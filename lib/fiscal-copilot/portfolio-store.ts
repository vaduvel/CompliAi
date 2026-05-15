/**
 * FiscCopilot — Portfolio Store
 *
 * Per-org persistence pentru ClientProfile[] + FiscalEvent[].
 * Înlocuiește DEMO_CLIENTS hardcoded cu DB real per cabinet.
 *
 * Folosește același pattern ca lib/server/mvp-store.ts (CompliAI existing):
 *  - In-memory cache per orgId
 *  - JSON persistence în .data/fiscal-copilot-portfolio-{orgId}.json
 *  - Graceful EROFS handling pentru Vercel serverless
 *
 * Integrare cu memory module: client_created + event_logged emit episodes.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { logEpisode } from "./memory/episodic";
import type { ClientProfile, FiscalEvent } from "./match-paths/types";

const DATA_DIR = path.join(process.cwd(), ".data");

interface PortfolioSnapshot {
  orgId: string;
  schemaVersion: 1;
  clients: ClientProfile[];
  events: FiscalEvent[];
  lastUpdatedAt: number;
}

const portfolioCache = new Map<string, PortfolioSnapshot>();
const initialized = new Set<string>();

function fileFor(orgId: string): string {
  const safe = orgId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `fiscal-copilot-portfolio-${safe}.json`);
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

function emptyPortfolio(orgId: string): PortfolioSnapshot {
  return { orgId, schemaVersion: 1, clients: [], events: [], lastUpdatedAt: 0 };
}

async function loadFromDisk(orgId: string): Promise<PortfolioSnapshot> {
  try {
    const buf = await fs.readFile(fileFor(orgId), "utf8");
    const parsed = JSON.parse(buf) as PortfolioSnapshot;
    return parsed.schemaVersion === 1 ? parsed : emptyPortfolio(orgId);
  } catch {
    return emptyPortfolio(orgId);
  }
}

async function persistToDisk(snap: PortfolioSnapshot): Promise<void> {
  await ensureDataDir();
  try {
    const tmp = fileFor(snap.orgId) + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(snap, null, 2), "utf8");
    await fs.rename(tmp, fileFor(snap.orgId));
  } catch {
    /* read-only fs */
  }
}

async function readPortfolio(orgId: string): Promise<PortfolioSnapshot> {
  if (!initialized.has(orgId)) {
    initialized.add(orgId);
    portfolioCache.set(orgId, await loadFromDisk(orgId));
  }
  return portfolioCache.get(orgId) ?? emptyPortfolio(orgId);
}

async function writePortfolio(
  orgId: string,
  mutator: (snap: PortfolioSnapshot) => void
): Promise<PortfolioSnapshot> {
  const current = await readPortfolio(orgId);
  mutator(current);
  current.lastUpdatedAt = Date.now() / 1000;
  portfolioCache.set(orgId, current);
  await persistToDisk(current);
  return current;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function listClients(orgId: string): Promise<ClientProfile[]> {
  const snap = await readPortfolio(orgId);
  return snap.clients;
}

export async function getClient(
  orgId: string,
  clientId: string
): Promise<ClientProfile | null> {
  const snap = await readPortfolio(orgId);
  return snap.clients.find((c) => c.id === clientId) ?? null;
}

export interface CreateClientInput {
  name: string;
  cui: string;
  type: ClientProfile["type"];
  vatRegime: ClientProfile["vatRegime"];
  hasEmployees: boolean;
  registeredDate: string;
  caenCodes: string[];
  estimatedAnnualRevenueEUR?: number;
  flags?: ClientProfile["flags"];
}

export async function createClient(
  orgId: string,
  input: CreateClientInput
): Promise<ClientProfile> {
  const client: ClientProfile = {
    id: `cli_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    flags: [],
    ...input,
  };

  await writePortfolio(orgId, (snap) => {
    snap.clients.push(client);
  });

  // Log episode
  await logEpisode({
    orgId,
    kind: "client_created",
    clientId: client.id,
    payload: { name: client.name, cui: client.cui, type: client.type },
    outcome: "success",
  });

  return client;
}

export async function updateClient(
  orgId: string,
  clientId: string,
  patch: Partial<ClientProfile>
): Promise<ClientProfile | null> {
  let updated: ClientProfile | null = null;
  await writePortfolio(orgId, (snap) => {
    const idx = snap.clients.findIndex((c) => c.id === clientId);
    if (idx < 0) return;
    const merged: ClientProfile = { ...snap.clients[idx], ...patch, id: clientId };
    snap.clients[idx] = merged;
    updated = merged;
  });

  if (updated) {
    await logEpisode({
      orgId,
      kind: "client_updated",
      clientId,
      payload: { patch: Object.keys(patch) },
      outcome: "success",
    });
  }

  return updated;
}

export async function deleteClient(orgId: string, clientId: string): Promise<boolean> {
  let removed = false;
  await writePortfolio(orgId, (snap) => {
    const before = snap.clients.length;
    snap.clients = snap.clients.filter((c) => c.id !== clientId);
    snap.events = snap.events.filter((e) => e.clientId !== clientId);
    removed = snap.clients.length < before;
  });
  return removed;
}

// ── EVENTS ──────────────────────────────────────────────────────────────────

export async function listEvents(
  orgId: string,
  filter: { clientId?: string; type?: FiscalEvent["type"]; sinceDays?: number } = {}
): Promise<FiscalEvent[]> {
  const snap = await readPortfolio(orgId);
  let events = snap.events;
  if (filter.clientId) events = events.filter((e) => e.clientId === filter.clientId);
  if (filter.type) events = events.filter((e) => e.type === filter.type);
  if (filter.sinceDays) {
    const since = Date.now() - filter.sinceDays * 86_400_000;
    events = events.filter((e) => new Date(e.date).getTime() >= since);
  }
  return events;
}

export interface LogFiscalEventInput {
  clientId: string;
  type: FiscalEvent["type"];
  date?: string;
  amountRON?: number;
  refDoc?: string;
  meta?: Record<string, unknown>;
}

export async function logFiscalEvent(
  orgId: string,
  input: LogFiscalEventInput
): Promise<FiscalEvent> {
  const event: FiscalEvent = {
    id: `evt_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    clientId: input.clientId,
    type: input.type,
    date: input.date ?? new Date().toISOString(),
    amountRON: input.amountRON,
    refDoc: input.refDoc,
    meta: input.meta,
  };

  await writePortfolio(orgId, (snap) => {
    snap.events.push(event);
    // Cap la 50000 evenimente per org (older trebuie arhivate manual)
    if (snap.events.length > 50000) {
      snap.events = snap.events.slice(-50000);
    }
  });

  await logEpisode({
    orgId,
    kind: "event_logged",
    clientId: input.clientId,
    payload: { type: input.type, refDoc: input.refDoc, amountRON: input.amountRON },
    outcome: "success",
  });

  return event;
}

/**
 * Verifică dacă portofoliul are clienți; dacă nu, oferă pre-populate de demo.
 */
export async function isPortfolioEmpty(orgId: string): Promise<boolean> {
  const snap = await readPortfolio(orgId);
  return snap.clients.length === 0;
}

/**
 * Pre-populate cu demo portfolio (5 clienți + evenimente).
 * Folosit la onboarding sau ca opțiune în UI "Încarcă demo".
 */
export async function seedDemoPortfolio(orgId: string): Promise<void> {
  const { DEMO_CLIENTS, generateDemoEvents } = await import("./demo-portfolio");
  const events = generateDemoEvents(new Date());

  await writePortfolio(orgId, (snap) => {
    snap.clients = DEMO_CLIENTS;
    snap.events = events;
  });

  await logEpisode({
    orgId,
    kind: "client_created",
    payload: { source: "seed_demo", count: DEMO_CLIENTS.length },
    note: `Seed demo portfolio cu ${DEMO_CLIENTS.length} clienți și ${events.length} evenimente`,
    outcome: "success",
  });
}
