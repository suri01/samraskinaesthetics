"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  TREATMENT_MENU_DISCLAIMER,
  TREATMENT_MENU_TAGLINE,
  formatTreatmentPrice,
  penceToPoundsInput,
  type Treatment,
  type TreatmentCategory,
} from "@/lib/treatments";

type Draft = {
  id?: string;
  sku: string;
  category: TreatmentCategory;
  name: string;
  serviceName: string;
  pricePounds: string;
  fromPrice: boolean;
  priceNote: string;
  blurb: string;
  sortOrder: string;
  active: boolean;
};

function toDraft(t: Treatment): Draft {
  return {
    id: t.id,
    sku: t.sku,
    category: t.category,
    name: t.name,
    serviceName: t.serviceName,
    pricePounds: penceToPoundsInput(t.pricePence),
    fromPrice: Boolean(t.fromPrice),
    priceNote: t.priceNote ?? "",
    blurb: t.blurb ?? "",
    sortOrder: String(t.sortOrder ?? 0),
    active: t.active !== false,
  };
}

function emptyDraft(category: TreatmentCategory = "consultations"): Draft {
  return {
    sku: "",
    category,
    name: "",
    serviceName: "",
    pricePounds: "",
    fromPrice: false,
    priceNote: "",
    blurb: "",
    sortOrder: "100",
    active: true,
  };
}

/** Staff-facing editable treatment menu (list prices), persisted in DB. */
export function TreatmentMenuPanel(props: { initialItems: Treatment[]; canEdit: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(props.initialItems);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const groups = useMemo(() => {
    return CATEGORY_ORDER.map((category) => ({
      category,
      label: CATEGORY_LABELS[category],
      items: items.filter((t) => t.category === category),
    }));
  }, [items]);

  function startEdit(t: Treatment) {
    setError(null);
    setOk(null);
    setEditingId(t.id ?? t.sku);
    setDraft(toDraft(t));
  }

  function startNew() {
    setError(null);
    setOk(null);
    setEditingId("new");
    setDraft(emptyDraft());
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
  }

  async function saveDraft() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const payload = {
        sku: draft.sku.trim() || undefined,
        category: draft.category,
        name: draft.name.trim(),
        serviceName: draft.serviceName.trim() || draft.name.trim(),
        pricePounds: draft.pricePounds,
        fromPrice: draft.fromPrice,
        priceNote: draft.priceNote.trim(),
        blurb: draft.blurb.trim(),
        sortOrder: Number(draft.sortOrder) || 0,
        active: draft.active,
      };
      if (!payload.name) throw new Error("Name is required");

      const isNew = editingId === "new" || !draft.id;
      const res = await fetch(
        isNew ? "/api/staff/treatments" : `/api/staff/treatments/${draft.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save treatment");

      const listRes = await fetch("/api/staff/treatments", { credentials: "same-origin" });
      const listData = await listRes.json().catch(() => ({}));
      if (listRes.ok && Array.isArray(listData.items)) {
        setItems(listData.items);
      }
      setOk(isNew ? "Treatment added." : "Treatment saved.");
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function disableTreatment(id: string) {
    if (!confirm("Remove this treatment from the active menu?")) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/staff/treatments/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not disable treatment");
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, active: false } : t)));
      setOk("Treatment deactivated.");
      if (editingId === id) cancelEdit();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disable failed");
    } finally {
      setBusy(false);
    }
  }

  async function reactivate(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/treatments/${id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not reactivate");
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, active: true } : t)));
      setOk("Treatment reactivated.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reactivate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: "0.35rem" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Treatment menu
          </h2>
          <p className="muted" style={{ margin: 0 }}>
            {TREATMENT_MENU_TAGLINE}
          </p>
        </div>
        {props.canEdit ? (
          <button className="btn btn--primary" type="button" onClick={startNew} disabled={busy}>
            Add treatment
          </button>
        ) : null}
      </div>

      {props.canEdit ? (
        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
          Edit names and prices here — they sync to booking options and are stored in the database.
        </p>
      ) : null}

      {editingId === "new" ? (
        <TreatmentEditor
          title="New treatment"
          draft={draft}
          setDraft={setDraft}
          busy={busy}
          onCancel={cancelEdit}
          onSave={saveDraft}
        />
      ) : null}

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
          {group.items.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              No treatments in this category yet.
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }} className="stack">
              {group.items.map((t) => {
                const key = t.id ?? t.sku;
                const isEditing = editingId === key;
                return (
                  <li
                    key={key}
                    className="panel"
                    style={{
                      padding: "0.85rem 1rem",
                      opacity: t.active === false ? 0.55 : 1,
                    }}
                  >
                    {isEditing ? (
                      <TreatmentEditor
                        title="Edit treatment"
                        draft={draft}
                        setDraft={setDraft}
                        busy={busy}
                        onCancel={cancelEdit}
                        onSave={saveDraft}
                      />
                    ) : (
                      <div className="stack" style={{ gap: "0.35rem" }}>
                        <div
                          className="row"
                          style={{ justifyContent: "space-between", alignItems: "baseline" }}
                        >
                          <div>
                            <strong>{t.name}</strong>
                            {t.active === false ? (
                              <span className="badge badge--warn" style={{ marginLeft: "0.5rem" }}>
                                inactive
                              </span>
                            ) : null}
                          </div>
                          <span>{formatTreatmentPrice(t)}</span>
                        </div>
                        <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                          Booking label: {t.serviceName}
                          {t.blurb ? ` · ${t.blurb}` : ""}
                        </p>
                        {props.canEdit ? (
                          <div className="row">
                            <button
                              className="btn btn--ghost"
                              type="button"
                              disabled={busy}
                              onClick={() => startEdit(t)}
                            >
                              Edit
                            </button>
                            {t.active === false ? (
                              <button
                                className="btn btn--ghost"
                                type="button"
                                disabled={busy || !t.id}
                                onClick={() => t.id && reactivate(t.id)}
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                className="btn btn--ghost"
                                type="button"
                                disabled={busy || !t.id}
                                onClick={() => t.id && disableTreatment(t.id)}
                              >
                                Deactivate
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}

      {error ? <p className="error">{error}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
        {TREATMENT_MENU_DISCLAIMER}
      </p>
    </div>
  );
}

function TreatmentEditor(props: {
  title: string;
  draft: Draft;
  setDraft: (d: Draft | ((prev: Draft) => Draft)) => void;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { draft, setDraft } = props;
  return (
    <div className="stack">
      <h4 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        {props.title}
      </h4>
      <div className="field-row">
        <div className="field">
          <label htmlFor="tx-name">Display name</label>
          <input
            id="tx-name"
            value={draft.name}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                name: e.target.value,
                serviceName: d.serviceName || e.target.value,
              }))
            }
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tx-category">Category</label>
          <select
            id="tx-category"
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value as TreatmentCategory }))
            }
          >
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor="tx-service">Booking / appointment label</label>
        <input
          id="tx-service"
          value={draft.serviceName}
          onChange={(e) => setDraft((d) => ({ ...d, serviceName: e.target.value }))}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="tx-price">Price (£) — leave blank if clinically indicated</label>
          <input
            id="tx-price"
            inputMode="decimal"
            value={draft.pricePounds}
            onChange={(e) => setDraft((d) => ({ ...d, pricePounds: e.target.value }))}
            placeholder="e.g. 150"
          />
        </div>
        <div className="field">
          <label htmlFor="tx-note">Price note</label>
          <input
            id="tx-note"
            value={draft.priceNote}
            onChange={(e) => setDraft((d) => ({ ...d, priceNote: e.target.value }))}
            placeholder="e.g. per session"
          />
        </div>
      </div>
      <label className="consent">
        <input
          type="checkbox"
          checked={draft.fromPrice}
          onChange={(e) => setDraft((d) => ({ ...d, fromPrice: e.target.checked }))}
        />
        <span>Show as “from £…”</span>
      </label>
      <div className="field">
        <label htmlFor="tx-blurb">Short description</label>
        <input
          id="tx-blurb"
          value={draft.blurb}
          onChange={(e) => setDraft((d) => ({ ...d, blurb: e.target.value }))}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="tx-sku">SKU (optional)</label>
          <input
            id="tx-sku"
            value={draft.sku}
            onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
            placeholder="auto from name if empty"
          />
        </div>
        <div className="field">
          <label htmlFor="tx-sort">Sort order</label>
          <input
            id="tx-sort"
            inputMode="numeric"
            value={draft.sortOrder}
            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
          />
        </div>
      </div>
      <div className="row">
        <button className="btn btn--primary" type="button" disabled={props.busy} onClick={props.onSave}>
          {props.busy ? "Saving…" : "Save to database"}
        </button>
        <button className="btn btn--ghost" type="button" disabled={props.busy} onClick={props.onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
