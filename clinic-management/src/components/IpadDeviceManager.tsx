"use client";

import { useEffect, useState } from "react";

type Device = {
  id: string;
  name: string;
  active: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  deviceType: string | null;
};

export function IpadDeviceManager() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [name, setName] = useState("Front desk iPad");
  const [registerUrl, setRegisterUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/staff/ipad-devices");
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDevices(data.devices ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createRegistration() {
    setBusy(true);
    setError(null);
    setRegisterUrl(null);
    const res = await fetch("/api/staff/ipad-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create registration");
      return;
    }
    setRegisterUrl(data.registerUrl);
    await load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/staff/ipad-devices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    await load();
  }

  return (
    <div className="stack">
      <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
        Registered iPads (passkeys)
      </h2>
      <p className="muted" style={{ margin: 0 }}>
        Create a one-time link, open it <strong>on the clinic iPad</strong>, then create a device
        passkey (Face ID / Touch ID). After that, `/ipad` unlocks with the passkey before customer
        check-in.
      </p>
      <div className="field">
        <label htmlFor="ipad-name">Device name</label>
        <input id="ipad-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <button className="btn btn--primary" type="button" onClick={createRegistration} disabled={busy}>
        {busy ? "Creating…" : "Create registration link"}
      </button>
      {registerUrl ? (
        <p className="ok" style={{ wordBreak: "break-all" }}>
          Open on the iPad (30 min): <a href={registerUrl}>{registerUrl}</a>
        </p>
      ) : null}
      {error ? <p className="error">{error}</p> : null}

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Last seen</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td>
                {d.name}
                {d.deviceType ? <span className="muted"> · {d.deviceType}</span> : null}
              </td>
              <td>
                {d.active ? <span className="badge">active</span> : <span className="badge badge--warn">disabled</span>}
              </td>
              <td className="muted">
                {d.lastSeenAt
                  ? new Date(d.lastSeenAt).toLocaleString("en-GB", { timeZone: "Europe/London" })
                  : "—"}
              </td>
              <td>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => toggle(d.id, !d.active)}
                >
                  {d.active ? "Disable" : "Enable"}
                </button>
              </td>
            </tr>
          ))}
          {devices.length === 0 ? (
            <tr>
              <td colSpan={4} className="muted">
                No iPads registered yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
