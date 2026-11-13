import { eq } from "drizzle-orm";
import { IpadDeviceManager } from "@/components/IpadDeviceManager";
import { MfaSetupPanel } from "@/components/MfaSetupPanel";
import { StaffShell } from "@/components/StaffShell";
import { db } from "@/db";
import { clinicSettings, staffUsers } from "@/db/schema";
import { requireStaffPage } from "@/lib/auth/staff";
import { ROLE_PERMISSIONS } from "@/lib/constants";

export default async function SettingsPage() {
  const ctx = await requireStaffPage();
  const [settings] = await db
    .select()
    .from(clinicSettings)
    .where(eq(clinicSettings.clinicId, ctx.clinicId))
    .limit(1);
  const staff = await db.select().from(staffUsers).where(eq(staffUsers.clinicId, ctx.clinicId));
  const me = staff.find((s) => s.id === ctx.staffUserId);
  const canManageIpads =
    ctx.role === "owner" || ctx.role === "receptionist" || ctx.role === "practitioner";

  return (
    <StaffShell>
      <h1 className="page-title">Settings</h1>
      <p className="page-lede">
        Scaffolding for roles, consent, retention, MFA, and clinic iPad passkeys. UK GDPR /
        medical-record items need adviser review — not claimed as compliant by this software.
      </p>
      <div className="stack">
        <div className="panel" id="ipad-devices">
          {canManageIpads ? (
            <IpadDeviceManager />
          ) : (
            <div className="stack">
              <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
                Registered iPads (passkeys)
              </h2>
              <p className="muted" style={{ margin: 0 }}>
                Your role ({ctx.role}) can view settings but cannot register clinic iPads. Sign in as
                reception or owner to create a setup code.
              </p>
            </div>
          )}
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Your MFA</h2>
          <p className="muted" style={{ margin: 0 }}>
            Status: {me?.totpEnabled ? "enabled" : "not enabled"}
          </p>
          <MfaSetupPanel enabled={Boolean(me?.totpEnabled)} />
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>Roles</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Permissions (v1)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => (
                <tr key={role}>
                  <td style={{ textTransform: "capitalize" }}>{role}</td>
                  <td className="muted">{perms.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>Staff</h3>
          <ul>
            {staff.map((s) => (
              <li key={s.id}>
                {s.name} · {s.email} · {s.role} {s.totpEnabled ? "· MFA" : ""}{" "}
                {!s.active ? <span className="badge badge--warn">disabled</span> : null}
              </li>
            ))}
          </ul>
          <p className="muted">Invite / disable flows: API scaffolding in place; UI polish later.</p>
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Consent template
          </h2>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{settings?.consentTemplate}</p>
        </div>

        <div className="panel stack">
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500 }}>
            Retention hooks
          </h2>
          <p style={{ margin: 0 }}>
            Clinical: {settings?.retentionYearsClinical ?? 8} years · Finance:{" "}
            {settings?.retentionYearsFinance ?? 7} years
          </p>
          <p className="muted" style={{ margin: 0 }}>
            Jobs can mark eligible records; no auto-delete without confirmation (stub).
          </p>
          <p style={{ margin: 0 }}>
            Idle lock: {settings?.idleLockMinutes ?? 15} min · Max session:{" "}
            {settings?.maxSessionHours ?? 12} h
          </p>
        </div>
      </div>
    </StaffShell>
  );
}
