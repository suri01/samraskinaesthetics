import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { AuthError, requireStaff } from "@/lib/auth/staff";
import { createInvoice, type InvoiceLineItem } from "@/lib/invoices";
import { parseGbpToPence } from "@/lib/money";

export async function GET() {
  try {
    const staff = await requireStaff("invoices");
    const list = await db
      .select({
        id: customers.id,
        firstName: customers.firstName,
        lastName: customers.lastName,
        email: customers.email,
      })
      .from(customers)
      .where(eq(customers.clinicId, staff.clinicId))
      .orderBy(asc(customers.lastName), asc(customers.firstName));
    return NextResponse.json({ customers: list });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}

export async function POST(req: Request) {
  try {
    const staff = await requireStaff("invoices");
    const body = await req.json().catch(() => ({}));
    const customerId = String(body.customerId ?? "").trim();
    if (!customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.clinicId, staff.clinicId)))
      .limit(1);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const rawLines = Array.isArray(body.lineItems) ? body.lineItems : [];
    const lineItems: InvoiceLineItem[] = rawLines.map(
      (li: { description?: string; quantity?: number; unitPounds?: string; unitPence?: number }) => ({
        description: String(li.description ?? ""),
        quantity: Number(li.quantity ?? 1),
        unitPence:
          typeof li.unitPence === "number"
            ? li.unitPence
            : parseGbpToPence(String(li.unitPounds ?? "0")),
      }),
    );

    const status = body.status === "draft" ? "draft" : "open";
    const taxPence =
      typeof body.taxPence === "number"
        ? body.taxPence
        : parseGbpToPence(String(body.taxPounds ?? "0"));

    const invoice = await createInvoice({
      clinicId: staff.clinicId,
      customerId,
      appointmentId: body.appointmentId ? String(body.appointmentId) : null,
      source: "custom",
      status,
      lineItems,
      taxPence,
      notes: body.notes ? String(body.notes) : null,
    });

    await writeAudit({
      clinicId: staff.clinicId,
      actorType: "staff",
      actorId: staff.staffUserId,
      action: "invoice.created_custom",
      entityType: "invoice",
      entityId: invoice.id,
      meta: { number: invoice.number, totalPence: invoice.totalPence },
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (e) {
    const err = e as Error & { status?: number };
    return NextResponse.json(
      { error: err.message ?? "Could not create invoice" },
      { status: err.status ?? 400 },
    );
  }
}
