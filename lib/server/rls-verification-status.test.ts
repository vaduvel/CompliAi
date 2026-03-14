import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { promises as fs } from "node:fs"
import os from "node:os"
import path from "node:path"

describe("lib/server/rls-verification-status", () => {
  const originalFile = process.env.COMPLISCAN_RLS_VERIFICATION_FILE
  let tempDir = ""

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "compliscan-rls-"))
    process.env.COMPLISCAN_RLS_VERIFICATION_FILE = path.join(tempDir, "last-rls.json")
  })

  afterEach(async () => {
    if (originalFile) {
      process.env.COMPLISCAN_RLS_VERIFICATION_FILE = originalFile
    } else {
      delete process.env.COMPLISCAN_RLS_VERIFICATION_FILE
    }
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it("returns degraded when marker is missing", async () => {
    const { getRlsVerificationReadiness } = await import("@/lib/server/rls-verification-status")

    const result = await getRlsVerificationReadiness()

    expect(result.ready).toBe(false)
    expect(result.state).toBe("degraded")
    expect(result.blockers[0]).toContain("npm run verify:supabase:rls")
  })

  it("returns healthy for fresh successful marker", async () => {
    await fs.writeFile(
      process.env.COMPLISCAN_RLS_VERIFICATION_FILE!,
      JSON.stringify({
        checkedAtISO: new Date().toISOString(),
        ready: true,
        blockers: [],
      }),
      "utf8"
    )

    const { getRlsVerificationReadiness } = await import("@/lib/server/rls-verification-status")
    const result = await getRlsVerificationReadiness()

    expect(result.ready).toBe(true)
    expect(result.state).toBe("healthy")
  })

  it("returns degraded when marker is stale", async () => {
    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    await fs.writeFile(
      process.env.COMPLISCAN_RLS_VERIFICATION_FILE!,
      JSON.stringify({
        checkedAtISO: staleDate,
        ready: true,
        blockers: [],
      }),
      "utf8"
    )

    const { getRlsVerificationReadiness } = await import("@/lib/server/rls-verification-status")
    const result = await getRlsVerificationReadiness()

    expect(result.ready).toBe(false)
    expect(result.summary).toContain("prea veche")
  })
})
