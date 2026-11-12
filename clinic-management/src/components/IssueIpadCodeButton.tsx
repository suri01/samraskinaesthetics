"use client";

import { useState } from "react";

export function IssueIpadCodeButton({ appointmentId }: { appointmentId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function issue() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/appointments/${appointmentId}/ipad-code`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    setCode(data.code);
  }

  return (
    <div className="stack">
      <button className="btn btn--gold" type="button" onClick={issue} disabled={busy}>
        {busy ? "Issuing…" : "Issue iPad unlock code"}
      </button>
      {code ? (
        <p className="ok">
          Code for kiosk: <strong style={{ fontSize: "1.4rem", letterSpacing: "0.15em" }}>{code}</strong>{" "}
          <span className="muted">(30 minutes · enter on /ipad)</span>
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
