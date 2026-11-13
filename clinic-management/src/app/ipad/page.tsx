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
        <p className="badge badge--gold">Clinic iPad</p>
        {!device ? (
          <>
            <h1>Authenticate this device</h1>
            <p className="muted">
              Like a mobile app signing the device in: use the clinic passkey (Face ID / Touch ID) so
              backend access stays limited to registered iPads.
            </p>
            <IpadPasskeyUnlock />
            <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
              First time setup: Staff → Settings → create a registration link, open it on this iPad
              once.
            </p>
          </>
        ) : (
          <>
            <h1>Hand over to customer</h1>
            <p className="muted">
              Device <strong>{device.deviceName}</strong> is trusted. When you hand the iPad over,
              ask the customer to enter the passcode you generate in clinic management — that opens{" "}
              <em>only their</em> profile.
            </p>
            <IpadUnlockForm />
          </>
        )}
      </div>
    </main>
  );
}
