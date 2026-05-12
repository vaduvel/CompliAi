"use client"

// FiscalResolveCockpit — cockpit dedicat rezolvării findings fiscale.
//
// Layout fix (SUS / CENTRU / JOS) cu CENTRU variabil per pattern. Detectează
// findingTypeId și alege blocurile potrivite per pattern de rezolvare:
//
//   Pattern A (auto-approve) — EF-003 safe-code, EF-006: XmlDiff + AI Explain
//                              + Disclaimer + ResolveCTAButton chain repair→submit
//   Pattern B (manual-input) — D300-LINE-ERROR, SAFT-ACCOUNTS-INVALID: form input
//   Pattern C (skip-wait)    — EF-004: TimerCountdown + check status manual
//   Pattern D (search)       — EF-006 lookup CUI, EF-SEQUENCE: search ERP
//   Pattern E (compare)      — ETVA-GAP, EF-DUPLICATE: CompareDiffBlock
//   Pattern F (generate-doc) — răspuns ANAF, D300 draft, notă explicativă
//   Pattern G (upload)       — CERT-EXPIRING, SAFT-DEADLINE: drag-drop file
//   Pattern H (external)     — EMPUTERNICIRE-MISSING: template PDF + email
//   Pattern I (retransmit)   — EF-005: ResolveCTAButton chain validate→submit
//
// Pentru EF-GENERIC (sau type nedetectat), folosim layout fallback minimal:
// AI Explain + manual close button + audit log.
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Clock, Sparkles } from "lucide-react"

import type { ScanFinding } from "@/lib/compliance/types"
import { AIExplainBlock } from "@/components/compliscan/fiscal/resolve/AIExplainBlock"
import { AuditLogInline } from "@/components/compliscan/fiscal/resolve/AuditLogInline"
import { PatternAAutoApprove } from "@/components/compliscan/fiscal/resolve/patterns/PatternAAutoApprove"
import { PatternFallback } from "@/components/compliscan/fiscal/resolve/patterns/PatternFallback"

type FiscalResolveCockpitProps = {
  finding: ScanFinding
  /**
   * URL la care utilizatorul revine după "Înapoi" — de obicei /dashboard/fiscal
   * sau /portfolio dacă vine de acolo.
   */
  backHref?: string
}

export function FiscalResolveCockpit({
  finding,
  backHref = "/dashboard/fiscal",
}: FiscalResolveCockpitProps) {
  // Extract error codes from finding detail/title pentru AI Explain.
  const errorCodes = extractErrorCodes(finding)
  const severityLabel = humanizeSeverity(finding.severity)
  const statusLabel = humanizeStatus(finding.findingStatus ?? "open")
  const [resolved, setResolved] = useState(finding.findingStatus === "resolved")

  return (
    <div className="space-y-4">
      {/* SUS — header */}
      <header className="rounded-eos-md border border-eos-border bg-eos-surface px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-eos-text-tertiary transition hover:text-eos-text-muted"
          >
            <ArrowLeft className="size-3" strokeWidth={2} />
            Înapoi
          </Link>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} label={severityLabel} />
            <StatusBadge status={finding.findingStatus ?? "open"} label={statusLabel} />
          </div>
        </div>
        <h1
          data-display-text="true"
          className="mt-2 font-display text-[19px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          {finding.title}
        </h1>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">{finding.detail}</p>
        {finding.sourceDocument && (
          <p className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-eos-text-tertiary">
            <Clock className="size-2.5" strokeWidth={1.5} />
            Sursă: {finding.sourceDocument}
          </p>
        )}
      </header>

      {/* CENTRU — pattern-specific blocks */}
      <section className="space-y-4">
        {/* AI Explain — totdeauna primul */}
        {errorCodes.length > 0 && <AIExplainBlock errorCodes={errorCodes} />}

        {/* Pattern-specific dispatch */}
        <PatternDispatcher
          finding={finding}
          onResolved={() => setResolved(true)}
          resolved={resolved}
        />
      </section>

      {/* JOS — audit log + revalidation rules */}
      <section className="space-y-3">
        <AuditLogInline scopeId={finding.id} limit={5} />
        {finding.rescanHint && (
          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-3 py-2 text-[11.5px] text-eos-text-tertiary">
            <strong className="text-eos-text-muted">Reverificare:</strong> {finding.rescanHint}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Pattern dispatcher ───────────────────────────────────────────────────────

function PatternDispatcher({
  finding,
  onResolved,
  resolved,
}: {
  finding: ScanFinding
  onResolved: () => void
  resolved: boolean
}) {
  if (resolved) {
    return (
      <div className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-4 py-3">
        <p className="flex items-center gap-2 text-[13px] font-medium text-eos-success">
          <Sparkles className="size-4" strokeWidth={2} />
          Finding rezolvat. Auditul a fost salvat la dosar.
        </p>
      </div>
    )
  }

  const typeId = finding.findingTypeId ?? ""

  // Pattern A — auto-approve (EF-003 safe-code, EF-006)
  if (typeId === "EF-003" || typeId === "EF-006") {
    return <PatternAAutoApprove finding={finding} onResolved={onResolved} />
  }

  // Pattern I — retransmit (EF-005, EF-004 after 72h)
  // Pattern G — upload (CERT-*, SAFT-DEADLINE)
  // Pattern E — compare (ETVA-GAP, ERP-SPV-MISMATCH, BANK-SPV-MISMATCH)
  // Pattern F — generate-doc (ETVA-LATE, D300-MISSING, PFA-FORM082)
  // Pattern D — search (EF-SEQUENCE, EMPUTERNICIRE-MISSING)
  // Pattern C — skip-wait (EF-004 <72h)
  // Pattern B — manual-input (D300-LINE-ERROR, SAFT-ACCOUNTS-INVALID)
  // Pattern H — external-contact (EMPUTERNICIRE-MISSING)
  //
  // Restul pattern-urilor sunt fallback la generic în Faza 3.1; vor fi
  // implementate în Faza 3.5 + următoarele.

  return <PatternFallback finding={finding} onResolved={onResolved} />
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorCodes(finding: ScanFinding): string[] {
  const codes: string[] = []
  // Match V001-V099, T001-T099, BR-XX, BR-RO-XXX from title + detail
  const re = /\b(V\d{2,3}|T\d{2,3}|BR-[A-Z]+-?\d{0,4}|BR-CO-\d+|BR-S-\d+)\b/g
  const haystack = `${finding.title}\n${finding.detail}`
  let match
  while ((match = re.exec(haystack)) !== null) {
    if (!codes.includes(match[1])) codes.push(match[1])
  }
  return codes
}

function humanizeSeverity(s: ScanFinding["severity"]): string {
  switch (s) {
    case "critical":
      return "Critic"
    case "high":
      return "Sever"
    case "medium":
      return "Moderat"
    case "low":
      return "Scăzut"
    default:
      return s
  }
}

function humanizeStatus(s: string): string {
  switch (s) {
    case "open":
      return "Necesită acțiune"
    case "confirmed":
      return "În lucru"
    case "resolved":
      return "Rezolvat"
    case "dismissed":
      return "Ignorat"
    case "under_monitoring":
      return "Monitorizat"
    default:
      return s
  }
}

function SeverityBadge({ severity, label }: { severity: ScanFinding["severity"]; label: string }) {
  const cls =
    severity === "critical"
      ? "bg-eos-error/20 text-eos-error"
      : severity === "high"
        ? "bg-eos-warning/20 text-eos-warning"
        : severity === "medium"
          ? "bg-eos-primary/20 text-eos-primary"
          : "bg-eos-surface-variant text-eos-text-muted"
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {label}
    </span>
  )
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const cls =
    status === "resolved"
      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
      : status === "open" || status === "confirmed"
        ? "border-eos-border bg-eos-surface text-eos-text-muted"
        : "border-eos-border-subtle bg-eos-surface-variant text-eos-text-tertiary"
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {label}
    </span>
  )
}
