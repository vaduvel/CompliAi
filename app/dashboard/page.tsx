"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { AccumulationCard } from "@/components/compliscan/dashboard/accumulation-card"
import { NextBestAction } from "@/components/compliscan/next-best-action"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { SiteScanCard } from "@/components/compliscan/site-scan-card"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { APPLICABILITY_TAG_LABELS } from "@/lib/compliance/applicability"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type {
  ComplianceDriftRecord,
  ComplianceEvent,
  GeneratedDocumentRecord,
} from "@/lib/compliance/types"
import { buildExternalFeedItems, buildProactiveSystemChecks } from "@/lib/compliscan/feed-sources"
import type { AppNotification } from "@/lib/server/notifications-store"

type ActivityFeedItem = {
  id: string
  eyebrow: string
  title: string
  detail: string
  dateISO: string
  tone: "default" | "success" | "warning"
  href?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cockpit = useCockpitData()
  const [highlightAccumulation, setHighlightAccumulation] = useState(false)
  const [externalNotifications, setExternalNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    fetch("/api/notifications", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { notifications?: AppNotification[] } | null) => {
        if (data?.notifications) setExternalNotifications(data.notifications)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (searchParams.get("focus") !== "accumulation") return

    const scrollToAccumulation = () => {
      const node = document.getElementById("dashboard-accumulation-card")
      if (!node) return false

      node.scrollIntoView({ behavior: "smooth", block: "center" })
      setHighlightAccumulation(true)
      window.setTimeout(() => setHighlightAccumulation(false), 2600)

      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.delete("focus")
      window.history.replaceState(window.history.state, "", nextUrl.toString())
      return true
    }

    if (scrollToAccumulation()) return

    const timeoutId = window.setTimeout(scrollToAccumulation, 450)
    return () => window.clearTimeout(timeoutId)
  }, [searchParams])

  if (cockpit.error && !cockpit.loading) {
    return <ErrorScreen message={cockpit.error} variant="section" />
  }

  if (cockpit.loading || !cockpit.data) {
    return <LoadingScreen variant="section" />
  }

  const { data, activeDrifts, tasks, nextBestAction, openAlerts } = cockpit
  const state = data.state
  const applicability = state.applicability ?? null
  const applicableEntries = (applicability?.entries ?? [])
    .filter((entry) => entry.certainty !== "unlikely")
    .slice(0, 3)
  const openTasks = tasks.filter((task) => task.status !== "done")
  const activeFindings = state.findings.filter((finding) => finding.findingStatus !== "dismissed")
  const missingEvidenceCount = openTasks.filter((task) => !task.attachedEvidence).length
  const hasBaselineEvidence = Boolean(
    state.scans.length > 0 || state.scannedDocuments > 0 || state.validatedBaselineSnapshotId
  )
  const activeRiskCount = openAlerts.length + activeDrifts.length
  const latestSnapshot = state.snapshotHistory[0] ?? null
  const previousSnapshot = state.snapshotHistory[1] ?? null
  const scoreDelta =
    latestSnapshot && previousSnapshot
      ? latestSnapshot.summary.complianceScore - previousSnapshot.summary.complianceScore
      : null
  const firstSnapshotSignals = [
    `${activeFindings.length} cazuri active sau confirmate`,
    state.siteScan
      ? `${state.siteScan.findingCount} semnale detectate pe website`
      : state.orgProfile?.website
        ? "Website adăugat, dar fără snapshot de scan încă"
        : "Fără website în profilul firmei",
    state.generatedDocuments.length > 0
      ? `${state.generatedDocuments.length} documente sau artefacte deja în lucru`
      : "Nicio dovadă sau document pregătit încă",
  ]

  const internalFeedItems = buildActivityFeedItems({
    events: state.events,
    activeDrifts,
    generatedDocuments: state.generatedDocuments,
  })
  const externalFeedItems = buildExternalFeedItems(externalNotifications, state)
  const systemCheckItems = buildProactiveSystemChecks(state, data.summary.score, data.summary.redAlerts)
  const activityFeedItems = [
    ...internalFeedItems,
    ...externalFeedItems.map((item) => ({
      id: item.id,
      eyebrow: item.eyebrow,
      title: item.title,
      detail: item.detail,
      dateISO: item.dateISO,
      tone: item.tone,
      href: item.href,
    })),
    ...systemCheckItems.map((item) => ({
      id: item.id,
      eyebrow: item.eyebrow,
      title: item.title,
      detail: item.detail,
      dateISO: item.dateISO,
      tone: item.tone,
      href: item.href,
    })),
  ]
    .sort((left, right) => right.dateISO.localeCompare(left.dateISO))
    .slice(0, 3)

  const auditStatusLabel =
    data.summary.score >= 90
      ? "Pregătit"
      : activeDrifts.some((drift) => drift.blocksAudit)
        ? "Blocat"
        : missingEvidenceCount > 0
          ? "Dovezi slabe"
          : data.summary.score >= 60
            ? "În progres"
            : "Neînceput"

  return (
    <div className="space-y-5 pb-20 sm:space-y-8 sm:pb-0" role="main" aria-labelledby="dashboard-title">
      <PageIntro
        eyebrow="Snapshot"
        title="Starea firmei tale acum"
        description="Asta ți se aplică, asta am găsit deja și asta faci acum. Restul de instrumente stau dedesubt, nu în fața deciziei."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Readiness global: {data.summary.score}%
            </Badge>
            <Badge
              dot
              variant={activeDrifts.length > 0 ? "destructive" : "success"}
              className="normal-case tracking-normal"
            >
              {activeDrifts.length > 0 ? `${activeDrifts.length} drift-uri active` : "Control stabil"}
            </Badge>
          </>
        }
      />

      {state.orgProfile ? (
        <>
          <section aria-label="Primul snapshot">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.2fr)]">
              <SnapshotFocusCard
                title="Ce ți se aplică"
                subtitle="Framework-urile care contează deja pentru firma ta"
                items={
                  applicableEntries.length > 0
                    ? applicableEntries.map((entry) => ({
                        label: APPLICABILITY_TAG_LABELS[entry.tag],
                        detail: entry.reason,
                      }))
                    : [
                        {
                          label: "Maparea este în curs",
                          detail:
                            "Compli completează obligațiile aplicabile imediat ce profilul și sursele sunt suficient de clare.",
                        },
                      ]
                }
              />
              <SnapshotFocusCard
                title="Ce am găsit deja"
                subtitle="Semnale și constatări pregătite înainte să intri în cockpit"
                items={firstSnapshotSignals.map((signal) => ({ label: signal }))}
              />
              <NextBestAction
                task={nextBestAction}
                additionalTasks={[]}
                onResolve={() => router.push(dashboardRoutes.resolve)}
                onResolveTask={(taskId) => router.push(`${dashboardRoutes.resolve}?taskId=${taskId}`)}
                hasEvidence={hasBaselineEvidence}
                activeRiskCount={activeRiskCount}
              />
            </div>
          </section>

          <section aria-label="Sumar rapid de conformitate">
            <div className="grid grid-cols-2 divide-x divide-y divide-eos-border-subtle overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface sm:grid-cols-4 sm:divide-y-0">
              <SummaryMetric
                label="Readiness globală"
                value={`${data.summary.score}%`}
                trend={
                  scoreDelta !== null
                    ? {
                        delta: scoreDelta,
                        label: "p",
                      }
                    : undefined
                }
              />
              <SummaryMetric
                label="Cazuri active"
                value={String(activeFindings.length)}
                alert={activeFindings.length > 0}
              />
              <SummaryMetric
                label="Drift activ"
                value={String(activeDrifts.length)}
                alert={activeDrifts.length > 0}
              />
              <SummaryMetric
                label="Stare audit"
                value={auditStatusLabel}
                alert={auditStatusLabel !== "Pregătit"}
              />
            </div>
          </section>

          <section aria-label="Activitate recentă">
            <ActivityMonitorCard items={activityFeedItems} />
          </section>

          <details className="group">
            <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-3.5 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
              <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
              Instrumente secundare
              <span className="ml-auto text-xs text-eos-text-muted">
                Scanare, valoare acumulată și rute dedicate
              </span>
            </summary>
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <section
                id="dashboard-accumulation-card"
                aria-label="Valoare acumulată"
                className={`scroll-mt-24 rounded-eos-xl transition-all duration-500 ${
                  highlightAccumulation
                    ? "ring-2 ring-eos-primary/45 ring-offset-2 ring-offset-eos-bg"
                    : ""
                }`}
              >
                <AccumulationCard />
              </section>
              <div className="space-y-4">
                <SiteScanCard
                  existingScan={state.siteScan ?? null}
                  defaultUrl={state.orgProfile?.website ?? undefined}
                />
                <Card className="border-eos-border bg-eos-surface">
                  <div className="px-5 py-4">
                    <p className="text-sm font-semibold text-eos-text">Suprafețe dedicate</p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      Instrumentele grele rămân în paginile lor dedicate, nu pe Home.
                    </p>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <Link
                        href={dashboardRoutes.fiscal}
                        className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:bg-eos-surface-variant"
                      >
                        Fiscal
                      </Link>
                      <Link
                        href={dashboardRoutes.nis2}
                        className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:bg-eos-surface-variant"
                      >
                        NIS2
                      </Link>
                      <Link
                        href={dashboardRoutes.dosar}
                        className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:bg-eos-surface-variant"
                      >
                        Dosar
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </details>
        </>
      ) : (
        <section aria-label="Bun venit">
          <Card className="border-eos-primary/30 bg-eos-primary/5">
            <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <span className="text-3xl leading-none">👋</span>
                <div>
                  <p className="text-base font-semibold text-eos-text">Bun venit în CompliAI!</p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Completează profilul firmei în 2 minute — primești imediat o analiză de conformitate personalizată: ce legi se aplică, ce documente ai nevoie și ce riscuri există.
                  </p>
                  <p className="mt-2 text-xs text-eos-text-tertiary">
                    GDPR · NIS2 · EU AI Act · e-Factura — toate calculate pentru firma ta.
                  </p>
                </div>
              </div>
              <Link
                href="/onboarding"
                className="inline-flex shrink-0 items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-eos-primary/90"
              >
                Începe analiza gratuită
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

function SnapshotFocusCard({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: { label: string; detail?: string }[]
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <div className="border-b border-eos-border-subtle px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
          Primul snapshot
        </p>
        <p className="mt-2 text-base font-semibold text-eos-text">{title}</p>
        <p className="mt-1 text-sm text-eos-text-muted">{subtitle}</p>
      </div>
      <div className="space-y-3 px-5 py-4">
        {items.map((item) => (
          <div
            key={`${title}-${item.label}`}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3"
          >
            <p className="text-sm font-medium text-eos-text">{item.label}</p>
            {item.detail ? (
              <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{item.detail}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}

function SummaryMetric({
  label,
  value,
  alert = false,
  trend,
}: {
  label: string
  value: string
  alert?: boolean
  trend?: { delta: number; label: string }
}) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-lg font-semibold ${alert ? "text-eos-warning" : "text-eos-text"}`}>
          {value}
        </span>
        {trend && trend.delta !== 0 ? (
          <span
            className={`text-[11px] font-medium ${
              trend.delta > 0 ? "text-eos-success" : "text-eos-error"
            }`}
          >
            {trend.delta > 0 ? "▲" : "▼"} {Math.abs(trend.delta)}
            {trend.label}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function buildActivityFeedItems({
  events,
  activeDrifts,
  generatedDocuments,
}: {
  events: ComplianceEvent[]
  activeDrifts: ComplianceDriftRecord[]
  generatedDocuments: GeneratedDocumentRecord[]
}) {
  const items: ActivityFeedItem[] = []
  const now = Date.now()

  for (const doc of generatedDocuments) {
    if (doc.approvalStatus !== "approved_as_evidence") continue

    items.push({
      id: `doc-saved-${doc.id}`,
      eyebrow: "Ți-am salvat",
      title: `${doc.title} este în dosar`,
      detail:
        doc.approvedByEmail
          ? `Aprobat de ${doc.approvedByEmail} și păstrat în Vault pentru audit și handoff.`
          : "Documentul aprobat rămâne în Vault pentru audit și handoff.",
      dateISO: doc.approvedAtISO ?? doc.generatedAtISO,
      tone: "success",
      href: dashboardRoutes.auditorVault,
    })

    if (doc.nextReviewDateISO) {
      const reviewAt = new Date(doc.nextReviewDateISO).getTime()
      const withinWindow = Number.isFinite(reviewAt) && reviewAt - now <= 45 * 24 * 60 * 60 * 1000

      if (withinWindow) {
        items.push({
          id: `doc-review-${doc.id}`,
          eyebrow: "Urmează reverificare",
          title: `${doc.title} cere review`,
          detail: `Review recomandat la ${new Date(doc.nextReviewDateISO).toLocaleDateString("ro-RO")}. Dacă apare drift, finding-ul se poate redeschide pe aceeași urmă.`,
          dateISO: doc.nextReviewDateISO,
          tone: "warning",
          href: dashboardRoutes.auditorVault,
        })
      }
    }
  }

  for (const drift of activeDrifts.slice(0, 4)) {
    items.push({
      id: `drift-${drift.id}`,
      eyebrow: "Am detectat",
      title: drift.summary,
      detail: drift.nextAction ?? drift.impactSummary ?? "Verifică schimbarea și decide dacă revine în execuție.",
      dateISO: drift.detectedAtISO,
      tone: drift.severity === "critical" || drift.severity === "high" ? "warning" : "default",
      href: dashboardRoutes.drifts,
    })
  }

  for (const event of events.slice(0, 8)) {
    const eyebrow =
      event.entityType === "drift"
        ? "Am verificat"
        : event.entityType === "task"
          ? "Am validat"
          : event.entityType === "finding"
            ? "Am actualizat"
            : "Activitate"

    const href =
      event.entityType === "drift"
        ? dashboardRoutes.drifts
        : event.entityType === "task" || event.entityType === "finding"
          ? dashboardRoutes.resolve
          : dashboardRoutes.dosar

    items.push({
      id: `event-${event.id}`,
      eyebrow,
      title: event.message,
      detail:
        event.actorLabel
          ? `${event.actorLabel}${event.actorRole ? ` · ${event.actorRole}` : ""}`
          : "Activitate salvată în logul operațional.",
      dateISO: event.createdAtISO,
      tone:
        event.entityType === "drift"
          ? "warning"
          : event.type.includes("validated") || event.type.includes("evidence")
            ? "success"
            : "default",
      href,
    })
  }

  return items
    .sort((left, right) => right.dateISO.localeCompare(left.dateISO))
    .slice(0, 6)
}

function ActivityMonitorCard({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-eos-text">Ce s-a mișcat recent</p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Doar ultimele 3 lucruri care contează acum: ce am verificat, ce a intrat la dosar și ce urmează să reverificăm.
            </p>
          </div>
          <Link
            href={dashboardRoutes.auditLog}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
          >
            Audit log
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-4 text-sm text-eos-text-muted">
            Monitorizarea este activă. Primele verificări, dovezi salvate și reverificări vor apărea aici.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const toneClass =
                item.tone === "success"
                  ? "bg-eos-success"
                  : item.tone === "warning"
                    ? "bg-eos-warning"
                    : "bg-eos-primary"

              const body = (
                <div className="flex items-start gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3 transition-colors hover:bg-eos-surface-variant">
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${toneClass}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                        {item.eyebrow}
                      </p>
                      <span className="text-[11px] text-eos-text-muted">
                        {new Date(item.dateISO).toLocaleString("ro-RO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-eos-text">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{item.detail}</p>
                  </div>
                  {item.href ? (
                    <ArrowRight className="mt-1 size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  ) : null}
                </div>
              )

              return item.href ? (
                <Link key={item.id} href={item.href} className="block">
                  {body}
                </Link>
              ) : (
                <div key={item.id}>{body}</div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
