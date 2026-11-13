import Link from "next/link";
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
            <div className="panel stack" style={{ background: "rgba(255,255,255,0.5)" }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
                First time on this iPad?
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Open the registration screen and enter the setup code from Staff → Settings.
              </p>
              <Link className="btn btn--ghost" href="/ipad/register">
                Go to iPad registration screen
              </Link>
            </div>
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
