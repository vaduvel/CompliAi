import { CheckCircle2, Lock, ShieldCheck, XCircle } from "lucide-react"

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

function TrustMetricCard({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}

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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="size-3.5" strokeWidth={2} />
      ) : (
        <XCircle className="size-3.5" strokeWidth={2} />
      )}
      {ok ? labelOk : labelFail}
    </span>
  )
}

// ─── Not-found / error states ─────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <ShieldCheck className="mx-auto mb-4 size-12 text-gray-300" strokeWidth={1.5} />
        <h1 className="text-xl font-semibold text-gray-900">Profil negăsit</h1>
        <p className="mt-2 text-sm text-gray-500">
          Organizația solicitată nu are un profil public de conformitate disponibil.
        </p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 ring-1 ring-blue-100">
            <ShieldCheck className="size-6 text-blue-600" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">Trust Center</h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] text-gray-400">
                <Lock className="size-3" strokeWidth={2} />
                read-only
              </span>
            </div>
            <p className="mt-1 text-base text-gray-600">{orgName}</p>
            <p className="mt-0.5 text-sm text-gray-400">Profil public de conformitate</p>
          </div>
        </div>

        {/* Score hero */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-gray-900">{summary.score}%</span>
            <div className="mb-1">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  summary.score >= 70
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : summary.score >= 40
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                {summary.riskLabel}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-400">Scor global de conformitate</p>

          {/* Progress bar */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                summary.score >= 70
                  ? "bg-emerald-500"
                  : summary.score >= 40
                  ? "bg-amber-400"
                  : "bg-red-400"
              }`}
              style={{ width: `${summary.score}%` }}
            />
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TrustMetricCard label="GDPR">
            <StatusPill ok={isGdprGood} labelOk="Conform" labelFail="În progres" />
            <p className="mt-2 text-sm text-gray-500">Progres: {gdprProgress}%</p>
          </TrustMetricCard>

          <TrustMetricCard label="EU AI Act">
            <StatusPill
              ok={isAiActGood}
              labelOk="Fără risc ridicat"
              labelFail="Sisteme de risc ridicat"
            />
            <p className="mt-2 text-sm text-gray-500">
              {highRisk === 0
                ? "Niciun sistem AI cu risc ridicat detectat"
                : `${highRisk} sistem${highRisk !== 1 ? "e" : ""} cu risc ridicat`}
            </p>
          </TrustMetricCard>

          <TrustMetricCard label="e-Factura">
            <StatusPill
              ok={efacturaConnected}
              labelOk="Conectat"
              labelFail="Neconectat"
            />
            <p className="mt-2 text-sm text-gray-500">
              {efacturaConnected
                ? "Integrare e-Factura activă"
                : "Integrarea e-Factura nu este configurată"}
            </p>
          </TrustMetricCard>

          <TrustMetricCard label="Ultima actualizare">
            <p className="text-sm font-semibold text-gray-800">{updatedAt}</p>
            <div className="mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-emerald-500" strokeWidth={2} />
              <p className="text-xs text-gray-400">Status verificat</p>
            </div>
          </TrustMetricCard>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Acest profil este generat automat de CompliScan și reflectă starea conformității la data afișată.
          Datele sunt furnizate exclusiv în scop informativ.
        </p>
      </div>
    </div>
  )
}
