"use client";

import { useState } from "react";

export function MfaSetupPanel({ enabled }: { enabled: boolean }) {
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    const res = await fetch("/api/auth/mfa/setup", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Setup failed");
      return;
    }
    setOtpauth(data.otpauth);
    setSecret(data.secret);
  }

  async function confirm() {
    setError(null);
    const res = await fetch("/api/auth/mfa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Enable failed");
      return;
    }
    setMsg("MFA enabled. Refresh the page.");
  }

  if (enabled && !otpauth) {
    return <p className="ok">TOTP MFA is already enabled on this account.</p>;
  }

  return (
    <div className="stack">
      {!otpauth ? (
        <button className="btn btn--ghost" type="button" onClick={start}>
          Set up authenticator
        </button>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            Add this secret in your authenticator app: <strong>{secret}</strong>
          </p>
          <p className="muted" style={{ margin: 0, wordBreak: "break-all", fontSize: "0.8rem" }}>
            {otpauth}
          </p>
          <div className="field">
            <label htmlFor="mfa-code">Confirm with a code</label>
            <input id="mfa-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <button className="btn btn--primary" type="button" onClick={confirm}>
            Enable MFA
          </button>
        </>
      )}
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
