import {
  TREATMENT_MENU_DISCLAIMER,
  TREATMENT_MENU_TAGLINE,
  formatTreatmentPrice,
  treatmentsByCategory,
} from "@/lib/treatments";

/** Staff-facing treatment menu (list prices). */
export function TreatmentMenuPanel() {
  const groups = treatmentsByCategory();
  return (
    <div className="stack">
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Treatment menu
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        {TREATMENT_MENU_TAGLINE}
      </p>
      {groups.map((group) => (
        <div key={group.category} className="stack" style={{ gap: "0.45rem" }}>
          <h3
            style={{
              margin: "0.35rem 0 0",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "1.05rem",
            }}
          >
            {group.label}
          </h3>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {group.items.map((t) => (
              <li key={t.sku}>
                <strong>{t.name}</strong> — {formatTreatmentPrice(t)}
                {t.blurb ? <span className="muted"> · {t.blurb}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        {TREATMENT_MENU_DISCLAIMER}
      </p>
    </div>
  );
}
