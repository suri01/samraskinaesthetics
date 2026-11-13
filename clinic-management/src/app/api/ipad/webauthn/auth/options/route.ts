import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinics, ipadDevices, webauthnChallenges } from "@/db/schema";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import { asTransports, rpID } from "@/lib/webauthn";
import { bindChallengeCookie } from "@/lib/webauthn-challenge";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = await checkRateLimit(`ipad-wa:${ip}`, "ipad_auth_options");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  await hitRateLimit(`ipad-wa:${ip}`, "ipad_auth_options");

  const [clinic] = await db.select().from(clinics).limit(1);
  if (!clinic) return NextResponse.json({ error: "No clinic configured" }, { status: 500 });

  const devices = await db
    .select()
    .from(ipadDevices)
    .where(eq(ipadDevices.active, true));

  if (devices.length === 0) {
    return NextResponse.json(
      { error: "No iPads registered yet. Ask an admin to create a setup code in Settings." },
      { status: 400 },
    );
  }

  const options = await generateAuthenticationOptions({
    rpID: rpID(),
    userVerification: "required",
    allowCredentials: devices.map((d) => ({
      id: d.credentialId,
      transports: asTransports(d.transportsJson),
    })),
  });

  const [challengeRow] = await db
    .insert(webauthnChallenges)
    .values({
      clinicId: clinic.id,
      purpose: "ipad_auth",
      challenge: options.challenge,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    })
    .returning();

  await bindChallengeCookie(challengeRow.id);

  return NextResponse.json({ options });
}
