import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const staffRoleEnum = pgEnum("staff_role", [
  "owner",
  "practitioner",
  "receptionist",
  "finance",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "void",
  "refunded",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "mocked",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "done",
  "cancelled",
]);

export const clinics = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  country: varchar("country", { length: 2 }).notNull().default("GB"),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  timezone: text("timezone").notNull().default("Europe/London"),
  addressJson: jsonb("address_json").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const staffUsers = pgTable(
  "staff_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: staffRoleEnum("role").notNull(),
    passwordHash: text("password_hash").notNull(),
    totpSecretEnc: text("totp_secret_enc"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    recoveryCodesHash: text("recovery_codes_hash"),
    active: boolean("active").notNull().default(true),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    inviteTokenHash: text("invite_token_hash"),
    passwordResetTokenHash: text("password_reset_token_hash"),
    passwordResetExpiresAt: timestamp("password_reset_expires_at", { withTimezone: true }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("staff_users_clinic_email_uidx").on(t.clinicId, t.email),
    index("staff_users_clinic_idx").on(t.clinicId),
  ],
);

export const staffSessions = pgTable(
  "staff_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    staffUserId: uuid("staff_user_id")
      .notNull()
      .references(() => staffUsers.id, { onDelete: "cascade" }),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    absoluteExpiresAt: timestamp("absolute_expires_at", { withTimezone: true }).notNull(),
    idleExpiresAt: timestamp("idle_expires_at", { withTimezone: true }).notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    reauthAt: timestamp("reauth_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    userAgent: text("user_agent"),
    ip: text("ip"),
  },
  (t) => [
    uniqueIndex("staff_sessions_token_hash_uidx").on(t.tokenHash),
    index("staff_sessions_user_idx").on(t.staffUserId),
  ],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    action: text("action").notNull(),
    attempts: integer("attempts").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true }).defaultNow().notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
  },
  (t) => [uniqueIndex("auth_rate_limits_key_action_uidx").on(t.key, t.action)],
);

export type MedicalHistory = {
  gpName?: string;
  medications?: string;
  allergies?: string;
  conditions?: string;
  previousTreatments?: string;
  pregnantBreastfeeding?: string;
  smoking?: string;
  skinGoals?: string;
  emergencyName?: string;
  emergencyPhone?: string;
};

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    dateOfBirth: text("date_of_birth"),
    addressJson: jsonb("address_json").$type<Record<string, string>>(),
    medicalNotes: text("medical_notes"),
    allergies: text("allergies"),
    medicalHistoryJson: jsonb("medical_history_json").$type<MedicalHistory>(),
    /** null = new / incomplete intake (typical after booking registration). */
    intakeCompletedAt: timestamp("intake_completed_at", { withTimezone: true }),
    registeredVia: text("registered_via").notNull().default("booking"),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(false),
    emailOptIn: boolean("email_opt_in").notNull().default(false),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    /** Soft interest from iPad upsell — staff follow up; not a payment. */
    upsellInterestJson: jsonb("upsell_interest_json").$type<
      Array<{ sku: string; title: string; bookedService: string; notedAt: string }>
    >(),
    retentionHold: boolean("retention_hold").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("customers_clinic_idx").on(t.clinicId)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    practitionerId: uuid("practitioner_id").references(() => staffUsers.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("scheduled"),
    serviceName: text("service_name").notNull(),
    notes: text("notes"),
    ipadUnlockCodeHash: text("ipad_unlock_code_hash"),
    ipadUnlockExpiresAt: timestamp("ipad_unlock_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("appointments_clinic_starts_idx").on(t.clinicId, t.startsAt),
    index("appointments_customer_idx").on(t.customerId),
  ],
);

export const ipadDevices = pgTable(
  "ipad_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    name: text("name").notNull(),
    /** WebAuthn credential ID (base64url). */
    credentialId: text("credential_id").notNull(),
    publicKey: text("public_key").notNull(),
    counter: integer("counter").notNull().default(0),
    transportsJson: jsonb("transports_json").$type<string[]>(),
    deviceType: text("device_type"),
    backedUp: boolean("backed_up").notNull().default(false),
    active: boolean("active").notNull().default(true),
    registeredByStaffId: uuid("registered_by_staff_id").references(() => staffUsers.id),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("ipad_devices_credential_uidx").on(t.credentialId),
    index("ipad_devices_clinic_idx").on(t.clinicId),
  ],
);

/** One-time staff-issued tokens so an iPad can register a passkey without a staff browser session. */
export const ipadDeviceRegistrations = pgTable(
  "ipad_device_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    createdByStaffId: uuid("created_by_staff_id").references(() => staffUsers.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("ipad_device_registrations_token_uidx").on(t.tokenHash)],
);

export const webauthnChallenges = pgTable(
  "webauthn_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id").references(() => clinics.id),
    purpose: text("purpose").notNull(),
    challenge: text("challenge").notNull(),
    registrationId: uuid("registration_id").references(() => ipadDeviceRegistrations.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("webauthn_challenges_challenge_idx").on(t.challenge)],
);

export const ipadDeviceSessions = pgTable(
  "ipad_device_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    deviceId: uuid("device_id")
      .notNull()
      .references(() => ipadDevices.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("ipad_device_sessions_token_uidx").on(t.tokenHash),
    index("ipad_device_sessions_device_idx").on(t.deviceId),
  ],
);

export const ipadSessions = pgTable(
  "ipad_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    deviceId: uuid("device_id").references(() => ipadDevices.id),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("ipad_sessions_token_hash_uidx").on(t.tokenHash),
    index("ipad_sessions_appointment_idx").on(t.appointmentId),
  ],
);

export const formTemplates = pgTable("form_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  key: text("key").notNull(),
  title: text("title").notNull(),
  version: integer("version").notNull().default(1),
  schemaJson: jsonb("schema_json").$type<{ fields: Array<Record<string, unknown>> }>().notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const formSubmissions = pgTable("form_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  templateId: uuid("template_id")
    .notNull()
    .references(() => formTemplates.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  answersJson: jsonb("answers_json").$type<Record<string, unknown>>().notNull(),
  signedName: text("signed_name"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const consentRecords = pgTable("consent_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  signedName: text("signed_name").notNull(),
  signedAt: timestamp("signed_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const treatmentRecords = pgTable("treatment_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  practitionerId: uuid("practitioner_id").references(() => staffUsers.id),
  title: text("title").notNull(),
  notes: text("notes").notNull(),
  productsUsed: text("products_used"),
  lotNumbers: text("lot_numbers"),
  aftercare: text("aftercare"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  treatmentId: uuid("treatment_id").references(() => treatmentRecords.id),
  storageKey: text("storage_key").notNull(),
  contentType: text("content_type").notNull(),
  byteSize: integer("byte_size").notNull(),
  caption: text("caption"),
  stage: text("stage").notNull().default("before"),
  uploadedByStaffId: uuid("uploaded_by_staff_id").references(() => staffUsers.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  number: text("number").notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  subtotalPence: integer("subtotal_pence").notNull(),
  taxPence: integer("tax_pence").notNull().default(0),
  totalPence: integer("total_pence").notNull(),
  lineItemsJson: jsonb("line_items_json")
    .$type<Array<{ description: string; quantity: number; unitPence: number }>>()
    .notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id),
  amountPence: integer("amount_pence").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  provider: text("provider").notNull().default("mock"),
  providerRef: text("provider_ref"),
  mocked: boolean("mocked").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id").references(() => customers.id),
  assigneeId: uuid("assignee_id").references(() => staffUsers.id),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  status: taskStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messageOutbox = pgTable("message_outbox", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id),
  customerId: uuid("customer_id").references(() => customers.id),
  appointmentId: uuid("appointment_id").references(() => appointments.id),
  channel: text("channel").notNull().default("whatsapp"),
  toAddress: text("to_address").notNull(),
  preview: text("preview").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("mocked"),
  mocked: boolean("mocked").notNull().default(true),
  providerRef: text("provider_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clinicId: uuid("clinic_id")
      .notNull()
      .references(() => clinics.id),
    actorType: text("actor_type").notNull(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metaJson: jsonb("meta_json").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_clinic_created_idx").on(t.clinicId, t.createdAt)],
);

export const clinicSettings = pgTable("clinic_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinics.id)
    .unique(),
  retentionYearsClinical: integer("retention_years_clinical").notNull().default(8),
  retentionYearsFinance: integer("retention_years_finance").notNull().default(7),
  idleLockMinutes: integer("idle_lock_minutes").notNull().default(15),
  maxSessionHours: integer("max_session_hours").notNull().default(12),
  rolesJson: jsonb("roles_json")
    .$type<Record<string, string[]>>()
    .notNull()
    .default({
      owner: ["*"],
      practitioner: ["customers", "appointments", "treatments", "photos", "forms"],
      receptionist: ["customers", "appointments", "forms", "tasks"],
      finance: ["customers", "invoices", "payments"],
    }),
  consentTemplate: text("consent_template").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
