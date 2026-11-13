"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { IpadCameraCapture } from "@/components/IpadCameraCapture";
import {
  AESTHETIC_HISTORY_ITEMS,
  AFTERCARE_SECTIONS,
  CONSENT_STATEMENTS,
  FITZPATRICK_OPTIONS,
  MEDICAL_PRECAUTION_ITEMS,
  ROUTINE_ITEMS,
  SKIN_HEALTH_ITEMS,
  SKIN_TYPE_OPTIONS,
  SUN_LIFESTYLE_ITEMS,
  buildConsentBody,
  createEmptyConsultation,
  type ConsultationAnswers,
  type YnAnswer,
} from "@/lib/consultation-form";
import { formatGbp } from "@/lib/money";
import type { UpsellOffer } from "@/lib/upsells";

type Step =
  | "details"
  | "concerns"
  | "skinHealth"
  | "routine"
  | "skinType"
  | "history"
  | "medical"
  | "photos"
  | "consent"
  | "aftercare"
  | "upsell";

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

export function IpadCustomerFlow(props: {
  isNewCustomer: boolean;
  serviceName: string;
  upsells: UpsellOffer[];
  initialDetails: InitialDetails;
  initialMedical: InitialMedical;
}) {
  const router = useRouter();
  const steps = useMemo<Step[]>(() => {
    if (props.isNewCustomer) {
      return [
        "details",
        "concerns",
        "skinHealth",
        "routine",
        "skinType",
        "history",
        "medical",
        "photos",
        "consent",
        "aftercare",
        "upsell",
      ];
    }
    return ["details", "medical", "consent", "aftercare", "upsell"];
  }, [props.isNewCustomer]);

  const [stepIndex, setStepIndex] = useState(0);
  const step = steps[stepIndex]!;
  const [form, setForm] = useState<ConsultationAnswers>(() =>
    createEmptyConsultation({
      details: {
        ...props.initialDetails,
        gpName: props.initialMedical.gpName,
        emergencyName: props.initialMedical.emergencyName,
        emergencyPhone: props.initialMedical.emergencyPhone,
      },
      medicalExtras: {
        allergies: props.initialMedical.allergies,
        medications: props.initialMedical.medications,
        gpName: props.initialMedical.gpName,
        emergencyName: props.initialMedical.emergencyName,
        emergencyPhone: props.initialMedical.emergencyPhone,
        pregnantBreastfeeding: props.initialMedical.pregnantBreastfeeding,
        skinGoals: props.initialMedical.skinGoals,
      },
    }),
  );
  const [signedName, setSignedName] = useState(
    `${props.initialDetails.firstName} ${props.initialDetails.lastName}`.trim(),
  );
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function setDetails<K extends keyof ConsultationAnswers["details"]>(
    key: K,
    value: ConsultationAnswers["details"][K],
  ) {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
  }

  function setYn(
    group: "skinHealth" | "routine" | "sunLifestyle" | "aestheticHistory",
    id: string,
    patch: Partial<YnAnswer>,
  ) {
    setForm((f) => ({
      ...f,
      [group]: {
        ...f[group],
        [id]: { ...f[group][id], ...patch },
      },
    }));
  }

  function setPrecaution(id: string, patch: Partial<YnAnswer>) {
    setForm((f) => ({
      ...f,
      medical: {
        ...f.medical,
        precautions: {
          ...f.medical.precautions,
          [id]: { ...f.medical.precautions[id], ...patch },
        },
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
    if (step === "concerns") {
      if (!form.concerns.mainConcerns.trim()) return "Please tell us your main skin concerns.";
    }
    if (step === "skinType" && props.isNewCustomer) {
      if (!form.skinType.selfAssessment) return "Please choose the skin type that fits you best.";
      if (!form.skinType.fitzpatrick) return "Please choose a Fitzpatrick skin type.";
    }
    if (step === "medical") {
      if (!form.medical.allergies.trim()) return "Please confirm allergies (or type “None known”).";
      if (!form.medical.pregnantBreastfeeding) return "Please answer the pregnancy / breastfeeding question.";
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consultation: form,
        details: form.details,
        medical: {
          gpName: form.details.gpName,
          gpAddress: form.details.gpAddress,
          contactGp: form.details.contactGp,
          medications: form.medical.medications,
          allergies: form.medical.allergies,
          conditions: form.medical.pastHistory,
          previousTreatments: summariseYn(form.aestheticHistory),
          pregnantBreastfeeding: form.medical.pregnantBreastfeeding,
          smoking: form.sunLifestyle.smoking?.answer === "Y" ? "Yes" : form.sunLifestyle.smoking?.answer === "N" ? "No" : "",
          skinGoals: form.concerns.mainConcerns,
          emergencyName: form.details.emergencyName,
          emergencyPhone: form.details.emergencyPhone,
          receivingTreatment: form.medical.receivingTreatment,
          precautions: form.medical.precautions,
        },
        signedName,
        consentTitle,
        consentBody,
        aftercareAcknowledged: form.aftercareAcknowledged,
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
              <div className="field">
                <label htmlFor="gpName">GP name</label>
                <input
                  id="gpName"
                  value={form.details.gpName}
                  onChange={(e) => setDetails("gpName", e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="gpAddress">GP address / practice</label>
                <input
                  id="gpAddress"
                  value={form.details.gpAddress}
                  onChange={(e) => setDetails("gpAddress", e.target.value)}
                />
              </div>
              <div className="field">
                <span className="field__label">Permission to contact your GP?</span>
                <YnToggle
                  value={form.details.contactGp}
                  onChange={(v) => setDetails("contactGp", v)}
                />
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

      {step === "concerns" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Your skin goals</h2>
          <p className="muted" style={{ margin: 0 }}>
            Tell us what brought you in — short answers are fine.
          </p>
          <div className="field">
            <label htmlFor="mainConcerns">What are your main skin concerns?</label>
            <textarea
              id="mainConcerns"
              rows={4}
              value={form.concerns.mainConcerns}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  concerns: { ...f.concerns, mainConcerns: e.target.value },
                }))
              }
              placeholder="e.g. dullness, pigmentation, fine lines…"
            />
          </div>
          <div className="field">
            <label htmlFor="desiredResults">What results would you like from treatment?</label>
            <textarea
              id="desiredResults"
              rows={4}
              value={form.concerns.desiredResults}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  concerns: { ...f.concerns, desiredResults: e.target.value },
                }))
              }
              placeholder="e.g. brighter, calmer, more even skin…"
            />
          </div>
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

      {step === "routine" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Your skincare routine</h2>
          <p className="muted" style={{ margin: 0 }}>
            Which of these do you currently use?
          </p>
          <YnList
            items={ROUTINE_ITEMS}
            values={form.routine}
            onChange={(id, patch) => setYn("routine", id, patch)}
          />
        </section>
      ) : null}

      {step === "skinType" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Skin type</h2>
          <p className="muted" style={{ margin: 0 }}>
            Choose what feels most like your skin most of the time.
          </p>
          <div className="chip-grid" role="listbox" aria-label="Skin type">
            {SKIN_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`chip${form.skinType.selfAssessment === opt ? " is-selected" : ""}`}
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    skinType: { ...f.skinType, selfAssessment: opt },
                  }))
                }
              >
                {opt}
              </button>
            ))}
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
                <strong>{opt.title}</strong>
                <span>{opt.blurb}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "history" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Sun, lifestyle & past treatments</h2>
          <h3 className="ipad-subhead">Sun & lifestyle</h3>
          <YnList
            items={SUN_LIFESTYLE_ITEMS}
            values={form.sunLifestyle}
            onChange={(id, patch) => setYn("sunLifestyle", id, patch)}
          />
          <h3 className="ipad-subhead">Aesthetic history</h3>
          <p className="muted" style={{ margin: 0 }}>
            Previous, recent, or planned treatments.
          </p>
          <YnList
            items={AESTHETIC_HISTORY_ITEMS}
            values={form.aestheticHistory}
            onChange={(id, patch) => setYn("aestheticHistory", id, patch)}
          />
          <div className="field">
            <label htmlFor="adverse">Any adverse skin reactions in the past?</label>
            <textarea
              id="adverse"
              rows={2}
              value={form.aestheticNotes.adverseReactions}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  aestheticNotes: { ...f.aestheticNotes, adverseReactions: e.target.value },
                }))
              }
              placeholder="Or type None"
            />
          </div>
          <div className="field">
            <label htmlFor="disappoint">Any treatments where results were disappointing?</label>
            <textarea
              id="disappoint"
              rows={2}
              value={form.aestheticNotes.disappointingResults}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  aestheticNotes: {
                    ...f.aestheticNotes,
                    disappointingResults: e.target.value,
                  },
                }))
              }
              placeholder="Optional"
            />
          </div>
        </section>
      ) : null}

      {step === "medical" ? (
        <section className="stack">
          <h2 className="ipad-step-title">
            {props.isNewCustomer ? "Medical history" : "Quick medical update"}
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            Needed so we can treat you safely today.
          </p>
          {props.isNewCustomer ? (
            <div className="field">
              <span className="field__label">Currently receiving treatment from a GP or dentist?</span>
              <YnToggle
                value={form.medical.receivingTreatment.answer}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    medical: {
                      ...f.medical,
                      receivingTreatment: { ...f.medical.receivingTreatment, answer: v },
                    },
                  }))
                }
              />
              {form.medical.receivingTreatment.answer === "Y" ? (
                <input
                  className="yn-comment"
                  placeholder="Optional comments"
                  value={form.medical.receivingTreatment.comments}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      medical: {
                        ...f.medical,
                        receivingTreatment: {
                          ...f.medical.receivingTreatment,
                          comments: e.target.value,
                        },
                      },
                    }))
                  }
                />
              ) : null}
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="meds">Current medications (including supplements)</label>
            <textarea
              id="meds"
              rows={2}
              value={form.medical.medications}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  medical: { ...f.medical, medications: e.target.value },
                }))
              }
              placeholder="Or type None"
            />
          </div>
          <div className="field">
            <label htmlFor="allergies">Allergies</label>
            <textarea
              id="allergies"
              rows={2}
              value={form.medical.allergies}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  medical: { ...f.medical, allergies: e.target.value },
                }))
              }
              placeholder="Or type None known"
            />
          </div>
          <div className="field">
            <label htmlFor="preg">Pregnancy / breastfeeding / IVF</label>
            <select
              id="preg"
              value={form.medical.pregnantBreastfeeding}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  medical: { ...f.medical, pregnantBreastfeeding: e.target.value },
                }))
              }
            >
              <option value="">Select…</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="IVF">IVF / fertility treatment</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          {props.isNewCustomer ? (
            <div className="field">
              <label htmlFor="past">Past medical & drug history (optional notes)</label>
              <textarea
                id="past"
                rows={2}
                value={form.medical.pastHistory}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    medical: { ...f.medical, pastHistory: e.target.value },
                  }))
                }
              />
            </div>
          ) : null}
          <h3 className="ipad-subhead">Precautions</h3>
          <YnList
            items={MEDICAL_PRECAUTION_ITEMS}
            values={form.medical.precautions}
            onChange={setPrecaution}
          />
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

      {step === "upsell" ? (
        <section className="stack">
          <h2 className="ipad-step-title">Enhance today’s visit?</h2>
          <p className="muted" style={{ margin: 0 }}>
            Optional add-ons for <strong>{props.serviceName}</strong>. Nothing is charged here —
            reception will confirm suitability with you.
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
                    {offer.pricePence > 0 ? formatGbp(offer.pricePence) : "Confirm with clinician"}
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
          {busy ? "Saving…" : stepIndex === steps.length - 1 ? "Finish check-in" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function summariseYn(map: Record<string, YnAnswer>): string {
  return Object.entries(map)
    .filter(([, v]) => v.answer === "Y")
    .map(([k, v]) => (v.comments ? `${k}: ${v.comments}` : k))
    .join("; ");
}

function labelForStep(step: Step): string {
  switch (step) {
    case "details":
      return "About you";
    case "concerns":
      return "Goals";
    case "skinHealth":
      return "Skin health";
    case "routine":
      return "Routine";
    case "skinType":
      return "Skin type";
    case "history":
      return "History";
    case "medical":
      return "Medical";
    case "photos":
      return "Photos";
    case "consent":
      return "Consent";
    case "aftercare":
      return "Aftercare";
    case "upsell":
      return "Add-ons";
    default:
      return step;
  }
}

function YnToggle(props: {
  value: "" | "Y" | "N";
  onChange: (v: "" | "Y" | "N") => void;
}) {
  return (
    <div className="yn-toggle" role="group">
      <button
        type="button"
        className={`yn-btn${props.value === "Y" ? " is-yes" : ""}`}
        onClick={() => props.onChange("Y")}
      >
        Yes
      </button>
      <button
        type="button"
        className={`yn-btn${props.value === "N" ? " is-no" : ""}`}
        onClick={() => props.onChange("N")}
      >
        No
      </button>
    </div>
  );
}

function YnList(props: {
  items: Array<{ id: string; label: string }>;
  values: Record<string, YnAnswer>;
  onChange: (id: string, patch: Partial<YnAnswer>) => void;
}) {
  return (
    <div className="yn-list">
      {props.items.map((item) => {
        const row = props.values[item.id] ?? { answer: "", comments: "" };
        return (
          <div key={item.id} className="yn-row">
            <p className="yn-row__label">{item.label}</p>
            <YnToggle
              value={row.answer}
              onChange={(answer) => props.onChange(item.id, { answer })}
            />
            {row.answer === "Y" ? (
              <input
                className="yn-comment"
                placeholder="Optional comments"
                value={row.comments}
                onChange={(e) => props.onChange(item.id, { comments: e.target.value })}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
