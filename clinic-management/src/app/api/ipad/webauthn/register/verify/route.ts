import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDeviceRegistrations, ipadDevices, webauthnChallenges } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { createIpadDeviceSession } from "@/lib/auth/ipad-device";
import { findOpenRegistration } from "@/lib/auth/ipad-registration";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { expectedOrigins, rpID } from "@/lib/webauthn";
import { clearChallengeCookie, loadBoundChallenge } from "@/lib/webauthn-challenge";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = await checkRateLimit(`ipad-reg:${ip}`, "ipad_register_verify");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const response = body.response;
  if (!response) {
    return NextResponse.json({ error: "Passkey response required" }, { status: 400 });
  }

  const reg = await findOpenRegistration({
    token: body.token ? String(body.token) : undefined,
    setupCode: body.setupCode ? String(body.setupCode) : undefined,
  });
  if (!reg) {
    await hitRateLimit(`ipad-reg:${ip}`, "ipad_register_verify");
    return NextResponse.json({ error: "Invalid or expired registration code" }, { status: 400 });
  }

  const challengeRow = await loadBoundChallenge("ipad_register");
  if (!challengeRow || challengeRow.registrationId !== reg.id) {
    await hitRateLimit(`ipad-reg:${ip}`, "ipad_register_verify");
    return NextResponse.json({ error: "Registration challenge missing or expired — try again" }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: expectedOrigins(),
      expectedRPID: rpID(),
      requireUserVerification: true,
    });
  } catch (e) {
    await hitRateLimit(`ipad-reg:${ip}`, "ipad_register_verify");
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Passkey registration failed" },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    await hitRateLimit(`ipad-reg:${ip}`, "ipad_register_verify");
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const publicKey = isoBase64URL.fromBuffer(credential.publicKey);

  // Prevent registering the same credential twice.
  const dupes = await db
    .select({ id: ipadDevices.id })
    .from(ipadDevices)
    .where(eq(ipadDevices.credentialId, credential.id))
    .limit(1);
  if (dupes[0]) {
    return NextResponse.json({ error: "This passkey is already registered" }, { status: 409 });
  }

  const [device] = await db
    .insert(ipadDevices)
    .values({
      clinicId: reg.clinicId,
      name: reg.name,
      credentialId: credential.id,
      publicKey,
      counter: credential.counter,
      transportsJson: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      active: true,
      registeredByStaffId: reg.createdByStaffId,
      lastSeenAt: new Date(),
    })
    .returning();

  await db
    .update(ipadDeviceRegistrations)
    .set({ consumedAt: new Date() })
    .where(eq(ipadDeviceRegistrations.id, reg.id));

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, challengeRow.id));
  await clearChallengeCookie();
  await createIpadDeviceSession({ clinicId: reg.clinicId, deviceId: device.id });

  await writeAudit({
    clinicId: reg.clinicId,
    actorType: "system",
    actorId: reg.createdByStaffId,
    action: "ipad_device.registered",
    entityType: "ipad_device",
    entityId: device.id,
    meta: { name: device.name, deviceType: credentialDeviceType },
  });

  return NextResponse.json({ ok: true, deviceId: device.id, deviceName: device.name });
}
