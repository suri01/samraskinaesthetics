"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IpadFormsClient(props: {
  templateId: string;
  fields: Array<Record<string, unknown>>;
  consentTitle: string;
  consentBody: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [signedName, setSignedName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/ipad/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: props.templateId,
        answers,
        signedName,
        consentTitle: props.consentTitle,
        consentBody: props.consentBody,
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

  return (
    <form className="stack" onSubmit={submit}>
      {props.fields.map((field) => {
        const id = String(field.id);
        const label = String(field.label ?? id);
        const type = String(field.type ?? "text");
        return (
          <div className="field" key={id}>
            <label htmlFor={id}>{label}</label>
            {type === "textarea" ? (
              <textarea
                id={id}
                rows={3}
                value={answers[id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))}
              />
            ) : type === "select" ? (
              <select
                id={id}
                value={answers[id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))}
              >
                <option value="">Select…</option>
                {((field.options as string[]) ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                value={answers[id] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [id]: e.target.value }))}
              />
            )}
          </div>
        );
      })}

      <div className="panel" style={{ background: "rgba(255,255,255,0.5)" }}>
        <h2 style={{ marginTop: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
          {props.consentTitle}
        </h2>
        <p style={{ whiteSpace: "pre-wrap" }}>{props.consentBody}</p>
      </div>

      <div className="field">
        <label htmlFor="signedName">Type your full name to sign</label>
        <input
          id="signedName"
          value={signedName}
          onChange={(e) => setSignedName(e.target.value)}
          required
        />
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="row">
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Complete"}
        </button>
        <button className="btn btn--ghost" type="button" onClick={abandon}>
          Cancel
        </button>
      </div>
    </form>
  );
}
