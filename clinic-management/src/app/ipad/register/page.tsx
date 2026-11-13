import { BrandLogo } from "@/components/BrandLogo";
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
        <div style={{ textAlign: "center" }}>
          <BrandLogo href={null} size="card" priority />
          <p className="badge badge--gold">iPad registration</p>
        </div>
        <IpadPasskeyRegister initialToken={token} />
      </div>
    </main>
  );
}
