"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("reception@samra.demo");
  const [password, setPassword] = useState("ClinicDemo2026!");
  const [totpCode, setTotpCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode: totpCode || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (data.needsMfa) {
      setNeedsMfa(true);
      return;
    }
    if (!res.ok || data.error) {
      setError(data.error ?? "Sign-in failed");
      return;
    }
    router.push("/staff");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
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
      {needsMfa ? (
        <div className="field">
          <label htmlFor="totp">Authenticator code</label>
          <input
            id="totp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required
          />
        </div>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : needsMfa ? "Verify & sign in" : "Sign in"}
      </button>
      <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Sample: reception@samra.demo / ClinicDemo2026! (no MFA; can register iPads). Owner requires
        TOTP from seed output.
      </p>
    </form>
  );
}
