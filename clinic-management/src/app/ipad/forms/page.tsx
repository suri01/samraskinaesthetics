import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { IpadFormsClient } from "@/components/IpadFormsClient";
import { db } from "@/db";
import { clinicSettings, formTemplates } from "@/db/schema";
import { getIpadContext } from "@/lib/auth/ipad";

export default async function IpadFormsPage() {
  const ctx = await getIpadContext();
  if (!ctx) redirect("/ipad");

  const templates = await db
    .select()
    .from(formTemplates)
    .where(eq(formTemplates.clinicId, ctx.clinicId));
  const [settings] = await db
    .select()
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, ctx.clinicId))
    .limit(1);

  const intake = templates.find((t) => t.key === "intake_v1") ?? templates[0];

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack" style={{ width: "min(640px, 100%)" }}>
        <p className="badge badge--gold">Your appointment</p>
        <h1>{ctx.serviceName}</h1>
        <p className="muted">
          Hello {ctx.customerName}. Please complete the form, optional clinical photos, and consent
          below. This iPad session only covers your appointment and expires automatically.
        </p>
        <IpadFormsClient
          templateId={intake?.id ?? ""}
          fields={(intake?.schemaJson.fields as Array<Record<string, unknown>>) ?? []}
          consentTitle="Treatment consent"
          consentBody={settings?.consentTemplate ?? ""}
        />
      </div>
    </main>
  );
}
