import { NextResponse } from "next/server";
import { abandonIpadSession } from "@/lib/auth/ipad";

export async function POST() {
  await abandonIpadSession();
  return NextResponse.json({ ok: true });
}
