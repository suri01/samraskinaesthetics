/**
 * Replace demo staff with Shahid Suri (admin) and Samra Suri (practitioner).
 * Does not wipe customers/appointments — clears staff FKs then rebuilds staff rows.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "../src/db";
import {
  appointments,
  clinics,
  ipadDeviceRegistrations,
  ipadDevices,
  photos,
  staffSessions,
  staffUsers,
  tasks,
  treatmentRecords,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/crypto";

const PASSWORD = "ClinicDemo2026!";

async function main() {
  const [clinic] = await db.select().from(clinics).limit(1);
  if (!clinic) throw new Error("No clinic found");

  const passwordHash = await hashPassword(PASSWORD);

  // Drop staff FK references so demo users can be removed.
  await db.update(appointments).set({ practitionerId: null });
  await db.update(treatmentRecords).set({ practitionerId: null });
  await db.update(photos).set({ uploadedByStaffId: null });
  await db.update(tasks).set({ assigneeId: null });
  await db.update(ipadDevices).set({ registeredByStaffId: null });
  await db.update(ipadDeviceRegistrations).set({ createdByStaffId: null });

  await db.delete(staffSessions);
  await db.delete(staffUsers);

  const inserted = await db
    .insert(staffUsers)
    .values([
      {
        clinicId: clinic.id,
        email: "shahidsuri",
        name: "Shahid Suri",
        role: "admin",
        passwordHash,
        totpEnabled: false,
        totpSecretEnc: null,
        active: true,
      },
      {
        clinicId: clinic.id,
        email: "samrasuri",
        name: "Samra Suri",
        role: "practitioner",
        passwordHash,
        totpEnabled: false,
        totpSecretEnc: null,
        active: true,
      },
    ])
    .returning({
      id: staffUsers.id,
      email: staffUsers.email,
      name: staffUsers.name,
      role: staffUsers.role,
    });

  console.log("Staff replaced for clinic", clinic.name);
  console.log(JSON.stringify(inserted, null, 2));
  console.log("Password for both:", PASSWORD);
  console.log("Log in with username: shahidsuri (admin) or samrasuri (practitioner)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
