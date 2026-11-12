"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IpadUnlockForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ipad/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Invalid code");
      return;
    }
    router.push("/ipad/forms");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="code">Unlock code</label>
        <input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          style={{ fontSize: "1.4rem", letterSpacing: "0.2em", textAlign: "center" }}
        />
      </div>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Starting…" : "Continue"}
      </button>
    </form>
  );
}
