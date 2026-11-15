"use client";

import { FormEvent, useState } from "react";
import { site } from "@/lib/site";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const topic = String(data.get("topic") || "consultation");
    const message = String(data.get("message") || "").trim();
    const company = String(data.get("company") || "").trim();
    const consent = data.get("consent") === "on";

    if (!name || !email || !message || !consent) {
      setStatus("error");
      setErrorMessage("Please complete name, email, message, and consent.");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          topic,
          message,
          company,
          consent: true,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(
          payload.error ||
            `Something went wrong. Please email ${site.email} instead.`,
        );
        return;
      }

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMessage(
        `Network error — please try again or email ${site.email}.`,
      );
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from people, filled by many bots */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" autoComplete="name" required />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="topic">Topic</label>
        <select id="topic" name="topic" defaultValue="consultation">
          <option value="consultation">Book a consultation</option>
          <option value="treatment">Treatment question</option>
          <option value="skincare">Skincare advice</option>
          <option value="other">Something else</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="Tell us what you’re looking for"
        />
      </div>

      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          I agree to be contacted about this enquiry. Details will not be used
          for marketing without separate consent.
        </span>
      </label>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      {status === "sent" ? (
        <p className="form-note form-note--ok" role="status">
          Thank you — your enquiry has been sent. We’ll reply by email soon.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-note form-note--err" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
