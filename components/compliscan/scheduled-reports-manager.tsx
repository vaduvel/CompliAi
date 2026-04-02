"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, Loader2, Mail, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioReportRow } from "@/lib/server/portfolio"
import type {
  ScheduledReport,
  ScheduledReportFrequency,
  ScheduledReportType,
} from "@/lib/server/scheduled-reports"
import { FREQUENCY_LABELS, REPORT_TYPE_LABELS } from "@/lib/server/scheduled-reports"

type RecentRun = {
  id: string
  scheduledReportId: string
  reportType: string
  status: "queued_for_approval" | "auto_executed" | "approved_then_executed" | "failed"
  createdAtISO: string
  message: string
}

type ScheduledReportsPayload = {
  reports: ScheduledReport[]
  recentRuns?: RecentRun[]
  runtimeStatus?: {
    storageBackend: "supabase" | "local_fallback"
    persistenceStatus: "synced" | "fallback"
  }
}

const DEFAULT_FORM = {
  reportType: "compliance_summary" as ScheduledReportType,
  frequency: "monthly" as ScheduledReportFrequency,
  recipientEmails: "",
  requiresApproval: true,
}

export function ScheduledReportsManager() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [recentRuns, setRecentRuns] = useState<RecentRun[]>([])
  const [portfolio, setPortfolio] = useState<PortfolioReportRow[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectAllClients, setSelectAllClients] = useState(true)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [runtimeStatus, setRuntimeStatus] = useState<
    ScheduledReportsPayload["runtimeStatus"] | null
  >(null)

  useEffect(() => {
    let cancelled = false

    async function loadReports() {
      setLoading(true)
      try {
        const [reportsResponse, portfolioResponse] = await Promise.all([
          fetch("/api/reports/scheduled", { cache: "no-store" }),
          fetch("/api/portfolio/reports", { cache: "no-store" }),
        ])

        const reportsPayload = reportsResponse.ok
          ? ((await reportsResponse.json()) as ScheduledReportsPayload)
          : { reports: [], recentRuns: [] }
        const portfolioPayload = portfolioResponse.ok
          ? ((await portfolioResponse.json()) as { reports: PortfolioReportRow[] })
          : { reports: [] }

        if (cancelled) return
        setReports(reportsPayload.reports ?? [])
        setRecentRuns(reportsPayload.recentRuns ?? [])
        setRuntimeStatus(reportsPayload.runtimeStatus ?? null)
        setPortfolio(portfolioPayload.reports ?? [])
        if (selectAllClients) {
          setSelectedClients((portfolioPayload.reports ?? []).map((item) => item.orgId))
        }
      } catch {
        if (!cancelled) toast.error("Nu am putut încărca rapoartele programate.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadReports()
    return () => {
      cancelled = true
    }
  }, [selectAllClients])

  useEffect(() => {
    if (selectAllClients) {
      setSelectedClients(portfolio.map((item) => item.orgId))
    }
  }, [portfolio, selectAllClients])

  const selectedClientCount = useMemo(
    () => (selectAllClients ? portfolio.length : selectedClients.length),
    [portfolio.length, selectAllClients, selectedClients.length]
  )

  function toggleClient(orgId: string) {
    setSelectedClients((current) =>
      current.includes(orgId)
        ? current.filter((item) => item !== orgId)
        : [...current, orgId]
    )
  }

  async function handleCreate() {
    const recipientEmails = form.recipientEmails
      .split(/[,;\s]+/)
      .map((item) => item.trim())
      .filter(Boolean)

    const clientOrgIds = selectAllClients ? portfolio.map((item) => item.orgId) : selectedClients

    if (clientOrgIds.length === 0) {
      toast.error("Selectează cel puțin o firmă din portofoliu.")
      return
    }
    if (recipientEmails.length === 0) {
      toast.error("Adaugă cel puțin un email destinatar.")
      return
    }

    setCreating(true)
    try {
      const response = await fetch("/api/reports/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: form.reportType,
          frequency: form.frequency,
          clientOrgIds,
          recipientEmails,
          requiresApproval: form.requiresApproval,
        }),
      })
      const payload = (await response.json().catch(() => null)) as { report?: ScheduledReport; error?: string } | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut crea raportul programat.")
      }
      setReports((current) => (payload?.report ? [payload.report, ...current] : current))
      setShowForm(false)
      setForm(DEFAULT_FORM)
      setSelectAllClients(true)
      toast.success("Raportul programat a fost creat.")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Nu am putut crea raportul programat.")
    } finally {
      setCreating(false)
    }
  }

  async function toggleEnabled(report: ScheduledReport) {
    setBusyId(report.id)
    try {
      const response = await fetch(`/api/reports/scheduled/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !report.enabled }),
      })
      const payload = (await response.json().catch(() => null)) as { report?: ScheduledReport } | null
      if (!response.ok || !payload?.report) {
        throw new Error("Nu am putut actualiza raportul programat.")
      }
      setReports((current) => current.map((item) => (item.id === report.id ? payload.report! : item)))
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Nu am putut actualiza raportul programat.")
    } finally {
      setBusyId(null)
    }
  }

  async function deleteReport(reportId: string) {
    setDeletingId(reportId)
    try {
      const response = await fetch(`/api/reports/scheduled/${reportId}`, { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Nu am putut șterge raportul programat.")
      }
      setReports((current) => current.filter((item) => item.id !== reportId))
      toast.success("Raportul programat a fost șters.")
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Nu am putut șterge raportul programat.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Rapoarte programate"
        title="Programezi livrabile recurente pentru portofoliu"
        description="Configurezi tipul de raport, frecvența, firmele incluse și dacă trimiterea merge direct sau intră mai întâi în Approval Queue."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {reports.length} rapoarte active
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {portfolio.length} firme în portofoliu
            </Badge>
            <Badge
              variant={runtimeStatus?.persistenceStatus === "fallback" ? "warning" : "success"}
              className="normal-case tracking-normal"
            >
              {runtimeStatus?.persistenceStatus === "fallback"
                ? "fallback local"
                : "Supabase synced"}
            </Badge>
          </>
        }
        actions={
          <Button onClick={() => setShowForm((current) => !current)}>
            <Plus className="size-4" strokeWidth={2} />
            Raport nou
          </Button>
        }
      />

      {runtimeStatus?.persistenceStatus === "fallback" ? (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-eos-text">
            Rapoartele programate rulează momentan pe fallback local. Configurația rămâne utilizabilă,
            dar nu o trata ca truth de producție până când traseul Supabase nu revine la `synced`.
          </CardContent>
        </Card>
      ) : null}

      {showForm ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">Configurează un raport programat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-eos-text">Tip raport</span>
                <select
                  className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
                  value={form.reportType}
                  onChange={(event) => setForm((current) => ({ ...current, reportType: event.target.value as ScheduledReportType }))}
                >
                  {(Object.entries(REPORT_TYPE_LABELS) as [ScheduledReportType, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-eos-text">Frecvență</span>
                <select
                  className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
                  value={form.frequency}
                  onChange={(event) => setForm((current) => ({ ...current, frequency: event.target.value as ScheduledReportFrequency }))}
                >
                  {(Object.entries(FREQUENCY_LABELS) as [ScheduledReportFrequency, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-eos-text">Destinatari email</span>
              <input
                value={form.recipientEmails}
                onChange={(event) => setForm((current) => ({ ...current, recipientEmails: event.target.value }))}
                placeholder="owner@firma.ro, audit@client.ro"
                className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
              />
            </label>

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-eos-text">Firme incluse</p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    {selectedClientCount} firme vor intra în raportul programat.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-eos-text">
                  <input
                    type="checkbox"
                    checked={selectAllClients}
                    onChange={(event) => setSelectAllClients(event.target.checked)}
                    className="size-4 rounded border-eos-border accent-eos-primary"
                  />
                  Toate firmele din portofoliu
                </label>
              </div>

              {!selectAllClients ? (
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {portfolio.map((org) => (
                    <label key={org.orgId} className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text">
                      <input
                        type="checkbox"
                        checked={selectedClients.includes(org.orgId)}
                        onChange={() => toggleClient(org.orgId)}
                        className="size-4 rounded border-eos-border accent-eos-primary"
                      />
                      <span className="truncate">{org.orgName}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm text-eos-text">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(event) => setForm((current) => ({ ...current, requiresApproval: event.target.checked }))}
                className="size-4 rounded border-eos-border accent-eos-primary"
              />
              Cere aprobare înainte de trimitere
            </label>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button onClick={() => void handleCreate()} disabled={creating}>
                {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" strokeWidth={2} />}
                Creează
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">Rapoarte active</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-eos-text-muted">
                <Loader2 className="size-4 animate-spin" />
                Încărcăm rapoartele programate...
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                Nu există încă rapoarte programate.
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className={`rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 ${report.enabled ? "" : "opacity-70"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-eos-text">{REPORT_TYPE_LABELS[report.reportType]}</p>
                        <Badge variant="outline" className="normal-case tracking-normal">
                          {FREQUENCY_LABELS[report.frequency]}
                        </Badge>
                        {report.requiresApproval ? (
                          <Badge variant="outline" className="normal-case tracking-normal">
                            Approval Queue
                          </Badge>
                        ) : (
                          <Badge variant="success" className="normal-case tracking-normal">
                            auto-send
                          </Badge>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-eos-text-muted">
                        {report.recipientEmails.join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {report.clientOrgIds.length} firme · următorul run {report.nextRunAt ? new Date(report.nextRunAt).toLocaleString("ro-RO") : "nedefinit"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled={busyId === report.id} onClick={() => void toggleEnabled(report)}>
                        {busyId === report.id ? <Loader2 className="size-4 animate-spin" /> : <CalendarClock className="size-4" strokeWidth={2} />}
                        {report.enabled ? "Dezactivează" : "Activează"}
                      </Button>
                      <Button variant="outline" disabled={deletingId === report.id} onClick={() => void deleteReport(report.id)}>
                        {deletingId === report.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" strokeWidth={2} />}
                        Șterge
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">Istoric rulări</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {recentRuns.length === 0 ? (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                Încă nu există rulări înregistrate pentru rapoartele programate.
              </div>
            ) : (
              recentRuns.slice(0, 8).map((run) => (
                <div key={run.id} className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-eos-text">
                        {REPORT_TYPE_LABELS[run.reportType as ScheduledReportType] ?? run.reportType}
                      </p>
                      <p className="mt-1 text-xs text-eos-text-muted">{run.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          run.status === "failed"
                            ? "warning"
                            : run.status === "queued_for_approval"
                              ? "outline"
                              : run.status === "approved_then_executed"
                                ? "success"
                              : "success"
                        }
                        className="normal-case tracking-normal"
                      >
                        {run.status === "failed"
                          ? "failed"
                          : run.status === "queued_for_approval"
                            ? "queued"
                            : run.status === "approved_then_executed"
                              ? "executat după aprobare"
                            : "executat"}
                      </Badge>
                      <span className="text-xs text-eos-text-muted">
                        {new Date(run.createdAtISO).toLocaleString("ro-RO")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-eos-text-tertiary" strokeWidth={2} />
                Trimiterile cu `requiresApproval` intră întâi în Approval Queue și rămân urmărite aici ca `queued`.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
