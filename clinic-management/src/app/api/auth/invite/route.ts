import { NextResponse } from "next/server";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { hashPassword, randomToken, sha256 } from "@/lib/crypto";

/** Owner-only staff invite scaffolding. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (staff.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await req.json();
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const name = String(body.name ?? "").trim();
    const role = String(body.role ?? "receptionist") as
      | "admin"
      | "practitioner"
      | "receptionist"
      | "finance";
    if (!email || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const token = randomToken(24);
    const tempPassword = randomToken(12);
    const [user] = await db
      .insert(staffUsers)
      .values({
        clinicId: staff.clinicId,
        email,
        name,
        role,
        passwordHash: await hashPassword(tempPassword),
        invitedAt: new Date(),
        inviteTokenHash: sha256(token),
        totpEnabled: false,
      })
      .returning();

    const link = `${process.env.APP_URL ?? "http://localhost:3001"}/staff/invite?token=${token}`;
    console.log("[MOCK EMAIL] Invite for", email, link, "temp password:", tempPassword);

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "staff.invited",
      entityType: "staff_user",
      entityId: user.id,
      meta: { mockedEmail: true },
    });

    return NextResponse.json({ ok: true, mocked: true, staffUserId: user.id });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
