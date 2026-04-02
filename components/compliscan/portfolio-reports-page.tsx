"use client"

import { useEffect, useState } from "react"
import { Calendar, Check, FileSearch, FolderOpen, Loader2, Paintbrush, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioReportRow } from "@/lib/server/portfolio"
import type { ScheduledReport, ScheduledReportFrequency, ScheduledReportType } from "@/lib/server/scheduled-reports"
import { REPORT_TYPE_LABELS, FREQUENCY_LABELS } from "@/lib/server/scheduled-reports"

// ── White-label Section ───────────────────────────────────────────────────────

type WhiteLabelConfig = {
  partnerName: string
  tagline: string | null
  logoUrl: string | null
  brandColor: string
  storageBackend?: "supabase" | "local_fallback"
  persistenceStatus?: "synced" | "fallback"
}

function WhiteLabelSection() {
  const [config, setConfig] = useState<WhiteLabelConfig>({
    partnerName: "",
    tagline: null,
    logoUrl: null,
    brandColor: "#6366f1",
  })
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/partner/white-label", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { config?: WhiteLabelConfig }) => {
        if (data.config) setConfig(data.config)
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch("/api/partner/white-label", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? "Salvare eșuată.")
        return
      }
      const data = (await res.json().catch(() => null)) as { config?: WhiteLabelConfig } | null
      if (data?.config) setConfig(data.config)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      toast.success("Configurație white-label salvată.")
    } catch {
      toast.error("Eroare la salvare.")
    } finally {
      setSaving(false)
    }
  }

  if (loadingConfig) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" /> Se încarcă...
      </div>
    )
  }

  const previewColor = config.brandColor || "#6366f1"

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paintbrush className="size-4 text-eos-primary" strokeWidth={2} />
          <p className="text-sm font-semibold text-eos-text">Branding partener (White-label)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={config.persistenceStatus === "fallback" ? "warning" : "success"}
            className="normal-case tracking-normal"
          >
            {config.persistenceStatus === "fallback" ? "fallback local" : "Supabase synced"}
          </Badge>
          <p className="text-xs text-eos-text-tertiary">Aplicat pe rapoarte și exporturi</p>
        </div>
      </div>

      {config.persistenceStatus === "fallback" ? (
        <div className="rounded-eos-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-eos-text">
          Brandingul este disponibil, dar persistă momentan pe fallback local. Nu îl trata ca
          sursă finală până când traseul Supabase nu revine la `synced`.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Partner name */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-eos-text-muted">Nume partener</label>
          <input
            type="text"
            value={config.partnerName}
            onChange={(e) => setConfig((c) => ({ ...c, partnerName: e.target.value }))}
            placeholder="Ex: Consultanță Fiscal SRL"
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-primary focus:outline-none"
          />
        </div>

        {/* Tagline */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-eos-text-muted">Tagline (opțional)</label>
          <input
            type="text"
            value={config.tagline ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value || null }))}
            placeholder="Ex: Conformitate fără efort"
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-primary focus:outline-none"
          />
        </div>

        {/* Logo URL */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-eos-text-muted">URL logo (opțional)</label>
          <input
            type="url"
            value={config.logoUrl ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, logoUrl: e.target.value || null }))}
            placeholder="https://firma.ro/logo.png"
            className="w-full rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-primary focus:outline-none"
          />
        </div>

        {/* Brand color */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-eos-text-muted">Culoare brand</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={config.brandColor}
              onChange={(e) => setConfig((c) => ({ ...c, brandColor: e.target.value }))}
              className="size-9 shrink-0 cursor-pointer rounded-eos-md border border-eos-border bg-eos-surface-active p-0.5"
            />
            <input
              type="text"
              value={config.brandColor}
              onChange={(e) => {
                const v = e.target.value
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setConfig((c) => ({ ...c, brandColor: v }))
              }}
              maxLength={7}
              className="w-28 rounded-eos-md border border-eos-border bg-eos-surface-active px-3 py-2 text-sm font-mono text-eos-text focus:border-eos-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="overflow-hidden rounded-eos-xl border border-eos-border">
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{ backgroundColor: previewColor + "18", borderBottom: `2px solid ${previewColor}` }}
        >
          {config.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.logoUrl} alt="logo" className="h-6 w-auto object-contain" />
          ) : (
            <div
              className="flex size-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
              style={{ backgroundColor: previewColor }}
            >
              {(config.partnerName || "P").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-eos-text">
              {config.partnerName || "Numele partenerului"}
            </p>
            {config.tagline && (
              <p className="text-[11px] text-eos-text-tertiary">{config.tagline}</p>
            )}
          </div>
          <span
            className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ backgroundColor: previewColor }}
          >
            Raport conformitate
          </span>
        </div>
        <div className="bg-eos-surface px-5 py-3 text-xs text-eos-text-tertiary">
          Preview header raport · Aplicat la exporturi și audit pack-uri
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : saved ? (
            <Check className="size-4" />
          ) : (
            <Paintbrush className="size-4" />
          )}
          {saved ? "Salvat!" : "Salvează branding"}
        </button>
      </div>
    </div>
  )
}

// ── Scheduled Reports Section ─────────────────────────────────────────────────

function ScheduledReportsSection() {
  const [reports, setReports] = useState<ScheduledReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({
    reportType: "compliance_summary" as ScheduledReportType,
    frequency: "monthly" as ScheduledReportFrequency,
    recipientEmails: "",
    requiresApproval: true,
  })

  useEffect(() => {
    fetch("/api/reports/scheduled", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { reports?: ScheduledReport[] }) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    const emails = form.recipientEmails
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean)
    if (!emails.length) {
      toast.error("Adaugă cel puțin un email destinatar.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/reports/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: form.reportType,
          frequency: form.frequency,
          clientOrgIds: ["all"], // all portfolio clients
          recipientEmails: emails,
          requiresApproval: form.requiresApproval,
        }),
      })
      const data = (await res.json()) as { report?: ScheduledReport; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      if (data.report) setReports((prev) => [data.report!, ...prev])
      setShowForm(false)
      setForm({ reportType: "compliance_summary", frequency: "monthly", recipientEmails: "", requiresApproval: true })
      toast.success("Raport programat creat.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleEnabled(report: ScheduledReport) {
    try {
      const res = await fetch(`/api/reports/scheduled/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !report.enabled }),
      })
      const data = (await res.json()) as { report?: ScheduledReport }
      if (!res.ok) throw new Error("Eroare la actualizare.")
      if (data.report) setReports((prev) => prev.map((r) => (r.id === report.id ? data.report! : r)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la actualizare.")
    }
  }

  async function handleDelete(reportId: string) {
    setDeleting(reportId)
    try {
      const res = await fetch(`/api/reports/scheduled/${reportId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Eroare la ștergere.")
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.success("Raport șters.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la ștergere.")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-4 text-sm text-eos-text-muted"><Loader2 className="size-4 animate-spin" /> Se încarcă...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-eos-text">Rapoarte programate</h2>
          <p className="mt-0.5 text-xs text-eos-text-muted">Configurează trimiterea automată de rapoarte periodic.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" /> Raport nou
        </Button>
      </div>

      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Tip raport</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.reportType}
                  onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value as ScheduledReportType }))}
                >
                  {(Object.entries(REPORT_TYPE_LABELS) as [ScheduledReportType, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-eos-text">Frecvență</span>
                <select
                  className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.frequency}
                  onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as ScheduledReportFrequency }))}
                >
                  {(Object.entries(FREQUENCY_LABELS) as [ScheduledReportFrequency, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-eos-text">Destinatari email (separați prin virgulă)</span>
              <input
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                placeholder="partner@firma.ro, client@client.ro"
                value={form.recipientEmails}
                onChange={(e) => setForm((f) => ({ ...f, recipientEmails: e.target.value }))}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-eos-text">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm((f) => ({ ...f, requiresApproval: e.target.checked }))}
                className="size-4 rounded border-eos-border accent-eos-primary"
              />
              <span>Necesită aprobare înainte de trimitere</span>
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anulează</Button>
              <Button size="sm" disabled={creating} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Creează
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reports.length === 0 ? (
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-4 py-6 text-center text-sm text-eos-text-muted">
          <Calendar className="mx-auto mb-2 size-6 text-eos-text-tertiary" strokeWidth={1.5} />
          Niciun raport programat. Creează primul raport pentru a trimite periodic la clienți.
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Card key={r.id} className={`border-eos-border bg-eos-surface ${!r.enabled ? "opacity-60" : ""}`}>
              <CardContent className="flex flex-wrap items-center gap-3 py-3 px-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{REPORT_TYPE_LABELS[r.reportType]}</p>
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                      {FREQUENCY_LABELS[r.frequency]}
                    </Badge>
                    {r.requiresApproval && (
                      <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                        cu aprobare
                      </Badge>
                    )}
                    {!r.enabled && (
                      <Badge variant="outline" className="text-[10px] normal-case tracking-normal text-eos-text-muted">
                        dezactivat
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-eos-text-muted">
                    {r.recipientEmails.join(", ")}
                  </p>
                  {r.nextRunAt && (
                    <p className="text-xs text-eos-text-muted">
                      Următorul: {new Date(r.nextRunAt).toLocaleDateString("ro-RO")}
                      {r.lastRunAt && <> · Ultimul: {new Date(r.lastRunAt).toLocaleDateString("ro-RO")}</>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleEnabled(r)}
                    className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-2.5 py-1 text-xs text-eos-text-muted hover:text-eos-text"
                  >
                    {r.enabled ? "Dezactivează" : "Activează"}
                  </button>
                  <button
                    type="button"
                    disabled={deleting === r.id}
                    onClick={() => void handleDelete(r.id)}
                    className="rounded-eos-md p-1.5 text-eos-text-tertiary hover:bg-eos-error-soft hover:text-eos-error disabled:opacity-50"
                  >
                    {deleting === r.id
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Trash2 className="size-3.5" />}
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function PortfolioReportsPage() {
  const [reports, setReports] = useState<PortfolioReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/portfolio/reports", { cache: "no-store" })
        if (!response.ok) throw new Error("Nu am putut încărca metadata de raportare.")
        const data = (await response.json()) as { reports: PortfolioReportRow[] }
        setReports(data.reports)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Rapoarte și livrabile"
        description="Metadata agregată pentru rapoarte, documente generate și ultima activitate pe fiecare firmă."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            {reports.length} firme în raportare
          </Badge>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState
              title="Nu există metadate de raportare"
              label="Generează documente sau rapoarte în firmele din portofoliu pentru a vedea aici activitatea."
              icon={FolderOpen}
              className="px-5 py-10"
            />
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.orgId} className="border-eos-border bg-eos-surface px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-eos-text">{report.orgName}</p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Scor: {report.score !== null ? `${report.score}%` : "fără date"} · {report.openAlerts} alerte
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {report.generatedDocumentsCount} livrabile
                </Badge>
              </div>

              <div className="mt-4 space-y-2 text-xs text-eos-text-muted">
                <p>Ultimul document: {report.latestGeneratedTitle ?? "niciun document generat"}</p>
                <p>Ultima generare: {report.latestGeneratedAtISO ? new Date(report.latestGeneratedAtISO).toLocaleDateString("ro-RO") : "—"}</p>
                <p>Ultima scanare: {report.lastScanAtISO ? new Date(report.lastScanAtISO).toLocaleDateString("ro-RO") : "—"}</p>
                <p>Documente scanate: {report.scannedDocuments}</p>
              </div>

              <div className="mt-4">
                <PortfolioOrgActionButton
                  orgId={report.orgId}
                  destination="/dashboard/reports"
                  label="Deschide rapoartele"
                  variant="outline"
                />
              </div>
            </Card>
          ))
        )}
      </div>

      {/* ── White-label branding ── */}
      <div className="rounded-eos-xl border border-eos-border bg-eos-surface p-5">
        <WhiteLabelSection />
      </div>

      {/* ── Scheduled Reports ── */}
      <div className="rounded-eos-xl border border-eos-border bg-eos-surface p-5">
        <ScheduledReportsSection />
      </div>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <FileSearch className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Metadata cross-client, nu exporturi brute</span>
        </div>
        <p className="mt-1">
          În Wave 2 arătăm ce există și ce lipsește pe fiecare firmă. Exporturile și livrabilele concrete rămân în contextul per-firmă.
        </p>
      </div>
    </div>
  )
}
