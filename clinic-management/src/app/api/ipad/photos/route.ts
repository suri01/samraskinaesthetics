import { NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { requireIpad } from "@/lib/auth/ipad";
import { AuthError } from "@/lib/auth/staff";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, putObject } from "@/lib/storage";

const STAGES = new Set(["before", "front", "left", "right", "other"]);

/** Appointment-scoped photo upload — never accepts staff session or other customers. */
export async function POST(req: Request) {
  try {
    const ctx = await requireIpad();
    const form = await req.formData();
    const file = form.get("file");
    const caption = form.get("caption") ? String(form.get("caption")) : null;
    const stageRaw = String(form.get("stage") ?? "before");
    const stage = STAGES.has(stageRaw) ? stageRaw : "before";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await putObject({
      clinicId: ctx.clinicId,
      contentType: file.type,
      bytes,
      filenameHint: file.name || `ipad-${stage}.jpg`,
    });

    const [row] = await db
      .insert(photos)
      .values({
        clinicId: ctx.clinicId,
        customerId: ctx.customerId,
        appointmentId: ctx.appointmentId,
        storageKey: stored.key,
        contentType: file.type,
        byteSize: stored.byteSize,
        caption: caption ?? `iPad capture · ${stage}`,
        stage,
        uploadedByStaffId: null,
      })
      .returning();

    await writeAudit({
      clinicId: ctx.clinicId,
      actorType: "ipad",
      actorId: ctx.sessionId,
      action: "ipad.photo_uploaded",
      entityType: "photo",
      entityId: row.id,
      meta: { stage, byteSize: stored.byteSize },
    });

    return NextResponse.json({
      id: row.id,
      key: stored.key,
      stage,
      byteSize: stored.byteSize,
    });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
