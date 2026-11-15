import Link from "next/link";
import { redirect } from "next/navigation";
import { GateShell } from "@/components/GateShell";
import { IpadPasskeyUnlock } from "@/components/IpadPasskeyUnlock";
import { IpadUnlockForm } from "@/components/IpadUnlockForm";
import { getIpadContext } from "@/lib/auth/ipad";
import { getIpadDeviceContext } from "@/lib/auth/ipad-device";

export default async function IpadEntryPage() {
  const customerSession = await getIpadContext();
  if (customerSession) redirect("/ipad/forms");

  const device = await getIpadDeviceContext();

  return (
    <GateShell eyebrow="Clinic iPad" logoHref={null} wide>
      {!device ? (
        <>
          <h1>Authenticate this device</h1>
          <p className="gate__lede">
            Use Face ID or Touch ID to unlock this registered clinic iPad.
          </p>
          <IpadPasskeyUnlock />
          <div className="panel stack" style={{ background: "rgba(255,255,255,0.55)" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.15rem" }}>
              First time on this iPad?
            </h2>
            <p className="muted" style={{ margin: 0 }}>
              Open registration and enter the setup code from Staff → Settings.
            </p>
            <Link className="btn btn--ghost" href="/ipad/register">
              iPad registration
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1>Hand over to customer</h1>
          <p className="gate__lede">
            <strong>{device.deviceName}</strong> is ready. Enter the visit passcode from the
            appointment.
          </p>
          <IpadUnlockForm />
        </>
      )}
    </GateShell>
  );
}
