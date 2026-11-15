import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, customers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";

/**
 * Register a booking. New customers are created with intakeCompletedAt = null
 * so the iPad runs the full customer intake on first visit.
 */
export async function POST(req: Request) {
  try {
    const staff = await requireStaff("appointments");
    const body = await req.json();
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const serviceName = String(body.serviceName ?? "").trim();
    const startsAtRaw = String(body.startsAt ?? "");
    const existingCustomerId = body.customerId ? String(body.customerId) : null;

    if (!serviceName || !startsAtRaw) {
      return NextResponse.json({ error: "serviceName and startsAt required" }, { status: 400 });
    }
    const startsAt = new Date(startsAtRaw);
    if (Number.isNaN(startsAt.getTime())) {
      return NextResponse.json({ error: "Invalid startsAt" }, { status: 400 });
    }
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

    let customerId = existingCustomerId;
    let isNewCustomer = false;

    if (!customerId) {
      if (!firstName || !lastName) {
        return NextResponse.json({ error: "Name required for new customer" }, { status: 400 });
      }
      const [created] = await db
        .insert(customers)
        .values({
          clinicId: staff.clinicId,
          firstName,
          lastName,
          email,
          phone,
          registeredVia: "booking",
          intakeCompletedAt: null,
          whatsappOptIn: Boolean(body.whatsappOptIn),
          emailOptIn: Boolean(body.emailOptIn),
        })
        .returning();
      customerId = created.id;
      isNewCustomer = true;
    }

    const [appt] = await db
      .insert(appointments)
      .values({
        clinicId: staff.clinicId,
        customerId: customerId!,
        practitionerId: staff.role === "practitioner" ? staff.staffUserId : null,
        startsAt,
        endsAt,
        status: "scheduled",
        serviceName,
        notes: body.notes ? String(body.notes) : isNewCustomer ? "Registered at booking — iPad full intake pending." : null,
      })
      .returning();

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: isNewCustomer ? "booking.registered_new_customer" : "booking.registered_existing",
      entityType: "appointment",
      entityId: appt.id,
      meta: { customerId, isNewCustomer },
    });

    return NextResponse.json({
      ok: true,
      appointmentId: appt.id,
      customerId,
      isNewCustomer,
    });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
