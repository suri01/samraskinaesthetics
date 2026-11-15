import { NextResponse } from "next/server";
import { AuthError, unlockStaffSession } from "@/lib/auth/staff";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await unlockStaffSession(String(body.password ?? ""), body.totpCode ? String(body.totpCode) : undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message ?? "Unlock failed" }, { status: err.status ?? 401 });
  }
}
