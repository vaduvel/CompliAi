"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Building2,
  CheckCircle2,
  FileText,
  Filter,
  Inbox as InboxIcon,
  MailOpen,
  RefreshCw,
  Scale,
  ShieldAlert,
  ThumbsDown,
  X,
} from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import { Checkbox } from "@/components/evidence-os/Checkbox"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { InboxItem } from "@/app/api/portfolio/inbox/route"

type BatchAction = "dismiss_finding" | "confirm_finding" | "mark_notification_read"
type BatchFeedback = {
  tone: "success" | "error"
  message: string
} | null

type InboxResponse = {
  items: InboxItem[]
  total: number
  critical: number
  unread: number
  firmsAffected: number
  firms: { orgId: string; orgName: string }[]
  frameworks: string[]
}

type SeverityFilter = "all" | "critical-high" | "unread"
type SourceFilter = "all" | "alert" | "notification"

const severityVariant = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
  info: "outline",
} as const

const severityLabel: Record<InboxItem["severity"], string> = {
  critical: "Critic",
  high: "Ridicat",
  medium: "Mediu",
  low: "Scăzut",
  info: "Info",
}

const iconForSource = (item: InboxItem) => {
  if (item.source === "alert") return AlertTriangle
  switch (item.notificationType) {
    case "drift_detected":
      return AlertCircle
    case "incident_deadline":
    case "anaf_deadline":
    case "fiscal_alert":
      return ShieldAlert
    case "finding_new":
      return AlertTriangle
    case "document_generated":
      return FileText
    case "vendor_risk":
      return Scale
    case "anaf_signal":
      return Bell
    default:
      return Bell
  }
}

function groupByDay(items: InboxItem[]): { label: string; items: InboxItem[] }[] {
  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const today: InboxItem[] = []
  const yesterday: InboxItem[] = []
  const thisWeek: InboxItem[] = []
  const earlier: InboxItem[] = []

  for (const item of items) {
    const age = now - new Date(item.createdAt).getTime()
    if (age < DAY) today.push(item)
    else if (age < 2 * DAY) yesterday.push(item)
    else if (age < 7 * DAY) thisWeek.push(item)
    else earlier.push(item)
  }

  const groups: { label: string; items: InboxItem[] }[] = []
  if (today.length) groups.push({ label: "Azi", items: today })
  if (yesterday.length) groups.push({ label: "Ieri", items: yesterday })
  if (thisWeek.length) groups.push({ label: "Săptămâna asta", items: thisWeek })
  if (earlier.length) groups.push({ label: "Mai vechi", items: earlier })
  return groups
}

function actionLabelForDestination(destination?: string) {
  if (!destination || destination === "/dashboard") return "Intră în firmă"
  if (destination.startsWith("/dashboard/resolve")) return "Deschide finding"
  if (destination.startsWith("/dashboard/fiscal")) return "Deschide fiscal"
  if (destination.startsWith("/dashboard/nis2")) return "Deschide NIS2"
  if (destination.startsWith("/dashboard/vendor-review")) return "Deschide registrul"
  if (destination.startsWith("/dashboard/dosar") || destination.startsWith("/dashboard/reports")) return "Vezi cazul"
  return "Vezi contextul"
}

export function PortfolioAlertsPage() {
  const [data, setData] = useState<InboxResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [firmFilter, setFirmFilter] = useState<string>("all")
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all")

  // Bulk selection (Faza 4)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchBusy, setBatchBusy] = useState(false)
  const [batchFeedback, setBatchFeedback] = useState<BatchFeedback>(null)

  async function fetchInbox(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const response = await fetch("/api/portfolio/inbox", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut încărca inbox-ul portofoliu.")
      const payload = (await response.json()) as InboxResponse
      setData(payload)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void fetchInbox()
  }, [])

  const filteredItems = useMemo(() => {
    if (!data) return []
    return data.items.filter((item) => {
      if (severityFilter === "critical-high" && item.severity !== "critical" && item.severity !== "high") {
        return false
      }
      if (severityFilter === "unread" && item.unread !== true) {
        return false
      }
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false
      }
      if (firmFilter !== "all" && item.orgId !== firmFilter) {
        return false
      }
      if (frameworkFilter !== "all" && item.framework !== frameworkFilter) {
        return false
      }
      return true
    })
  }, [data, severityFilter, sourceFilter, firmFilter, frameworkFilter])

  const grouped = useMemo(() => groupByDay(filteredItems), [filteredItems])

  // Drop stale selections when filters or data change.
  useEffect(() => {
    const visibleIds = new Set(filteredItems.map((i) => i.id))
    setSelectedIds((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (visibleIds.has(id)) next.add(id)
        else changed = true
      }
      return changed ? next : prev
    })
  }, [filteredItems])

  const selectedItems = useMemo(
    () => filteredItems.filter((i) => selectedIds.has(i.id)),
    [filteredItems, selectedIds]
  )
  const findingCandidateCount = selectedItems.filter((i) => !!i.findingId).length
  const notificationCandidateCount = selectedItems.filter(
    (i) => i.source === "notification" && !!i.notificationId
  ).length

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllVisible() {
    if (selectedIds.size >= filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)))
    }
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function runBatch(action: BatchAction) {
    if (batchBusy || selectedItems.length === 0) return
    type BatchPayloadItem = { orgId: string; findingId?: string; notificationId?: string }
    const payloadItems: BatchPayloadItem[] = []
    for (const i of selectedItems) {
      if (action === "mark_notification_read") {
        if (i.source === "notification" && i.notificationId) {
          payloadItems.push({ orgId: i.orgId, notificationId: i.notificationId })
        }
      } else if (i.findingId) {
        payloadItems.push({ orgId: i.orgId, findingId: i.findingId })
      }
    }

    if (payloadItems.length === 0) {
      setBatchFeedback({
        tone: "error",
        message: "Niciun item selectat nu suportă acțiunea aleasă.",
      })
      return
    }

    setBatchBusy(true)
    setBatchFeedback(null)
    try {
      const response = await fetch("/api/portfolio/findings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, items: payloadItems }),
      })
      const payload = (await response.json().catch(() => ({}))) as {
        successCount?: number
        failedCount?: number
        skippedCount?: number
        message?: string
      }
      if (!response.ok) {
        setBatchFeedback({
          tone: "error",
          message: payload.message ?? "Batch-ul a eșuat.",
        })
        return
      }
      const parts = [
        payload.successCount ? `${payload.successCount} aplicate` : null,
        payload.skippedCount ? `${payload.skippedCount} sărite` : null,
        payload.failedCount ? `${payload.failedCount} eșuate` : null,
      ].filter(Boolean)
      setBatchFeedback({
        tone: (payload.failedCount ?? 0) > 0 ? "error" : "success",
        message: parts.join(" · ") || payload.message || "Batch procesat.",
      })
      clearSelection()
      await fetchInbox(true)
    } catch (err) {
      setBatchFeedback({
        tone: "error",
        message: err instanceof Error ? err.message : "Eroare la batch.",
      })
    } finally {
      setBatchBusy(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />
  if (!data) return null

  const hasActiveFilter =
    severityFilter !== "all" ||
    sourceFilter !== "all" ||
    firmFilter !== "all" ||
    frameworkFilter !== "all"

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Inbox — alerte și notificări cross-client"
        description="Un singur feed cu tot ce apare peste noapte pe toate firmele tale. Drift, alerte, noi legi, schimbări status ANAF — toate într-un singur loc."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {data.total} itemi total
            </Badge>
            {data.critical > 0 ? (
              <Badge variant="destructive" dot className="normal-case tracking-normal">
                {data.critical} critice / ridicate
              </Badge>
            ) : null}
            {data.unread > 0 ? (
              <Badge variant="secondary" className="normal-case tracking-normal">
                {data.unread} necitite
              </Badge>
            ) : null}
          </>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Total</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">{data.total}</p>
        </Card>
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Critice</p>
          <p className="mt-2 text-2xl font-semibold text-eos-error">{data.critical}</p>
        </Card>
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Necitite</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">{data.unread}</p>
        </Card>
        <Card className="border-eos-border bg-eos-surface px-5 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-eos-text-muted">Firme afectate</p>
          <p className="mt-2 text-2xl font-semibold text-eos-text">
            {data.firmsAffected} <span className="text-sm text-eos-text-muted">/ {data.firms.length}</span>
          </p>
        </Card>
      </div>

      {/* Filter bar */}
      <Card className="border-eos-border bg-eos-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-eos-text-muted">
            <Filter className="size-3.5" strokeWidth={2} />
            <span>Filtre</span>
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="h-8 rounded-eos-md border border-eos-border bg-eos-surface-active px-2.5 text-xs text-eos-text-muted focus:outline-none"
          >
            <option value="all">Toate severitățile</option>
            <option value="critical-high">Doar critice/ridicate</option>
            <option value="unread">Doar necitite</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
            className="h-8 rounded-eos-md border border-eos-border bg-eos-surface-active px-2.5 text-xs text-eos-text-muted focus:outline-none"
          >
            <option value="all">Toate sursele</option>
            <option value="alert">Doar alerte</option>
            <option value="notification">Doar notificări</option>
          </select>

          <select
            value={firmFilter}
            onChange={(e) => setFirmFilter(e.target.value)}
            className="h-8 rounded-eos-md border border-eos-border bg-eos-surface-active px-2.5 text-xs text-eos-text-muted focus:outline-none"
          >
            <option value="all">Toate firmele</option>
            {data.firms.map((f) => (
              <option key={f.orgId} value={f.orgId}>
                {f.orgName}
              </option>
            ))}
          </select>

          {data.frameworks.length > 0 ? (
            <select
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value)}
              className="h-8 rounded-eos-md border border-eos-border bg-eos-surface-active px-2.5 text-xs text-eos-text-muted focus:outline-none"
            >
              <option value="all">Toate framework-urile</option>
              {data.frameworks.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : null}

          {hasActiveFilter ? (
            <button
              type="button"
              onClick={() => {
                setSeverityFilter("all")
                setSourceFilter("all")
                setFirmFilter("all")
                setFrameworkFilter("all")
              }}
              className="h-8 rounded-eos-md px-2.5 text-xs font-medium text-eos-text-muted transition hover:bg-eos-surface-active hover:text-eos-text"
            >
              Șterge filtre
            </button>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-eos-text-tertiary">
              {filteredItems.length} din {data.total}
            </span>
            <button
              type="button"
              onClick={() => void fetchInbox(true)}
              disabled={refreshing}
              className="flex h-8 items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-active px-2.5 text-xs font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:opacity-40"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2} />
              {refreshing ? "Se actualizează..." : "Actualizează"}
            </button>
          </div>
        </div>
      </Card>

      {/* Bulk action bar — Faza 4 */}
      {selectedItems.length > 0 ? (
        <Card className="sticky top-2 z-10 border-eos-primary/40 bg-eos-primary-soft/40 px-4 py-3 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  filteredItems.length > 0 && selectedItems.length === filteredItems.length
                    ? true
                    : selectedItems.length > 0
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={() => toggleSelectAllVisible()}
                aria-label="Selectează tot ce e vizibil"
              />
              <span className="text-sm font-medium text-eos-text">
                {selectedItems.length} selectate
              </span>
              <span className="text-xs text-eos-text-muted">
                ({findingCandidateCount} findings · {notificationCandidateCount} notificări)
              </span>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={batchBusy || findingCandidateCount === 0}
                onClick={() => void runBatch("confirm_finding")}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                Confirmă {findingCandidateCount > 0 ? `(${findingCandidateCount})` : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={batchBusy || findingCandidateCount === 0}
                onClick={() => void runBatch("dismiss_finding")}
                className="gap-1.5"
              >
                <ThumbsDown className="size-3.5" strokeWidth={2} />
                Respinge {findingCandidateCount > 0 ? `(${findingCandidateCount})` : ""}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={batchBusy || notificationCandidateCount === 0}
                onClick={() => void runBatch("mark_notification_read")}
                className="gap-1.5"
              >
                <MailOpen className="size-3.5" strokeWidth={2} />
                Marchează citite {notificationCandidateCount > 0 ? `(${notificationCandidateCount})` : ""}
              </Button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={batchBusy}
                className="flex h-8 items-center gap-1 rounded-eos-md px-2 text-xs font-medium text-eos-text-muted transition hover:bg-eos-surface-active hover:text-eos-text disabled:opacity-40"
              >
                <X className="size-3.5" strokeWidth={2} />
                Deselectează
              </button>
            </div>
          </div>
          {batchFeedback ? (
            <p
              className={`mt-2 text-xs ${
                batchFeedback.tone === "success" ? "text-eos-success" : "text-eos-error"
              }`}
            >
              {batchFeedback.message}
            </p>
          ) : null}
        </Card>
      ) : batchFeedback ? (
        <Card
          className={`border-eos-border bg-eos-surface px-4 py-3 ${
            batchFeedback.tone === "success" ? "text-eos-success" : "text-eos-error"
          }`}
        >
          <p className="text-sm">{batchFeedback.message}</p>
        </Card>
      ) : null}

      {/* Feed grouped by day */}
      {filteredItems.length === 0 ? (
        <Card className="overflow-hidden border-eos-border bg-eos-surface">
          <EmptyState
            title={data.total === 0 ? "Inbox curat" : "Niciun item pentru filtrele selectate"}
            label={
              data.total === 0
                ? "Nu există alerte sau notificări active în portofoliul tău. Watchdog-ul monitorizează continuu."
                : "Modifică sau șterge filtrele ca să vezi mai mulți itemi."
            }
            icon={data.total === 0 ? CheckCircle2 : InboxIcon}
            className="px-5 py-12"
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
                  {group.label}
                </h3>
                <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                  {group.items.length}
                </Badge>
              </div>
              <Card className="overflow-hidden border-eos-border bg-eos-surface">
                <div className="divide-y divide-eos-border-subtle">
                  {group.items.map((item) => {
                    const Icon = iconForSource(item)
                    const isSelected = selectedIds.has(item.id)
                    const canSelect = !!item.findingId || !!item.notificationId
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-wrap items-start gap-3 px-5 py-4 transition-colors ${
                          isSelected
                            ? "bg-eos-primary-soft/40"
                            : item.unread === true
                              ? "bg-eos-primary-soft/20"
                              : ""
                        }`}
                      >
                        <div className="mt-1 shrink-0">
                          {canSelect ? (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(item.id)}
                              aria-label={`Selectează ${item.title}`}
                            />
                          ) : (
                            <div className="h-4 w-4" aria-hidden />
                          )}
                        </div>
                        <div className="mt-0.5 shrink-0">
                          <Icon
                            className={`size-4 ${
                              item.severity === "critical" || item.severity === "high"
                                ? "text-eos-error"
                                : item.severity === "medium"
                                  ? "text-eos-warning"
                                  : "text-eos-text-muted"
                            }`}
                            strokeWidth={1.8}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant={severityVariant[item.severity]}
                              className="text-[10px] normal-case tracking-normal"
                            >
                              {severityLabel[item.severity]}
                            </Badge>
                            {item.framework ? (
                              <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                                {item.framework}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                                {item.source === "alert" ? "Alertă" : item.kind.replace(/_/g, " ")}
                              </Badge>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-eos-text-muted">
                              <Building2 className="size-3" strokeWidth={1.8} />
                              <span>{item.orgName}</span>
                            </div>
                            {item.unread === true ? (
                              <span className="size-1.5 rounded-full bg-eos-primary" aria-label="necitit" />
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-medium text-eos-text">{item.title}</p>
                          {item.message ? (
                            <p className="mt-1 text-xs leading-5 text-eos-text-muted line-clamp-2">
                              {item.message}
                            </p>
                          ) : null}
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-eos-text-tertiary">
                            <span>{new Date(item.createdAt).toLocaleString("ro-RO")}</span>
                            {item.sourceDocument ? <span>· {item.sourceDocument}</span> : null}
                          </div>
                        </div>

                        <PortfolioOrgActionButton
                          orgId={item.orgId}
                          destination={item.linkTo ?? "/dashboard"}
                          label={actionLabelForDestination(item.linkTo)}
                          variant="outline"
                        />
                      </div>
                    )
                  })}
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
