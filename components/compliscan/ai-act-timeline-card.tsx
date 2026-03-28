"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Badge } from "@/components/evidence-os/Badge"
import type { AISystemRecord } from "@/lib/compliance/types"
import { getSystemTimeline, STATUS_ICONS, STATUS_LABELS } from "@/lib/compliance/ai-act-timeline"

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary"> = {
  active: "success",
  proposed_delay: "warning",
  unknown: "secondary",
}

export function AIActTimelineCard({ system }: { system: AISystemRecord }) {
  const [expanded, setExpanded] = useState(false)
  const timeline = getSystemTimeline(system.riskLevel)

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
            <CardTitle className="text-sm">Timeline obligații AI Act</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
              {timeline.riskLabel}
            </Badge>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-eos-text-muted hover:text-eos-text"
              aria-label={expanded ? "Minimizează" : "Extinde"}
            >
              {expanded ? (
                <ChevronUp className="size-4" strokeWidth={2} />
              ) : (
                <ChevronDown className="size-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
        <p className="mt-0.5 text-[11px] text-eos-text-muted">
          {system.name} — {system.riskLevel === "high" ? "Obligații extinse" : "Obligații de bază"}
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {timeline.obligations.map((ob, i) => (
              <div
                key={i}
                className={`rounded-eos-md border px-3 py-3 ${
                  ob.deadlineStatus === "active"
                    ? "border-eos-success/20 bg-eos-success-soft"
                    : ob.deadlineStatus === "proposed_delay"
                      ? "border-eos-warning/20 bg-eos-warning-soft"
                      : "border-eos-border bg-eos-bg-inset"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={STATUS_BADGE[ob.deadlineStatus]} className="text-[10px] normal-case tracking-normal">
                    {STATUS_ICONS[ob.deadlineStatus]} {STATUS_LABELS[ob.deadlineStatus]}
                  </Badge>
                  <span className="text-[11px] font-medium text-eos-text-muted">{ob.legalBasis}</span>
                </div>
                <p className="mt-1.5 text-xs font-medium text-eos-text">{ob.description}</p>
                <p className="mt-0.5 text-[11px] text-eos-text-muted">Deadline: {ob.deadline}</p>
                {ob.note && (
                  <p className="mt-1.5 text-[11px] italic leading-relaxed text-eos-text-muted">
                    {ob.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] leading-relaxed text-eos-text-muted">
            Sursă: {timeline.sourceNote}
          </p>
        </CardContent>
      )}
    </Card>
  )
}
