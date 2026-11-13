"use client";

import { startRegistration } from "@simplewebauthn/browser";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function IpadPasskeyRegister({ initialToken = "" }: { initialToken?: string }) {
  const router = useRouter();
  const [setupCode, setSetupCode] = useState("");
  const [token] = useState(initialToken);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function register() {
    setBusy(true);
    setError(null);
    try {
      const payload = token
        ? { token }
        : { setupCode: setupCode.trim().toUpperCase() };
      if (!token && !setupCode.trim()) {
        throw new Error("Enter the setup code from clinic management.");
      }

      const optRes = await fetch("/api/ipad/webauthn/register/options", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const optData = await optRes.json().catch(() => ({}));
      if (!optRes.ok) throw new Error(optData.error ?? "Could not start registration");
      setDeviceName(optData.deviceName ?? null);

      const credential = await startRegistration({ optionsJSON: optData.options });
      const verifyRes = await fetch("/api/ipad/webauthn/register/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, response: credential }),
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
      <h1>Register this clinic iPad</h1>
      <p className="muted" style={{ margin: 0 }}>
        One-time setup. Reception creates a setup code in Staff → Settings. Enter it here, then create
        a device passkey (Face ID / Touch ID). After that, this iPad can authenticate to the clinic
        backend.
      </p>

      {token ? (
        <p className="ok" style={{ margin: 0 }}>
          Registration link detected{deviceName ? ` for “${deviceName}”` : ""}. Continue to create the
          passkey.
        </p>
      ) : (
        <div className="field">
          <label htmlFor="setup-code">Setup code from reception</label>
          <input
            id="setup-code"
            value={setupCode}
            onChange={(e) => setSetupCode(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ABCD2345"
            required
            style={{ fontSize: "1.35rem", letterSpacing: "0.18em", textAlign: "center" }}
          />
        </div>
      )}

      {deviceName && !done ? (
        <p className="muted" style={{ margin: 0 }}>
          Registering as <strong>{deviceName}</strong>
        </p>
      ) : null}

      {!done ? (
        <button
          className="btn btn--primary"
          type="button"
          onClick={register}
          disabled={busy || (!token && !setupCode.trim())}
        >
          {busy ? "Waiting for passkey…" : "Create device passkey"}
        </button>
      ) : (
        <p className="ok">Registered. Opening device screen…</p>
      )}

      {error ? <p className="error">{error}</p> : null}

      <p className="muted" style={{ margin: 0 }}>
        <Link href="/ipad">← Back to iPad home</Link>
      </p>
    </div>
  );
}
