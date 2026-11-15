import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { authenticator } from "otplib";
import { db } from "@/db";
import { staffSessions, staffUsers } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import {
  IDLE_LOCK_MS,
  MAX_SESSION_MS,
  REAUTH_WINDOW_MS,
  STAFF_COOKIE,
  roleCan,
  type StaffRole,
} from "@/lib/constants";
import {
  decryptSecret,
  encryptSecret,
  hashPassword,
  randomToken,
  sha256,
  verifyPassword,
} from "@/lib/crypto";
import { checkRateLimit, clearRateLimit, hitRateLimit } from "@/lib/rate-limit";

export type StaffContext = {
  sessionId: string;
  staffUserId: string;
  clinicId: string;
  email: string;
  name: string;
  role: StaffRole;
  totpEnabled: boolean;
  idleLocked: boolean;
  reauthFresh: boolean;
};

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function createStaffSession(input: {
  staffUserId: string;
  clinicId: string;
  userAgent?: string | null;
  ip?: string | null;
}) {
  const token = randomToken(32);
  const now = new Date();
  const [session] = await db
    .insert(staffSessions)
    .values({
      staffUserId: input.staffUserId,
      clinicId: input.clinicId,
      tokenHash: sha256(token),
      createdAt: now,
      lastSeenAt: now,
      absoluteExpiresAt: new Date(now.getTime() + MAX_SESSION_MS),
      idleExpiresAt: new Date(now.getTime() + IDLE_LOCK_MS),
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
    })
    .returning();

  const jar = await cookies();
  jar.set(STAFF_COOKIE, token, cookieOptions(Math.floor(MAX_SESSION_MS / 1000)));
  return session;
}

export async function revokeStaffSessionByToken(token: string) {
  await db
    .update(staffSessions)
    .set({ revokedAt: new Date() })
    .where(eq(staffSessions.tokenHash, sha256(token)));
}

export async function revokeAllStaffSessions(staffUserId: string) {
  await db
    .update(staffSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(staffSessions.staffUserId, staffUserId), isNull(staffSessions.revokedAt)));
}

export async function getStaffContext(): Promise<StaffContext | null> {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      session: staffSessions,
      user: staffUsers,
    })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffUsers.id, staffSessions.staffUserId))
    .where(eq(staffSessions.tokenHash, sha256(token)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const { session, user } = row;
  const now = new Date();

  if (session.revokedAt || !user.active) return null;
  if (session.absoluteExpiresAt <= now) return null;

  const idleLocked = session.idleExpiresAt <= now || Boolean(session.lockedAt);
  const reauthFresh = Boolean(session.reauthAt && now.getTime() - session.reauthAt.getTime() < REAUTH_WINDOW_MS);

  if (!idleLocked) {
    await db
      .update(staffSessions)
      .set({
        lastSeenAt: now,
        idleExpiresAt: new Date(now.getTime() + IDLE_LOCK_MS),
      })
      .where(eq(staffSessions.id, session.id));
  }

  return {
    sessionId: session.id,
    staffUserId: user.id,
    clinicId: user.clinicId,
    email: user.email,
    name: user.name,
    role: user.role as StaffRole,
    totpEnabled: user.totpEnabled,
    idleLocked,
    reauthFresh,
  };
}

export async function requireStaff(
  permission?: string,
  opts?: { allowIdleLocked?: boolean },
): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!ctx) throw new AuthError("Unauthorized", 401);
  // Pages render StaffShell lock UI; API routes should pass allowIdleLocked: false (default).
  if (ctx.idleLocked && !opts?.allowIdleLocked) throw new AuthError("Session locked", 423);
  if (permission && !roleCan(ctx.role, permission)) throw new AuthError("Forbidden", 403);
  return ctx;
}

/** For React pages: allow idle lock so StaffShell can show the unlock gate. */
export async function requireStaffPage(permission?: string): Promise<StaffContext> {
  try {
    return await requireStaff(permission, { allowIdleLocked: true });
  } catch (e) {
    const err = e as AuthError;
    if (err.status === 401) {
      const { redirect } = await import("next/navigation");
      redirect("/staff/login");
    }
    if (err.status === 403) {
      const { redirect } = await import("next/navigation");
      redirect("/staff?error=forbidden");
    }
    throw e;
  }
}

export async function requireReauth(): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (!ctx.reauthFresh) throw new AuthError("Reauthentication required", 403);
  return ctx;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function loginStaff(input: {
  email: string;
  password: string;
  totpCode?: string;
  userAgent?: string | null;
  ip?: string | null;
}): Promise<{ needsMfa?: boolean; ok?: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  const rateKey = `login:${email}`;
  const limit = await checkRateLimit(rateKey, "login");
  if (!limit.ok) {
    return { error: "Too many attempts. Try again later." };
  }

  const users = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1);
  const user = users[0];
  if (!user || !user.active) {
    await hitRateLimit(rateKey, "login");
    return { error: "Invalid username or password." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "Account temporarily locked." };
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    await hitRateLimit(rateKey, "login");
    const failed = user.failedLoginCount + 1;
    await db
      .update(staffUsers)
      .set({
        failedLoginCount: failed,
        lockedUntil: failed >= 8 ? new Date(Date.now() + 15 * 60 * 1000) : null,
      })
      .where(eq(staffUsers.id, user.id));
    return { error: "Invalid username or password." };
  }

  if (user.totpEnabled) {
    if (!input.totpCode) {
      return { needsMfa: true };
    }
    const mfaLimit = await checkRateLimit(`mfa:${email}`, "mfa");
    if (!mfaLimit.ok) return { error: "Too many MFA attempts." };
    if (!user.totpSecretEnc) return { error: "MFA misconfigured." };
    const secret = decryptSecret(user.totpSecretEnc);
    const ok = authenticator.check(input.totpCode.replace(/\s/g, ""), secret);
    if (!ok) {
      await hitRateLimit(`mfa:${email}`, "mfa");
      return { error: "Invalid authenticator code." };
    }
    await clearRateLimit(`mfa:${email}`, "mfa");
  }

  await db
    .update(staffUsers)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(staffUsers.id, user.id));
  await clearRateLimit(rateKey, "login");
  await createStaffSession({
    staffUserId: user.id,
    clinicId: user.clinicId,
    userAgent: input.userAgent,
    ip: input.ip,
  });
  await writeAudit({
    clinicId: user.clinicId,
    actorType: "staff",
    actorId: user.id,
    action: "staff.login",
  });
  return { ok: true };
}

export async function unlockStaffSession(password: string, totpCode?: string) {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (!token) throw new AuthError("Unauthorized", 401);

  const rows = await db
    .select({ session: staffSessions, user: staffUsers })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffUsers.id, staffSessions.staffUserId))
    .where(eq(staffSessions.tokenHash, sha256(token)))
    .limit(1);
  const row = rows[0];
  if (!row) throw new AuthError("Unauthorized", 401);

  const valid = await verifyPassword(row.user.passwordHash, password);
  if (!valid) throw new AuthError("Invalid credentials", 401);

  if (row.user.totpEnabled) {
    if (!totpCode || !row.user.totpSecretEnc) throw new AuthError("MFA required", 401);
    const secret = decryptSecret(row.user.totpSecretEnc);
    if (!authenticator.check(totpCode.replace(/\s/g, ""), secret)) {
      throw new AuthError("Invalid MFA code", 401);
    }
  }

  const now = new Date();
  await db
    .update(staffSessions)
    .set({
      lockedAt: null,
      lastSeenAt: now,
      idleExpiresAt: new Date(now.getTime() + IDLE_LOCK_MS),
      reauthAt: now,
    })
    .where(eq(staffSessions.id, row.session.id));
}

export async function markReauth() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (!token) throw new AuthError("Unauthorized", 401);
  await db
    .update(staffSessions)
    .set({ reauthAt: new Date() })
    .where(eq(staffSessions.tokenHash, sha256(token)));
}

export async function setupTotpSecret(staffUserId: string) {
  const secret = authenticator.generateSecret();
  await db
    .update(staffUsers)
    .set({ totpSecretEnc: encryptSecret(secret), totpEnabled: false })
    .where(eq(staffUsers.id, staffUserId));
  return secret;
}

export async function enableTotp(staffUserId: string, code: string) {
  const users = await db.select().from(staffUsers).where(eq(staffUsers.id, staffUserId)).limit(1);
  const user = users[0];
  if (!user?.totpSecretEnc) throw new AuthError("No pending MFA secret", 400);
  const secret = decryptSecret(user.totpSecretEnc);
  if (!authenticator.check(code.replace(/\s/g, ""), secret)) {
    throw new AuthError("Invalid code", 400);
  }
  await db.update(staffUsers).set({ totpEnabled: true }).where(eq(staffUsers.id, staffUserId));
  await writeAudit({
    clinicId: user.clinicId,
    actorType: "staff",
    actorId: user.id,
    action: "staff.mfa_enabled",
  });
}

export async function setStaffPassword(staffUserId: string, password: string) {
  const passwordHash = await hashPassword(password);
  await db
    .update(staffUsers)
    .set({ passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null, updatedAt: new Date() })
    .where(eq(staffUsers.id, staffUserId));
  await revokeAllStaffSessions(staffUserId);
}

export async function logoutStaff() {
  const jar = await cookies();
  const token = jar.get(STAFF_COOKIE)?.value;
  if (token) {
    await revokeStaffSessionByToken(token);
    jar.set(STAFF_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  }
}
