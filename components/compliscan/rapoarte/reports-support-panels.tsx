"use client"

import { ClipboardList, FileCode2, FileSearch } from "lucide-react"

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
  const artifacts = [
    {
      icon: FileSearch,
      title: "Audit Pack PDF",
      detail:
        "Dosar executiv pentru client: sumar, blocaje, sisteme, controale, dovezi, drift si jurnal de validare intr-un format printabil.",
    },
    {
      icon: FileSearch,
      title: "Audit Pack ZIP",
      detail:
        "Pachet complet cu varianta pentru client, JSON-urile structurale, traceability matrix si dovezile agregate disponibile din workspace.",
    },
    {
      icon: FileSearch,
      title: "Raport PDF",
      detail:
        "Rezumat pentru stakeholderi: scor, drift, progres și remediere într-un format ușor de distribuit.",
    },
    {
      icon: FileCode2,
      title: "compliscan.json / yaml",
      detail:
        "Snapshot structurat cu surse, sisteme, findings, drift si sumar. Devine sursa tehnica de adevar pentru comparatii viitoare.",
    },
    {
      icon: ClipboardList,
      title: "Checklist execuție",
      detail:
        "Listă practică pentru închiderea task-urilor și pentru dovezile pe care trebuie să le aduni.",
    },
  ]

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Ce exportă fiecare artefact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {artifacts.map((artifact) => (
          <div
            key={artifact.title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-9 place-items-center rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)]">
                <artifact.icon className="size-4" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">
                  {artifact.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  {artifact.detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RecentDriftCard({
  drifts,
}: {
  drifts: ComplianceDriftRecord[]
}) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border)] pb-5">
        <CardTitle className="text-xl">Drift inclus în snapshot</CardTitle>
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

          return (
            <div
              key={drift.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    {drift.summary}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {formatDriftTypeLabel(drift.type)} · {formatRelativeRomanian(drift.detectedAtISO)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-on-surface-muted)]">
                    {guidance.impactSummary}
                  </p>
                </div>
                <SeverityBadge severity={drift.severity} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
                {breached && <Badge variant="destructive">SLA depășit</Badge>}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    De ce conteaza
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                    {guidance.lawReference}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {guidance.severityReason}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Ce faci acum
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                    {guidance.nextAction}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Dovada
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                    {guidance.evidenceRequired}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Escalare
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-on-surface)]">
                    {drift.escalationOwner || guidance.ownerSuggestion}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {formatDriftEscalationTier(drift.escalationTier || guidance.escalationTier)} · până la{" "}
                    {formatDriftEscalationDeadline(
                      drift.escalationDueAtISO || guidance.escalationDueAtISO
                    )}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">
                    {[
                      drift.blocksAudit ? "blochează auditul" : null,
                      drift.blocksBaseline ? "blochează baseline-ul" : null,
                      drift.requiresHumanApproval ? "cere aprobare umană" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "review operațional recomandat"}
                  </p>
                  {(drift.acknowledgedBy || drift.lastStatusUpdatedAtISO) && (
                    <p className="mt-2 text-xs text-[var(--color-muted)]">
                      {drift.acknowledgedBy ? `Owner: ${drift.acknowledgedBy}` : "Ultima actualizare"} ·{" "}
                      {formatRelativeRomanian(
                        drift.lastStatusUpdatedAtISO || drift.acknowledgedAtISO || drift.detectedAtISO
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
