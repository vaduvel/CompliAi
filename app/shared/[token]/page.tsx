// Sprint 9 — Public shared compliance summary page
// Accessible without authentication. Token is self-contained + HMAC-signed.
// Route: /shared/[token]

import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { SharedApprovalPanel } from "@/components/compliscan/shared-approval-panel"
import { V3ScoreRing } from "@/components/compliscan/v3"
import { resolveSignedShareToken } from "@/lib/server/share-token-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadOrganizations } from "@/lib/server/auth"
import {
  findSharedApprovalDocument,
  getSharedDocumentComments,
  isSharedDocumentApproved,
  isSharedDocumentRejected,
} from "@/lib/server/shared-approval"
import { getWhiteLabelConfig, type WhiteLabelConfig } from "@/lib/server/white-label"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function readOrgName(orgId: string): Promise<string> {
  try {
    const orgs = await loadOrganizations()
    return orgs.find((o) => o.id === orgId)?.name ?? "Organizație"
  } catch {
    return "Organizație"
  }
}

function scoreTone(score: number): "ok" | "high" | "critical" {
  if (score >= 75) return "ok"
  if (score >= 50) return "high"
  return "critical"
}

function scoreLabel(score: number) {
  if (score >= 75) return "Risc Scăzut"
  if (score >= 50) return "Risc Mediu"
  return "Risc Ridicat"
}

function formatExpiry(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function recipientLabel(type: string) {
  if (type === "counsel") return "Brief juridic"
  if (type === "partner") return "Profil partener"
  return "Raport contabil"
}

function envValue(name: string) {
  return process.env[name]?.trim() || null
}

function initialsFromName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CS"
}

function buildConsultantProfile(config: WhiteLabelConfig, orgName: string) {
  const cabinetName =
    config.partnerName?.trim() ||
    envValue("COMPLISCAN_CABINET_NAME") ||
    "Cabinet DPO"
  const consultantName =
    envValue("COMPLISCAN_CONSULTANT_NAME") ||
    "Diana Popescu"

  return {
    cabinetName,
    consultantName,
    title: envValue("COMPLISCAN_CONSULTANT_TITLE") || "Consultant DPO",
    certification: envValue("COMPLISCAN_CONSULTANT_CERTIFICATION") || "CIPP/E",
    email: envValue("COMPLISCAN_CONSULTANT_EMAIL") || "diana@dpocomplet.ro",
    phone: envValue("COMPLISCAN_CONSULTANT_PHONE") || "+40 700 000 000",
    brandColor: config.brandColor || "#6366f1",
    clientName: orgName,
  }
}

// ── Empty/error state ────────────────────────────────────────────────────────

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-eos-bg px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft">
          <AlertTriangle className="size-5 text-eos-warning" strokeWidth={1.75} />
        </div>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
          Acces blocat
        </p>
        <h1
          data-display-text="true"
          className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text"
        >
          {title}
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">{message}</p>
        <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          Link-urile expiră în 72 de ore de la generare
        </p>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SharedCompliancePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const payload = resolveSignedShareToken(token)
  if (!payload) {
    return (
      <ErrorState
        title="Link invalid sau expirat"
        message="Acest link de partajare nu mai este valid. Solicită un link nou de la organizația care l-a generat."
      />
    )
  }

  const rawState = await readStateForOrg(payload.orgId)
  const orgName = await readOrgName(payload.orgId)
  const whiteLabel = await getWhiteLabelConfig(payload.orgId)
  const consultant = buildConsultantProfile(whiteLabel, orgName)

  if (!rawState) {
    return (
      <ErrorState
        title="Date indisponibile"
        message="Profilul de conformitate pentru această organizație nu este disponibil momentan."
      />
    )
  }

  const state = normalizeComplianceState(rawState)
  const summary = computeDashboardSummary(state)
  const score = summary.score
  const tone = scoreTone(score)
  const label = scoreLabel(score)

  const openFindings = state.findings.filter(
    (f) => f.findingStatus !== "resolved" && f.findingStatus !== "dismissed"
  )
  const criticalFindings = openFindings
    .filter((f) => f.severity === "critical" || f.severity === "high")
    .slice(0, 5)

  const gdprOk = state.gdprProgress >= 70
  const efacturaOk = state.efacturaConnected && state.efacturaSignalsCount === 0
  const hasAiSystems = state.aiSystems.length > 0
  const driftCount = (state.driftRecords ?? []).filter((d) => d.open).length
  const approvalDocument = findSharedApprovalDocument(state, payload.documentId)
  const approvalDocumentApproved = isSharedDocumentApproved(approvalDocument)
  const approvalDocumentRejected = isSharedDocumentRejected(approvalDocument)
  const approvalDocumentComments = getSharedDocumentComments(approvalDocument).map((c) => ({
    id: c.id,
    authorName: c.authorName,
    comment: c.comment,
    createdAtISO: c.createdAtISO,
  }))

  const generatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
            <ShieldCheck className="size-3" strokeWidth={2} />
            {consultant.cabinetName} · {recipientLabel(payload.recipientType)}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* ── Hero ── */}
        <div className="mb-8">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Profil de conformitate · partajat
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[36px]"
            style={{ textWrap: "balance" }}
          >
            {orgName}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            <span>generat · {generatedAt}</span>
            <span className="text-eos-border-strong">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3" strokeWidth={2} />
              expiră · {formatExpiry(payload.expiresAtISO)}
            </span>
          </div>
        </div>

        {/* ── Score hero card ── */}
        <div className="mb-6 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
          <div className="flex items-center gap-5">
            <V3ScoreRing value={score} tone={tone} size={72} strokeWidth={5} />
            <div className="flex-1">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                Scor global de conformitate
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  data-display-text="true"
                  className={[
                    "font-display text-[44px] font-medium leading-none tabular-nums tracking-[-0.025em]",
                    tone === "ok"
                      ? "text-eos-success"
                      : tone === "high"
                        ? "text-eos-warning"
                        : "text-eos-error",
                  ].join(" ")}
                >
                  {score}
                </span>
                <span className="text-[13px] font-medium text-eos-text-tertiary">%</span>
              </div>
              <p
                className={[
                  "mt-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]",
                  tone === "ok"
                    ? "text-eos-success"
                    : tone === "high"
                      ? "text-eos-warning"
                      : "text-eos-error",
                ].join(" ")}
              >
                {label}
              </p>
            </div>
          </div>
        </div>

        {/* ── Consultant identity ── */}
        <div className="mb-6 rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-eos-md text-sm font-bold text-white"
              style={{ background: consultant.brandColor }}
            >
              {initialsFromName(consultant.cabinetName)}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                Pregătit pentru {consultant.clientName}
              </p>
              <h2
                data-display-text="true"
                className="mt-1 font-display text-[16px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                {consultant.consultantName}
              </h2>
              <p className="mt-1 text-[13px] text-eos-text-muted">
                {consultant.title} · {consultant.certification} · {consultant.cabinetName}
              </p>
              <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
                {consultant.email} · {consultant.phone}
              </p>
            </div>
          </div>
        </div>

        {/* ── Framework status ── */}
        <div className="mb-6 rounded-eos-lg border border-eos-border bg-eos-surface">
          <div className="border-b border-eos-border px-5 py-3.5">
            <p
              data-display-text="true"
              className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
            >
              Stare framework-uri
            </p>
            <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              acoperire pe regulamente
            </p>
          </div>
          <div className="space-y-1 p-3">
            <FrameworkRow
              name="GDPR · Protecția datelor personale"
              ok={gdprOk}
              detail={
                gdprOk
                  ? `${state.gdprProgress}% · acoperire satisfăcătoare`
                  : `${state.gdprProgress}% · necesită remediere`
              }
            />
            {payload.recipientType === "accountant" && (
              <FrameworkRow
                name="e-Factura · SPV ANAF"
                ok={efacturaOk}
                detail={
                  !state.efacturaConnected
                    ? "conexiune SPV neconfigurată"
                    : state.efacturaSignalsCount > 0
                      ? `${state.efacturaSignalsCount} semnale active`
                      : "conexiune activă, fără probleme detectate"
                }
              />
            )}
            {hasAiSystems && (
              <FrameworkRow
                name="EU AI Act · Sisteme AI"
                ok={state.highRisk === 0}
                detail={
                  state.highRisk > 0
                    ? `${state.highRisk} ${state.highRisk === 1 ? "sistem" : "sisteme"} cu risc ridicat`
                    : `${state.aiSystems.length} ${state.aiSystems.length === 1 ? "sistem" : "sisteme"} inventariat${state.aiSystems.length === 1 ? "" : "e"} · fără risc ridicat`
                }
              />
            )}
            {driftCount > 0 && (
              <FrameworkRow
                name="Drift · modificări de conformitate"
                ok={false}
                detail={`${driftCount} ${driftCount === 1 ? "modificare necesită" : "modificări necesită"} confirmare`}
              />
            )}
          </div>
        </div>

        {/* ── Open risks ── */}
        {criticalFindings.length > 0 && (
          <div className="mb-6 rounded-eos-lg border border-eos-border bg-eos-surface">
            <div className="flex items-center gap-2 border-b border-eos-border px-5 py-3.5">
              <p
                data-display-text="true"
                className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Riscuri deschise prioritare
              </p>
              <span className="ml-auto inline-flex items-center rounded-sm border border-eos-error/25 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-error">
                {criticalFindings.length}
              </span>
            </div>
            <div className="space-y-2 p-3">
              {criticalFindings.map((f) => (
                <div
                  key={f.id}
                  className={[
                    "relative flex items-start gap-3 overflow-hidden rounded-eos-sm border bg-white/[0.02] px-3.5 py-3",
                    f.severity === "critical"
                      ? "border-eos-error/20"
                      : "border-eos-warning/20",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "absolute left-0 top-0 bottom-0 w-[3px]",
                      f.severity === "critical" ? "bg-eos-error" : "bg-eos-warning",
                    ].join(" ")}
                  />
                  <div className="ml-1 min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold leading-tight text-eos-text">
                      {f.title}
                    </p>
                    {f.impactSummary && (
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.5] text-eos-text-muted">
                        {f.impactSummary}
                      </p>
                    )}
                    <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                      {f.category} · {f.severity}
                    </p>
                  </div>
                </div>
              ))}
              {openFindings.length > criticalFindings.length && (
                <p className="px-1 pt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                  + {openFindings.length - criticalFindings.length} alte finding-uri active
                </p>
              )}
            </div>
          </div>
        )}

        {approvalDocument ? (
          <div className="mb-6">
            <SharedApprovalPanel
              token={token}
              documentTitle={payload.documentTitle ?? approvalDocument.title}
              initialApproved={approvalDocumentApproved}
              initialRejected={approvalDocumentRejected}
              initialComments={approvalDocumentComments}
            />
          </div>
        ) : null}

        {/* ── Disclaimer ── */}
        <div className="rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft px-5 py-4">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            Notă juridică
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.65] text-eos-text-muted">
            Acest document este un rezumat de lucru pregătit de cabinet și nu constituie
            consultanță juridică sau contabilă. Informațiile reflectă starea internă a
            workspace-ului la momentul generării și necesită validare profesională înainte de
            utilizare în scop oficial, contractual sau de audit.
          </p>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <span>Pregătit de</span>
          <span className="font-semibold text-eos-text-muted">{consultant.cabinetName}</span>
          <span className="text-eos-border-strong">·</span>
          <span>link expiră în 72h</span>
          <span className="ml-auto text-eos-text-muted">© 2026</span>
        </div>
      </footer>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FrameworkRow({
  name,
  ok,
  detail,
}: {
  name: string
  ok: boolean
  detail: string
}) {
  return (
    <div className="relative flex items-start gap-3 overflow-hidden rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] px-3.5 py-3">
      <span
        aria-hidden
        className={[
          "absolute left-0 top-0 bottom-0 w-[3px]",
          ok ? "bg-eos-success" : "bg-eos-warning",
        ].join(" ")}
      />
      <span className="ml-1 mt-0.5 shrink-0">
        {ok ? (
          <CheckCircle2 className="size-4 text-eos-success" strokeWidth={2} />
        ) : (
          <XCircle className="size-4 text-eos-warning" strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold leading-tight text-eos-text">{name}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.04em] text-eos-text-muted">
          {detail}
        </p>
      </div>
    </div>
  )
}
