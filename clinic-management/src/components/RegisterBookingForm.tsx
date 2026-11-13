"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { bookingServiceOptions } from "@/lib/treatments";

const SERVICE_OPTIONS = bookingServiceOptions();

export function RegisterBookingForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceName, setServiceName] = useState(
    SERVICE_OPTIONS[0]?.value ?? "Initial skin consultation",
  );
  const [startsAt, setStartsAt] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    const res = await fetch("/api/staff/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        serviceName,
        startsAt,
        whatsappOptIn,
        emailOptIn: true,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not register booking");
      return;
    }
    setMsg(
      data.isNewCustomer
        ? "New customer registered at booking — iPad runs customer intake; staff complete medical/consultation on the customer record."
        : "Booking created.",
    );
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    router.refresh();
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Register booking (new customer)
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        Creates a customer with intake pending. On arrival, issue an iPad code from the appointment —
        the kiosk runs the customer flow, not a generic appointment form.
      </p>
      <div className="field-row">
        <div className="field">
          <label htmlFor="bfn">First name</label>
          <input id="bfn" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="bln">Last name</label>
          <input id="bln" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="bem">Email</label>
          <input id="bem" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bph">Phone</label>
          <input id="bph" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="bsvc">Treatment booked</label>
        <select id="bsvc" value={serviceName} onChange={(e) => setServiceName(e.target.value)}>
          {SERVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="bstart">Starts at</label>
        <input
          id="bstart"
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          required
        />
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={whatsappOptIn}
          onChange={(e) => setWhatsappOptIn(e.target.checked)}
        />
        <span>Customer opted in to WhatsApp reminders at booking</span>
      </label>
      {msg ? <p className="ok">{msg}</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Register new customer booking"}
      </button>
    </form>
  );
}
