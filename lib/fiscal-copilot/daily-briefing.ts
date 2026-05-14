/**
 * FiscCopilot — Daily Briefing Generator
 *
 * Agregare alerte din toate path-urile + sumarizare cu Gemma → briefing zilnic
 * personalizat pentru contabil.
 *
 * Output format:
 * 1. Headline summary (LLM)
 * 2. Urgenti (alerts severity urgent + high)
 * 3. De pregătit (medium)
 * 4. Info (low + info)
 * 5. Stats portofoliu
 */

import { runAllPaths } from "./match-paths/paths";
import { askGemma } from "./gemma-client";
import type { ClientProfile, FiscalEvent, MatchPathAlert } from "./match-paths/types";

export interface DailyBriefing {
  date: string;
  cabinetId: string;
  cabinetName: string;
  generatedAt: string;
  /** LLM-generated headline 1-3 propoziții */
  headline: string;
  stats: {
    totalClients: number;
    clientsWithAlerts: number;
    urgentCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    estimatedRiskRON: number;
  };
  alertsBySeverity: {
    urgent: MatchPathAlert[];
    high: MatchPathAlert[];
    medium: MatchPathAlert[];
    low: MatchPathAlert[];
    info: MatchPathAlert[];
  };
  /** Top 5 acțiuni prioritate maximă */
  topActions: Array<{
    clientName: string;
    title: string;
    severity: string;
    deadlineDate?: string;
    firstStep: string;
  }>;
  generationLatencyMs: number;
}

interface PortfolioInput {
  cabinetId: string;
  cabinetName: string;
  clients: Array<{ profile: ClientProfile; events: FiscalEvent[] }>;
}

const BRIEFING_SYSTEM_PROMPT = `Ești "FiscCopilot" — asistent fiscal AI pentru contabili din România.
Sarcina ta: genera un HEADLINE pentru briefing-ul de dimineață, în limba română, prietenos dar profesional.
REGULI:
- Maxim 3 propoziții.
- Începe cu salut + numele cabinetului.
- Menționează NUMĂRUL de alerte urgent + high (dacă există).
- Menționează cele 1-2 lucruri cele mai importante de făcut azi.
- Termină cu o încurajare scurtă.
- NU enumera toate alertele — doar pune accent pe ce contează.
- Nu folosi emoticoane. Tonul prietenos dar concis.`;

async function generateHeadline(
  cabinetName: string,
  stats: DailyBriefing["stats"],
  topAlerts: MatchPathAlert[]
): Promise<string> {
  const topAlertsSummary = topAlerts
    .slice(0, 3)
    .map((a) => `- ${a.clientName}: ${a.title}`)
    .join("\n");

  const userPrompt = `Cabinet: ${cabinetName}
Data: ${new Date().toLocaleDateString("ro-RO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}

Statistici portofoliu:
- ${stats.totalClients} clienți total, ${stats.clientsWithAlerts} cu alerte
- ${stats.urgentCount} urgente, ${stats.highCount} prioritate înaltă
- ${stats.mediumCount} de pregătit, ${stats.lowCount} informative
- Risc estimat cumulat: ${stats.estimatedRiskRON} RON

Top alerte (cele mai importante):
${topAlertsSummary || "(niciuna)"}

Generează headline-ul (max 3 propoziții).`;

  try {
    const res = await askGemma(userPrompt, {
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
      temperature: 0.4,
      maxTokens: 250,
      thinking: false,
      timeoutMs: 60_000,
    });
    return res.text;
  } catch (err) {
    // Fallback non-LLM
    const sev =
      stats.urgentCount > 0
        ? `${stats.urgentCount} urgente`
        : stats.highCount > 0
          ? `${stats.highCount} cu prioritate înaltă`
          : "calm";
    return `Bună dimineața, ${cabinetName}. Astăzi în portofoliu: ${stats.clientsWithAlerts}/${stats.totalClients} clienți cu alerte (${sev}). Verifică acțiunile de mai jos.`;
  }
}

/**
 * Generează briefing-ul zilnic pentru un cabinet.
 */
export async function generateDailyBriefing(
  portfolio: PortfolioInput,
  today: Date = new Date()
): Promise<DailyBriefing> {
  const start = Date.now();

  // 1. Rulează Match Paths pe toți clienții
  const allAlerts: MatchPathAlert[] = [];
  for (const { profile, events } of portfolio.clients) {
    const alerts = runAllPaths(profile, events, today);
    allAlerts.push(...alerts);
  }

  // 2. Group by severity
  const bySev: DailyBriefing["alertsBySeverity"] = {
    urgent: allAlerts.filter((a) => a.severity === "urgent"),
    high: allAlerts.filter((a) => a.severity === "high"),
    medium: allAlerts.filter((a) => a.severity === "medium"),
    low: allAlerts.filter((a) => a.severity === "low"),
    info: allAlerts.filter((a) => a.severity === "info"),
  };

  // 3. Stats
  const clientsWithAlerts = new Set(allAlerts.map((a) => a.clientId)).size;
  const stats: DailyBriefing["stats"] = {
    totalClients: portfolio.clients.length,
    clientsWithAlerts,
    urgentCount: bySev.urgent.length,
    highCount: bySev.high.length,
    mediumCount: bySev.medium.length,
    lowCount: bySev.low.length,
    estimatedRiskRON: allAlerts.reduce((s, a) => s + (a.estimatedImpactRON ?? 0), 0),
  };

  // 4. Top actions (priority order)
  const topAlerts = [...bySev.urgent, ...bySev.high, ...bySev.medium].slice(0, 5);
  const topActions = topAlerts.map((a) => ({
    clientName: a.clientName,
    title: a.title,
    severity: a.severity,
    deadlineDate: a.deadlineDate,
    firstStep: a.actionSteps[0] ?? "Verifică detaliile",
  }));

  // 5. LLM headline
  const headline = await generateHeadline(portfolio.cabinetName, stats, topAlerts);

  return {
    date: today.toISOString().slice(0, 10),
    cabinetId: portfolio.cabinetId,
    cabinetName: portfolio.cabinetName,
    generatedAt: new Date().toISOString(),
    headline,
    stats,
    alertsBySeverity: bySev,
    topActions,
    generationLatencyMs: Date.now() - start,
  };
}
