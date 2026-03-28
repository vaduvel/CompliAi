"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, ShieldAlert } from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioAlertRow } from "@/lib/server/portfolio"

const severityVariant = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
} as const

export function PortfolioAlertsPage() {
  const [alerts, setAlerts] = useState<PortfolioAlertRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/portfolio/alerts", { cache: "no-store" })
        if (!response.ok) throw new Error("Nu am putut încărca alertele din portofoliu.")
        const data = (await response.json()) as { alerts: PortfolioAlertRow[] }
        setAlerts(data.alerts)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const criticalCount = useMemo(
    () => alerts.filter((alert) => alert.severity === "critical" || alert.severity === "high").length,
    [alerts]
  )

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Alerte cross-client"
        description="Vezi toate alertele active din firmele din portofoliu și intră pe firmă doar când trebuie să execuți."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {alerts.length} alerte active
            </Badge>
            {criticalCount > 0 ? (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {criticalCount} critice sau ridicate
              </Badge>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Total</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">{alerts.length}</p>
        </Card>
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Critice / ridicate</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">{criticalCount}</p>
        </Card>
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Firme afectate</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">{new Set(alerts.map((alert) => alert.orgId)).size}</p>
        </Card>
      </div>

      <Card className="overflow-hidden border-eos-border bg-eos-surface">
        {alerts.length === 0 ? (
          <EmptyState
            title="Nu există alerte active"
            label="Portofoliul este curat în acest moment."
            icon={ShieldAlert}
            className="px-5 py-10"
          />
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {alerts.map((alert) => (
              <div key={alert.alertId} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={severityVariant[alert.severity]}
                      className="text-[10px] normal-case tracking-normal"
                    >
                      {alert.severity}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                      {alert.framework}
                    </Badge>
                    <span className="text-xs text-eos-text-muted">{alert.orgName}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-eos-text">{alert.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-eos-text-muted">
                    <span>{new Date(alert.createdAtISO).toLocaleString("ro-RO")}</span>
                    {alert.sourceDocument ? <span>• {alert.sourceDocument}</span> : null}
                  </div>
                </div>
                <PortfolioOrgActionButton
                  orgId={alert.orgId}
                  destination="/dashboard/alerte"
                  label="Intră în firmă"
                  variant="outline"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <ArrowUpRight className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Drilldown pe firmă</span>
        </div>
        <p className="mt-1">
          Butonul “Intră în firmă” schimbă contextul la orgul selectat și te duce direct în workspace-ul per-firmă, unde continui execuția.
        </p>
      </div>
    </div>
  )
}
