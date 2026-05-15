/**
 * FiscCopilot — Memory Persistence
 *
 * Per-org JSON storage cu in-memory cache.
 * Pattern identic cu lib/server/mvp-store.ts (existing CompliAI).
 *
 * Locație: .data/fiscal-copilot-memory-{orgId}.json
 *
 * Upgrade path:
 *  - Supabase (cloud sync — already supported pattern în mvp-store)
 *  - better-sqlite3 (local, transactional)
 *  - Qdrant pentru vector search on episodes
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { MemorySnapshot, newMemorySnapshot } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");

// In-memory cache per orgId
const memoryCache = new Map<string, MemorySnapshot>();
const initialized = new Set<string>();

function fileFor(orgId: string): string {
  // Sanitize orgId — must be safe filename
  const safe = orgId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(DATA_DIR, `fiscal-copilot-memory-${safe}.json`);
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore EEXIST or read-only filesystems (Vercel)
  }
}

async function loadFromDisk(orgId: string): Promise<MemorySnapshot> {
  try {
    const buf = await fs.readFile(fileFor(orgId), "utf8");
    const parsed = JSON.parse(buf) as MemorySnapshot;
    if (parsed.schemaVersion !== 1) {
      // Future: migration logic
      return newMemorySnapshot(orgId);
    }
    return parsed;
  } catch (err: unknown) {
    // ENOENT or parse error → start fresh
    return newMemorySnapshot(orgId);
  }
}

async function persistToDisk(snap: MemorySnapshot): Promise<void> {
  await ensureDataDir();
  try {
    const tmp = fileFor(snap.orgId) + ".tmp";
    await fs.writeFile(tmp, JSON.stringify(snap, null, 2), "utf8");
    await fs.rename(tmp, fileFor(snap.orgId));
  } catch {
    // Vercel read-only fs: silently skip disk write, cache rămâne în memorie
  }
}

/**
 * Citește memoria pentru un org. Initial load din disk + cache subsequent.
 */
export async function readMemory(orgId: string): Promise<MemorySnapshot> {
  if (!initialized.has(orgId)) {
    initialized.add(orgId);
    const loaded = await loadFromDisk(orgId);
    memoryCache.set(orgId, loaded);
  }
  return memoryCache.get(orgId) ?? newMemorySnapshot(orgId);
}

/**
 * Aplică o mutare pe memorie + persistă pe disk.
 */
export async function writeMemory(
  orgId: string,
  mutator: (snap: MemorySnapshot) => MemorySnapshot | void
): Promise<MemorySnapshot> {
  const current = await readMemory(orgId);
  const next = mutator(current) ?? current;
  next.stats.lastWriteAt = Date.now() / 1000;
  next.stats.totalEpisodes = next.episodes.length;
  next.stats.totalFacts = next.facts.length;
  next.stats.totalProcedures = next.procedures.length;
  memoryCache.set(orgId, next);
  await persistToDisk(next);
  return next;
}

/**
 * Reset cache pentru un org (force re-read din disk).
 */
export function invalidateCache(orgId: string): void {
  initialized.delete(orgId);
  memoryCache.delete(orgId);
}

/**
 * Lista tuturor org-urilor cu memorie pe disk (util pentru cron jobs).
 */
export async function listOrgIdsWithMemory(): Promise<string[]> {
  try {
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((f) => f.startsWith("fiscal-copilot-memory-") && f.endsWith(".json"))
      .map((f) =>
        f.replace(/^fiscal-copilot-memory-/, "").replace(/\.json$/, "")
      );
  } catch {
    return [];
  }
}
