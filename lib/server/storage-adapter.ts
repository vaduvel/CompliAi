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

// ── S2A.7 — Dual-write pattern pentru cutover safe ────────────────────────────
//
// Scrie ÎN PARALEL la 2 storage-uri (primary + secondary) și citește din primary.
// La fiecare read, compară primary vs secondary și loghează discrepancies.
// Folosit înainte de cutover production: monitorizezi 1 săpt fără discrepancies →
// flip COMPLISCAN_DATA_BACKEND la "supabase" (read-from-supabase only).
//
// Activat când COMPLISCAN_DATA_BACKEND=dual-write.
//
// Discrepancy detection: hash JSON.stringify (cost mic, bun pentru sanity check;
// NU detectează ordering keys diferite — acceptabil dacă write-urile pleacă din
// același reducer la același moment).

type DualWriteDiscrepancy<T> = {
  orgId: string
  primary: T | null
  secondary: T | null
  detectedAtISO: string
}

export type DualWriteOptions<T> = {
  /** Callback la fiecare read cu discrepancy între primary și secondary. */
  onDiscrepancy?: (event: DualWriteDiscrepancy<T>) => void
  /** Dacă true, secondary failure NU rupe write-ul. Default: true (safety). */
  tolerateSecondaryFailure?: boolean
}

function jsonHash(value: unknown): string {
  // Simplificat — JSON.stringify e suficient pentru sanity check între backends.
  if (value === null || value === undefined) return "null"
  return JSON.stringify(value)
}

export class DualWriteStorage<T> implements IStateStorage<T> {
  private readonly tolerateSecondaryFailure: boolean
  private readonly onDiscrepancy: ((event: DualWriteDiscrepancy<T>) => void) | null

  constructor(
    private readonly primary: IStateStorage<T>,
    private readonly secondary: IStateStorage<T>,
    options: DualWriteOptions<T> = {}
  ) {
    this.tolerateSecondaryFailure = options.tolerateSecondaryFailure ?? true
    this.onDiscrepancy = options.onDiscrepancy ?? null
  }

  async read(orgId: string): Promise<T | null> {
    // Citire în paralel pentru detection rapidă + return primary doar.
    const [primaryResult, secondaryResult] = await Promise.allSettled([
      this.primary.read(orgId),
      this.secondary.read(orgId),
    ])
    const p = primaryResult.status === "fulfilled" ? primaryResult.value : null
    const s = secondaryResult.status === "fulfilled" ? secondaryResult.value : null
    if (jsonHash(p) !== jsonHash(s)) {
      const event: DualWriteDiscrepancy<T> = {
        orgId,
        primary: p,
        secondary: s,
        detectedAtISO: new Date().toISOString(),
      }
      if (this.onDiscrepancy) {
        try {
          this.onDiscrepancy(event)
        } catch {
          // discrepancy callback failure NU rupe read-ul
        }
      } else {
        console.warn(
          `[dual-write] discrepancy org=${orgId} primary=${p === null ? "null" : "set"} secondary=${
            s === null ? "null" : "set"
          }`
        )
      }
    }
    if (primaryResult.status === "rejected") {
      throw primaryResult.reason instanceof Error
        ? primaryResult.reason
        : new Error(String(primaryResult.reason))
    }
    return p
  }

  async write(orgId: string, state: T): Promise<void> {
    const [primaryResult, secondaryResult] = await Promise.allSettled([
      this.primary.write(orgId, state),
      this.secondary.write(orgId, state),
    ])
    if (primaryResult.status === "rejected") {
      throw primaryResult.reason instanceof Error
        ? primaryResult.reason
        : new Error(String(primaryResult.reason))
    }
    if (secondaryResult.status === "rejected") {
      console.warn(
        `[dual-write] secondary write failed org=${orgId}: ${
          secondaryResult.reason instanceof Error ? secondaryResult.reason.message : "unknown"
        }`
      )
      if (!this.tolerateSecondaryFailure) {
        throw secondaryResult.reason instanceof Error
          ? secondaryResult.reason
          : new Error(String(secondaryResult.reason))
      }
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
 *
 * S2A.7 — Suport pentru dual-write mode (ambele storage-uri scriu în paralel,
 * citește din local primary, loghează discrepancies). Activat când
 * COMPLISCAN_DATA_BACKEND=dual-write.
 *
 * Mode-uri:
 *  - "local"      → file system only (default fără Supabase)
 *  - "supabase"   → Supabase primary, local fallback (cutover production)
 *  - "dual-write" → ambele paralel, primary=local, log discrepancies
 *                   (folosit 1 săpt înainte de switch la "supabase")
 */
export function createAdaptiveStorage<T>(localPrefix: string, supabaseTable: string): IStateStorage<T> {
  const localStorage = new LocalFileStorage<T>(localPrefix)

  if (!hasSupabaseConfig()) {
    return localStorage
  }

  const backend = getConfiguredDataBackend()

  if (backend === "supabase") {
    return new CloudPrimaryStorage<T>(new SupabaseStateStorage<T>(supabaseTable), localStorage)
  }

  if (backend === "dual-write") {
    return new DualWriteStorage<T>(
      localStorage,
      new SupabaseStateStorage<T>(supabaseTable),
      { tolerateSecondaryFailure: true }
    )
  }

  return localStorage
}
