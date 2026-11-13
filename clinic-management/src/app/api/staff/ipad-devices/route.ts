import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ipadDeviceRegistrations, ipadDevices } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { randomSetupCode, randomToken, sha256 } from "@/lib/crypto";

export async function GET() {
  try {
    const staff = await requireStaff();
    if (staff.role !== "owner" && staff.role !== "receptionist") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const devices = await db
      .select({
        id: ipadDevices.id,
        name: ipadDevices.name,
        active: ipadDevices.active,
        lastSeenAt: ipadDevices.lastSeenAt,
        createdAt: ipadDevices.createdAt,
        deviceType: ipadDevices.deviceType,
        backedUp: ipadDevices.backedUp,
      })
      .from(ipadDevices)
      .where(eq(ipadDevices.clinicId, staff.clinicId))
      .orderBy(desc(ipadDevices.createdAt));
    return NextResponse.json({ devices });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

/** Create a one-time registration link for a named clinic iPad. */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (staff.role !== "owner" && staff.role !== "receptionist") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Device name required" }, { status: 400 });

    const token = randomToken(24);
    const setupCode = randomSetupCode(8);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const [reg] = await db
      .insert(ipadDeviceRegistrations)
      .values({
        clinicId: staff.clinicId,
        name,
        tokenHash: sha256(token),
        setupCodeHash: sha256(setupCode),
        createdByStaffId: staff.staffUserId,
        expiresAt,
      })
      .returning();

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "ipad_device.registration_created",
      entityType: "ipad_device_registration",
      entityId: reg.id,
      meta: { name },
    });

    const appUrl = process.env.APP_URL ?? "http://localhost:3001";
    return NextResponse.json({
      ok: true,
      registrationId: reg.id,
      expiresAt,
      setupCode,
      registerPath: "/ipad/register",
      registerUrl: `${appUrl}/ipad/register?token=${token}`,
      token,
    });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const staff = await requireStaff();
    if (staff.role !== "owner" && staff.role !== "receptionist") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json();
    const id = String(body.id ?? "");
    const active = Boolean(body.active);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db
      .update(ipadDevices)
      .set({ active })
      .where(eq(ipadDevices.id, id));

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: active ? "ipad_device.enabled" : "ipad_device.disabled",
      entityType: "ipad_device",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
