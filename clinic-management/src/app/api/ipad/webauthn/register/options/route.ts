import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDevices, webauthnChallenges } from "@/db/schema";
import { findOpenRegistration } from "@/lib/auth/ipad-registration";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { rpID, rpName } from "@/lib/webauthn";
import { bindChallengeCookie } from "@/lib/webauthn-challenge";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = await checkRateLimit(`ipad-reg:${ip}`, "ipad_register_options");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const reg = await findOpenRegistration({
    token: body.token ? String(body.token) : undefined,
    setupCode: body.setupCode ? String(body.setupCode) : undefined,
  });
  if (!reg) {
    await hitRateLimit(`ipad-reg:${ip}`, "ipad_register_options");
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

  const [challengeRow] = await db
    .insert(webauthnChallenges)
    .values({
      clinicId: reg.clinicId,
      purpose: "ipad_register",
      challenge: options.challenge,
      registrationId: reg.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
    .returning();

  await bindChallengeCookie(challengeRow.id);

  return NextResponse.json({
    options,
    deviceName: reg.name,
    registrationId: reg.id,
  });
}
