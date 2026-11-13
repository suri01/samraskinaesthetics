"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GateShell } from "@/components/GateShell";

export function IdleLockGate({ name }: { name: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, totpCode }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not unlock");
      return;
    }
    router.refresh();
  }

  return (
    <GateShell eyebrow="Session locked" logoHref={null}>
      <h1>Welcome back, {name.split(" ")[0]}</h1>
      <p className="gate__lede">Idle for 15 minutes. Re-enter your password to continue.</p>
      <form className="stack" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="totp">Authenticator code (if MFA enabled)</label>
          <input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </GateShell>
  );
}
