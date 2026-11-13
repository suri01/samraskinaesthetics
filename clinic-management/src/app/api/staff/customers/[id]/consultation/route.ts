import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, type MedicalHistory } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff("customers");
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.clinicId, staff.clinicId)))
      .limit(1);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const existing = (customer.medicalHistoryJson ?? {}) as MedicalHistory;
    const skinGoals = String(body.skinGoals ?? "").trim();
    const desiredResults = String(body.desiredResults ?? "").trim();
    const medications = String(body.medications ?? "").trim();
    const allergies = String(body.allergies ?? "").trim();
    const pregnantBreastfeeding = String(body.pregnantBreastfeeding ?? "").trim();
    const pastHistory = String(body.pastHistory ?? "").trim();
    const nowIso = new Date().toISOString();

    const nextHistory: MedicalHistory = {
      ...existing,
      skinGoals,
      desiredResults,
      medications,
      allergies,
      pregnantBreastfeeding,
      pastHistory,
      conditions: pastHistory || existing.conditions,
      receivingTreatment: body.receivingTreatment ?? existing.receivingTreatment ?? null,
      precautions: body.precautions ?? existing.precautions ?? null,
      routine: body.routine ?? existing.routine ?? {},
      sunLifestyle: body.sunLifestyle ?? existing.sunLifestyle ?? {},
      aestheticHistory: body.aestheticHistory ?? existing.aestheticHistory ?? {},
      aestheticNotes: {
        adverseReactions: String(body.aestheticNotes?.adverseReactions ?? ""),
        disappointingResults: String(body.aestheticNotes?.disappointingResults ?? ""),
      },
      previousTreatments:
        typeof body.previousTreatmentsSummary === "string"
          ? body.previousTreatmentsSummary
          : existing.previousTreatments,
      smoking:
        body.sunLifestyle?.smoking?.answer === "Y"
          ? "Yes"
          : body.sunLifestyle?.smoking?.answer === "N"
            ? "No"
            : (existing.smoking ?? ""),
      staffConsultationAt: nowIso,
      staffConsultationBy: staff.staffUserId,
    };

    await db
      .update(customers)
      .set({
        allergies: allergies || null,
        medicalNotes: skinGoals || desiredResults || null,
        medicalHistoryJson: nextHistory,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, id));

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "customer.staff_consultation_saved",
      entityType: "customer",
      entityId: id,
    });

    return NextResponse.json({ ok: true, medicalHistoryJson: nextHistory });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
