import { redirect } from "next/navigation";
import { IpadUnlockForm } from "@/components/IpadUnlockForm";
import { getIpadContext } from "@/lib/auth/ipad";

export default async function IpadEntryPage() {
  const ctx = await getIpadContext();
  if (ctx) redirect("/ipad/forms");

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack">
        <p className="badge badge--gold">Customer iPad</p>
        <h1>Welcome</h1>
        <p className="muted">
          Enter the code from reception. This session only covers your appointment — never staff
          tools or other customers.
        </p>
        <IpadUnlockForm />
      </div>
    </main>
  );
}
