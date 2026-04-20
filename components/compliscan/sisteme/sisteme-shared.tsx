"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { AICompliancePackEntry } from "@/lib/compliance/ai-compliance-pack"

// ── Shared types ───────────────────────────────────────────────────────────────

export type ControlPrimaryViewMode = "overview" | "systems" | "drift" | "review"
export type SystemsSubViewMode = "inventory" | "discovery" | "baseline" | "pack"
export type UpdateCompliancePackFieldInput = {
  systemId: string
  field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
  value?: string | null
  action: "save" | "confirm" | "clear"
}

// ── Shared helpers (pure functions) ────────────────────────────────────────────

export function ControlPackageHighlightsCard({
  highlights,
}: {
  highlights: Array<{
    groupKey: string
    groupLabel: string
    systemsCount: number
    highestPriority: "P1" | "P2" | "P3"
    ownerRoute: string
    bundleHint: string
    businessImpact: string
    familyLabels: string[]
  }>
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <CardTitle className="text-xl">Pachete de control dominante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {highlights.length === 0 && (
          <EmptyState
            title="Insuficiente semnale pentru grupuri dominante"
            label="Confirmă mai întâi suficiente sisteme sau completează câmpurile lipsă din pack — vei vedea ce bundle domină pe fiecare categorie."
            className="border-eos-border bg-eos-surface-variant py-8"
          />
        )}
        <div className="grid gap-4 xl:grid-cols-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.groupKey}
              className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-eos-text">{highlight.groupLabel}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      highlight.highestPriority === "P1"
                        ? "destructive"
                        : highlight.highestPriority === "P2"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {highlight.highestPriority}
                  </Badge>
                  <Badge variant="outline">{highlight.systemsCount} sisteme</Badge>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-eos-text-muted">{highlight.businessImpact}</p>
              <p className="mt-3 text-xs text-eos-text-muted">
                <span className="font-medium text-eos-text">Owner route:</span>{" "}
                {highlight.ownerRoute}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                <span className="font-medium text-eos-text">Bundle util:</span>{" "}
                {highlight.bundleHint}
              </p>
              {highlight.familyLabels.length > 0 && (
                <p className="mt-2 text-xs text-eos-text-muted">
                  <span className="font-medium text-eos-text">Familii:</span>{" "}
                  {highlight.familyLabels.join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function buildControlPackageHighlights(entries: AICompliancePackEntry[]) {
  const groups = new Map<
    string,
    {
      groupKey: string
      groupLabel: string
      systems: Set<string>
      highestPriority: "P1" | "P2" | "P3"
      ownerRoute: string
      bundleHint: string
      businessImpact: string
      familyLabels: Set<string>
    }
  >()

  for (const entry of entries) {
    for (const control of entry.compliance.suggestedControls) {
      const groupKey = control.systemGroup ?? "general-operations"
      const current = groups.get(groupKey) ?? {
        groupKey,
        groupLabel: formatSystemGroupLabel(groupKey),
        systems: new Set<string>(),
        highestPriority: control.priority,
        ownerRoute: control.ownerRoute ?? "Owner sistem + responsabil compliance",
        bundleHint:
          control.bundleHint ?? "Bundle recomandat: owner, dovadă operațională și confirmare a controlului.",
        businessImpact:
          control.businessImpact ??
          "Acest grup concentrează controalele care fac sistemele din aceeași zonă mai ușor de apărat în audit.",
        familyLabels: new Set<string>(),
      }

      current.systems.add(entry.systemName)
      if (priorityRank(control.priority) < priorityRank(current.highestPriority)) {
        current.highestPriority = control.priority
      }
      if (control.controlFamily?.label) current.familyLabels.add(control.controlFamily.label)
      if (control.ownerRoute) current.ownerRoute = control.ownerRoute
      if (control.bundleHint) current.bundleHint = control.bundleHint
      if (control.businessImpact) current.businessImpact = control.businessImpact

      groups.set(groupKey, current)
    }
  }

  return [...groups.values()]
    .map((group) => ({
      groupKey: group.groupKey,
      groupLabel: group.groupLabel,
      systemsCount: group.systems.size,
      highestPriority: group.highestPriority,
      ownerRoute: group.ownerRoute,
      bundleHint: group.bundleHint,
      businessImpact: group.businessImpact,
      familyLabels: [...group.familyLabels],
    }))
    .sort((left, right) => {
      if (priorityRank(left.highestPriority) !== priorityRank(right.highestPriority)) {
        return priorityRank(left.highestPriority) - priorityRank(right.highestPriority)
      }
      if (right.systemsCount !== left.systemsCount) {
        return right.systemsCount - left.systemsCount
      }
      return left.groupLabel.localeCompare(right.groupLabel, "ro")
    })
    .slice(0, 3)
}

export function formatSystemGroupLabel(value: string) {
  if (value === "customer-support") return "suport clienți"
  if (value === "hr-recruitment") return "HR / recrutare"
  if (value === "finance-operations") return "operațiuni financiare"
  if (value === "marketing-analytics") return "marketing / analytics"
  return "operațiuni generale"
}

export function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}
