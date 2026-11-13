"use client";

import { useState } from "react";
import { YnList, YnToggle } from "@/components/YnControls";
import {
  AESTHETIC_HISTORY_ITEMS,
  MEDICAL_PRECAUTION_ITEMS,
  ROUTINE_ITEMS,
  SUN_LIFESTYLE_ITEMS,
  createEmptyConsultation,
  type YnAnswer,
} from "@/lib/consultation-form";
import type { MedicalHistory } from "@/db/schema";
import { formatUkDateTime } from "@/lib/dates";

function ynFromStored(
  stored: Record<string, { answer?: string; comments?: string }> | undefined,
  items: Array<{ id: string }>,
): Record<string, YnAnswer> {
  const out: Record<string, YnAnswer> = {};
  for (const item of items) {
    const row = stored?.[item.id];
    const answer = row?.answer === "Y" || row?.answer === "N" ? row.answer : "";
    out[item.id] = {
      answer,
      comments: row?.comments ?? "",
    };
  }
  return out;
}

function precautionsFromStored(stored: unknown): Record<string, YnAnswer> {
  const empty = createEmptyConsultation().medical.precautions;
  if (!stored || typeof stored !== "object") return empty;
  const src = stored as Record<string, { answer?: string; comments?: string }>;
  const out: Record<string, YnAnswer> = { ...empty };
  for (const id of Object.keys(empty)) {
    const row = src[id];
    if (!row) continue;
    out[id] = {
      answer: row.answer === "Y" || row.answer === "N" ? row.answer : "",
      comments: row.comments ?? "",
    };
  }
  return out;
}

function receivingFromStored(stored: unknown): YnAnswer {
  if (!stored || typeof stored !== "object") return { answer: "", comments: "" };
  const row = stored as { answer?: string; comments?: string };
  return {
    answer: row.answer === "Y" || row.answer === "N" ? row.answer : "",
    comments: row.comments ?? "",
  };
}

function summariseYn(map: Record<string, YnAnswer>): string {
  return Object.entries(map)
    .filter(([, v]) => v.answer === "Y")
    .map(([k, v]) => (v.comments ? `${k}: ${v.comments}` : k))
    .join("; ");
}

export function StaffConsultationForm(props: {
  customerId: string;
  initial: MedicalHistory | null;
}) {
  const mh = props.initial ?? {};
  const [skinGoals, setSkinGoals] = useState(mh.skinGoals ?? "");
  const [desiredResults, setDesiredResults] = useState(mh.desiredResults ?? "");
  const [routine, setRoutine] = useState(() => ynFromStored(mh.routine, ROUTINE_ITEMS));
  const [sunLifestyle, setSunLifestyle] = useState(() =>
    ynFromStored(mh.sunLifestyle, SUN_LIFESTYLE_ITEMS),
  );
  const [aestheticHistory, setAestheticHistory] = useState(() =>
    ynFromStored(mh.aestheticHistory, AESTHETIC_HISTORY_ITEMS),
  );
  const [adverseReactions, setAdverseReactions] = useState(
    mh.aestheticNotes?.adverseReactions ?? "",
  );
  const [disappointingResults, setDisappointingResults] = useState(
    mh.aestheticNotes?.disappointingResults ?? "",
  );
  const [receivingTreatment, setReceivingTreatment] = useState(() =>
    receivingFromStored(mh.receivingTreatment),
  );
  const [medications, setMedications] = useState(mh.medications ?? "");
  const [allergies, setAllergies] = useState(mh.allergies ?? "");
  const [pregnantBreastfeeding, setPregnantBreastfeeding] = useState(
    mh.pregnantBreastfeeding ?? "",
  );
  const [pastHistory, setPastHistory] = useState(
    mh.pastHistory ?? mh.conditions ?? "",
  );
  const [precautions, setPrecautions] = useState(() =>
    precautionsFromStored(mh.precautions),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function patchYn(
    setter: (updater: (prev: Record<string, YnAnswer>) => Record<string, YnAnswer>) => void,
    id: string,
    patch: Partial<YnAnswer>,
  ) {
    setter((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { answer: "", comments: "" }), ...patch },
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/staff/customers/${props.customerId}/consultation`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinGoals,
          desiredResults,
          routine,
          sunLifestyle,
          aestheticHistory,
          aestheticNotes: { adverseReactions, disappointingResults },
          receivingTreatment,
          medications,
          allergies,
          pregnantBreastfeeding,
          pastHistory,
          precautions,
          previousTreatmentsSummary: summariseYn(aestheticHistory),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save consultation");
      setOk("Patient consultation saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Patient consultation (staff)
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        Clinician notes — skin goals, skincare routine, sun/lifestyle, past treatments, and medical
        history. Customer iPad answers (skin type, skin health, consent) are in the section above.
      </p>
      {mh.staffConsultationAt ? (
        <p className="muted" style={{ margin: 0 }}>
          Last saved {formatUkDateTime(mh.staffConsultationAt)} (Europe/London)
        </p>
      ) : null}

      <h3 style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Skin goals for the clinician
      </h3>
      <div className="field">
        <label htmlFor="staff-skin-goals">Main skin concerns / goals</label>
        <textarea
          id="staff-skin-goals"
          rows={3}
          value={skinGoals}
          onChange={(e) => setSkinGoals(e.target.value)}
          placeholder="e.g. dullness, pigmentation, fine lines…"
        />
      </div>
      <div className="field">
        <label htmlFor="staff-desired">Desired results</label>
        <textarea
          id="staff-desired"
          rows={3}
          value={desiredResults}
          onChange={(e) => setDesiredResults(e.target.value)}
          placeholder="e.g. brighter, calmer, more even skin…"
        />
      </div>

      <h3 style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Skincare routine
      </h3>
      <p className="muted" style={{ margin: 0 }}>
        Which of these does the patient currently use?
      </p>
      <YnList
        items={ROUTINE_ITEMS}
        values={routine}
        onChange={(id, patch) => patchYn(setRoutine, id, patch)}
      />

      <h3 style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Sun, lifestyle & past treatments
      </h3>
      <h4 className="ipad-subhead" style={{ margin: 0 }}>
        Sun & lifestyle
      </h4>
      <YnList
        items={SUN_LIFESTYLE_ITEMS}
        values={sunLifestyle}
        onChange={(id, patch) => patchYn(setSunLifestyle, id, patch)}
      />
      <h4 className="ipad-subhead" style={{ margin: 0 }}>
        Aesthetic history
      </h4>
      <YnList
        items={AESTHETIC_HISTORY_ITEMS}
        values={aestheticHistory}
        onChange={(id, patch) => patchYn(setAestheticHistory, id, patch)}
      />
      <div className="field">
        <label htmlFor="staff-adverse">Any adverse skin reactions in the past?</label>
        <textarea
          id="staff-adverse"
          rows={2}
          value={adverseReactions}
          onChange={(e) => setAdverseReactions(e.target.value)}
          placeholder="Or type None"
        />
      </div>
      <div className="field">
        <label htmlFor="staff-disappoint">Any treatments where results were disappointing?</label>
        <textarea
          id="staff-disappoint"
          rows={2}
          value={disappointingResults}
          onChange={(e) => setDisappointingResults(e.target.value)}
          placeholder="Optional"
        />
      </div>

      <h3 style={{ margin: "0.5rem 0 0", fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Medical history
      </h3>
      <div className="field">
        <span className="field__label">Currently receiving treatment from a GP or dentist?</span>
        <YnToggle
          value={receivingTreatment.answer}
          onChange={(v) => setReceivingTreatment((r) => ({ ...r, answer: v }))}
        />
        {receivingTreatment.answer === "Y" ? (
          <input
            className="yn-comment"
            placeholder="Optional comments"
            value={receivingTreatment.comments}
            onChange={(e) =>
              setReceivingTreatment((r) => ({ ...r, comments: e.target.value }))
            }
          />
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="staff-meds">Current medications (including supplements)</label>
        <textarea
          id="staff-meds"
          rows={2}
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          placeholder="Or type None"
        />
      </div>
      <div className="field">
        <label htmlFor="staff-allergies">Allergies</label>
        <textarea
          id="staff-allergies"
          rows={2}
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          placeholder="Or type None known"
        />
      </div>
      <div className="field">
        <label htmlFor="staff-preg">Pregnancy / breastfeeding / IVF</label>
        <select
          id="staff-preg"
          value={pregnantBreastfeeding}
          onChange={(e) => setPregnantBreastfeeding(e.target.value)}
        >
          <option value="">Select…</option>
          <option value="No">No</option>
          <option value="Yes">Yes</option>
          <option value="IVF">IVF / fertility treatment</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="staff-past">Past medical & drug history</label>
        <textarea
          id="staff-past"
          rows={2}
          value={pastHistory}
          onChange={(e) => setPastHistory(e.target.value)}
        />
      </div>
      <h4 className="ipad-subhead" style={{ margin: 0 }}>
        Precautions
      </h4>
      <YnList
        items={MEDICAL_PRECAUTION_ITEMS}
        values={precautions}
        onChange={(id, patch) => patchYn(setPrecautions, id, patch)}
      />

      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      <button className="btn btn--primary" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save patient consultation"}
      </button>
    </form>
  );
}
