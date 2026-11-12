import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { sendAppointmentReminder } from "@/lib/whatsapp";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff("appointments");
    const { id } = await ctx.params;
    const rows = await db
      .select({ appointment: appointments, customer: customers })
      .from(appointments)
      .innerJoin(customers, eq(customers.id, appointments.customerId))
      .where(and(eq(appointments.id, id), eq(appointments.clinicId, staff.clinicId)))
      .limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!row.customer.phone) return NextResponse.json({ error: "No phone on file" }, { status: 400 });

    const result = await sendAppointmentReminder({
      clinicId: staff.clinicId,
      customerId: row.customer.id,
      appointmentId: row.appointment.id,
      toPhone: row.customer.phone,
      customerFirstName: row.customer.firstName,
      startsAt: row.appointment.startsAt,
      serviceName: row.appointment.serviceName,
      whatsappOptIn: row.customer.whatsappOptIn,
    });
    return NextResponse.json(result);
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
