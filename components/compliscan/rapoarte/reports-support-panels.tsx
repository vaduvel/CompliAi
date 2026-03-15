"use client"

import { ChevronDown, ClipboardList, FileCode2, FileSearch } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { LifecycleBadge } from "@/components/evidence-os/LifecycleBadge"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import {
  formatDriftEscalationDeadline,
  formatDriftEscalationTier,
  formatDriftTypeLabel,
  getDriftPolicyFromRecord,
} from "@/lib/compliance/drift-policy"
import { isDriftSlaBreached } from "@/lib/compliance/drift-lifecycle"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import type { ComplianceDriftRecord } from "@/lib/compliance/types"

function ReportsEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <EmptyState title={title} label={description} className="rounded-2xl" />
}

export function ExportArtifactsCard() {
  const artifactGroups = [
    {
      label: "Livrabil principal",
      description: "Primul export pe care il trimiti in mod normal.",
      items: [
        {
          icon: FileSearch,
          title: "Raport PDF",
          detail: "Rezumat pentru stakeholderi: scor, drift, progres si remediere.",
        },
      ],
    },
    {
      label: "Suport pentru audit",
      description: "Le folosesti cand ai nevoie de review extins sau dosar complet.",
      items: [
        {
          icon: FileSearch,
          title: "Audit Pack PDF",
          detail: "Dosar executiv pentru client, audit sau due diligence.",
        },
        {
          icon: FileSearch,
          title: "Audit Pack ZIP",
          detail: "Pachet complet cu artefacte, traceability si dovezi agregate.",
        },
        {
          icon: ClipboardList,
          title: "Checklist executie",
          detail: "Lista practica pentru inchiderea task-urilor si a dovezilor.",
        },
      ],
    },
    {
      label: "Snapshot tehnic",
      description: "Pentru integrare, comparatie si trasabilitate.",
      items: [
        {
          icon: FileCode2,
          title: "compliscan.json / yaml",
          detail: "Snapshot structurat cu surse, sisteme, findings, drift si sumar.",
        },
      ],
    },
  ]

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Ce exporta fiecare artefact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {artifactGroups.map((group) => (
          <section
            key={group.label}
            className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="border-b border-eos-border pb-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                {group.label}
              </p>
              <p className="mt-2 text-sm text-eos-text-muted">
                {group.description}
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {group.items.map((artifact) => (
                <div key={artifact.title} className="flex items-start gap-3 rounded-xl bg-eos-bg-inset p-3">
                  <span className="grid size-9 place-items-center rounded-2xl border border-eos-border bg-eos-surface text-eos-text">
                    <artifact.icon className="size-4" strokeWidth={2.25} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-eos-text">
                      {artifact.title}
                    </p>
                    <p className="mt-1 text-sm text-eos-text-muted">
                      {artifact.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}

function getDriftSnapshotFlags(drift: ComplianceDriftRecord) {
  return [
    drift.blocksAudit ? "blocheaza auditul" : null,
    drift.blocksBaseline ? "blocheaza baseline-ul" : null,
    drift.requiresHumanApproval ? "cere aprobare umana" : null,
  ].filter(Boolean) as string[]
}

function DriftDetailBlock({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string
  title: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">{eyebrow}</p>
      <p className="mt-2 text-sm font-medium text-eos-text">{title}</p>
      <p className="mt-1 text-xs leading-5 text-eos-text-muted">{detail}</p>
    </div>
  )
}

export function RecentDriftCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Drift inclus in snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {drifts.length === 0 && (
          <ReportsEmptyState
            title="Nu exista drift activ"
            description="Snapshot-ul va iesi curat din acest punct de vedere."
          />
        )}
        {drifts.map((drift) => {
          const guidance = getDriftPolicyFromRecord(drift)
          const breached = isDriftSlaBreached(drift)
          const snapshotFlags = getDriftSnapshotFlags(drift)

          return (
            <div
              key={drift.id}
              className="rounded-2xl border border-eos-border bg-eos-surface-variant p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-eos-text">
                    {drift.summary}
                  </p>
                  <p className="mt-2 text-xs text-eos-text-muted">
                    {formatDriftTypeLabel(drift.type)} · {formatRelativeRomanian(drift.detectedAtISO)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <SeverityBadge severity={drift.severity} />
                  <LifecycleBadge
                    state={
                      (drift.lifecycleStatus ?? "open") as
                        | "open"
                        | "acknowledged"
                        | "in_progress"
                        | "resolved"
                        | "waived"
                    }
                  />
                  {breached ? <Badge variant="destructive">SLA depasit</Badge> : null}
                </div>
              </div>

              <div className="mt-3 grid gap-3 xl:grid-cols-3">
                <DriftDetailBlock
                  eyebrow="Intra in snapshot"
                  title={
                    snapshotFlags.length > 0
                      ? snapshotFlags.join(" · ")
                      : "Ramane vizibil pana la inchidere"
                  }
                  detail="Acest drift apare in snapshot-ul curent cat timp starea lui nu este inchisa."
                />
                <DriftDetailBlock
                  eyebrow="De ce conteaza"
                  title={guidance.lawReference}
                  detail={guidance.impactSummary}
                />
                <DriftDetailBlock
                  eyebrow="Ce urmeaza"
                  title={guidance.nextAction}
                  detail={`Dovada ceruta: ${guidance.evidenceRequired}`}
                />
              </div>

              <details className="mt-3 rounded-2xl border border-eos-border bg-eos-bg-inset p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">
                        Context operational
                      </p>
                      <p className="mt-1 text-sm font-medium text-eos-text">
                        Escalare, owner si update-uri de stare
                      </p>
                    </div>
                    <ChevronDown
                      className="mt-1 size-4 shrink-0 text-eos-text-muted"
                      strokeWidth={2.25}
                    />
                  </div>
                </summary>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <DriftDetailBlock
                    eyebrow="Escalare"
                    title={drift.escalationOwner || guidance.ownerSuggestion}
                    detail={`${formatDriftEscalationTier(
                      drift.escalationTier || guidance.escalationTier
                    )} · pana la ${formatDriftEscalationDeadline(
                      drift.escalationDueAtISO || guidance.escalationDueAtISO
                    )}`}
                  />
                  <DriftDetailBlock
                    eyebrow="Stare"
                    title={
                      drift.acknowledgedBy ? `Owner: ${drift.acknowledgedBy}` : "Ultima actualizare"
                    }
                    detail={formatRelativeRomanian(
                      drift.lastStatusUpdatedAtISO || drift.acknowledgedAtISO || drift.detectedAtISO
                    )}
                  />
                </div>
              </details>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
