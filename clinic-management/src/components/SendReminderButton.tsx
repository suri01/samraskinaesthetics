"use client";

import { useState } from "react";

export function SendReminderButton({ appointmentId }: { appointmentId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/appointments/${appointmentId}/remind`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? (data.status === "failed" ? "WhatsApp send failed" : "Failed"));
      return;
    }
    if (data.mocked) {
      setMsg(
        data.status === "skipped_no_opt_in"
          ? "Skipped — customer has not opted in to WhatsApp reminders."
          : "Reminder saved to the outbox (mock mode).",
      );
      return;
    }
    setMsg(data.status === "sent" ? "WhatsApp reminder sent." : `Reminder status: ${data.status}`);
  }

  return (
    <div className="stack">
      <button className="btn btn--ghost" type="button" onClick={send} disabled={busy}>
        {busy ? "Sending…" : "Send WhatsApp reminder"}
      </button>
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
