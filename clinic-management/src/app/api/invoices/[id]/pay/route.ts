import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers, invoices, payments } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { createPaymentIntent } from "@/lib/stripe";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff("payments");
    const { id } = await ctx.params;
    const rows = await db
      .select({ invoice: invoices, customer: customers })
      .from(invoices)
      .innerJoin(customers, eq(customers.id, invoices.customerId))
      .where(and(eq(invoices.id, id), eq(invoices.clinicId, staff.clinicId)))
      .limit(1);
    const row = rows[0];
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.invoice.status !== "open") {
      return NextResponse.json({ error: "Invoice is not open" }, { status: 400 });
    }

    const intent = await createPaymentIntent({
      amountPence: row.invoice.totalPence,
      currency: row.invoice.currency,
      invoiceId: row.invoice.id,
      customerEmail: row.customer.email,
    });

    await db.insert(payments).values({
      clinicId: staff.clinicId,
      invoiceId: row.invoice.id,
      amountPence: row.invoice.totalPence,
      currency: row.invoice.currency,
      status: intent.mocked ? "mocked" : "pending",
      provider: intent.provider,
      providerRef: intent.providerRef,
      mocked: intent.mocked,
    });

    if (intent.mocked) {
      await db.update(invoices).set({ status: "paid" }).where(eq(invoices.id, row.invoice.id));
    }

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: intent.mocked ? "payment.mocked" : "payment.intent_created",
      entityType: "invoice",
      entityId: row.invoice.id,
      meta: { providerRef: intent.providerRef },
    });

    return NextResponse.json(intent);
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
