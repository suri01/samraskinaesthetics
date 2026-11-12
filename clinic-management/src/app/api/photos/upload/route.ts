import { NextResponse } from "next/server";
import { db } from "@/db";
import { photos } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES, putObject } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const staff = await requireStaff("photos");
    const form = await req.formData();
    const file = form.get("file");
    const customerId = String(form.get("customerId") ?? "");
    const appointmentId = form.get("appointmentId") ? String(form.get("appointmentId")) : null;
    const caption = form.get("caption") ? String(form.get("caption")) : null;
    const stage = String(form.get("stage") ?? "before");

    if (!(file instanceof File) || !customerId) {
      return NextResponse.json({ error: "file and customerId required" }, { status: 400 });
    }
    if (!ALLOWED_UPLOAD_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await putObject({
      clinicId: staff.clinicId,
      contentType: file.type,
      bytes,
      filenameHint: file.name,
    });

    const [row] = await db
      .insert(photos)
      .values({
        clinicId: staff.clinicId,
        customerId,
        appointmentId,
        storageKey: stored.key,
        contentType: file.type,
        byteSize: stored.byteSize,
        caption,
        stage,
        uploadedByStaffId: staff.staffUserId,
      })
      .returning();

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "photo.uploaded",
      entityType: "photo",
      entityId: row.id,
    });

    return NextResponse.json({ id: row.id, key: stored.key });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
