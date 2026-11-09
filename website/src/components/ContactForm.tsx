"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const consent = data.get("consent") === "on";

    if (!name || !email || !message || !consent) {
      setStatus("error");
      return;
    }

    // MVP: form UI only — email delivery (Resend / Formspree) comes next.
    setStatus("sent");
    form.reset();
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
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

      <button type="submit" className="btn btn--primary">
        Send message
      </button>

      {status === "sent" ? (
        <p className="form-note form-note--ok" role="status">
          Thanks — your message is ready on this page. Email delivery will be
          wired before launch; for now please also call or email if urgent.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="form-note form-note--err" role="alert">
          Please complete name, email, message, and consent.
        </p>
      ) : null}
    </form>
  );
}
