"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatchPathAlert } from "@/lib/fiscal-copilot/match-paths/types";
import { ProcedureModal } from "./procedure-modal";

const SEV_ORDER = ["urgent", "high", "medium", "low", "info"] as const;
const SEV_COLORS: Record<string, string> = {
  urgent: "border-red-300 bg-red-50",
  high: "border-orange-300 bg-orange-50",
  medium: "border-yellow-300 bg-yellow-50",
  low: "border-blue-300 bg-blue-50",
  info: "border-gray-300 bg-gray-50",
};
const SEV_BADGE: Record<string, string> = {
  urgent: "bg-red-600 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-blue-500 text-white",
  info: "bg-gray-500 text-white",
};

export function AlertsList({ alerts }: { alerts: MatchPathAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nicio alertă activă. Portofoliul tău e curat astăzi.
        </p>
      </div>
    );
  }

  const grouped = SEV_ORDER.map((sev) => ({
    sev,
    items: alerts.filter((a) => a.severity === sev),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(({ sev, items }) => (
        <section key={sev} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <span>{labelFor(sev)}</span>
            <Badge className={SEV_BADGE[sev]}>{items.length}</Badge>
          </h3>
          <ul className="space-y-2">
            {items.map((a, i) => (
              <AlertItem key={i} alert={a} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AlertItem({ alert }: { alert: MatchPathAlert }) {
  const [expanded, setExpanded] = useState(false);
  const [procOpen, setProcOpen] = useState(false);
  return (
    <li className={`rounded-lg border-2 p-4 ${SEV_COLORS[alert.severity]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">{alert.clientName}</span>
            <span className="opacity-60">·</span>
            <span className="opacity-70">{alert.pathName}</span>
          </div>
          <p className="text-sm font-medium">{alert.title}</p>
          <p className="text-sm">{alert.explanation}</p>
        </div>
        {alert.deadlineDate && (
          <div className="shrink-0 text-right text-xs">
            <div className="opacity-70">Deadline:</div>
            <div className="font-semibold">{alert.deadlineDate.slice(0, 10)}</div>
            {alert.estimatedImpactRON && (
              <div className="mt-1 text-red-700">
                Risc: {alert.estimatedImpactRON.toLocaleString("ro-RO")} RON
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ascunde pașii" : `Vezi ${alert.actionSteps.length} pași`}
        </Button>
        <Button
          size="sm"
          variant="default"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setProcOpen(true)}
        >
          Procedura completă
        </Button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-current/10 pt-3">
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
              Pași de urmat (sumar)
            </h4>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {alert.actionSteps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
          <div>
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-80">
              Surse legale
            </h4>
            <ul className="space-y-0.5 text-xs">
              {alert.legalSources.map((s, i) => (
                <li key={i}>
                  <span className="font-medium">{s.label}</span>{" "}
                  <span className="opacity-60">— {s.ref}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <ProcedureModal
        pathId={alert.pathId}
        open={procOpen}
        onClose={() => setProcOpen(false)}
      />
    </li>
  );
}

function labelFor(sev: string): string {
  return (
    {
      urgent: "Urgent",
      high: "Prioritate înaltă",
      medium: "De pregătit",
      low: "Informativ",
      info: "Info",
    }[sev] || sev
  );
}
