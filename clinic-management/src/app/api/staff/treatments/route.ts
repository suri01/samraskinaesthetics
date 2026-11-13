import { NextResponse } from "next/server";
import { db } from "@/db";
import { clinicTreatments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { isAdmin, roleCan } from "@/lib/constants";
import {
  isTreatmentCategory,
  listClinicTreatments,
  poundsToPence,
} from "@/lib/treatments";

function canManageTreatments(role: Parameters<typeof roleCan>[0]) {
  return isAdmin(role) || roleCan(role, "appointments") || roleCan(role, "treatments");
}

export async function GET() {
  try {
    const staff = await requireStaff();
    if (!canManageTreatments(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const items = await listClinicTreatments(staff.clinicId, { includeInactive: true });
    return NextResponse.json({ items });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    if (!canManageTreatments(staff.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const serviceName = String(body.serviceName ?? name).trim();
    const category = String(body.category ?? "consultations").trim();
    const skuRaw = String(body.sku ?? "").trim();
    const sku =
      skuRaw ||
      serviceName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);

    if (!name || !serviceName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!isTreatmentCategory(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!sku) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const pricePence =
      body.pricePence === null || body.pricePence === ""
        ? null
        : typeof body.pricePence === "number"
          ? Math.round(body.pricePence)
          : poundsToPence(String(body.pricePounds ?? body.pricePence ?? ""));

    const [row] = await db
      .insert(clinicTreatments)
      .values({
        clinicId: staff.clinicId,
        sku,
        category,
        name,
        serviceName,
        pricePence,
        fromPrice: Boolean(body.fromPrice),
        priceNote: body.priceNote ? String(body.priceNote).trim() : null,
        blurb: body.blurb ? String(body.blurb).trim() : null,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 100,
        active: body.active === false ? false : true,
      })
      .returning();

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "clinic_treatment.created",
      entityType: "clinic_treatment",
      entityId: row.id,
      meta: { sku: row.sku, serviceName: row.serviceName },
    });

    return NextResponse.json({ ok: true, item: row });
  } catch (e) {
    const err = e as AuthError & { code?: string };
    if (String(err.message ?? "").includes("unique") || err.code === "23505") {
      return NextResponse.json({ error: "A treatment with that SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
