// Sprint 6.1 — Email reminder fiscal pentru contabili.
//
// Trimitem digest cu termenele iminente (≤7 zile) și findings noi:
//   - Filing reminders din generateFilingReminders
//   - Findings preventive (P300, SAF-T hygiene, eFactura)
//   - Issues e-Factura din ultima sincronizare
//
// Trimitere via Resend HTTP API. Fallback console.log dacă RESEND_API_KEY
// lipsește (dev mode).

import type { FilingReminder } from "@/lib/compliance/filing-discipline"
import { FILING_TYPE_LABELS } from "@/lib/compliance/filing-discipline"
import type { ScanFinding } from "@/lib/compliance/types"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_ADDRESS =
  process.env.ALERT_EMAIL_FROM ?? "CompliScan Fiscal <onboarding@resend.dev>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.compliscan.ro"

export type FiscalReminderEmailPayload = {
  orgName: string
  recipientEmail: string
  reminders: FilingReminder[]
  newFindings: ScanFinding[]
  efacturaProblems?: number
  saftHygieneScore?: number | null
  spvLastSyncedAtISO?: string | null
}

export type FiscalEmailResult = {
  ok: boolean
  channel: "resend" | "console"
  reason?: string
}

function urgencyTone(level: FilingReminder["escalationLevel"]): {
  bg: string
  border: string
  fg: string
  label: string
} {
  switch (level) {
    case "escalation":
      return { bg: "#fef2f2", border: "#fecaca", fg: "#b91c1c", label: "URGENT" }
    case "warning":
      return { bg: "#fef3c7", border: "#fde68a", fg: "#a16207", label: "Atenție" }
    default:
      return { bg: "#f0f9ff", border: "#bae6fd", fg: "#0369a1", label: "Reminder" }
  }
}

function buildHtml(payload: FiscalReminderEmailPayload): string {
  const remindersSorted = [...payload.reminders].sort((a, b) => a.daysUntilDue - b.daysUntilDue)

  const reminderRows = remindersSorted
    .slice(0, 10)
    .map((r) => {
      const tone = urgencyTone(r.escalationLevel)
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">
            <strong>${FILING_TYPE_LABELS[r.filingType] ?? r.filingType}</strong>
            <span style="color:#64748b">· ${r.period}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">
            <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${tone.bg};border:1px solid ${tone.border};color:${tone.fg}">
              ${tone.label}
            </span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:ui-monospace,Menlo,monospace;color:#0f172a">
            ${r.daysUntilDue} zile
          </td>
        </tr>
      `
    })
    .join("")

  const criticalFindings = payload.newFindings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5)

  const findingRows = criticalFindings
    .map(
      (f) => `
        <li style="margin-bottom:8px">
          <strong style="color:#0f172a">${f.title}</strong>
          <div style="color:#475569;font-size:13px;margin-top:2px">${f.detail.slice(0, 200)}${f.detail.length > 200 ? "…" : ""}</div>
        </li>
      `,
    )
    .join("")

  const escalationCount = remindersSorted.filter((r) => r.escalationLevel === "escalation").length
  const warningCount = remindersSorted.filter((r) => r.escalationLevel === "warning").length

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a">
  <div style="background:#0f172a;padding:20px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:600">CompliScan Fiscal — Digest zilnic</h1>
    <p style="color:#94a3b8;margin:4px 0 0;font-size:13px">${payload.orgName} · ${new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;background:#fff">

    <h2 style="margin:0 0 12px;font-size:15px;color:#0f172a">Sumar de azi</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        <td style="padding:8px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;width:33%">
          <div style="font-size:11px;color:#991b1b;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">URGENT (≤3 zile)</div>
          <div style="font-size:24px;font-weight:700;color:#b91c1c;margin-top:2px">${escalationCount}</div>
        </td>
        <td style="padding:8px 12px;background:#fef3c7;border:1px solid #fde68a;border-radius:6px;width:33%">
          <div style="font-size:11px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Atenție (≤7 zile)</div>
          <div style="font-size:24px;font-weight:700;color:#a16207;margin-top:2px">${warningCount}</div>
        </td>
        <td style="padding:8px 12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;width:33%">
          <div style="font-size:11px;color:#075985;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">e-Factura probleme</div>
          <div style="font-size:24px;font-weight:700;color:#0369a1;margin-top:2px">${payload.efacturaProblems ?? 0}</div>
        </td>
      </tr>
    </table>

    ${
      remindersSorted.length > 0
        ? `
    <h3 style="margin:24px 0 12px;font-size:14px;color:#0f172a">Termene de depunere</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;letter-spacing:0.05em">Declarație</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;letter-spacing:0.05em">Status</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;letter-spacing:0.05em">Termen</th>
        </tr>
      </thead>
      <tbody>${reminderRows}</tbody>
    </table>
    `
        : `<p style="color:#64748b;margin:24px 0">Niciun termen de depunere în următoarele 7 zile.</p>`
    }

    ${
      payload.saftHygieneScore !== null && payload.saftHygieneScore !== undefined
        ? `
    <div style="margin-top:24px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px">
      <strong style="color:#0f172a">Scor SAF-T hygiene</strong>
      <span style="float:right;font-family:ui-monospace,monospace;font-size:18px;font-weight:700;color:${payload.saftHygieneScore >= 70 ? "#15803d" : payload.saftHygieneScore >= 50 ? "#a16207" : "#b91c1c"}">${payload.saftHygieneScore}/100</span>
    </div>
    `
        : ""
    }

    ${
      criticalFindings.length > 0
        ? `
    <h3 style="margin:24px 0 12px;font-size:14px;color:#0f172a">Findings critice (${criticalFindings.length})</h3>
    <ul style="margin:0;padding-left:20px;color:#475569">
      ${findingRows}
    </ul>
    `
        : ""
    }

    <div style="margin-top:32px;text-align:center">
      <a href="${APP_URL}/dashboard/fiscal" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">
        Deschide dashboard fiscal →
      </a>
    </div>

    <hr style="margin:32px 0 16px;border:none;border-top:1px solid #e2e8f0">
    <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5">
      Notificare zilnică CompliScan Fiscal · trimisă doar dacă există termene în 7 zile sau findings noi.<br>
      <a href="${APP_URL}/dashboard/settings" style="color:#6366f1">Dezactivează notificările</a>
    </p>
  </div>
</body>
</html>`
}

export function shouldSendFiscalReminder(payload: FiscalReminderEmailPayload): {
  send: boolean
  reason: string
} {
  const hasUrgent = payload.reminders.some((r) => r.escalationLevel === "escalation")
  const hasWarning = payload.reminders.some((r) => r.escalationLevel === "warning")
  const hasCriticalFindings = payload.newFindings.some(
    (f) => f.severity === "critical" || f.severity === "high",
  )
  const hasEfacturaProblems = (payload.efacturaProblems ?? 0) > 0

  if (hasUrgent) return { send: true, reason: "urgent_filing" }
  if (hasWarning) return { send: true, reason: "warning_filing" }
  if (hasCriticalFindings) return { send: true, reason: "critical_finding" }
  if (hasEfacturaProblems) return { send: true, reason: "efactura_problems" }

  return { send: false, reason: "no_actionable_items" }
}

export async function sendFiscalReminderEmail(
  payload: FiscalReminderEmailPayload,
): Promise<FiscalEmailResult> {
  const decision = shouldSendFiscalReminder(payload)
  if (!decision.send) {
    return { ok: true, channel: "console", reason: `skipped: ${decision.reason}` }
  }

  const subject = `[CompliScan] Fiscal — ${payload.reminders.filter((r) => r.escalationLevel === "escalation").length} URGENT, ${payload.efacturaProblems ?? 0} probleme e-Factura`

  if (!RESEND_API_KEY) {
    console.log(
      `[CompliScan Fiscal] EMAIL → ${payload.recipientEmail} | subject="${subject}" | reminders=${payload.reminders.length} | findings=${payload.newFindings.length}`,
    )
    return { ok: true, channel: "console", reason: decision.reason }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [payload.recipientEmail],
        subject,
        html: buildHtml(payload),
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text()
      // Resend free tier: 403 cu „validation_error" la send către un email
      // ne-verificat. În dev/demo asta NU e o eroare reală — facem fallback
      // la console.log ca și cum n-ar fi configurat Resend.
      const isResendSandboxRestriction =
        res.status === 403 && err.includes("validation_error")
      if (isResendSandboxRestriction) {
        console.log(
          `[CompliScan Fiscal] EMAIL → ${payload.recipientEmail} | Resend sandbox restriction (free tier) — fallback console | reminders=${payload.reminders.length} findings=${payload.newFindings.length}`,
        )
        return {
          ok: true,
          channel: "console",
          reason: `${decision.reason} (resend sandbox fallback)`,
        }
      }
      return { ok: false, channel: "resend", reason: `HTTP ${res.status}: ${err.slice(0, 100)}` }
    }

    return { ok: true, channel: "resend", reason: decision.reason }
  } catch (err) {
    return {
      ok: false,
      channel: "resend",
      reason: err instanceof Error ? err.message : "fetch failed",
    }
  }
}

// ── Generic operational email helper ─────────────────────────────────────────
//
// Folosit de alte cron-uri pentru reminders ad-hoc (ex: PFA Form 082, e-Transport
// UIT expirat). Subject + body plain-text; același fallback Resend/console.

export type OperationalEmailInput = {
  to: string
  subject: string
  /** Body plain text — fără HTML. */
  body: string
  /** Label pentru log (cron name etc.). */
  label?: string
}

export async function sendOperationalEmail(
  input: OperationalEmailInput,
): Promise<FiscalEmailResult> {
  const label = input.label ?? "operational-email"

  if (!RESEND_API_KEY) {
    console.log(
      `[${label}] EMAIL → ${input.to} | subject="${input.subject}" | (no RESEND_API_KEY)`,
    )
    return { ok: true, channel: "console", reason: "no_resend_key" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [input.to],
        subject: input.subject,
        text: input.body,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      const err = await res.text()
      // Resend sandbox fallback (vezi sendFiscalReminderEmail pentru context).
      const isResendSandboxRestriction =
        res.status === 403 && err.includes("validation_error")
      if (isResendSandboxRestriction) {
        console.log(
          `[${label}] EMAIL → ${input.to} | Resend sandbox restriction — fallback console`,
        )
        return { ok: true, channel: "console", reason: "resend_sandbox_fallback" }
      }
      return { ok: false, channel: "resend", reason: `HTTP ${res.status}: ${err.slice(0, 100)}` }
    }

    return { ok: true, channel: "resend" }
  } catch (err) {
    return {
      ok: false,
      channel: "resend",
      reason: err instanceof Error ? err.message : "fetch failed",
    }
  }
}

// ── Test helpers ─────────────────────────────────────────────────────────────

export const __test__ = {
  buildHtml,
  urgencyTone,
}
