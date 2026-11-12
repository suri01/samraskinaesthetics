import { NextResponse } from "next/server";
import { authenticator } from "otplib";
import { AuthError, requireStaff, setupTotpSecret } from "@/lib/auth/staff";
import { BRAND } from "@/lib/constants";

export async function POST() {
  try {
    const staff = await requireStaff();
    const secret = await setupTotpSecret(staff.staffUserId);
    const otpauth = authenticator.keyuri(staff.email, BRAND.name, secret);
    return NextResponse.json({ secret, otpauth });
  } catch (e) {
    const err = e as AuthError;
    return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
  }
}
