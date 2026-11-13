"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomerOption = { id: string; firstName: string; lastName: string; email: string | null };

type LineDraft = {
  description: string;
  quantity: string;
  unitPounds: string;
};

export function CreateInvoiceForm(props: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(props.customers[0]?.id ?? "");
  const [status, setStatus] = useState<"open" | "draft">("open");
  const [notes, setNotes] = useState("");
  const [taxPounds, setTaxPounds] = useState("0");
  const [lines, setLines] = useState<LineDraft[]>([
    { description: "", quantity: "1", unitPounds: "" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", quantity: "1", unitPounds: "" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/invoices", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          status,
          notes,
          taxPounds,
          lineItems: lines.map((li) => ({
            description: li.description,
            quantity: Number(li.quantity),
            unitPounds: li.unitPounds,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create invoice");
      router.push(`/staff/invoices/${data.invoice.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setBusy(false);
    }
  }

  if (props.customers.length === 0) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        Add a customer before creating an invoice.
      </p>
    );
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Create custom invoice
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        Staff-created invoice with your own line items. Auto invoices are generated from
        appointments.
      </p>

      <div className="field-row">
        <div className="field">
          <label htmlFor="inv-customer">Customer</label>
          <select
            id="inv-customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          >
            {props.customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
                {c.email ? ` · ${c.email}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="inv-status">Status</label>
          <select
            id="inv-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "open" | "draft")}
          >
            <option value="open">Open (ready to collect)</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="stack" style={{ gap: "0.65rem" }}>
        <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
          Line items
        </h3>
        {lines.map((line, index) => (
          <div key={index} className="field-row" style={{ alignItems: "end" }}>
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor={`inv-desc-${index}`}>Description</label>
              <input
                id={`inv-desc-${index}`}
                value={line.description}
                onChange={(e) => updateLine(index, { description: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor={`inv-qty-${index}`}>Qty</label>
              <input
                id={`inv-qty-${index}`}
                inputMode="numeric"
                value={line.quantity}
                onChange={(e) => updateLine(index, { quantity: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor={`inv-price-${index}`}>Unit £</label>
              <input
                id={`inv-price-${index}`}
                inputMode="decimal"
                value={line.unitPounds}
                onChange={(e) => updateLine(index, { unitPounds: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => removeLine(index)}
              disabled={lines.length <= 1}
            >
              Remove
            </button>
          </div>
        ))}
        <button className="btn btn--ghost" type="button" onClick={addLine}>
          Add line
        </button>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="inv-tax">Tax £</label>
          <input
            id="inv-tax"
            inputMode="decimal"
            value={taxPounds}
            onChange={(e) => setTaxPounds(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="inv-notes">Notes (optional)</label>
          <input
            id="inv-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Creating…" : "Create invoice"}
      </button>
    </form>
  );
}
