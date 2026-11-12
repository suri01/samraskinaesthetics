import { NextResponse } from "next/server";
import { AuthError, enableTotp, requireStaff } from "@/lib/auth/staff";

export async function POST(req: Request) {
  try {
    const staff = await requireStaff();
    const body = await req.json();
    await enableTotp(staff.staffUserId, String(body.code ?? ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
