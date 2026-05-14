"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DailyBriefing } from "@/lib/fiscal-copilot/daily-briefing";

const SEV_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-900 border-red-200",
  high: "bg-orange-100 text-orange-900 border-orange-200",
  medium: "bg-yellow-100 text-yellow-900 border-yellow-200",
  low: "bg-blue-100 text-blue-900 border-blue-200",
  info: "bg-gray-100 text-gray-900 border-gray-200",
};

const SEV_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "Prioritate înaltă",
  medium: "De pregătit",
  low: "Informativ",
  info: "Info",
};

export function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const { headline, stats, topActions, generationLatencyMs } = briefing;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-muted/40 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{headline}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Generat în {(generationLatencyMs / 1000).toFixed(1)}s prin Gemma local · {briefing.date}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Clienți cu alerte" value={`${stats.clientsWithAlerts}/${stats.totalClients}`} />
        <Stat label="Urgent" value={stats.urgentCount} tone="urgent" />
        <Stat label="Prioritate înaltă" value={stats.highCount} tone="high" />
        <Stat label="De pregătit" value={stats.mediumCount} tone="medium" />
        <Stat label="Risc cumulat (RON)" value={stats.estimatedRiskRON.toLocaleString("ro-RO")} />
      </section>

      <Separator />

      <section>
        <h3 className="mb-3 text-sm font-semibold tracking-tight">
          Top {topActions.length} acțiuni pentru azi
        </h3>
        {topActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nimic urgent astăzi. Zi liniștită.</p>
        ) : (
          <ol className="space-y-3">
            {topActions.map((a, i) => (
              <li
                key={i}
                className={`rounded-lg border p-3 ${SEV_COLORS[a.severity] || SEV_COLORS.info}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {SEV_LABEL[a.severity] || a.severity}
                      </Badge>
                      <span className="text-sm font-semibold">{a.clientName}</span>
                    </div>
                    <p className="text-sm">{a.title}</p>
                    <p className="text-xs opacity-80">
                      Primul pas: <span className="font-medium">{a.firstStep}</span>
                    </p>
                  </div>
                  {a.deadlineDate && (
                    <div className="shrink-0 text-right text-xs opacity-80">
                      <div>Deadline:</div>
                      <div className="font-medium">{a.deadlineDate.slice(0, 10)}</div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className={`rounded-lg border p-3 ${tone ? SEV_COLORS[tone] : ""}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
