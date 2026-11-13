"use client";

import type { YnAnswer } from "@/lib/consultation-form";

export function YnToggle(props: {
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

export function YnList(props: {
  items: Array<{ id: string; label: string }>;
  values: Record<string, YnAnswer>;
  onChange: (id: string, patch: Partial<YnAnswer>) => void;
  /** Wide staff table layout (matches Customer entered). Default is iPad card stack. */
  variant?: "ipad" | "staff";
}) {
  const staff = props.variant === "staff";
  return (
    <div className={`yn-list${staff ? " yn-list--staff" : ""}`}>
      {props.items.map((item) => {
        const row = props.values[item.id] ?? { answer: "", comments: "" };
        return (
          <div key={item.id} className={`yn-row${staff ? " yn-row--staff" : ""}`}>
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
            ) : staff ? (
              <span className="muted yn-row__spacer" aria-hidden>
                —
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
