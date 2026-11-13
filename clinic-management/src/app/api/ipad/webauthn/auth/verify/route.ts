import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDevices, webauthnChallenges } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { createIpadDeviceSession } from "@/lib/auth/ipad-device";
import { asTransports, expectedOrigins, rpID } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const response = body.response;
  if (!response?.id) {
    return NextResponse.json({ error: "Passkey response required" }, { status: 400 });
  }

  const devices = await db
    .select()
    .from(ipadDevices)
    .where(and(eq(ipadDevices.credentialId, String(response.id)), eq(ipadDevices.active, true)))
    .limit(1);
  const device = devices[0];
  if (!device) {
    return NextResponse.json({ error: "Unknown or disabled iPad passkey" }, { status: 401 });
  }

  const challenges = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.clinicId, device.clinicId),
        eq(webauthnChallenges.purpose, "ipad_auth"),
        gt(webauthnChallenges.expiresAt, new Date()),
      ),
    );
  const challengeRow = challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  if (!challengeRow) {
    return NextResponse.json({ error: "Auth challenge expired — try again" }, { status: 400 });
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Passkey verification failed" },
      { status: 401 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey not verified" }, { status: 401 });
  }

  await db
    .update(ipadDevices)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastSeenAt: new Date(),
    })
    .where(eq(ipadDevices.id, device.id));

  await db.delete(webauthnChallenges).where(eq(webauthnChallenges.id, challengeRow.id));
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
