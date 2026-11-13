import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { appointments, customers, type MedicalHistory, ipadSessions } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { IPAD_COOKIE, IPAD_SESSION_MS } from "@/lib/constants";
import { randomNumericCode, randomToken, sha256 } from "@/lib/crypto";
import { AuthError } from "./staff";

export type IpadContext = {
  sessionId: string;
  clinicId: string;
  appointmentId: string;
  customerId: string;
  customerName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  addressJson: Record<string, string> | null;
  allergies: string | null;
  medicalNotes: string | null;
  medicalHistory: MedicalHistory | null;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  /** True when intake has never been completed (typical after booking registration). */
  isNewCustomer: boolean;
  serviceName: string;
  startsAt: Date;
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

export async function issueIpadUnlockCode(appointmentId: string, clinicId: string) {
  const code = randomNumericCode(6);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await db
    .update(appointments)
    .set({
      ipadUnlockCodeHash: sha256(code),
      ipadUnlockExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(and(eq(appointments.id, appointmentId), eq(appointments.clinicId, clinicId)));
  await writeAudit({
    clinicId,
    actorType: "staff",
    action: "ipad.unlock_code_issued",
    entityType: "appointment",
    entityId: appointmentId,
  });
  return { code, expiresAt };
}

export async function startIpadSession(code: string): Promise<{ ok: true } | { error: string }> {
  const codeHash = sha256(code.trim());
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.ipadUnlockCodeHash, codeHash))
    .limit(1);
  const appt = rows[0];
  if (!appt || !appt.ipadUnlockExpiresAt || appt.ipadUnlockExpiresAt < new Date()) {
    return { error: "Invalid or expired code." };
  }

  await db
    .update(ipadSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(ipadSessions.appointmentId, appt.id), isNull(ipadSessions.revokedAt)));

  const token = randomToken(32);
  const now = new Date();
  await db.insert(ipadSessions).values({
    clinicId: appt.clinicId,
    appointmentId: appt.id,
    customerId: appt.customerId,
    tokenHash: sha256(token),
    createdAt: now,
    expiresAt: new Date(now.getTime() + IPAD_SESSION_MS),
  });

  await db
    .update(appointments)
    .set({
      ipadUnlockCodeHash: null,
      ipadUnlockExpiresAt: null,
      status: appt.status === "scheduled" ? "checked_in" : appt.status,
      updatedAt: now,
    })
    .where(eq(appointments.id, appt.id));

  const jar = await cookies();
  jar.set(IPAD_COOKIE, token, cookieOptions(Math.floor(IPAD_SESSION_MS / 1000)));

  await writeAudit({
    clinicId: appt.clinicId,
    actorType: "ipad",
    action: "ipad.session_started",
    entityType: "customer",
    entityId: appt.customerId,
    meta: { appointmentId: appt.id },
  });

  return { ok: true };
}

export async function getIpadContext(): Promise<IpadContext | null> {
  const jar = await cookies();
  const token = jar.get(IPAD_COOKIE)?.value;
  if (!token) return null;

  const rows = await db
    .select({
      session: ipadSessions,
      appointment: appointments,
      customer: customers,
    })
    .from(ipadSessions)
    .innerJoin(appointments, eq(appointments.id, ipadSessions.appointmentId))
    .innerJoin(customers, eq(customers.id, ipadSessions.customerId))
    .where(eq(ipadSessions.tokenHash, sha256(token)))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  const { session, appointment, customer } = row;
  if (session.revokedAt || session.completedAt || session.abandonedAt) return null;
  if (session.expiresAt < new Date()) return null;

  return {
    sessionId: session.id,
    clinicId: session.clinicId,
    appointmentId: appointment.id,
    customerId: customer.id,
    customerName: `${customer.firstName} ${customer.lastName}`,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    dateOfBirth: customer.dateOfBirth,
    addressJson: customer.addressJson ?? null,
    allergies: customer.allergies,
    medicalNotes: customer.medicalNotes,
    medicalHistory: customer.medicalHistoryJson ?? null,
    whatsappOptIn: customer.whatsappOptIn,
    emailOptIn: customer.emailOptIn,
    isNewCustomer: !customer.intakeCompletedAt,
    serviceName: appointment.serviceName,
    startsAt: appointment.startsAt,
  };
}

export async function requireIpad(): Promise<IpadContext> {
  const ctx = await getIpadContext();
  if (!ctx) throw new AuthError("iPad session required", 401);
  return ctx;
}

export async function completeIpadSession() {
  const jar = await cookies();
  const token = jar.get(IPAD_COOKIE)?.value;
  if (!token) return;
  await db
    .update(ipadSessions)
    .set({ completedAt: new Date() })
    .where(eq(ipadSessions.tokenHash, sha256(token)));
  jar.set(IPAD_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

export async function abandonIpadSession() {
  const jar = await cookies();
  const token = jar.get(IPAD_COOKIE)?.value;
  if (!token) return;
  await db
    .update(ipadSessions)
    .set({ abandonedAt: new Date() })
    .where(eq(ipadSessions.tokenHash, sha256(token)));
  jar.set(IPAD_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}
