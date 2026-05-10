// Sprint 9 — Cron Status Store
//
// Tracks last-run state per cron handler so we can build an admin
// observability page (`/dashboard/settings/cron-status`).
//
// Each cron handler should call `recordCronRun(name, ok, summary, durationMs)`
// at the end of its execution. The page reads `getAllCronStatuses()` and
// displays a table with status + summary + age.
//
// Storage: single global record (no orgId partition) — cron status is platform-
// wide, not per-tenant. We reuse `createAdaptiveStorage` to inherit
// local→supabase auto-promotion when configured.

import { createAdaptiveStorage } from "@/lib/server/storage-adapter"

const STORAGE_KEY = "global"

export type CronRunRecord = {
  name: string
  lastRunAtISO: string
  ok: boolean
  durationMs: number
  /** Short human-readable summary (e.g. "23 reminders sent, 0 errors"). */
  summary: string
  /** Optional structured stats — JSON-friendly, displayed if present. */
  stats?: Record<string, number | string>
  /** If !ok, the error message captured at the boundary. */
  errorMessage?: string
}

export type CronStatusLog = {
  /** Map keyed by cron name → most recent run. */
  records: Record<string, CronRunRecord>
}

const cronStatusStorage = createAdaptiveStorage<CronStatusLog>(
  "cron-status",
  "cron_status",
)

async function readLog(): Promise<CronStatusLog> {
  return (await cronStatusStorage.read(STORAGE_KEY)) ?? { records: {} }
}

async function writeLog(log: CronStatusLog): Promise<void> {
  await cronStatusStorage.write(STORAGE_KEY, log)
}

export async function recordCronRun(record: CronRunRecord): Promise<void> {
  const log = await readLog()
  log.records[record.name] = record
  await writeLog(log)
}

/** Tolerant — never throws even if storage is unavailable. */
export async function safeRecordCronRun(record: CronRunRecord): Promise<void> {
  try {
    await recordCronRun(record)
  } catch {
    // Cron telemetry is secondary; primary work must complete.
  }
}

export async function getAllCronStatuses(): Promise<CronRunRecord[]> {
  const log = await readLog()
  return Object.values(log.records).sort((a, b) =>
    a.lastRunAtISO < b.lastRunAtISO ? 1 : -1,
  )
}

export async function safeGetAllCronStatuses(): Promise<CronRunRecord[]> {
  try {
    return await getAllCronStatuses()
  } catch {
    return []
  }
}

/**
 * Wrap a cron handler body with automatic recording. The wrapper records
 * `ok: true` on success (with the returned summary), `ok: false` on throw,
 * always with the elapsed duration.
 */
export async function withCronRecording<T extends { summary: string; stats?: Record<string, number | string> }>(
  name: string,
  body: () => Promise<T>,
): Promise<T> {
  const startedMs = Date.now()
  try {
    const result = await body()
    await safeRecordCronRun({
      name,
      lastRunAtISO: new Date(startedMs).toISOString(),
      ok: true,
      durationMs: Date.now() - startedMs,
      summary: result.summary,
      stats: result.stats,
    })
    return result
  } catch (err) {
    await safeRecordCronRun({
      name,
      lastRunAtISO: new Date(startedMs).toISOString(),
      ok: false,
      durationMs: Date.now() - startedMs,
      summary: "Cron a eșuat — vezi errorMessage.",
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    throw err
  }
}

/**
 * The static list of crons configured in vercel.json. We expose this so the
 * page can show "no run yet" placeholders for crons that never executed (e.g.
 * after a fresh deploy).
 */
export const CONFIGURED_CRONS: Array<{
  name: string
  path: string
  schedule: string
  description: string
}> = [
  {
    name: "fiscal-reminders",
    path: "/api/cron/fiscal-reminders",
    schedule: "30 5 * * *",
    description: "Email zilnic la 05:30 RO — termene fiscale critice (D300, D406, e-Factura, P300).",
  },
  {
    name: "p300-monthly-check",
    path: "/api/cron/p300-monthly-check",
    schedule: "0 7 10-20 * *",
    description: "Verificare zilnică între 10–20 ale lunii — atenționare diferențe P300/D300.",
  },
  {
    name: "anaf-retry-queue",
    path: "/api/cron/anaf-retry-queue",
    schedule: "*/15 * * * *",
    description: "La fiecare 15 minute — retry pentru transmisii ANAF eșuate.",
  },
  {
    name: "spv-realtime-monitor",
    path: "/api/cron/spv-realtime-monitor",
    schedule: "0 4,10,14,18 * * *",
    description: "4×/zi — verifică SPV ANAF pentru mesaje noi (notificări, conformare, e-TVA).",
  },
  {
    name: "agent-orchestrator",
    path: "/api/cron/agent-orchestrator",
    schedule: "0 6 * * *",
    description: "Agent zilnic — orchestrator pentru toate task-urile compliance.",
  },
  {
    name: "agent-regulatory-radar",
    path: "/api/cron/agent-regulatory-radar",
    schedule: "0 7 * * 1",
    description: "Săptămânal Luni 07:00 — scanare modificări legislative ANAF/CECCAR.",
  },
  {
    name: "audit-pack-monthly",
    path: "/api/cron/audit-pack-monthly",
    schedule: "0 8 1 * *",
    description: "Lunar pe 1 — audit pack pentru fiecare org (PDF + JSON).",
  },
  {
    name: "daily-digest",
    path: "/api/cron/daily-digest",
    schedule: "30 7 * * *",
    description: "Email zilnic 07:30 — digest cu finding-uri noi pentru contabili.",
  },
  {
    name: "drift-sweep",
    path: "/api/cron/drift-sweep",
    schedule: "0 3 * * *",
    description: "Zilnic 03:00 — detecție drift între state și surse (e-Factura, SAF-T).",
  },
  {
    name: "efactura-spv-monthly",
    path: "/api/cron/efactura-spv-monthly",
    schedule: "0 9 5 * *",
    description: "Lunar pe 5 — sincronizare e-Factura SPV cu SmartBill/Oblio.",
  },
  {
    name: "inspector-weekly",
    path: "/api/cron/inspector-weekly",
    schedule: "0 8 * * 1",
    description: "Săptămânal Luni 08:00 — inspector compliance pentru toate orgs.",
  },
  {
    name: "legislation-monitor",
    path: "/api/cron/legislation-monitor",
    schedule: "0 6 * * *",
    description: "Zilnic 06:00 — monitor legislativ ANAF/MF.",
  },
  {
    name: "monthly-digest",
    path: "/api/cron/monthly-digest",
    schedule: "0 9 1 * *",
    description: "Lunar pe 1 — digest lunar cu metrici compliance pentru manageri.",
  },
  {
    name: "partner-monthly-report",
    path: "/api/cron/partner-monthly-report",
    schedule: "0 10 1 * *",
    description: "Lunar pe 1 — raport partner cu portfolio + risc agregat.",
  },
  {
    name: "renewal-reminder",
    path: "/api/cron/renewal-reminder",
    schedule: "0 9 * * *",
    description: "Zilnic 09:00 — reminders pentru reînnoiri abonamente.",
  },
  {
    name: "scheduled-reports",
    path: "/api/cron/scheduled-reports",
    schedule: "*/30 * * * *",
    description: "La 30 minute — execuție rapoarte programate de utilizatori.",
  },
  {
    name: "score-snapshot",
    path: "/api/cron/score-snapshot",
    schedule: "0 23 * * *",
    description: "Zilnic 23:00 — snapshot scor compliance pentru istoric.",
  },
  {
    name: "vendor-review-revalidation",
    path: "/api/cron/vendor-review-revalidation",
    schedule: "0 9 * * 1",
    description: "Săptămânal Luni 09:00 — revalidare vendor reviews.",
  },
  {
    name: "vendor-sync-monthly",
    path: "/api/cron/vendor-sync-monthly",
    schedule: "0 10 1 * *",
    description: "Lunar pe 1 — sincronizare cataloage vendor.",
  },
  {
    name: "weekly-digest",
    path: "/api/cron/weekly-digest",
    schedule: "0 8 * * 1",
    description: "Săptămânal Luni 08:00 — digest săptămânal echipă compliance.",
  },
]
