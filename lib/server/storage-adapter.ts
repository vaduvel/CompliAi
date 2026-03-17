// Sprint 9 — Storage Abstraction Layer
// Interfață unică pentru read/write state per org.
// Implementare curentă: fișiere locale în .data/
// Migrare Supabase: implementezi interfața cu Supabase REST și swap fără a schimba logica.

import { promises as fs } from "node:fs"
import path from "node:path"

const DATA_DIR = path.join(process.cwd(), ".data")

// ── Interfață ─────────────────────────────────────────────────────────────────

export interface IStateStorage<T> {
  read(orgId: string): Promise<T | null>
  write(orgId: string, state: T): Promise<void>
}

// ── Implementare locală (fișiere .data/) ──────────────────────────────────────

export class LocalFileStorage<T> implements IStateStorage<T> {
  constructor(private readonly prefix: string) {}

  private filePath(orgId: string): string {
    return path.join(DATA_DIR, `${this.prefix}-${orgId}.json`)
  }

  async read(orgId: string): Promise<T | null> {
    try {
      const raw = await fs.readFile(this.filePath(orgId), "utf8")
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async write(orgId: string, state: T): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(this.filePath(orgId), JSON.stringify(state, null, 2), "utf8")
  }
}

/**
 * Factory — creează un storage local cu prefixul dat.
 * Exemple:
 *   createLocalStorage<Nis2OrgState>("nis2")   → .data/nis2-{orgId}.json
 *   createLocalStorage<ComplianceState>("state") → .data/state-{orgId}.json
 */
export function createLocalStorage<T>(prefix: string): IStateStorage<T> {
  return new LocalFileStorage<T>(prefix)
}
