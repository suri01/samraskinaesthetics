import { redirect } from "next/navigation";
import { IpadPasskeyUnlock } from "@/components/IpadPasskeyUnlock";
import { IpadUnlockForm } from "@/components/IpadUnlockForm";
import { getIpadContext } from "@/lib/auth/ipad";
import { getIpadDeviceContext } from "@/lib/auth/ipad-device";

export default async function IpadEntryPage() {
  const customerSession = await getIpadContext();
  if (customerSession) redirect("/ipad/forms");

  const device = await getIpadDeviceContext();

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack">
        <p className="badge badge--gold">Customer iPad</p>
        {!device ? (
          <>
            <h1>Unlock this clinic iPad</h1>
            <p className="muted">
              Use the device passkey registered in clinic management (Face ID / Touch ID). Unregistered
              iPads cannot start customer check-in.
            </p>
            <IpadPasskeyUnlock />
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
              First time? Reception creates a registration link under Staff → Settings, then open it
              here once.
            </p>
          </>
        ) : (
          <>
            <h1>Welcome</h1>
            <p className="muted">
              Device <strong>{device.deviceName}</strong> is unlocked. Enter the visit code from
              reception to open this customer’s check-in.
            </p>
            <IpadUnlockForm />
          </>
        )}
      </div>
    </main>
  );
}
