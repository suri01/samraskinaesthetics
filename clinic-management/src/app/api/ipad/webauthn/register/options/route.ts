import { generateRegistrationOptions } from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDeviceRegistrations, ipadDevices, webauthnChallenges } from "@/db/schema";
import { sha256 } from "@/lib/crypto";
import { rpID, rpName } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  if (!token) return NextResponse.json({ error: "Registration token required" }, { status: 400 });

  const regs = await db
    .select()
    .from(ipadDeviceRegistrations)
    .where(
      and(
        eq(ipadDeviceRegistrations.tokenHash, sha256(token)),
        isNull(ipadDeviceRegistrations.consumedAt),
        gt(ipadDeviceRegistrations.expiresAt, new Date()),
      ),
    )
    .limit(1);
  const reg = regs[0];
  if (!reg) return NextResponse.json({ error: "Invalid or expired registration link" }, { status: 400 });

  const existing = await db
    .select({ credentialId: ipadDevices.credentialId })
    .from(ipadDevices)
    .where(eq(ipadDevices.clinicId, reg.clinicId));

  const options = await generateRegistrationOptions({
    rpName: rpName(),
    rpID: rpID(),
    userName: `ipad:${reg.id}`,
    userDisplayName: reg.name,
    attestationType: "none",
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: existing.map((d) => ({
      id: d.credentialId,
    })),
  });

  await db.insert(webauthnChallenges).values({
    clinicId: reg.clinicId,
    purpose: "ipad_register",
    challenge: options.challenge,
    registrationId: reg.id,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return NextResponse.json({
    options,
    deviceName: reg.name,
  });
}
