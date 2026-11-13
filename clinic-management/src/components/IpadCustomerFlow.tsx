"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IpadCameraCapture } from "@/components/IpadCameraCapture";
import { formatGbp } from "@/lib/money";
import type { UpsellOffer } from "@/lib/upsells";

type Details = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  line1: string;
  city: string;
  postcode: string;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
};

type Medical = {
  gpName: string;
  medications: string;
  allergies: string;
  conditions: string;
  previousTreatments: string;
  pregnantBreastfeeding: string;
  smoking: string;
  skinGoals: string;
  emergencyName: string;
  emergencyPhone: string;
};

type Step = "details" | "medical" | "photos" | "consent" | "upsell";

export function IpadCustomerFlow(props: {
  isNewCustomer: boolean;
  serviceName: string;
  consentTitle: string;
  consentBody: string;
  upsells: UpsellOffer[];
  initialDetails: Details;
  initialMedical: Medical;
}) {
  const router = useRouter();
  const steps = useMemo<Step[]>(() => {
    if (props.isNewCustomer) {
      return ["details", "medical", "photos", "consent", "upsell"];
    }
    return ["details", "consent", "upsell"];
  }, [props.isNewCustomer]);

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!;
  const [details, setDetails] = useState<Details>(props.initialDetails);
  const [medical, setMedical] = useState<Medical>(props.initialMedical);
  const [signedName, setSignedName] = useState(
    `${props.initialDetails.firstName} ${props.initialDetails.lastName}`.trim(),
  );
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function updateDetail<K extends keyof Details>(key: K, value: Details[K]) {
    setDetails((d) => ({ ...d, [key]: value }));
  }
  function updateMedical<K extends keyof Medical>(key: K, value: Medical[K]) {
    setMedical((m) => ({ ...m, [key]: value }));
  }

  function validateCurrent(): string | null {
    if (step === "details") {
      if (!details.firstName.trim() || !details.lastName.trim()) return "Please enter your full name.";
      if (!details.phone.trim() && !details.email.trim()) {
        return "Please provide at least a phone number or email.";
      }
      if (props.isNewCustomer && !details.dateOfBirth.trim()) {
        return "Date of birth is required for new customers.";
      }
    }
    if (step === "medical") {
      if (!medical.allergies.trim()) return "Please confirm allergies (or type “None known”).";
      if (!medical.skinGoals.trim()) return "Please share what you would like help with.";
    }
    if (step === "consent") {
      if (!consentAccepted) return "Please confirm you agree to the consent statement.";
      if (!signedName.trim()) return "Please type your full name to sign.";
    }
    return null;
  }

  function next() {
    const v = validateCurrent();
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    void finish();
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  }

  async function finish() {
    const v = validateCurrent();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ipad/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        details,
        medical,
        signedName,
        consentTitle: props.consentTitle,
        consentBody: props.consentBody,
        upsellSkus: selectedUpsells,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    router.push("/ipad/done");
    router.refresh();
  }

  async function abandon() {
    await fetch("/api/ipad/abandon", { method: "POST" });
    router.push("/ipad");
    router.refresh();
  }

  function toggleUpsell(sku: string) {
    setSelectedUpsells((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku],
    );
  }

  return (
    <div className="stack">
      <div className="ipad-steps" aria-label="Progress">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`ipad-steps__dot${i === stepIndex ? " is-active" : ""}${i < stepIndex ? " is-done" : ""}`}
          >
            {labelForStep(s, props.isNewCustomer)}
          </span>
        ))}
      </div>

      {props.isNewCustomer ? (
        <p className="badge badge--gold">New customer intake</p>
      ) : (
        <p className="badge">Returning customer · quick check-in</p>
      )}

      {step === "details" ? (
        <section className="stack">
          <h2 className="ipad-step-title">
            {props.isNewCustomer ? "Your details" : "Confirm your details"}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Registered at booking — please {props.isNewCustomer ? "complete" : "confirm"} your
            contact information.
          </p>
          <div className="field-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                value={details.firstName}
                onChange={(e) => updateDetail("firstName", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                value={details.lastName}
                onChange={(e) => updateDetail("lastName", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={details.email}
                onChange={(e) => updateDetail("email", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile</label>
              <input
                id="phone"
                value={details.phone}
                onChange={(e) => updateDetail("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              value={details.dateOfBirth}
              onChange={(e) => updateDetail("dateOfBirth", e.target.value)}
            />
          </div>
          {props.isNewCustomer ? (
            <>
              <div className="field">
                <label htmlFor="line1">Address</label>
                <input
                  id="line1"
                  value={details.line1}
                  onChange={(e) => updateDetail("line1", e.target.value)}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="city">Town / city</label>
                  <input
                    id="city"
                    value={details.city}
                    onChange={(e) => updateDetail("city", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="postcode">Postcode</label>
                  <input
                    id="postcode"
                    value={details.postcode}
                    onChange={(e) => updateDetail("postcode", e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}
          <label className="consent">
            <input
              type="checkbox"
              checked={details.whatsappOptIn}
              onChange={(e) => updateDetail("whatsappOptIn", e.target.checked)}
            />
            <span>WhatsApp appointment reminders (not marketing)</span>
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={details.emailOptIn}
              onChange={(e) => updateDetail("emailOptIn", e.target.checked)}
            />
            <span>Email appointment updates</span>
          </label>
        </section>
      ) : null}

      {step === "medical" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Medical history</h2>
          <p className="muted" style={{ margin: 0 }}>
            Required for new customers before treatment. Sample clinic use only.
          </p>
          <div className="field">
            <label htmlFor="gp">GP / clinic name</label>
            <input id="gp" value={medical.gpName} onChange={(e) => updateMedical("gpName", e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="meds">Current medications</label>
            <textarea
              id="meds"
              rows={2}
              value={medical.medications}
              onChange={(e) => updateMedical("medications", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="allergies">Allergies</label>
            <textarea
              id="allergies"
              rows={2}
              value={medical.allergies}
              onChange={(e) => updateMedical("allergies", e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="conditions">Medical conditions</label>
            <textarea
              id="conditions"
              rows={2}
              value={medical.conditions}
              onChange={(e) => updateMedical("conditions", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="prev">Previous aesthetic treatments</label>
            <textarea
              id="prev"
              rows={2}
              value={medical.previousTreatments}
              onChange={(e) => updateMedical("previousTreatments", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="preg">Pregnant or breastfeeding?</label>
            <select
              id="preg"
              value={medical.pregnantBreastfeeding}
              onChange={(e) => updateMedical("pregnantBreastfeeding", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="smoke">Smoking / vaping</label>
            <select
              id="smoke"
              value={medical.smoking}
              onChange={(e) => updateMedical("smoking", e.target.value)}
            >
              <option value="">Select…</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Occasionally">Occasionally</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="goals">What would you like help with?</label>
            <textarea
              id="goals"
              rows={3}
              value={medical.skinGoals}
              onChange={(e) => updateMedical("skinGoals", e.target.value)}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="ename">Emergency contact name</label>
              <input
                id="ename"
                value={medical.emergencyName}
                onChange={(e) => updateMedical("emergencyName", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="ephone">Emergency phone</label>
              <input
                id="ephone"
                value={medical.emergencyPhone}
                onChange={(e) => updateMedical("emergencyPhone", e.target.value)}
              />
            </div>
          </div>
        </section>
      ) : null}

      {step === "photos" ? (
        <section className="stack">
          <div className="panel" style={{ background: "rgba(255,255,255,0.5)" }}>
            <IpadCameraCapture />
          </div>
          <p className="muted" style={{ margin: 0 }}>
            Optional for intake — your clinician may ask for face photos before treatment.
          </p>
        </section>
      ) : null}

      {step === "consent" ? (
        <section className="stack">
          <h2 className="ipad-step-title">{props.consentTitle}</h2>
          <div className="panel" style={{ background: "rgba(255,255,255,0.5)" }}>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{props.consentBody}</p>
            <p className="muted" style={{ marginTop: "1rem", marginBottom: 0 }}>
              Today’s booked treatment: <strong>{props.serviceName}</strong>
            </p>
          </div>
          <label className="consent">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
            />
            <span>I have read and agree to the consent statement above.</span>
          </label>
          <div className="field">
            <label htmlFor="signedName">Type your full name to sign</label>
            <input
              id="signedName"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              required
            />
          </div>
        </section>
      ) : null}

      {step === "upsell" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Enhance today’s visit?</h2>
          <p className="muted" style={{ margin: 0 }}>
            Based on your booked <strong>{props.serviceName}</strong>, you can note interest in
            add-ons. Nothing is charged here — reception will confirm suitability with you.
          </p>
          <div className="stack">
            {props.upsells.map((offer) => {
              const selected = selectedUpsells.includes(offer.sku);
              return (
                <button
                  key={offer.sku}
                  type="button"
                  className={`ipad-upsell${selected ? " is-selected" : ""}`}
                  onClick={() => toggleUpsell(offer.sku)}
                >
                  <span className="ipad-upsell__title">{offer.title}</span>
                  <span className="ipad-upsell__blurb">{offer.blurb}</span>
                  <span className="ipad-upsell__price">
                    {offer.pricePence > 0 ? formatGbp(offer.pricePence) : "Discuss with clinician"}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
            Skip if you prefer to stay with your original treatment only.
          </p>
        </section>
      ) : null}

      {error ? <p className="error">{error}</p> : null}

      <div className="row">
        {stepIndex > 0 ? (
          <button className="btn btn--ghost" type="button" onClick={back} disabled={busy}>
            Back
          </button>
        ) : (
          <button className="btn btn--ghost" type="button" onClick={abandon} disabled={busy}>
            Cancel
          </button>
        )}
        <button className="btn btn--primary" type="button" onClick={next} disabled={busy}>
          {busy
            ? "Saving…"
            : stepIndex === steps.length - 1
              ? "Finish"
              : "Continue"}
        </button>
      </div>
    </div>
  );
}

function labelForStep(step: Step, isNew: boolean): string {
  switch (step) {
    case "details":
      return "Details";
    case "medical":
      return "Medical";
    case "photos":
      return "Photos";
    case "consent":
      return "Consent";
    case "upsell":
      return isNew ? "Add-ons" : "Add-ons";
    default:
      return step;
  }
}
