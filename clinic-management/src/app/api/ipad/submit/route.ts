import { NextResponse } from "next/server";
import { db } from "@/db";
import { consentRecords, formSubmissions } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { completeIpadSession, requireIpad } from "@/lib/auth/ipad";
import { AuthError } from "@/lib/auth/staff";

export async function POST(req: Request) {
  try {
    const ctx = await requireIpad();
    const body = await req.json();
    const templateId = String(body.templateId ?? "");
    const signedName = String(body.signedName ?? "").trim();
    if (!templateId || !signedName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const answers = (body.answers ?? {}) as Record<string, unknown>;
    await db.insert(formSubmissions).values({
      clinicId: ctx.clinicId,
      templateId,
      appointmentId: ctx.appointmentId,
      customerId: ctx.customerId,
      answersJson: answers,
      signedName,
      signedAt: new Date(),
    });

    await db.insert(consentRecords).values({
      clinicId: ctx.clinicId,
      customerId: ctx.customerId,
      appointmentId: ctx.appointmentId,
      title: String(body.consentTitle ?? "Consent"),
      body: String(body.consentBody ?? ""),
      signedName,
      signedAt: new Date(),
    });

    await writeAudit({
      clinicId: ctx.clinicId,
      actorType: "ipad",
      actorId: ctx.sessionId,
      action: "ipad.forms_completed",
      entityType: "appointment",
      entityId: ctx.appointmentId,
    });

    await completeIpadSession();
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
