"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateInvoiceButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/staff/invoices/from-appointment", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not generate invoice");
      setMsg(
        data.alreadyExisted
          ? `Invoice ${data.invoice.number} already exists for this appointment.`
          : `Created ${data.invoice.number}.`,
      );
      router.push(`/staff/invoices/${data.invoice.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <button className="btn btn--primary" type="button" onClick={generate} disabled={busy}>
        {busy ? "Generating…" : "Generate invoice from appointment"}
      </button>
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
