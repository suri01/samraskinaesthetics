"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type WhatsAppSettingsView = {
  enabled: boolean;
  provider: "meta" | "twilio" | "mocked";
  mode: "meta" | "twilio" | "mocked";
  ready: boolean;
  hasAccessToken: boolean;
  hasTwilioAuthToken: boolean;
  phoneNumberId: string | null;
  templateName: string | null;
  templateLanguage: string;
  twilioAccountSid: string | null;
  twilioWhatsappFrom: string | null;
};

export function WhatsAppSettingsPanel(props: {
  initial: WhatsAppSettingsView;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(props.initial.enabled);
  const [provider, setProvider] = useState(props.initial.provider);
  const [phoneNumberId, setPhoneNumberId] = useState(props.initial.phoneNumberId ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [clearAccessToken, setClearAccessToken] = useState(false);
  const [templateName, setTemplateName] = useState(props.initial.templateName ?? "");
  const [templateLanguage, setTemplateLanguage] = useState(
    props.initial.templateLanguage || "en_GB",
  );
  const [twilioAccountSid, setTwilioAccountSid] = useState(
    props.initial.twilioAccountSid ?? "",
  );
  const [twilioAuthToken, setTwilioAuthToken] = useState("");
  const [clearTwilioAuthToken, setClearTwilioAuthToken] = useState(false);
  const [twilioWhatsappFrom, setTwilioWhatsappFrom] = useState(
    props.initial.twilioWhatsappFrom ?? "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [status, setStatus] = useState(props.initial);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!props.canEdit) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/staff/whatsapp-settings", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          provider,
          phoneNumberId,
          accessToken,
          clearAccessToken,
          templateName,
          templateLanguage,
          twilioAccountSid,
          twilioAuthToken,
          clearTwilioAuthToken,
          twilioWhatsappFrom,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save WhatsApp settings");
      setStatus(data.settings);
      setAccessToken("");
      setTwilioAuthToken("");
      setClearAccessToken(false);
      setClearTwilioAuthToken(false);
      setOk(
        data.settings?.ready
          ? "WhatsApp channel saved and ready."
          : "WhatsApp settings saved (still mocked until credentials are complete and enabled).",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        WhatsApp Business
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        Appointment reminders use this channel. Meta charges per delivered message; leave disabled
        to keep messages in the local outbox only (mock mode).
      </p>
      <p style={{ margin: 0 }}>
        Status:{" "}
        <span className="badge">{status.ready ? "live" : status.mode}</span>
        {status.hasAccessToken || status.hasTwilioAuthToken ? (
          <span className="muted"> · credentials on file</span>
        ) : (
          <span className="muted"> · no credentials stored</span>
        )}
      </p>

      {!props.canEdit ? (
        <p className="muted" style={{ margin: 0 }}>
          Only admins can change WhatsApp provider settings.
        </p>
      ) : (
        <>
          <label className="consent">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>Enable live WhatsApp sending</span>
          </label>

          <div className="field">
            <label htmlFor="wa-provider">Provider</label>
            <select
              id="wa-provider"
              value={provider}
              onChange={(e) =>
                setProvider(e.target.value as "meta" | "twilio" | "mocked")
              }
            >
              <option value="mocked">Mocked (outbox only)</option>
              <option value="meta">Meta Cloud API</option>
              <option value="twilio">Twilio</option>
            </select>
          </div>

          {provider === "meta" ? (
            <div className="stack">
              <div className="field">
                <label htmlFor="wa-phone-id">Phone number ID</label>
                <input
                  id="wa-phone-id"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="From Meta WhatsApp → API setup"
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="wa-token">
                  Access token{status.hasAccessToken ? " (leave blank to keep current)" : ""}
                </label>
                <input
                  id="wa-token"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder={status.hasAccessToken ? "••••••••" : "Permanent system user token"}
                  autoComplete="new-password"
                />
              </div>
              {status.hasAccessToken ? (
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={clearAccessToken}
                    onChange={(e) => setClearAccessToken(e.target.checked)}
                  />
                  <span>Clear stored access token</span>
                </label>
              ) : null}
              <div className="field-row">
                <div className="field">
                  <label htmlFor="wa-template">Utility template name (recommended)</label>
                  <input
                    id="wa-template"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g. appointment_reminder"
                  />
                </div>
                <div className="field">
                  <label htmlFor="wa-lang">Template language</label>
                  <input
                    id="wa-lang"
                    value={templateLanguage}
                    onChange={(e) => setTemplateLanguage(e.target.value)}
                    placeholder="en_GB"
                  />
                </div>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
                Template body params sent in order: customer first name, service name, date/time
                (Europe/London). If no template is set, a free-form text message is attempted
                (usually only works inside the 24-hour customer care window).
              </p>
            </div>
          ) : null}

          {provider === "twilio" ? (
            <div className="stack">
              <div className="field">
                <label htmlFor="tw-sid">Account SID</label>
                <input
                  id="tw-sid"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="field">
                <label htmlFor="tw-token">
                  Auth token{status.hasTwilioAuthToken ? " (leave blank to keep current)" : ""}
                </label>
                <input
                  id="tw-token"
                  type="password"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder={status.hasTwilioAuthToken ? "••••••••" : ""}
                  autoComplete="new-password"
                />
              </div>
              {status.hasTwilioAuthToken ? (
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={clearTwilioAuthToken}
                    onChange={(e) => setClearTwilioAuthToken(e.target.checked)}
                  />
                  <span>Clear stored Twilio auth token</span>
                </label>
              ) : null}
              <div className="field">
                <label htmlFor="tw-from">WhatsApp from number</label>
                <input
                  id="tw-from"
                  value={twilioWhatsappFrom}
                  onChange={(e) => setTwilioWhatsappFrom(e.target.value)}
                  placeholder="whatsapp:+447…"
                />
              </div>
            </div>
          ) : null}

          {error ? <p className="error">{error}</p> : null}
          {ok ? <p className="ok">{ok}</p> : null}
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save WhatsApp settings"}
          </button>
        </>
      )}
    </form>
  );
}
