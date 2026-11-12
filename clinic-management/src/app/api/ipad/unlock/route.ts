import { NextResponse } from "next/server";
import { startIpadSession } from "@/lib/auth/ipad";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const limit = await checkRateLimit(`ipad:${ip}`, "ipad_unlock");
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const result = await startIpadSession(String(body.code ?? ""));
  if ("error" in result) {
    await hitRateLimit(`ipad:${ip}`, "ipad_unlock");
    return NextResponse.json(result, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
