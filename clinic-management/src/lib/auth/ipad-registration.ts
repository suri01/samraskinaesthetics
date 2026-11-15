import { and, eq, gt, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { ipadDeviceRegistrations } from "@/db/schema";
import { sha256 } from "@/lib/crypto";

export async function findOpenRegistration(input: {
  token?: string;
  setupCode?: string;
}) {
  const token = input.token?.trim();
  const setupCode = input.setupCode?.trim().toUpperCase();
  if (!token && !setupCode) return null;

  const clauses = [];
  if (token) clauses.push(eq(ipadDeviceRegistrations.tokenHash, sha256(token)));
  if (setupCode) clauses.push(eq(ipadDeviceRegistrations.setupCodeHash, sha256(setupCode)));

  const rows = await db
    .select()
    .from(ipadDeviceRegistrations)
    .where(
      and(
        or(...clauses),
        isNull(ipadDeviceRegistrations.consumedAt),
        gt(ipadDeviceRegistrations.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}
