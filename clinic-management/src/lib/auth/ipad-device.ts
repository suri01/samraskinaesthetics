import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { ipadDeviceSessions, ipadDevices } from "@/db/schema";
import { IPAD_DEVICE_COOKIE, IPAD_DEVICE_SESSION_MS } from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/crypto";
import { AuthError } from "./staff";

export type IpadDeviceContext = {
  sessionId: string;
  clinicId: string;
  deviceId: string;
  deviceName: string;
};

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/ipad",
    maxAge: maxAgeSeconds,
  };
}

export async function createIpadDeviceSession(input: {
  clinicId: string;
  deviceId: string;
}) {
  const token = randomToken(32);
  const now = new Date();
  const [session] = await db
    .insert(ipadDeviceSessions)
    .values({
      clinicId: input.clinicId,
      deviceId: input.deviceId,
      tokenHash: sha256(token),
      createdAt: now,
      expiresAt: new Date(now.getTime() + IPAD_DEVICE_SESSION_MS),
    })
    .returning();

  const jar = await cookies();
  jar.set(IPAD_DEVICE_COOKIE, token, cookieOptions(Math.floor(IPAD_DEVICE_SESSION_MS / 1000)));

  await db
    .update(ipadDevices)
    .set({ lastSeenAt: now })
    .where(eq(ipadDevices.id, input.deviceId));

  return session;
}

export async function getIpadDeviceContext(): Promise<IpadDeviceContext | null> {
  const jar = await cookies();
  const token = jar.get(IPAD_DEVICE_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      session: ipadDeviceSessions,
      device: ipadDevices,
    })
    .from(ipadDeviceSessions)
    .innerJoin(ipadDevices, eq(ipadDevices.id, ipadDeviceSessions.deviceId))
    .where(
      and(
        eq(ipadDeviceSessions.tokenHash, sha256(token)),
        isNull(ipadDeviceSessions.revokedAt),
        gt(ipadDeviceSessions.expiresAt, new Date()),
        eq(ipadDevices.active, true),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    sessionId: row.session.id,
    clinicId: row.session.clinicId,
    deviceId: row.device.id,
    deviceName: row.device.name,
  };
}

export async function requireIpadDevice(): Promise<IpadDeviceContext> {
  const ctx = await getIpadDeviceContext();
  if (!ctx) throw new AuthError("Registered iPad passkey required", 401);
  return ctx;
}

export async function clearIpadDeviceSession() {
  const jar = await cookies();
  const token = jar.get(IPAD_DEVICE_COOKIE)?.value;
  if (token) {
    await db
      .update(ipadDeviceSessions)
      .set({ revokedAt: new Date() })
      .where(eq(ipadDeviceSessions.tokenHash, sha256(token)));
  }
  jar.set(IPAD_DEVICE_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}
