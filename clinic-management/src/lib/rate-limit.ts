import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authRateLimits } from "@/db/schema";
import { LOCKOUT_MS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "./constants";

export async function checkRateLimit(key: string, action: string): Promise<{ ok: boolean; retryAfterMs?: number }> {
  const now = new Date();
  const rows = await db
    .select()
    .from(authRateLimits)
    .where(and(eq(authRateLimits.key, key), eq(authRateLimits.action, action)))
    .limit(1);

  let row = rows[0];
  if (!row) {
    await db.insert(authRateLimits).values({ key, action, attempts: 0, windowStartedAt: now });
    return { ok: true };
  }

  if (row.lockedUntil && row.lockedUntil > now) {
    return { ok: false, retryAfterMs: row.lockedUntil.getTime() - now.getTime() };
  }

  const windowAge = now.getTime() - row.windowStartedAt.getTime();
  if (windowAge > RATE_LIMIT_WINDOW_MS) {
    await db
      .update(authRateLimits)
      .set({ attempts: 0, windowStartedAt: now, lockedUntil: null })
      .where(eq(authRateLimits.id, row.id));
    return { ok: true };
  }

  if (row.attempts >= RATE_LIMIT_MAX) {
    const lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
    await db.update(authRateLimits).set({ lockedUntil }).where(eq(authRateLimits.id, row.id));
    return { ok: false, retryAfterMs: LOCKOUT_MS };
  }

  return { ok: true };
}

export async function hitRateLimit(key: string, action: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(authRateLimits)
    .where(and(eq(authRateLimits.key, key), eq(authRateLimits.action, action)))
    .limit(1);
  const row = rows[0];
  if (!row) {
    await db.insert(authRateLimits).values({ key, action, attempts: 1, windowStartedAt: now });
    return;
  }
  const attempts = row.attempts + 1;
  const lockedUntil = attempts >= RATE_LIMIT_MAX ? new Date(now.getTime() + LOCKOUT_MS) : row.lockedUntil;
  await db
    .update(authRateLimits)
    .set({ attempts, lockedUntil })
    .where(eq(authRateLimits.id, row.id));
}

export async function clearRateLimit(key: string, action: string) {
  await db
    .update(authRateLimits)
    .set({ attempts: 0, lockedUntil: null, windowStartedAt: new Date() })
    .where(and(eq(authRateLimits.key, key), eq(authRateLimits.action, action)));
}
