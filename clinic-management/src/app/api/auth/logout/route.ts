import { NextResponse } from "next/server";
import { logoutStaff } from "@/lib/auth/staff";

export async function POST() {
  await logoutStaff();
  return NextResponse.redirect(new URL("/staff/login", process.env.APP_URL ?? "http://localhost:3001"), 303);
}
