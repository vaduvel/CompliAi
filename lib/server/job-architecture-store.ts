// Pay Transparency — Job Architecture store
// Persistence multi-tenant per orgId via adaptive storage (Supabase + local fallback).

import {
  buildJobArchitecture,
  type JobArchitecture,
  type SalaryBand,
} from "@/lib/compliance/job-architecture"
import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

const storage = createAdaptiveStorage<JobArchitecture>(
  "job-architecture",
  "job_architecture_state",
)

const EMPTY_ARCH: JobArchitecture = {
  levels: [],
  roles: [],
  bands: [],
}

/**
 * Read current job architecture pentru org. Returns empty arch if none.
 */
export async function getJobArchitecture(orgId: string): Promise<JobArchitecture> {
  const stored = await storage.read(orgId)
  return stored ?? EMPTY_ARCH
}

/**
 * Save full architecture (replace mode). Used for bulk import.
 */
export async function saveJobArchitecture(
  orgId: string,
  arch: JobArchitectureInput,
): Promise<JobArchitecture> {
  const built = buildJobArchitecture(arch)
  await storage.write(orgId, built)
  return built
}

/**
 * Add or update a single band. Idempotent on (level, role) — replaces existing.
 * Auto-extends levels/roles arrays.
 */
export async function addBand(
  orgId: string,
  band: SalaryBand,
): Promise<JobArchitecture> {
  const current = await getJobArchitecture(orgId)
  const filtered = current.bands.filter(
    (b) => !(b.level === band.level && b.role === band.role),
  )
  const next = buildJobArchitecture({
    levels: [...current.levels, band.level],
    roles: [...current.roles, band.role],
    bands: [...filtered, band],
  })
  await storage.write(orgId, next)
  return next
}

/**
 * Remove band by (level, role). Levels/roles arrays păstrate ca pot fi reused.
 */
export async function removeBand(
  orgId: string,
  level: string,
  role: string,
): Promise<JobArchitecture> {
  const current = await getJobArchitecture(orgId)
  const next: JobArchitecture = {
    ...current,
    bands: current.bands.filter(
      (b) => !(b.level === level && b.role === role),
    ),
  }
  await storage.write(orgId, next)
  return next
}

type JobArchitectureInput = {
  levels: string[]
  roles: string[]
  bands: SalaryBand[]
}
