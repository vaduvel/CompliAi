// Sprint 9 — Storage Abstraction Layer
// Interfață unică pentru read/write state per org.
// Implementare curentă: fișiere locale în .data/
// Sprint 10 — Supabase implementare adăugată.
// Migrare Supabase: schimbi implementarea, nu logica.

import { promises as fs } from "node:fs"
import path from "node:path"

import { writeFileSafe } from "@/lib/server/fs-safe"
import { hasSupabaseConfig } from "@/lib/server/supabase-rest"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

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
    await writeFileSafe(this.filePath(orgId), JSON.stringify(state, null, 2))
  }
}

// ── Implementare Supabase (Sprint 10) ─────────────────────────────────────────

type SupabaseRow<T> = { org_id: string; state: T }

function isLocalFallbackAllowed() {
  const explicit = process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK?.trim().toLowerCase()

  if (explicit === "1" || explicit === "true" || explicit === "yes") {
    return true
  }

  if (explicit === "0" || explicit === "false" || explicit === "no") {
    return false
  }

  return process.env.NODE_ENV !== "production"
}

export class SupabaseStateStorage<T> implements IStateStorage<T> {
  constructor(private readonly table: string) {}

  async read(orgId: string): Promise<T | null> {
    // Lazy import pentru a evita încărcarea Supabase în test/local
    const { supabaseSelect } = await import("@/lib/server/supabase-rest")
    const rows = await supabaseSelect<SupabaseRow<T>>(
      this.table,
      `select=org_id,state&org_id=eq.${orgId}&limit=1`,
      "public"
    )
    return rows[0]?.state ?? null
  }

  async write(orgId: string, state: T): Promise<void> {
    const { supabaseUpsert } = await import("@/lib/server/supabase-rest")
    await supabaseUpsert(this.table, { org_id: orgId, state }, "public")
  }
}

class CloudPrimaryStorage<T> implements IStateStorage<T> {
  constructor(
    private readonly primary: IStateStorage<T>,
    private readonly fallback: IStateStorage<T>
  ) {}

  async read(orgId: string): Promise<T | null> {
    try {
      return await this.primary.read(orgId)
    } catch (error) {
      if (!isLocalFallbackAllowed()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_STATE_REQUIRED: ${error.message}`
            : "SUPABASE_STATE_REQUIRED"
        )
      }
      return this.fallback.read(orgId)
    }
  }

  async write(orgId: string, state: T): Promise<void> {
    try {
      await this.primary.write(orgId, state)
    } catch (error) {
      if (!isLocalFallbackAllowed()) {
        throw new Error(
          error instanceof Error
            ? `SUPABASE_STATE_REQUIRED: ${error.message}`
            : "SUPABASE_STATE_REQUIRED"
        )
      }
      await this.fallback.write(orgId, state)
    }
  }
}

// ── Factory helpers ───────────────────────────────────────────────────────────

/**
 * Creează un storage local cu prefixul dat.
 *   createLocalStorage<Nis2OrgState>("nis2")   → .data/nis2-{orgId}.json
 */
export function createLocalStorage<T>(prefix: string): IStateStorage<T> {
  return new LocalFileStorage<T>(prefix)
}

/**
 * Creează un storage Supabase pe tabelul dat.
 *   createSupabaseStorage<Nis2OrgState>("nis2_state")
 */
export function createSupabaseStorage<T>(table: string): IStateStorage<T> {
  return new SupabaseStateStorage<T>(table)
}

/**
 * Sprint 10: Factory care alege backend-ul pe baza config.
 * Fallback local pentru development dacă Supabase nu e configurat.
 */
export function createAdaptiveStorage<T>(localPrefix: string, supabaseTable: string): IStateStorage<T> {
  const localStorage = new LocalFileStorage<T>(localPrefix)

  if (hasSupabaseConfig() && getConfiguredDataBackend() === "supabase") {
    return new CloudPrimaryStorage<T>(new SupabaseStateStorage<T>(supabaseTable), localStorage)
  }
  return localStorage
}
