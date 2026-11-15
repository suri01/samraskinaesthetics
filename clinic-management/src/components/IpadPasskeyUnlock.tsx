"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IpadPasskeyUnlock() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/ipad/webauthn/auth/options", {
        method: "POST",
        credentials: "same-origin",
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) throw new Error(optData.error ?? "Could not start passkey unlock");

      const assertion = await startAuthentication({ optionsJSON: optData.options });
      const verifyRes = await fetch("/api/ipad/webauthn/auth/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: assertion }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Passkey unlock failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="btn btn--primary" type="button" onClick={unlock} disabled={busy}>
        {busy ? "Waiting for Face ID / Touch ID…" : "Authenticate device with passkey"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
