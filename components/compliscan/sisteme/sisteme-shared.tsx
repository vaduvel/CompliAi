"use client"

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
    <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <header className="border-b border-eos-border-subtle px-4 py-3.5">
        <h3
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Pachete de control dominante
        </h3>
      </header>
      <div className="space-y-4 px-4 py-4">
        {highlights.length === 0 && (
          <div className="rounded-eos-lg border border-dashed border-eos-border bg-white/[0.02] px-4 py-8 text-center">
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-eos-text"
            >
              Insuficiente semnale pentru grupuri dominante
            </p>
            <p className="mt-1.5 text-[12px] leading-[1.5] text-eos-text-muted">
              Confirmă mai întâi suficiente sisteme sau completează câmpurile lipsă din pack — vei
              vedea ce bundle domină pe fiecare categorie.
            </p>
          </div>
        )}
        <div className="grid gap-4 xl:grid-cols-3">
          {highlights.map((highlight) => {
            const priorityTone =
              highlight.highestPriority === "P1"
                ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
                : highlight.highestPriority === "P2"
                  ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                  : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
            return (
              <div
                key={highlight.groupKey}
                className="rounded-eos-lg border border-eos-border bg-eos-surface-elevated p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    data-display-text="true"
                    className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-eos-text"
                  >
                    {highlight.groupLabel}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-sm border ${priorityTone} px-1.5 py-0.5 font-mono text-[10px] font-medium`}
                    >
                      {highlight.highestPriority}
                    </span>
                    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                      {highlight.systemsCount} sisteme
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-[12.5px] leading-[1.55] text-eos-text-muted">
                  {highlight.businessImpact}
                </p>
                <p className="mt-3 text-[11.5px] text-eos-text-muted">
                  <span className="font-medium text-eos-text">Owner route:</span>{" "}
                  {highlight.ownerRoute}
                </p>
                <p className="mt-2 text-[11.5px] text-eos-text-muted">
                  <span className="font-medium text-eos-text">Bundle util:</span>{" "}
                  {highlight.bundleHint}
                </p>
                {highlight.familyLabels.length > 0 && (
                  <p className="mt-2 text-[11.5px] text-eos-text-muted">
                    <span className="font-medium text-eos-text">Familii:</span>{" "}
                    {highlight.familyLabels.join(" · ")}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
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
