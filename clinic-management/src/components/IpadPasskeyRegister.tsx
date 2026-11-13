"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IpadPasskeyRegister({ token }: { token: string }) {
  const router = useRouter();
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function register() {
    setBusy(true);
    setError(null);
    try {
      const optRes = await fetch("/api/ipad/webauthn/register/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) throw new Error(optData.error ?? "Could not start registration");
      setDeviceName(optData.deviceName ?? null);

      const credential = await startRegistration({ optionsJSON: optData.options });
      const verifyRes = await fetch("/api/ipad/webauthn/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, response: credential }),
      });
      const verifyData = await verifyRes.json().catch(() => ({}));
      if (!verifyRes.ok) throw new Error(verifyData.error ?? "Verification failed");
      setDone(true);
      setTimeout(() => {
        router.push("/ipad");
        router.refresh();
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <h1>Register this iPad</h1>
      <p className="muted">
        {deviceName ? (
          <>
            Creating a passkey for <strong>{deviceName}</strong>. Use Face ID / Touch ID when prompted.
          </>
        ) : (
          <>This links a device passkey to Samra clinic management. Do this once per clinic iPad.</>
        )}
      </p>
      {!done ? (
        <button className="btn btn--primary" type="button" onClick={register} disabled={busy || !token}>
          {busy ? "Waiting for passkey…" : "Create device passkey"}
        </button>
      ) : (
        <p className="ok">Registered. Opening check-in…</p>
      )}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
