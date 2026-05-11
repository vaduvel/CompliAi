// Sprint 9 — tests pentru cron-status-store.
//
// Verifică record/read roundtrip, sortarea descrescătoare după data run-ului,
// merge-ul între CONFIGURED_CRONS și records (pentru observability page),
// withCronRecording wrapper pe success + error path.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
  mkdirMock: vi.fn(),
  hasSupabaseConfigMock: vi.fn(),
  getConfiguredDataBackendMock: vi.fn(),
}))

vi.mock("node:fs", () => ({
  promises: {
    readFile: mocks.readFileMock,
    writeFile: mocks.writeFileMock,
    mkdir: mocks.mkdirMock,
  },
}))

vi.mock("@/lib/server/supabase-rest", () => ({
  hasSupabaseConfig: mocks.hasSupabaseConfigMock,
  supabaseSelect: vi.fn(),
  supabaseUpsert: vi.fn(),
}))

vi.mock("@/lib/server/supabase-tenancy", () => ({
  getConfiguredDataBackend: mocks.getConfiguredDataBackendMock,
}))

vi.mock("@/lib/server/fs-safe", () => ({
  writeFileSafe: mocks.writeFileMock,
}))

import {
  CONFIGURED_CRONS,
  getAllCronStatuses,
  recordCronRun,
  withCronRecording,
} from "./cron-status-store"

describe("cron-status-store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.hasSupabaseConfigMock.mockReturnValue(false)
    mocks.getConfiguredDataBackendMock.mockReturnValue("local")
    mocks.mkdirMock.mockResolvedValue(undefined)
    mocks.writeFileMock.mockResolvedValue(undefined)
    mocks.readFileMock.mockRejectedValue(new Error("ENOENT"))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("getAllCronStatuses returnează listă goală când nu există records", async () => {
    const records = await getAllCronStatuses()
    expect(records).toEqual([])
  })

  it("recordCronRun persistă fișierul prin writeFileSafe", async () => {
    await recordCronRun({
      name: "fiscal-reminders",
      lastRunAtISO: "2026-04-15T05:30:00.000Z",
      ok: true,
      durationMs: 1234,
      summary: "5 emails sent",
      stats: { emailsSent: 5 },
    })
    expect(mocks.writeFileMock).toHaveBeenCalledTimes(1)
    const [path, body] = mocks.writeFileMock.mock.calls[0]
    expect(path).toContain("cron-status-global.json")
    const parsed = JSON.parse(body as string)
    expect(parsed.records["fiscal-reminders"]).toMatchObject({
      ok: true,
      durationMs: 1234,
      summary: "5 emails sent",
    })
  })

  it("getAllCronStatuses sortează descrescător după lastRunAtISO", async () => {
    mocks.readFileMock.mockResolvedValue(
      JSON.stringify({
        records: {
          older: {
            name: "older",
            lastRunAtISO: "2026-01-01T00:00:00.000Z",
            ok: true,
            durationMs: 100,
            summary: "older",
          },
          newer: {
            name: "newer",
            lastRunAtISO: "2026-04-15T00:00:00.000Z",
            ok: true,
            durationMs: 200,
            summary: "newer",
          },
          middle: {
            name: "middle",
            lastRunAtISO: "2026-03-01T00:00:00.000Z",
            ok: true,
            durationMs: 150,
            summary: "middle",
          },
        },
      }),
    )
    const records = await getAllCronStatuses()
    expect(records.map((r) => r.name)).toEqual(["newer", "middle", "older"])
  })

  it("CONFIGURED_CRONS conține toate cele 4 cron-uri fiscal critice", () => {
    const names = CONFIGURED_CRONS.map((c) => c.name)
    expect(names).toContain("fiscal-reminders")
    expect(names).toContain("p300-monthly-check")
    expect(names).toContain("anaf-retry-queue")
    expect(names).toContain("spv-realtime-monitor")
  })

  it("CONFIGURED_CRONS schedule-uri sunt în format crontab valid", () => {
    for (const cron of CONFIGURED_CRONS) {
      // 5 fields separated by whitespace
      expect(cron.schedule.split(/\s+/)).toHaveLength(5)
    }
  })

  it("withCronRecording salvează un record success cu summary", async () => {
    const result = await withCronRecording("test-cron", async () => ({
      summary: "all good",
      stats: { count: 7 },
    }))
    expect(result.summary).toBe("all good")
    expect(mocks.writeFileMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(mocks.writeFileMock.mock.calls[0][1] as string)
    expect(body.records["test-cron"]).toMatchObject({
      ok: true,
      summary: "all good",
      stats: { count: 7 },
    })
    expect(body.records["test-cron"].durationMs).toBeGreaterThanOrEqual(0)
  })

  it("withCronRecording salvează ok:false + errorMessage când body aruncă", async () => {
    await expect(
      withCronRecording("test-fail", async () => {
        throw new Error("boom")
      }),
    ).rejects.toThrow("boom")

    expect(mocks.writeFileMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(mocks.writeFileMock.mock.calls[0][1] as string)
    expect(body.records["test-fail"]).toMatchObject({
      ok: false,
      errorMessage: "boom",
    })
  })

  it("recordCronRun overwrite atunci când același name e re-rulat", async () => {
    // Prima rulare
    mocks.readFileMock.mockRejectedValueOnce(new Error("ENOENT"))
    await recordCronRun({
      name: "anaf-retry-queue",
      lastRunAtISO: "2026-04-15T10:00:00.000Z",
      ok: true,
      durationMs: 100,
      summary: "first",
    })

    // Refresh — read returnează ce am scris
    const firstWrite = mocks.writeFileMock.mock.calls[0][1] as string
    mocks.readFileMock.mockResolvedValueOnce(firstWrite)

    // A doua rulare
    await recordCronRun({
      name: "anaf-retry-queue",
      lastRunAtISO: "2026-04-15T10:15:00.000Z",
      ok: false,
      durationMs: 200,
      summary: "second",
      errorMessage: "failed",
    })

    expect(mocks.writeFileMock).toHaveBeenCalledTimes(2)
    const final = JSON.parse(mocks.writeFileMock.mock.calls[1][1] as string)
    expect(final.records["anaf-retry-queue"]).toMatchObject({
      summary: "second",
      ok: false,
      errorMessage: "failed",
    })
  })
})
