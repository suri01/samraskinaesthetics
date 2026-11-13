import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { db } from "../src/db";
import { clinics } from "../src/db/schema";
import { ensureDefaultTreatments, listClinicTreatments } from "../src/lib/treatments";

async function main() {
  const rows = await db.select({ id: clinics.id, name: clinics.name }).from(clinics);
  for (const c of rows) {
    await ensureDefaultTreatments(c.id);
    const items = await listClinicTreatments(c.id, { includeInactive: true });
    console.log(`${c.name} (${c.id}): ${items.length} treatments`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
