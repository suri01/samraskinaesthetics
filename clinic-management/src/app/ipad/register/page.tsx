import { GateShell } from "@/components/GateShell";
import { IpadPasskeyRegister } from "@/components/IpadPasskeyRegister";

export default async function IpadRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <GateShell eyebrow="iPad registration" logoHref="/ipad" wide>
      <h1>Register this iPad</h1>
      <p className="gate__lede">
        Enter the one-time setup code from an admin, then create this device&apos;s passkey.
      </p>
      <IpadPasskeyRegister initialToken={token} />
    </GateShell>
  );
}
