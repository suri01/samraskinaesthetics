import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
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
        <div style={{ textAlign: "center" }}>
          <BrandLogo href={null} size="card" priority />
          <p className="badge badge--gold">Clinic iPad</p>
        </div>
        {!device ? (
          <>
            <h1>Authenticate this device</h1>
            <p className="muted">
              Use Face ID or Touch ID to unlock this registered clinic iPad.
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
              <strong>{device.deviceName}</strong> is ready. Enter the visit passcode from the
              appointment to open this customer&apos;s forms.
            </p>
            <IpadUnlockForm />
          </>
        )}
      </div>
    </main>
  );
}
