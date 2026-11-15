import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(input: {
  clinicId: string;
  actorType: "staff" | "ipad" | "system";
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    clinicId: input.clinicId,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metaJson: input.meta,
  });
}
