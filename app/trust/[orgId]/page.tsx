import Link from "next/link"
import { CheckCircle2, Lock, ShieldCheck, XCircle } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { V3ScoreRing, V3RiskPill } from "@/components/compliscan/v3"
import { computeDashboardSummary, normalizeComplianceState } from "@/lib/compliance/engine"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadOrganizations } from "@/lib/server/auth"

// ─── Data helpers ─────────────────────────────────────────────────────────────

function isValidOrgId(id: string): boolean {
  return /^org-[a-z0-9]{8,}$/.test(id)
}

async function readOrgName(orgId: string): Promise<string> {
  try {
    const orgs = await loadOrganizations()
    return orgs.find((o) => o.id === orgId)?.name ?? orgId
  } catch {
    return orgId
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({
  ok,
  labelOk,
  labelFail,
}: {
  ok: boolean
  labelOk: string
  labelFail: string
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[2px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em]",
        ok
          ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
          : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
      ].join(" ")}
    >
      {ok ? (
        <CheckCircle2 className="size-3" strokeWidth={2.5} />
      ) : (
        <XCircle className="size-3" strokeWidth={2.5} />
      )}
      {ok ? labelOk : labelFail}
    </span>
  )
}

// ─── Not-found state ──────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-eos-bg px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-border bg-eos-surface">
          <ShieldCheck className="size-5 text-eos-text-tertiary" strokeWidth={1.75} />
        </div>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Trust Center
        </p>
        <h1
          data-display-text="true"
          className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text"
        >
          Profil negăsit
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">
          Organizația solicitată nu are un profil public de conformitate disponibil.
        </p>
        <Link
          href="/trust"
          className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-primary transition-colors hover:text-eos-primary/80"
        >
          → Înapoi la Trust Center
        </Link>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function TrustPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params

  if (!isValidOrgId(orgId)) {
    return <NotFound />
  }

  const [state, orgName] = await Promise.all([
    readStateForOrg(orgId),
    readOrgName(orgId),
  ])

  if (!state) {
    return <NotFound />
  }

  const normalizedState = normalizeComplianceState(state)
  const summary = computeDashboardSummary(normalizedState)
  const { gdprProgress, highRisk, efacturaConnected } = normalizedState

  const isGdprGood = gdprProgress >= 70
  const isAiActGood = highRisk === 0

  const updatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const scoreTone = summary.score >= 70 ? "ok" : summary.score >= 40 ? "high" : "critical"
  const riskTone = summary.score >= 70 ? "ok" : summary.score >= 40 ? "high" : "critical"

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-eos-border bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
            <Lock className="size-3" strokeWidth={2} />
            Doar vizualizare
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* ── Hero ── */}
        <div className="mb-10">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Trust Center · profil public
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[36px]"
            style={{ textWrap: "balance" }}
          >
            {orgName}
          </h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            Status conformitate · actualizat {updatedAt}
          </p>
        </div>

        {/* ── Score hero card ── */}
        <div className="mb-6 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
          <div className="flex items-center gap-5">
            <V3ScoreRing value={summary.score} tone={scoreTone} size={72} strokeWidth={5} />
            <div className="flex-1">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                Scor global
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  data-display-text="true"
                  className="font-display text-[44px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
                >
                  {summary.score}
                </span>
                <span className="text-[13px] font-medium text-eos-text-tertiary">%</span>
              </div>
              <div className="mt-2">
                <V3RiskPill tone={riskTone}>{summary.riskLabel}</V3RiskPill>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-eos-border-strong/30">
            <div
              className={[
                "h-full transition-all duration-500",
                summary.score >= 70
                  ? "bg-eos-success"
                  : summary.score >= 40
                    ? "bg-eos-warning"
                    : "bg-eos-error",
              ].join(" ")}
              style={{ width: `${summary.score}%` }}
            />
          </div>
        </div>

        {/* ── KPI metrics grid ── */}
        <div className="grid divide-x divide-eos-border overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface md:grid-cols-2">
          {/* GDPR */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                GDPR
              </p>
              <StatusPill ok={isGdprGood} labelOk="Conform" labelFail="În progres" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                data-display-text="true"
                className={[
                  "font-display text-[24px] font-medium leading-none tabular-nums tracking-[-0.025em]",
                  isGdprGood ? "text-eos-success" : "text-eos-warning",
                ].join(" ")}
              >
                {gdprProgress}
              </span>
              <span className="text-[13px] text-eos-text-tertiary">%</span>
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-muted">
              progres acoperire
            </p>
          </div>

          {/* AI Act */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                EU AI Act
              </p>
              <StatusPill
                ok={isAiActGood}
                labelOk="Fără risc ridicat"
                labelFail="Risc ridicat"
              />
            </div>
            <div className="mt-2">
              <span
                data-display-text="true"
                className={[
                  "font-display text-[24px] font-medium leading-none tabular-nums tracking-[-0.025em]",
                  isAiActGood ? "text-eos-success" : "text-eos-error",
                ].join(" ")}
              >
                {highRisk}
              </span>
            </div>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-muted">
              {highRisk === 0
                ? "niciun sistem high-risk"
                : `${highRisk === 1 ? "sistem" : "sisteme"} cu risc ridicat`}
            </p>
          </div>

          {/* e-Factura */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                e-Factura
              </p>
              <StatusPill
                ok={efacturaConnected}
                labelOk="Conectat"
                labelFail="Neconectat"
              />
            </div>
            <p
              data-display-text="true"
              className={[
                "mt-2 font-display text-[18px] font-semibold leading-tight tracking-[-0.015em]",
                efacturaConnected ? "text-eos-success" : "text-eos-text-tertiary",
              ].join(" ")}
            >
              {efacturaConnected ? "Activ" : "Inactiv"}
            </p>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-muted">
              {efacturaConnected
                ? "integrare ANAF SPV"
                : "integrarea nu e configurată"}
            </p>
          </div>

          {/* Ultima actualizare */}
          <div className="px-4 py-3.5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                Ultima sincronizare
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-eos-success/25 bg-eos-success-soft px-2 py-[2px] font-mono text-[10px] font-semibold uppercase tracking-[0.04em] text-eos-success">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                Verificat
              </span>
            </div>
            <p
              data-display-text="true"
              className="mt-2 font-display text-[16px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
            >
              {updatedAt}
            </p>
            <p className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-muted">
              status verificat
            </p>
          </div>
        </div>

        {/* ── Disclaimer ── */}
        <div className="mt-6 rounded-eos-lg border border-eos-border bg-white/[0.02] px-5 py-4">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Notă juridică
          </p>
          <p className="mt-2 text-[12.5px] leading-[1.65] text-eos-text-muted">
            Acest profil este generat automat de CompliScan și reflectă starea conformității
            la data afișată. Datele sunt furnizate exclusiv în scop informativ și nu
            substituie consilierea juridică.
          </p>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">
            Acasă
          </Link>
          <Link href="/trust" className="transition-colors hover:text-eos-text-muted">
            Trust Center
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-eos-text-muted">
            Privacy
          </Link>
          <span className="ml-auto text-eos-text-muted">© 2026 CompliScan</span>
        </div>
      </footer>
    </div>
  )
}
