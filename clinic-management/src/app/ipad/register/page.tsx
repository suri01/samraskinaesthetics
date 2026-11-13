import { IpadPasskeyRegister } from "@/components/IpadPasskeyRegister";

export default async function IpadRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <main className="ipad-shell">
      <div className="ipad-card stack">
        <p className="badge badge--gold">Device registration</p>
        {token ? (
          <IpadPasskeyRegister token={token} />
        ) : (
          <>
            <h1>Missing registration token</h1>
            <p className="muted">
              Ask reception to create an iPad registration link under Staff → Settings, then open that
              link on this device.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
