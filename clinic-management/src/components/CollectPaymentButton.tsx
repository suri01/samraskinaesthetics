"use client";

import { useState } from "react";

export function CollectPaymentButton({ invoiceId }: { invoiceId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pay() {
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Payment failed");
      return;
    }
    setMsg(
      data.mocked
        ? `Mock payment recorded (${data.providerRef}). No card data stored.`
        : `Stripe PaymentIntent ${data.providerRef} created.`,
    );
  }

  return (
    <div className="stack">
      <button className="btn btn--primary" type="button" onClick={pay} disabled={busy}>
        {busy ? "Processing…" : "Collect payment"}
      </button>
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
