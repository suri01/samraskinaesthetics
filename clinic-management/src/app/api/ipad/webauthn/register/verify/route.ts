import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDeviceRegistrations, ipadDevices, webauthnChallenges } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { findOpenRegistration } from "@/lib/auth/ipad-registration";
import { createIpadDeviceSession } from "@/lib/auth/ipad-device";
import { expectedOrigins, rpID } from "@/lib/webauthn";

export async function POST(req: Request) {
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
    return NextResponse.json({ error: "Invalid or expired registration code" }, { status: 400 });
  }

  const allChallenges = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.registrationId, reg.id),
        eq(webauthnChallenges.purpose, "ipad_register"),
        gt(webauthnChallenges.expiresAt, new Date()),
      ),
    );
  const challengeRow = allChallenges.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];
  if (!challengeRow) {
    return NextResponse.json({ error: "Registration challenge expired — try again" }, { status: 400 });
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Passkey registration failed" },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Passkey could not be verified" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
  const publicKey = isoBase64URL.fromBuffer(credential.publicKey);

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
