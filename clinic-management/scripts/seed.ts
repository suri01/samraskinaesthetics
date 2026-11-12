import { config } from "dotenv";
config({ path: ".env" });

import { eq } from "drizzle-orm";
import { authenticator } from "otplib";
import { db } from "../src/db";
import {
  appointments,
  auditLogs,
  clinicSettings,
  clinics,
  consentRecords,
  customers,
  formSubmissions,
  formTemplates,
  invoices,
  messageOutbox,
  payments,
  photos,
  staffUsers,
  tasks,
  treatmentRecords,
} from "../src/db/schema";
import { encryptSecret, hashPassword } from "../src/lib/crypto";

async function main() {
  console.log("Seeding Samra clinic sample data (fictional only)…");

  // Wipe in dependency-safe order for repeatable local seeds
  await db.delete(messageOutbox);
  await db.delete(auditLogs);
  await db.delete(payments);
  await db.delete(invoices);
  await db.delete(photos);
  await db.delete(treatmentRecords);
  await db.delete(consentRecords);
  await db.delete(formSubmissions);
  await db.delete(formTemplates);
  await db.delete(tasks);
  await db.delete(appointments);
  await db.delete(customers);
  await db.delete(staffUsers);
  await db.delete(clinicSettings);
  await db.delete(clinics);

  const [clinic] = await db
    .insert(clinics)
    .values({
      name: "Samra Skin & Aesthetics",
      country: "GB",
      currency: "GBP",
      timezone: "Europe/London",
      addressJson: {
        line1: "12 Sample Street",
        city: "London",
        postcode: "SW1A 1AA",
        country: "United Kingdom",
      },
    })
    .returning();

  const password = "ClinicDemo2026!";
  const passwordHash = await hashPassword(password);

  const totpSecret = authenticator.generateSecret();
  const ownerTotpEnc = encryptSecret(totpSecret);

  const [owner, practitioner, receptionist, finance] = await db
    .insert(staffUsers)
    .values([
      {
        clinicId: clinic.id,
        email: "owner@samra.demo",
        name: "Samra Suri",
        role: "owner",
        passwordHash,
        totpSecretEnc: ownerTotpEnc,
        totpEnabled: true,
      },
      {
        clinicId: clinic.id,
        email: "practitioner@samra.demo",
        name: "Alex Morgan",
        role: "practitioner",
        passwordHash,
        totpEnabled: false,
      },
      {
        clinicId: clinic.id,
        email: "reception@samra.demo",
        name: "Jordan Lee",
        role: "receptionist",
        passwordHash,
        totpEnabled: false,
      },
      {
        clinicId: clinic.id,
        email: "finance@samra.demo",
        name: "Casey Patel",
        role: "finance",
        passwordHash,
        totpEnabled: false,
      },
    ])
    .returning();

  await db.insert(clinicSettings).values({
    clinicId: clinic.id,
    retentionYearsClinical: 8,
    retentionYearsFinance: 7,
    consentTemplate:
      "I confirm I have discussed the proposed treatment, risks, benefits, and aftercare with the practitioner. I consent to treatment today. This is sample wording for demonstration only.",
  });

  const [custA, custB, custC] = await db
    .insert(customers)
    .values([
      {
        clinicId: clinic.id,
        firstName: "Amelia",
        lastName: "Wright",
        email: "amelia.wright@example.com",
        phone: "+447700900123",
        dateOfBirth: "1990-04-12",
        allergies: "None known",
        medicalNotes: "Sample notes only — fictional customer.",
        whatsappOptIn: true,
        emailOptIn: true,
        marketingOptIn: false,
      },
      {
        clinicId: clinic.id,
        firstName: "Noah",
        lastName: "Bennett",
        email: "noah.bennett@example.com",
        phone: "+447700900456",
        dateOfBirth: "1985-11-03",
        allergies: "Penicillin (reported)",
        whatsappOptIn: false,
        emailOptIn: true,
        marketingOptIn: false,
      },
      {
        clinicId: clinic.id,
        firstName: "Isla",
        lastName: "Hughes",
        email: "isla.hughes@example.com",
        phone: "+447700900789",
        dateOfBirth: "1994-07-22",
        whatsappOptIn: true,
        emailOptIn: false,
        marketingOptIn: false,
      },
    ])
    .returning();

  const now = new Date();
  const today10 = new Date(now);
  today10.setHours(10, 0, 0, 0);
  const today1130 = new Date(now);
  today1130.setHours(11, 30, 0, 0);
  const tomorrow14 = new Date(now);
  tomorrow14.setDate(tomorrow14.getDate() + 1);
  tomorrow14.setHours(14, 0, 0, 0);

  const [appt1, appt2, appt3] = await db
    .insert(appointments)
    .values([
      {
        clinicId: clinic.id,
        customerId: custA.id,
        practitionerId: practitioner.id,
        startsAt: today10,
        endsAt: new Date(today10.getTime() + 60 * 60 * 1000),
        status: "scheduled",
        serviceName: "Skin consultation",
        notes: "New customer — sample.",
      },
      {
        clinicId: clinic.id,
        customerId: custB.id,
        practitionerId: practitioner.id,
        startsAt: today1130,
        endsAt: new Date(today1130.getTime() + 45 * 60 * 1000),
        status: "checked_in",
        serviceName: "Treatment facial",
      },
      {
        clinicId: clinic.id,
        customerId: custC.id,
        practitionerId: practitioner.id,
        startsAt: tomorrow14,
        endsAt: new Date(tomorrow14.getTime() + 60 * 60 * 1000),
        status: "scheduled",
        serviceName: "Follow-up review",
      },
    ])
    .returning();

  const [intake] = await db
    .insert(formTemplates)
    .values({
      clinicId: clinic.id,
      key: "intake_v1",
      title: "New customer intake",
      version: 1,
      schemaJson: {
        fields: [
          { id: "gp", label: "GP / clinic name", type: "text" },
          { id: "medications", label: "Current medications", type: "textarea" },
          { id: "pregnant", label: "Pregnant or breastfeeding?", type: "select", options: ["No", "Yes", "Prefer not to say"] },
          { id: "goals", label: "What would you like help with?", type: "textarea" },
        ],
      },
    })
    .returning();

  await db.insert(formSubmissions).values({
    clinicId: clinic.id,
    templateId: intake.id,
    appointmentId: appt2.id,
    customerId: custB.id,
    answersJson: {
      gp: "Sample Medical Centre",
      medications: "None",
      pregnant: "No",
      goals: "Even skin tone",
    },
    signedName: "Noah Bennett",
    signedAt: new Date(),
  });

  await db.insert(consentRecords).values({
    clinicId: clinic.id,
    customerId: custB.id,
    appointmentId: appt2.id,
    title: "Treatment consent (sample)",
    body: "Sample consent body for demonstration.",
    signedName: "Noah Bennett",
    signedAt: new Date(),
  });

  const [treatment] = await db
    .insert(treatmentRecords)
    .values({
      clinicId: clinic.id,
      customerId: custB.id,
      appointmentId: appt2.id,
      practitionerId: practitioner.id,
      title: "Treatment facial",
      notes: "Sample clinical notes — fictional. Skin calm; mild erythema expected.",
      productsUsed: "Sample cleanser, peel (demo lot)",
      lotNumbers: "LOT-DEMO-001",
      aftercare: "SPF, avoid heat 24h — sample aftercare.",
    })
    .returning();

  await db.insert(photos).values({
    clinicId: clinic.id,
    customerId: custB.id,
    appointmentId: appt2.id,
    treatmentId: treatment.id,
    storageKey: `${clinic.id}/sample/placeholder-before.txt`,
    contentType: "text/plain",
    byteSize: 42,
    caption: "Placeholder photo record (upload real images in app)",
    stage: "before",
    uploadedByStaffId: practitioner.id,
  });

  const [invoice] = await db
    .insert(invoices)
    .values({
      clinicId: clinic.id,
      customerId: custB.id,
      appointmentId: appt2.id,
      number: "SSA-1001",
      status: "open",
      currency: "GBP",
      subtotalPence: 12000,
      taxPence: 0,
      totalPence: 12000,
      lineItemsJson: [{ description: "Treatment facial", quantity: 1, unitPence: 12000 }],
      issuedAt: new Date(),
    })
    .returning();

  await db.insert(payments).values({
    clinicId: clinic.id,
    invoiceId: invoice.id,
    amountPence: 12000,
    currency: "GBP",
    status: "mocked",
    provider: "mock",
    providerRef: "mock_pi_seed",
    mocked: true,
  });

  await db.insert(tasks).values([
    {
      clinicId: clinic.id,
      customerId: custA.id,
      assigneeId: receptionist.id,
      title: "Confirm Amelia’s consultation tomorrow WhatsApp (if opted in)",
      dueAt: today10,
      status: "open",
    },
    {
      clinicId: clinic.id,
      customerId: custC.id,
      assigneeId: practitioner.id,
      title: "Review Isla’s photos before follow-up",
      dueAt: tomorrow14,
      status: "open",
    },
  ]);

  await db.insert(messageOutbox).values({
    clinicId: clinic.id,
    customerId: custA.id,
    appointmentId: appt1.id,
    channel: "whatsapp",
    toAddress: custA.phone!,
    preview: "Reminder: appointment on today 10:00",
    body: "Hi Amelia, this is a reminder of your Skin consultation appointment at Samra Skin & Aesthetics. Reply STOP to opt out of reminders.",
    status: "mocked",
    mocked: true,
  });

  await db.insert(auditLogs).values({
    clinicId: clinic.id,
    actorType: "system",
    action: "seed.completed",
    metaJson: { note: "Fictional sample data only" },
  });

  // Ensure owner still present (lint silence)
  void owner;
  void finance;
  void eq;

  console.log("\nSeed complete.\n");
  console.log("Staff logins (password for all):", password);
  console.log("  owner@samra.demo        (TOTP MFA enabled)");
  console.log("  practitioner@samra.demo");
  console.log("  reception@samra.demo");
  console.log("  finance@samra.demo");
  console.log("\nOwner TOTP secret (add to authenticator app):", totpSecret);
  console.log("Owner TOTP sample code now:", authenticator.generate(totpSecret));
  console.log("\nClinic id:", clinic.id);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
