import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { randomToken, sha256 } from "@/lib/crypto";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";

/** Secure reset scaffolding — emails are mocked (link logged to console + audit). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const limit = await checkRateLimit(`reset:${email || "unknown"}`, "password_reset");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  await hitRateLimit(`reset:${email || "unknown"}`, "password_reset");

  const users = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
  const user = users[0];
  // Always return ok to avoid email enumeration
  if (user?.active) {
    const token = randomToken(32);
    await db
      .update(staffUsers)
      .set({
        passwordResetTokenHash: sha256(token),
        passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      })
      .where(eq(staffUsers.id, user.id));
    const link = `${process.env.APP_URL ?? "http://localhost:3001"}/staff/reset?token=${token}`;
    console.log("[MOCK EMAIL] Password reset link for", email, link);
    await writeAudit({
      clinicId: user.clinicId,
      actorType: "system",
      actorId: user.id,
      action: "staff.password_reset_requested",
      meta: { mockedEmail: true },
    });
  }
  return NextResponse.json({ ok: true, mocked: true });
}
