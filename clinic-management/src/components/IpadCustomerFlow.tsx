"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IpadCameraCapture } from "@/components/IpadCameraCapture";
import { YnList } from "@/components/YnControls";
import {
  AFTERCARE_SECTIONS,
  CONSENT_STATEMENTS,
  FITZPATRICK_OPTIONS,
  SKIN_HEALTH_ITEMS,
  SKIN_TYPE_OPTIONS,
  SKIN_TYPE_VISUALS,
  buildConsentBody,
  createEmptyConsultation,
  type ConsultationAnswers,
  type YnAnswer,
} from "@/lib/consultation-form";

type Step =
  | "details"
  | "skinHealth"
  | "skinType"
  | "photos"
  | "consent"
  | "aftercare";

type InitialDetails = {
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

type InitialMedical = {
  emergencyName: string;
  emergencyPhone: string;
};

export function IpadCustomerFlow(props: {
  isNewCustomer: boolean;
  serviceName: string;
  initialDetails: InitialDetails;
  initialMedical: InitialMedical;
}) {
  const router = useRouter();
  const steps = useMemo<Step[]>(() => {
    if (props.isNewCustomer) {
      return [
        "details",
        "skinHealth",
        "skinType",
        "photos",
        "consent",
        "aftercare",
      ];
    }
    return ["details", "consent", "aftercare"];
  }, [props.isNewCustomer]);

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!;
  const [form, setForm] = useState<ConsultationAnswers>(() =>
    createEmptyConsultation({
      details: {
        ...props.initialDetails,
        emergencyName: props.initialMedical.emergencyName,
        emergencyPhone: props.initialMedical.emergencyPhone,
      },
      medicalExtras: {
        emergencyName: props.initialMedical.emergencyName,
        emergencyPhone: props.initialMedical.emergencyPhone,
      },
    }),
  );
  const [signedName, setSignedName] = useState(
    `${props.initialDetails.firstName} ${props.initialDetails.lastName}`.trim(),
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setDetails<K extends keyof ConsultationAnswers["details"]>(
    key: K,
    value: ConsultationAnswers["details"][K],
  ) {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
  }

  function setYn(group: "skinHealth", id: string, patch: Partial<YnAnswer>) {
    setForm((f) => ({
      ...f,
      [group]: {
        ...f[group],
        [id]: { ...f[group][id], ...patch },
      },
    }));
  }

  function validateCurrent(): string | null {
    const d = form.details;
    if (step === "details") {
      if (!d.firstName.trim() || !d.lastName.trim()) return "Please enter your full name.";
      if (!d.phone.trim() && !d.email.trim()) return "Please add a mobile number or email.";
      if (props.isNewCustomer && !d.dateOfBirth.trim()) return "Please add your date of birth.";
      if (props.isNewCustomer && !d.emergencyName.trim()) return "Please add an emergency contact name.";
      if (props.isNewCustomer && !d.emergencyPhone.trim()) return "Please add an emergency contact number.";
    }
    if (step === "skinType" && props.isNewCustomer) {
      if (!form.skinType.selfAssessment) return "Please choose the skin type that fits you best.";
      if (!form.skinType.fitzpatrick) return "Please choose a Fitzpatrick skin type.";
    }
    if (step === "consent") {
      const missing = CONSENT_STATEMENTS.some((s) => !form.consentChecks[s.id]);
      if (missing) return "Please tick every consent statement to continue.";
      if (!signedName.trim()) return "Please type your full name to sign.";
    }
    if (step === "aftercare" && !form.aftercareAcknowledged) {
      return "Please confirm you have read the aftercare advice.";
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
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void finish();
  }

  function back() {
    setError(null);
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    const v = validateCurrent();
    if (v) {
      setError(v);
      return;
    }
    setBusy(true);
    setError(null);
    const consentTitle = "Patient consent — consultation & treatment";
    const consentBody = buildConsentBody(form.consentChecks);
    const res = await fetch("/api/ipad/submit", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultation: form,
        details: form.details,
        medical: {
          emergencyName: form.details.emergencyName,
          emergencyPhone: form.details.emergencyPhone,
        },
        signedName,
        consentTitle,
        consentBody,
        aftercareAcknowledged: form.aftercareAcknowledged,
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
    await fetch("/api/ipad/abandon", { method: "POST", credentials: "same-origin" });
    router.push("/ipad");
    router.refresh();
  }

  function acceptAllConsent() {
    setForm((f) => ({
      ...f,
      consentChecks: Object.fromEntries(CONSENT_STATEMENTS.map((s) => [s.id, true])),
    }));
  }

  return (
    <div className="stack">
      <div className="ipad-progress" aria-label="Progress">
        <div className="ipad-progress__meta">
          <span>
            Step {stepIndex + 1} of {steps.length}
          </span>
          <span>{labelForStep(step)}</span>
        </div>
        <div className="ipad-progress__track" aria-hidden>
          <div
            className="ipad-progress__fill"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {props.isNewCustomer ? (
        <p className="badge badge--gold">Consultation · new customer</p>
      ) : (
        <p className="badge">Returning visit · quick update</p>
      )}

      {step === "details" ? (
        <section className="stack">
          <h2 className="ipad-step-title">
            {props.isNewCustomer ? "About you" : "Confirm your details"}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Large fields — tap to edit. We only use this for your clinic record.
          </p>
          <div className="field-row">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                value={form.details.firstName}
                onChange={(e) => setDetails("firstName", e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                value={form.details.lastName}
                onChange={(e) => setDetails("lastName", e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.details.email}
                onChange={(e) => setDetails("email", e.target.value)}
                inputMode="email"
              />
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile</label>
              <input
                id="phone"
                value={form.details.phone}
                onChange={(e) => setDetails("phone", e.target.value)}
                inputMode="tel"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="dob">Date of birth</label>
            <input
              id="dob"
              type="date"
              value={form.details.dateOfBirth}
              onChange={(e) => setDetails("dateOfBirth", e.target.value)}
            />
          </div>
          {props.isNewCustomer ? (
            <>
              <div className="field">
                <label htmlFor="line1">Address</label>
                <input
                  id="line1"
                  value={form.details.line1}
                  onChange={(e) => setDetails("line1", e.target.value)}
                  autoComplete="address-line1"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="city">Town / city</label>
                  <input
                    id="city"
                    value={form.details.city}
                    onChange={(e) => setDetails("city", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="postcode">Postcode</label>
                  <input
                    id="postcode"
                    value={form.details.postcode}
                    onChange={(e) => setDetails("postcode", e.target.value)}
                    autoComplete="postal-code"
                  />
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="ename">Emergency contact name</label>
                  <input
                    id="ename"
                    value={form.details.emergencyName}
                    onChange={(e) => setDetails("emergencyName", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="ephone">Emergency phone</label>
                  <input
                    id="ephone"
                    value={form.details.emergencyPhone}
                    onChange={(e) => setDetails("emergencyPhone", e.target.value)}
                    inputMode="tel"
                  />
                </div>
              </div>
            </>
          ) : null}
          <label className="consent">
            <input
              type="checkbox"
              checked={form.details.whatsappOptIn}
              onChange={(e) => setDetails("whatsappOptIn", e.target.checked)}
            />
            <span>WhatsApp appointment reminders (not marketing)</span>
          </label>
          <label className="consent">
            <input
              type="checkbox"
              checked={form.details.emailOptIn}
              onChange={(e) => setDetails("emailOptIn", e.target.checked)}
            />
            <span>Email appointment updates</span>
          </label>
        </section>
      ) : null}

      {step === "skinHealth" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Skin health history</h2>
          <p className="muted" style={{ margin: 0 }}>
            Tap Yes or No for each. Add a short note only if helpful.
          </p>
          <YnList
            items={SKIN_HEALTH_ITEMS}
            values={form.skinHealth}
            onChange={(id, patch) => setYn("skinHealth", id, patch)}
          />
        </section>
      ) : null}

      {step === "skinType" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Skin type</h2>
          <p className="muted" style={{ margin: 0 }}>
            Choose what feels most like your skin most of the time — graphics show the feel, text
            names the type.
          </p>
          <div className="skin-type-grid" role="listbox" aria-label="Skin type">
            {SKIN_TYPE_OPTIONS.map((opt) => {
              const visual = SKIN_TYPE_VISUALS[opt];
              return (
                <button
                  key={opt}
                  type="button"
                  className={`skin-type-card${form.skinType.selfAssessment === opt ? " is-selected" : ""}`}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      skinType: { ...f.skinType, selfAssessment: opt },
                    }))
                  }
                >
                  <span className={`skin-type-icon ${visual.className}`} aria-hidden />
                  <strong>{opt}</strong>
                  <span>{visual.hint}</span>
                </button>
              );
            })}
          </div>
          <div className="field">
            <label htmlFor="ethnicity">How would you describe your ethnicity? (optional)</label>
            <input
              id="ethnicity"
              value={form.skinType.ethnicity}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  skinType: { ...f.skinType, ethnicity: e.target.value },
                }))
              }
            />
          </div>
          <h3 className="ipad-subhead">Fitzpatrick skin type</h3>
          <p className="muted" style={{ margin: 0 }}>
            Pick the closest skin tone — swatch plus description.
          </p>
          <div className="fitz-grid">
            {FITZPATRICK_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`fitz-card${form.skinType.fitzpatrick === opt.id ? " is-selected" : ""}`}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    skinType: { ...f.skinType, fitzpatrick: opt.id },
                  }))
                }
              >
                <span
                  className="fitz-swatch"
                  style={{ background: opt.tone }}
                  aria-hidden
                />
                <span className="fitz-card__text">
                  <strong>{opt.title}</strong>
                  <span>{opt.blurb}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "photos" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Clinical photos</h2>
          <p className="muted" style={{ margin: 0 }}>
            Optional now — your clinician may ask for front / oblique / profile photos.
          </p>
          <div className="panel" style={{ background: "rgba(255,255,255,0.5)" }}>
            <IpadCameraCapture />
          </div>
        </section>
      ) : null}

      {step === "consent" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Consent</h2>
          <p className="muted" style={{ margin: 0 }}>
            Booked today: <strong>{props.serviceName}</strong>. Please read each point and tick to
            confirm.
          </p>
          <button className="btn btn--ghost" type="button" onClick={acceptAllConsent}>
            Tick all statements
          </button>
          <div className="consent-list">
            {CONSENT_STATEMENTS.map((s) => (
              <label key={s.id} className="consent consent--block">
                <input
                  type="checkbox"
                  checked={Boolean(form.consentChecks[s.id])}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      consentChecks: { ...f.consentChecks, [s.id]: e.target.checked },
                    }))
                  }
                />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
          <div className="field">
            <label htmlFor="signedName">Type your full name to sign</label>
            <input
              id="signedName"
              value={signedName}
              onChange={(e) => setSignedName(e.target.value)}
              autoComplete="name"
            />
          </div>
        </section>
      ) : null}

      {step === "aftercare" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Aftercare advice</h2>
          <p className="muted" style={{ margin: 0 }}>
            Please read this carefully — it helps protect your results.
          </p>
          {AFTERCARE_SECTIONS.map((section) => (
            <div key={section.title} className="aftercare-card">
              <h3>{section.title}</h3>
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
          <label className="consent consent--block">
            <input
              type="checkbox"
              checked={form.aftercareAcknowledged}
              onChange={(e) =>
                setForm((f) => ({ ...f, aftercareAcknowledged: e.target.checked }))
              }
            />
            <span>I have read and understand the aftercare advice above.</span>
          </label>
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
          {busy ? "Saving…" : stepIndex === steps.length - 1 ? "Finish check-in" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function labelForStep(step: Step): string {
  switch (step) {
    case "details":
      return "About you";
    case "skinHealth":
      return "Skin health";
    case "skinType":
      return "Skin type";
    case "photos":
      return "Photos";
    case "consent":
      return "Consent";
    case "aftercare":
      return "Aftercare";
    default:
      return step;
  }
}
