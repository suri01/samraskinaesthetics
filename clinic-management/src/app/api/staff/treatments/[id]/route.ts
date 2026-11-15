import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinicTreatments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { isAdmin, roleCan } from "@/lib/constants";
import { isTreatmentCategory, poundsToPence } from "@/lib/treatments";

function canManageTreatments(role: Parameters<typeof roleCan>[0]) {
  return isAdmin(role) || roleCan(role, "appointments") || roleCan(role, "treatments");
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    if (!canManageTreatments(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const [existing] = await db
      .select()
      .from(clinicTreatments)
      .where(and(eq(clinicTreatments.id, id), eq(clinicTreatments.clinicId, staff.clinicId)))
      .limit(1);
    if (!existing) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    const patch: Partial<typeof clinicTreatments.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (body.name != null) patch.name = String(body.name).trim();
    if (body.serviceName != null) patch.serviceName = String(body.serviceName).trim();
    if (body.sku != null) patch.sku = String(body.sku).trim();
    if (body.category != null) {
      const category = String(body.category).trim();
      if (!isTreatmentCategory(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      patch.category = category;
    }
    if (body.pricePounds !== undefined || body.pricePence !== undefined) {
      if (body.pricePence === null || body.pricePounds === "") {
        patch.pricePence = null;
      } else if (typeof body.pricePence === "number") {
        patch.pricePence = Math.round(body.pricePence);
      } else if (body.pricePounds != null) {
        patch.pricePence = poundsToPence(String(body.pricePounds));
      }
    }
    if (body.fromPrice != null) patch.fromPrice = Boolean(body.fromPrice);
    if (body.priceNote !== undefined) {
      patch.priceNote = body.priceNote ? String(body.priceNote).trim() : null;
    }
    if (body.blurb !== undefined) {
      patch.blurb = body.blurb ? String(body.blurb).trim() : null;
    }
    if (body.sortOrder != null && Number.isFinite(Number(body.sortOrder))) {
      patch.sortOrder = Number(body.sortOrder);
    }
    if (body.active != null) patch.active = Boolean(body.active);

    if (!patch.name && body.name === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!patch.serviceName && body.serviceName === "") {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const [row] = await db
      .update(clinicTreatments)
      .set(patch)
      .where(and(eq(clinicTreatments.id, id), eq(clinicTreatments.clinicId, staff.clinicId)))
      .returning();

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "clinic_treatment.updated",
      entityType: "clinic_treatment",
      entityId: row.id,
      meta: { sku: row.sku, serviceName: row.serviceName, active: row.active },
    });

    return NextResponse.json({ ok: true, item: row });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff();
    if (!canManageTreatments(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await ctx.params;

    const [row] = await db
      .update(clinicTreatments)
      .set({ active: false, updatedAt: new Date() })
      .where(and(eq(clinicTreatments.id, id), eq(clinicTreatments.clinicId, staff.clinicId)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Treatment not found" }, { status: 404 });
    }

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "clinic_treatment.disabled",
      entityType: "clinic_treatment",
      entityId: row.id,
      meta: { sku: row.sku },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
