import { NextResponse } from "next/server";
import { loginStaff } from "@/lib/auth/staff";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const totpCode = body.totpCode ? String(body.totpCode) : undefined;
  const result = await loginStaff({
    email,
    password,
    totpCode,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for"),
  });
  if (result.error) return NextResponse.json(result, { status: 401 });
  if (result.needsMfa) return NextResponse.json(result);
  return NextResponse.json({ ok: true });
}
