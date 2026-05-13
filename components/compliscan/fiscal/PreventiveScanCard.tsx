"use client"

// Card scan preventiv unificat — rulează toate detectoarele preventive
// (filings deadline radar, cert expiry, frequency mismatch, consistency)
// într-un singur swoop și afișează rezultat agregat.
//
// Funcționează în orice mediu ANAF (mock/test/prod) — toate detectoarele
// rulează pe state-ul local. NU necesită token OAuth valid.

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  PlayCircle,
  ShieldAlert,
  Sparkles,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"

type Severity = "critical" | "high" | "medium" | "low"

type FilingReminder = {
  filingId: string
  filingType: string
  period: string
  dueISO: string
  daysUntilDue: number
  escalationLevel: "reminder" | "warning" | "escalation"
  message: string
}

type FrequencyMismatch = {
  filingId: string
  filingType: string
  period: string
  detectedFrequency: string
  filedAsFrequency: string
  severity: string
  message: string
}

type ScanFinding = {
  id: string
  title: string
  detail: string
  severity: Severity
  remediationHint?: string
  impactSummary?: string
}

type CertSnapshot = {
  total: number
  active: number
  expiringSoon: number
  expiringCritical: number
  expired: number
  unauthorized: number
  renewedPending: number
}

type ConsistencyIssue = {
  message: string
  severity: "warning" | "error"
  filingIds: string[]
}

type CalendarAutoFill = {
  enabled: boolean
  applicableRulesCount: number
  autoRecordsGenerated: number
  newCount: number
  refreshedCount: number
  preservedManualCount: number
  preservedFiledCount: number
}

type PreventiveScanResponse = {
  ok: boolean
  persisted: boolean
  scanId: string
  scannedAtISO: string
  summary: {
    totalChecks: number
    criticalCount: number
    warningCount: number
    infoCount: number
    newFindingsCount: number
    refreshedFindingsCount?: number
  }
  expectedFrequency: {
    frequency: "monthly" | "quarterly" | "unknown"
    confidence: "high" | "medium" | "low"
    reason: string
  }
  frequencyMismatches: FrequencyMismatch[]
  filingReminders: FilingReminder[]
  overdueFindings: ScanFinding[]
  frequencyFindings: ScanFinding[]
  certFindings: ScanFinding[]
  certSnapshot: CertSnapshot | null
  consistencyIssues: ConsistencyIssue[]
  newFindings: ScanFinding[]
  calendarAutoFill?: CalendarAutoFill
}

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "border-eos-error/40 bg-eos-error-soft text-eos-error",
  high: "border-eos-warning/40 bg-eos-warning-soft text-eos-warning",
  medium: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  low: "border-eos-border bg-eos-surface text-eos-text-muted",
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
  low: "Informativ",
}

export function PreventiveScanCard() {
  const [data, setData] = useState<PreventiveScanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    void loadInitial()
  }, [])

  async function loadInitial() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/preventive-scan", { cache: "no-store" })
      if (!res.ok) {
        toast.error("Nu am putut rula scanul preventiv.")
        return
      }
      setData((await res.json()) as PreventiveScanResponse)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function runAndPersist() {
    setRunning(true)
    try {
      const res = await fetch("/api/fiscal/preventive-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persist: true }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Scan preventiv eșuat.")
        return
      }
      const result = (await res.json()) as PreventiveScanResponse
      setData(result)
      const newCount = result.summary.newFindingsCount
      const refreshedCount = result.summary.refreshedFindingsCount ?? 0
      if (newCount === 0 && refreshedCount === 0) {
        toast.success("Scan preventiv complet — nu există noi findings.")
      } else {
        toast.success(
          `Scan preventiv complet — ${newCount} findings noi, ${refreshedCount} actualizate.`,
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setRunning(false)
    }
  }

  if (loading) {
    return (
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
        <div className="flex items-center gap-2 text-[12.5px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Rulez scanul preventiv…
        </div>
      </section>
    )
  }

  if (!data) return null

  const totalIssues =
    data.summary.criticalCount + data.summary.warningCount + data.summary.infoCount
  const noIssues = totalIssues === 0

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Scan preventiv fiscal
            </h2>
          </div>
          <p className="mt-1 text-[12.5px] text-eos-text-muted">
            Rulează 4 detectoare pe state-ul curent: frecvență declarații, deadline-uri filings, expirare certificate
            digitale, consistență istoric. NU necesită token ANAF — lucrează pe ce ai încărcat local.
          </p>
        </div>
        <button
          type="button"
          onClick={runAndPersist}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
          ) : (
            <PlayCircle className="size-3.5" strokeWidth={2.5} />
          )}
          {running ? "Rulez…" : "Rulează & persistă findings"}
        </button>
      </header>

      {/* Summary tiles */}
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <SummaryTile
          label="Critice"
          count={data.summary.criticalCount}
          tone="critical"
        />
        <SummaryTile
          label="Ridicate"
          count={data.summary.warningCount}
          tone="high"
        />
        <SummaryTile
          label="Medii"
          count={data.summary.infoCount}
          tone="medium"
        />
        <SummaryTile
          label="Findings noi"
          count={data.summary.newFindingsCount}
          tone="primary"
          subLabel={
            data.summary.refreshedFindingsCount
              ? `+${data.summary.refreshedFindingsCount} actualizate`
              : undefined
          }
        />
      </div>

      {/* Calendar auto-populat — marker explicit de transparență */}
      {data.calendarAutoFill && data.calendarAutoFill.enabled && (
        <div className="mt-4 rounded-eos-md border border-eos-primary/25 bg-eos-primary-soft/40 px-4 py-3">
          <div className="flex items-start gap-2">
            <Wand2 className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p
                data-display-text="true"
                className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                Calendar fiscal auto-detectat din profilul firmei
              </p>
              <p className="mt-1 text-[11.5px] leading-[1.55] text-eos-text-muted">
                Am identificat <strong>{data.calendarAutoFill.applicableRulesCount}</strong>{" "}
                declarații ANAF care se aplică profilului tău și am generat{" "}
                <strong>{data.calendarAutoFill.autoRecordsGenerated}</strong> termene
                viitoare. Nu inventăm — aplicăm regulile fiscale RO (Cod Fiscal, OUG-uri,
                Ordine ANAF) pe profilul concret al firmei.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-[10.5px] text-eos-text-muted">
                <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-0.5">
                  +{data.calendarAutoFill.newCount} adăugate
                </span>
                <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-0.5">
                  ↻ {data.calendarAutoFill.refreshedCount} actualizate
                </span>
                {data.calendarAutoFill.preservedManualCount > 0 && (
                  <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-0.5">
                    ✋ {data.calendarAutoFill.preservedManualCount} manuale păstrate
                  </span>
                )}
                {data.calendarAutoFill.preservedFiledCount > 0 && (
                  <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 text-eos-success">
                    ✓ {data.calendarAutoFill.preservedFiledCount} deja depuse
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {noIssues && (
        <div className="mt-4 flex items-center gap-2 rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-4 py-3 text-[12.5px] text-eos-success">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          Nicio problemă preventivă detectată. Continuă monitorizarea.
        </div>
      )}

      {/* Frequency rule */}
      <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated p-4">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
          Frecvență așteptată
        </p>
        <p className="mt-1 text-[13px] font-semibold text-eos-text">
          {data.expectedFrequency.frequency === "monthly"
            ? "LUNAR"
            : data.expectedFrequency.frequency === "quarterly"
              ? "TRIMESTRIAL"
              : "Necunoscut"}{" "}
          <span className="ml-1 text-[11px] font-normal text-eos-text-muted">
            ({data.expectedFrequency.confidence})
          </span>
        </p>
        <p className="mt-1 text-[12px] text-eos-text-muted">{data.expectedFrequency.reason}</p>
      </div>

      {/* Filing reminders */}
      {data.filingReminders.length > 0 && (
        <Section
          icon={<Clock className="size-4 text-eos-warning" strokeWidth={2} />}
          title={`Deadline-uri filings (${data.filingReminders.length})`}
        >
          <ul className="space-y-2">
            {data.filingReminders.slice(0, 8).map((r) => (
              <li
                key={r.filingId}
                className={`rounded-eos-md border px-3 py-2 text-[12.5px] ${
                  r.escalationLevel === "escalation"
                    ? "border-eos-error/30 bg-eos-error-soft"
                    : r.escalationLevel === "warning"
                      ? "border-eos-warning/30 bg-eos-warning-soft"
                      : "border-eos-border bg-eos-surface-elevated"
                }`}
              >
                <p className="font-semibold text-eos-text">{r.message}</p>
                <p className="mt-0.5 text-[11px] text-eos-text-muted">
                  Termen: {r.dueISO.slice(0, 10)} · {r.daysUntilDue} zile rămase
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Combined findings list */}
      {data.newFindings.length > 0 && (
        <Section
          icon={<ShieldAlert className="size-4 text-eos-error" strokeWidth={2} />}
          title={`Findings preventive (${data.newFindings.length})`}
        >
          <ul className="space-y-2">
            {data.newFindings.slice(0, 12).map((f) => (
              <li
                key={f.id}
                className={`rounded-eos-md border px-3 py-2.5 text-[12.5px] ${SEVERITY_TONE[f.severity]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug text-eos-text">{f.title}</p>
                  <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em]">
                    {SEVERITY_LABEL[f.severity]}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
                  {f.detail}
                </p>
                {f.remediationHint && (
                  <p className="mt-1.5 text-[11px] italic text-eos-text-tertiary">
                    → {f.remediationHint}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Cert snapshot */}
      {data.certSnapshot && data.certSnapshot.total > 0 && (
        <Section
          icon={<AlertTriangle className="size-4 text-eos-warning" strokeWidth={2} />}
          title={`Certificate digitale (${data.certSnapshot.total} total)`}
        >
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            <CertTile label="Active" count={data.certSnapshot.active} tone="success" />
            <CertTile label="Expiră ≤30z" count={data.certSnapshot.expiringSoon} tone="medium" />
            <CertTile label="Expiră ≤7z" count={data.certSnapshot.expiringCritical} tone="high" />
            <CertTile label="Expirate" count={data.certSnapshot.expired} tone="critical" />
            <CertTile
              label="Neautorizate"
              count={data.certSnapshot.unauthorized}
              tone="critical"
            />
            <CertTile
              label="Grace post-renewal"
              count={data.certSnapshot.renewedPending}
              tone="medium"
            />
          </div>
        </Section>
      )}

      {/* Consistency issues */}
      {data.consistencyIssues.length > 0 && (
        <Section
          icon={<AlertTriangle className="size-4 text-eos-warning" strokeWidth={2} />}
          title={`Probleme consistență (${data.consistencyIssues.length})`}
        >
          <ul className="space-y-2">
            {data.consistencyIssues.map((c, idx) => (
              <li
                key={idx}
                className={`rounded-eos-md border px-3 py-2 text-[12.5px] ${
                  c.severity === "error"
                    ? "border-eos-error/30 bg-eos-error-soft"
                    : "border-eos-warning/30 bg-eos-warning-soft"
                }`}
              >
                <p className="text-eos-text">{c.message}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <footer className="mt-5 flex items-center justify-between text-[10.5px] text-eos-text-tertiary">
        <span>
          Ultimul scan: {new Date(data.scannedAtISO).toLocaleString("ro-RO")}
        </span>
        <span className="font-mono">{data.scanId}</span>
      </footer>
    </section>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SummaryTile({
  label,
  count,
  tone,
  subLabel,
}: {
  label: string
  count: number
  tone: "critical" | "high" | "medium" | "primary"
  subLabel?: string
}) {
  const toneClass =
    tone === "critical"
      ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
      : tone === "high"
        ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
        : tone === "medium"
          ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
          : "border-eos-border bg-eos-surface-elevated text-eos-text"
  return (
    <div className={`rounded-eos-md border px-3 py-2.5 ${toneClass}`}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em]">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[20px] font-bold">{count}</p>
      {subLabel && (
        <p className="text-[10px] text-eos-text-tertiary">{subLabel}</p>
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        {icon}
        <p
          data-display-text="true"
          className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          {title}
        </p>
      </div>
      <div className="mt-2.5">{children}</div>
    </div>
  )
}

function CertTile({
  label,
  count,
  tone,
}: {
  label: string
  count: number
  tone: "success" | "medium" | "high" | "critical"
}) {
  const toneClass =
    tone === "critical"
      ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
      : tone === "high"
        ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
        : tone === "medium"
          ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
          : "border-eos-success/30 bg-eos-success-soft text-eos-success"
  return (
    <div className={`rounded-eos-md border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[16px] font-bold">{count}</p>
    </div>
  )
}
