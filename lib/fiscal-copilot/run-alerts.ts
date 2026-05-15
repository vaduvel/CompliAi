/**
 * FiscCopilot — Run alerts for a real cabinet
 *
 * Citește portofoliul din DB (per orgId) + rulează Match Paths + logează episodes.
 * Înlocuiește generateDemoEvents/DEMO_CLIENTS hardcoded.
 */

import { listClients, listEvents } from "./portfolio-store";
import { runAllPaths } from "./match-paths/paths";
import { logEpisode } from "./memory/episodic";
import type { MatchPathAlert } from "./match-paths/types";

export interface CabinetAlertsResult {
  orgId: string;
  generatedAt: string;
  totalClients: number;
  totalAlerts: number;
  alerts: MatchPathAlert[];
}

/**
 * Rulează detection pentru un cabinet (orgId) și logează rezultatele în episodic memory.
 */
export async function runAlertsForCabinet(
  orgId: string,
  today: Date = new Date(),
  opts: { logEpisodes?: boolean } = {}
): Promise<CabinetAlertsResult> {
  const clients = await listClients(orgId);
  const allEvents = await listEvents(orgId);

  const alerts: MatchPathAlert[] = [];
  for (const client of clients) {
    const clientEvents = allEvents.filter((e) => e.clientId === client.id);
    alerts.push(...runAllPaths(client, clientEvents, today));
  }

  // Severity order pentru sort
  const sevOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    info: 4,
  };
  alerts.sort((a, b) => (sevOrder[a.severity] ?? 5) - (sevOrder[b.severity] ?? 5));

  // Log episode pentru fiecare alert (default ON; off pentru polling rapid)
  if (opts.logEpisodes !== false) {
    await Promise.allSettled(
      alerts.map((a) =>
        logEpisode({
          orgId,
          kind: "alert_fired",
          clientId: a.clientId,
          payload: {
            pathId: a.pathId,
            pathName: a.pathName,
            severity: a.severity,
            title: a.title,
            deadlineDate: a.deadlineDate,
            estimatedImpactRON: a.estimatedImpactRON,
          },
          outcome: "info",
        })
      )
    );
  }

  return {
    orgId,
    generatedAt: today.toISOString(),
    totalClients: clients.length,
    totalAlerts: alerts.length,
    alerts,
  };
}
