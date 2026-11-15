import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDevices, webauthnChallenges } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { createIpadDeviceSession } from "@/lib/auth/ipad-device";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { asTransports, expectedOrigins, rpID } from "@/lib/webauthn";
import { clearChallengeCookie, loadBoundChallenge } from "@/lib/webauthn-challenge";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = await checkRateLimit(`ipad-wa:${ip}`, "ipad_auth_verify");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const response = body.response;
  if (!response?.id) {
    return NextResponse.json({ error: "Passkey response required" }, { status: 400 });
  }

  const challengeRow = await loadBoundChallenge("ipad_auth");
  if (!challengeRow) {
    await hitRateLimit(`ipad-wa:${ip}`, "ipad_auth_verify");
    return NextResponse.json({ error: "Auth challenge missing or expired — try again" }, { status: 400 });
  }

  const devices = await db
    .select()
    .from(ipadDevices)
    .where(and(eq(ipadDevices.credentialId, String(response.id)), eq(ipadDevices.active, true)))
    .limit(1);
  const device = devices[0];
  if (!device) {
    await hitRateLimit(`ipad-wa:${ip}`, "ipad_auth_verify");
    return NextResponse.json({ error: "Unknown or disabled iPad passkey" }, { status: 401 });
  }
  if (challengeRow.clinicId && device.clinicId !== challengeRow.clinicId) {
    return NextResponse.json({ error: "Passkey clinic mismatch" }, { status: 401 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: expectedOrigins(),
      expectedRPID: rpID(),
      credential: {
        id: device.credentialId,
        publicKey: isoBase64URL.toBuffer(device.publicKey),
        counter: device.counter,
        transports: asTransports(device.transportsJson),
      },
      requireUserVerification: true,
    });
  } catch (e) {
    await hitRateLimit(`ipad-wa:${ip}`, "ipad_auth_verify");
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Passkey verification failed" },
      { status: 401 },
    );
  }

  if (!verification.verified) {
    await hitRateLimit(`ipad-wa:${ip}`, "ipad_auth_verify");
    return NextResponse.json({ error: "Passkey not verified" }, { status: 401 });
  }

  // Reject authenticator counter rollback (cloned authenticator signal).
  if (verification.authenticationInfo.newCounter < device.counter) {
    await writeAudit({
      clinicId: device.clinicId,
      actorType: "system",
      actorId: device.id,
      action: "ipad_device.counter_rollback",
      entityType: "ipad_device",
      entityId: device.id,
    });
    return NextResponse.json({ error: "Passkey security check failed" }, { status: 401 });
  }

  await db
    .update(ipadDevices)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastSeenAt: new Date(),
    })
    .where(eq(ipadDevices.id, device.id));

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, challengeRow.id));
  await clearChallengeCookie();
  await createIpadDeviceSession({ clinicId: device.clinicId, deviceId: device.id });

  await writeAudit({
    clinicId: device.clinicId,
    actorType: "ipad",
    actorId: device.id,
    action: "ipad_device.passkey_authenticated",
    entityType: "ipad_device",
    entityId: device.id,
  });

  return NextResponse.json({ ok: true, deviceName: device.name });
}
