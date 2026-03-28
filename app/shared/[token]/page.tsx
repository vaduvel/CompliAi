// Sprint 9 — Public shared compliance summary page
// Accessible without authentication. Token is self-contained + HMAC-signed.
// Route: /shared/[token]

import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react"

import { resolveSignedShareToken } from "@/lib/server/share-token-store"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadOrganizations } from "@/lib/server/auth"
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

function scoreColor(score: number) {
  if (score >= 75) return "#10b981"
  if (score >= 50) return "#f59e0b"
  return "#ef4444"
}

function scoreLabel(score: number) {
  if (score >= 75) return "Risc Scăzut"
  if (score >= 50) return "Risc Mediu"
  return "Risc Ridicat"
}

function formatExpiry(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

function recipientLabel(type: string) {
  if (type === "counsel") return "Brief juridic"
  if (type === "partner") return "Profil partener"
  return "Raport contabil"
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function SharedCompliancePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // 1. Resolve + validate token
  const payload = resolveSignedShareToken(token)

  if (!payload) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-eos-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto size-10 text-eos-warning" strokeWidth={1.5} />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Link invalid sau expirat</h1>
          <p className="mt-2 text-sm text-slate-500">
            Acest link de partajare nu mai este valid. Solicită un link nou de la organizația care l-a generat.
          </p>
          <p className="mt-4 text-xs text-slate-400">Link-urile de conformitate expiră în 72 de ore.</p>
        </div>
      </div>
    )
  }

  // 2. Load org state
  const rawState = await readStateForOrg(payload.orgId)
  const orgName = await readOrgName(payload.orgId)

  if (!rawState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-eos-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto size-10 text-eos-warning" strokeWidth={1.5} />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Date indisponibile</h1>
          <p className="mt-2 text-sm text-slate-500">
            Profilul de conformitate pentru această organizație nu este disponibil momentan.
          </p>
        </div>
      </div>
    )
  }

  // 3. Build summary
  const state = normalizeComplianceState(rawState)
  const summary = computeDashboardSummary(state)
  const score = summary.score
  const color = scoreColor(score)
  const label = scoreLabel(score)

  const openFindings = state.findings.filter(
    (f) => f.findingStatus !== "resolved" && f.findingStatus !== "dismissed"
  )
  const criticalFindings = openFindings.filter(
    (f) => f.severity === "critical" || f.severity === "high"
  ).slice(0, 5)

  const gdprOk = state.gdprProgress >= 70
  const efacturaOk = state.efacturaConnected && state.efacturaSignalsCount === 0
  const hasAiSystems = state.aiSystems.length > 0
  const driftCount = (state.driftRecords ?? []).filter((d) => d.open).length

  const generatedAt = new Date().toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div className="rounded-eos-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-indigo-600" strokeWidth={2} />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
                  CompliAI · {recipientLabel(payload.recipientType)}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-bold text-slate-900">{orgName}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Profil de conformitate generat la {generatedAt}
              </p>
            </div>
            <div
              className="shrink-0 rounded-eos-md px-4 py-3 text-center"
              style={{ background: `${color}18`, border: `1px solid ${color}33` }}
            >
              <p className="text-2xl font-bold" style={{ color }}>{score}%</p>
              <p className="mt-0.5 text-xs font-medium" style={{ color }}>{label}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="size-3.5" strokeWidth={2} />
            Link valid până la {formatExpiry(payload.expiresAtISO)}
          </div>
        </div>

        {/* Framework status */}
        <div className="rounded-eos-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
            Stare framework-uri
          </h2>
          <div className="mt-4 space-y-3">
            <FrameworkRow
              name="GDPR / Protecția datelor personale"
              ok={gdprOk}
              detail={gdprOk ? `${state.gdprProgress}% — acoperire satisfăcătoare` : `${state.gdprProgress}% — necesită remediere`}
            />
            <FrameworkRow
              name="e-Factura / SPV ANAF"
              ok={efacturaOk}
              detail={
                !state.efacturaConnected
                  ? "Conexiune SPV neconfigurată"
                  : state.efacturaSignalsCount > 0
                    ? `${state.efacturaSignalsCount} semnale active de monitorizat`
                    : "Conexiune activă, fără probleme detectate"
              }
            />
            {hasAiSystems && (
              <FrameworkRow
                name="EU AI Act / Sisteme AI"
                ok={state.highRisk === 0}
                detail={
                  state.highRisk > 0
                    ? `${state.highRisk} sistem${state.highRisk !== 1 ? "e" : ""} cu risc ridicat înregistrat${state.highRisk !== 1 ? "e" : ""}`
                    : `${state.aiSystems.length} sistem${state.aiSystems.length !== 1 ? "e" : ""} AI inventariat${state.aiSystems.length !== 1 ? "e" : ""} — fără risc ridicat`
                }
              />
            )}
            {driftCount > 0 && (
              <FrameworkRow
                name="Modificări de conformitate (Drift)"
                ok={false}
                detail={`${driftCount} modificar${driftCount !== 1 ? "i" : "e"} față de baseline necesit${driftCount !== 1 ? "ă" : "ă"} confirmare`}
              />
            )}
          </div>
        </div>

        {/* Open risks */}
        {criticalFindings.length > 0 && (
          <div className="rounded-eos-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
              Riscuri deschise prioritare
            </h2>
            <div className="mt-4 space-y-3">
              {criticalFindings.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start gap-3 rounded-eos-md border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span
                    className={`mt-0.5 size-2 shrink-0 rounded-full ${
                      f.severity === "critical" ? "bg-eos-error" : "bg-eos-warning"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{f.title}</p>
                    {f.impactSummary && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{f.impactSummary}</p>
                    )}
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
                      {f.category} · {f.severity}
                    </p>
                  </div>
                </div>
              ))}
              {openFindings.length > criticalFindings.length && (
                <p className="text-xs text-slate-400">
                  + {openFindings.length - criticalFindings.length} alte finding-uri de conformitate active
                </p>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-eos-lg border border-eos-warning/10 bg-eos-warning-soft p-5">
          <p className="text-xs leading-relaxed text-eos-warning">
            <strong>Notă juridică:</strong> Acest document este un rezumat automatizat generat de CompliAI
            și nu constituie consultanță juridică sau contabilă. Informațiile reflectă starea internă
            a workspace-ului la momentul generării și necesită validare profesională înainte de utilizare
            în scop oficial, contractual sau de audit.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          Generat de <strong>CompliAI</strong> · compliscanag.vercel.app ·{" "}
          Link expiră în 72 ore de la generare
        </p>

      </div>
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
    <div className="flex items-start gap-3">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  )
}
