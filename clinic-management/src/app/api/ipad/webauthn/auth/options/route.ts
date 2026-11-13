import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinics, ipadDevices, webauthnChallenges } from "@/db/schema";
import { asTransports, rpID } from "@/lib/webauthn";

export async function POST() {
  // Allow any active clinic device for this deployment (single-clinic v1).
  const [clinic] = await db.select().from(clinics).limit(1);
  if (!clinic) return NextResponse.json({ error: "No clinic configured" }, { status: 500 });

  const devices = await db
    .select()
    .from(ipadDevices)
    .where(eq(ipadDevices.active, true));

  if (devices.length === 0) {
    return NextResponse.json(
      { error: "No iPads registered yet. Create a registration link in Staff → Settings." },
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

  await db.insert(webauthnChallenges).values({
    clinicId: clinic.id,
    purpose: "ipad_auth",
    challenge: options.challenge,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return NextResponse.json({ options });
}
