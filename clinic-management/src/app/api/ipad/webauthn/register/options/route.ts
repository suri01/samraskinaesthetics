import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDevices, webauthnChallenges } from "@/db/schema";
import { findOpenRegistration } from "@/lib/auth/ipad-registration";
import { rpID, rpName } from "@/lib/webauthn";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const reg = await findOpenRegistration({
    token: body.token ? String(body.token) : undefined,
    setupCode: body.setupCode ? String(body.setupCode) : undefined,
  });
  if (!reg) {
    return NextResponse.json({ error: "Invalid or expired registration code" }, { status: 400 });
  }

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
    registrationId: reg.id,
  });
}
