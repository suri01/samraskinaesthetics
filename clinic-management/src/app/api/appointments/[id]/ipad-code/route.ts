import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { issueIpadUnlockCode } from "@/lib/auth/ipad";
import { AuthError, requireStaff } from "@/lib/auth/staff";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const staff = await requireStaff("appointments");
    const { id } = await ctx.params;
    const rows = await db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.clinicId, staff.clinicId)))
      .limit(1);
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const result = await issueIpadUnlockCode(id, staff.clinicId);
    return NextResponse.json(result);
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
