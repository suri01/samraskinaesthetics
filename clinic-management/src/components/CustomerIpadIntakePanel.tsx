import {
  FITZPATRICK_OPTIONS,
  SKIN_HEALTH_ITEMS,
  SKIN_TYPE_VISUALS,
  type ConsultationAnswers,
  type YnAnswer,
} from "@/lib/consultation-form";
import { formatUkDate, formatUkDateTime } from "@/lib/dates";

function asConsultation(raw: unknown): ConsultationAnswers | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as ConsultationAnswers;
}

function ynLabel(answer?: string) {
  if (answer === "Y") return "Yes";
  if (answer === "N") return "No";
  return "—";
}

function YnRows(props: {
  items: Array<{ id: string; label: string }>;
  values: Record<string, YnAnswer> | undefined;
}) {
  const rows = props.items.map((item) => {
    const v = props.values?.[item.id];
    return { ...item, answer: v?.answer ?? "", comments: v?.comments ?? "" };
  });
  const answered = rows.filter((r) => r.answer === "Y" || r.answer === "N");
  if (answered.length === 0) {
    return <p className="muted" style={{ margin: 0 }}>No answers recorded.</p>;
  }
  return (
    <table className="table">
      <tbody>
        {answered.map((r) => (
          <tr key={r.id}>
            <td>{r.label}</td>
            <td>
              <span className={`badge${r.answer === "Y" ? " badge--gold" : ""}`}>
                {ynLabel(r.answer)}
              </span>
            </td>
            <td className="muted">{r.comments || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function CustomerIpadIntakePanel(props: {
  consultation: unknown;
  aftercareAcknowledged?: boolean;
  intakeCompletedAt: Date | null;
  addressJson: Record<string, string> | null;
  whatsappOptIn: boolean;
  emailOptIn: boolean;
  consents: Array<{
    id: string;
    title: string;
    body: string;
    signedName: string;
    signedAt: Date;
  }>;
}) {
  const form = asConsultation(props.consultation);
  const skinType = form?.skinType;
  const fitz = FITZPATRICK_OPTIONS.find((o) => o.id === skinType?.fitzpatrick);
  const selfAssessment = skinType?.selfAssessment?.trim() || "";
  const visual =
    selfAssessment && selfAssessment in SKIN_TYPE_VISUALS
      ? SKIN_TYPE_VISUALS[selfAssessment as keyof typeof SKIN_TYPE_VISUALS]
      : null;

  return (
    <div className="panel stack" id="customer-entered">
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Customer entered (iPad)
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        What the customer completed on the clinic iPad
        {props.intakeCompletedAt
          ? ` · finished ${formatUkDateTime(props.intakeCompletedAt)} (Europe/London)`
          : " · intake not finished yet"}
        .
      </p>

      {!form ? (
        <p className="muted" style={{ margin: 0 }}>
          No iPad consultation answers saved for this customer yet. After they complete the iPad
          journey, skin type, skin health, consent and aftercare will appear here.
        </p>
      ) : (
        <>
          <div className="stack" style={{ gap: "0.35rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
              Contact &amp; address
            </h3>
            <p style={{ margin: 0 }}>
              {form.details.firstName} {form.details.lastName}
              {form.details.email ? ` · ${form.details.email}` : ""}
              {form.details.phone ? ` · ${form.details.phone}` : ""}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              DOB {formatUkDate(form.details.dateOfBirth)} ·{" "}
              {[form.details.line1, form.details.city, form.details.postcode]
                .filter(Boolean)
                .join(", ") ||
                [
                  props.addressJson?.line1,
                  props.addressJson?.city,
                  props.addressJson?.postcode,
                ]
                  .filter(Boolean)
                  .join(", ") ||
                "—"}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Emergency: {form.details.emergencyName || "—"}{" "}
              {form.details.emergencyPhone ? `· ${form.details.emergencyPhone}` : ""}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              WhatsApp {props.whatsappOptIn || form.details.whatsappOptIn ? "yes" : "no"} · Email{" "}
              {props.emailOptIn || form.details.emailOptIn ? "yes" : "no"}
            </p>
          </div>

          <div className="stack" style={{ gap: "0.65rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
              Skin type &amp; tone
            </h3>
            {selfAssessment || fitz ? (
              <div className="row" style={{ gap: "1rem", flexWrap: "wrap", alignItems: "stretch" }}>
                {selfAssessment ? (
                  <div className="skin-type-card is-selected" style={{ minWidth: "10rem", cursor: "default" }}>
                    {visual ? <span className={`skin-type-icon ${visual.className}`} aria-hidden /> : null}
                    <strong>{selfAssessment}</strong>
                    {visual ? <span>{visual.hint}</span> : null}
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No skin-type self-assessment (returning check-in may skip this).
                  </p>
                )}
                {fitz ? (
                  <div className="fitz-card is-selected" style={{ minWidth: "12rem", cursor: "default" }}>
                    <span className="fitz-swatch" aria-hidden style={{ background: fitz.tone }} />
                    <div className="fitz-card__text">
                      <strong>{fitz.title}</strong>
                      <span>{fitz.blurb}</span>
                    </div>
                  </div>
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    No Fitzpatrick tone selected.
                  </p>
                )}
              </div>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                Skin type / tone not collected on this visit (typical for returning check-in).
              </p>
            )}
            {skinType?.ethnicity ? (
              <p style={{ margin: 0 }}>
                <strong>Ethnicity / background noted:</strong> {skinType.ethnicity}
              </p>
            ) : null}
          </div>

          <div className="stack" style={{ gap: "0.35rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
              Skin health
            </h3>
            <YnRows items={SKIN_HEALTH_ITEMS} values={form.skinHealth} />
          </div>

          <div className="stack" style={{ gap: "0.35rem" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
              Consent &amp; aftercare
            </h3>
            <p style={{ margin: 0 }}>
              Aftercare acknowledged:{" "}
              <span
                className={`badge${
                  props.aftercareAcknowledged || form.aftercareAcknowledged ? " badge--gold" : ""
                }`}
              >
                {props.aftercareAcknowledged || form.aftercareAcknowledged ? "Yes" : "No"}
              </span>
            </p>
          </div>
        </>
      )}

      {props.consents.length > 0 ? (
        <div className="stack" style={{ gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "1.05rem" }}>
            Signed consent records
          </h3>
          {props.consents.map((c) => (
            <details key={c.id}>
              <summary>
                {c.title} · {c.signedName} ·{" "}
                {formatUkDateTime(c.signedAt)}
              </summary>
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  margin: "0.5rem 0 0",
                  fontSize: "0.9rem",
                }}
              >
                {c.body}
              </pre>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
