import { NextResponse } from "next/server";
import { startIpadSession } from "@/lib/auth/ipad";
import { getIpadDeviceContext } from "@/lib/auth/ipad-device";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const device = await getIpadDeviceContext();
  if (!device) {
    return NextResponse.json(
      { error: "Authenticate this clinic iPad with its passkey first." },
      { status: 401 },
    );
  }

  const ip = req.headers.get("x-forwarded-for") ?? "local";
  const keys = [`ipad:${ip}`, `ipad-device:${device.deviceId}`];
  for (const key of keys) {
    const limit = await checkRateLimit(key, "ipad_unlock");
    if (!limit.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    for (const key of keys) await hitRateLimit(key, "ipad_unlock");
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 401 });
  }

  const result = await startIpadSession(code);
  if ("error" in result) {
    for (const key of keys) await hitRateLimit(key, "ipad_unlock");
    return NextResponse.json(result, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
