"use client"

// Sprint 6.3 — Portfolio fiscal aggregation UI.
// Cabinet view cross-client cu scor SAF-T, filing discipline, e-Factura issues
// și status integrări per client. Sortat by risk level (critical primul).

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PlugZap,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type FiscalClientRow = {
  orgId: string
  orgName: string
  saftHygieneScore: number | null
  saftHygieneLabel: string | null
  filingDisciplineScore: number | null
  filingDisciplineLabel: string | null
  filingTotal: number
  filingMissing: number
  filingLate: number
  filingRectified: number
  efacturaIssueCount: number
  efacturaSignalsTotal: number
  efacturaLastSyncAtISO: string | null
  smartbillConnected: boolean
  smartbillLastSyncAtISO: string | null
  oblioConnected: boolean
  oblioLastSyncAtISO: string | null
  riskLevel: "ok" | "warning" | "critical"
  topFinding: { id: string; title: string; severity: string } | null
}

type Summary = {
  totalClients: number
  criticalClients: number
  warningClients: number
  okClients: number
  totalEfacturaIssues: number
  totalFilingMissing: number
  integrationsConnected: number
  avgSaftScore: number | null
}

type Response = {
  summary: Summary
  clients: FiscalClientRow[]
  timestamp: string
}

const RISK_TONE: Record<FiscalClientRow["riskLevel"], string> = {
  ok: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  warning: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const RISK_LABEL: Record<FiscalClientRow["riskLevel"], string> = {
  ok: "OK",
  warning: "Atenție",
  critical: "Critic",
}

function fmtScore(score: number | null): string {
  return score === null ? "—" : `${score}/100`
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short" })
  } catch {
    return iso
  }
}

export function PortfolioFiscalPanel() {
  const [data, setData] = useState<Response | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/partner/portfolio/fiscal", { cache: "no-store" })
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Doar utilizatorii partner pot accesa portofoliul fiscal.")
        } else {
          toast.error("Nu am putut încărca portofoliul fiscal.")
        }
        return
      }
      setData((await res.json()) as Response)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă portofoliul fiscal...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-eos-md border border-eos-border bg-eos-surface p-6 text-center text-[12.5px] text-eos-text-muted">
        Portofoliu indisponibil.
      </div>
    )
  }

  const { summary, clients } = data

  return (
    <div className="space-y-6">
      {/* Aggregate stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Total clienți
          </p>
          <p className="mt-1 font-display text-[26px] font-semibold tracking-[-0.015em] text-eos-text">
            {summary.totalClients}
          </p>
        </div>
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-error">
            Risc critic
          </p>
          <p className="mt-1 font-display text-[26px] font-semibold tracking-[-0.015em] text-eos-text">
            {summary.criticalClients}
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">{summary.warningClients} warning · {summary.okClients} OK</p>
        </div>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Probleme e-Factura
          </p>
          <p className="mt-1 font-display text-[26px] font-semibold tracking-[-0.015em] text-eos-text">
            {summary.totalEfacturaIssues}
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">{summary.totalFilingMissing} declarații lipsă</p>
        </div>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            SAF-T mediu
          </p>
          <p className="mt-1 font-display text-[26px] font-semibold tracking-[-0.015em] text-eos-text">
            {summary.avgSaftScore ?? "—"}
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">
            {summary.integrationsConnected} clienți cu integrare ERP
          </p>
        </div>
      </section>

      {/* Per-client table */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface">
        <header className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-3">
          <h3
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Clienți · {clients.length} ({summary.criticalClients} de atenție)
          </h3>
        </header>

        {clients.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12.5px] text-eos-text-muted">
            Niciun client în portofoliu.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2 text-center">Risc</th>
                  <th className="px-3 py-2 text-right">SAF-T</th>
                  <th className="px-3 py-2 text-right">Disciplină</th>
                  <th className="px-3 py-2 text-right">e-Factura</th>
                  <th className="px-3 py-2 text-center">Integrări</th>
                  <th className="px-3 py-2">Top finding</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.orgId} className="border-b border-eos-border/50 align-top">
                    <td className="px-3 py-2">
                      <Link
                        href={`/portfolio/client/${c.orgId}`}
                        className="inline-flex items-center gap-1 font-semibold text-eos-text hover:text-eos-primary"
                      >
                        {c.orgName}
                        <ExternalLink className="size-3" strokeWidth={2} />
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${RISK_TONE[c.riskLevel]}`}
                      >
                        {c.riskLevel === "critical" ? (
                          <AlertTriangle className="mr-1 size-3" strokeWidth={2} />
                        ) : c.riskLevel === "ok" ? (
                          <CheckCircle2 className="mr-1 size-3" strokeWidth={2} />
                        ) : (
                          <TrendingUp className="mr-1 size-3" strokeWidth={2} />
                        )}
                        {RISK_LABEL[c.riskLevel]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text-muted">
                      {fmtScore(c.saftHygieneScore)}
                      {c.saftHygieneLabel && (
                        <div className="text-[10px] text-eos-text-tertiary">{c.saftHygieneLabel}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text-muted">
                      {fmtScore(c.filingDisciplineScore)}
                      <div className="text-[10px] text-eos-text-tertiary">
                        {c.filingMissing}M · {c.filingLate}L · {c.filingRectified}R
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text-muted">
                      {c.efacturaIssueCount}
                      <div className="text-[10px] text-eos-text-tertiary">{c.efacturaSignalsTotal} semnale</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.smartbillConnected ? (
                          <span title={`SmartBill · sync ${fmtDate(c.smartbillLastSyncAtISO)}`}>
                            <PlugZap className="size-3.5 text-eos-success" strokeWidth={2} />
                          </span>
                        ) : (
                          <span className="text-eos-text-tertiary" title="SmartBill neconectat">SB</span>
                        )}
                        {c.oblioConnected ? (
                          <span title={`Oblio · sync ${fmtDate(c.oblioLastSyncAtISO)}`}>
                            <PlugZap className="size-3.5 text-eos-primary" strokeWidth={2} />
                          </span>
                        ) : (
                          <span className="text-eos-text-tertiary" title="Oblio neconectat">OB</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-eos-text-muted">
                      {c.topFinding ? (
                        <Link
                          href={`/dashboard/resolve/${c.topFinding.id}`}
                          className="text-[12px] text-eos-primary hover:underline"
                          title={c.topFinding.title}
                        >
                          {c.topFinding.title.slice(0, 60)}
                          {c.topFinding.title.length > 60 ? "…" : ""}
                        </Link>
                      ) : (
                        <span className="text-[10.5px] text-eos-text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
