import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import {
  createInvoice,
  findOpenAutoInvoiceForAppointment,
} from "@/lib/invoices";
import { findTreatmentByServiceName, listClinicTreatments } from "@/lib/treatments";

export async function POST(req: Request) {
  try {
    const staff = await requireStaff("invoices");
    const body = await req.json().catch(() => ({}));
    const appointmentId = String(body.appointmentId ?? "").trim();
    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment is required" }, { status: 400 });
    }

    const rows = await db
      .select({ appointment: appointments, customer: customers })
      .from(appointments)
      .innerJoin(customers, eq(customers.id, appointments.customerId))
      .where(
        and(eq(appointments.id, appointmentId), eq(appointments.clinicId, staff.clinicId)),
      )
      .limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });

    const existing = await findOpenAutoInvoiceForAppointment(staff.clinicId, appointmentId);
    if (existing) {
      return NextResponse.json({
        ok: true,
        invoice: existing,
        alreadyExisted: true,
      });
    }

    const treatments = await listClinicTreatments(staff.clinicId);
    const treatment = findTreatmentByServiceName(treatments, row.appointment.serviceName);
    const unitPence = treatment?.pricePence ?? 0;
    if (unitPence <= 0 && !body.allowZero) {
      return NextResponse.json(
        {
          error:
            "No list price for this treatment. Create a custom invoice or set a price on the treatment menu.",
        },
        { status: 400 },
      );
    }

    const invoice = await createInvoice({
      clinicId: staff.clinicId,
      customerId: row.customer.id,
      appointmentId: row.appointment.id,
      source: "auto",
      status: "open",
      lineItems: [
        {
          description: row.appointment.serviceName,
          quantity: 1,
          unitPence,
        },
      ],
      notes: `Auto-generated from appointment on ${row.appointment.startsAt.toLocaleString("en-GB", {
        timeZone: "Europe/London",
      })}`,
    });

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "invoice.created_auto",
      entityType: "invoice",
      entityId: invoice.id,
      meta: {
        number: invoice.number,
        appointmentId,
        serviceName: row.appointment.serviceName,
      },
    });

    return NextResponse.json({ ok: true, invoice, alreadyExisted: false });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json(
      { error: err.message ?? "Could not generate invoice" },
      { status: err.status ?? 400 },
    );
  }
}
