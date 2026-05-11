// S3.3 — Tests pentru waitlist signup logic.

import { promises as fs } from "node:fs"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  countByIcpSegment,
  listWaitlistEntries,
  signupForWaitlist,
} from "./waitlist-store"

const FILE_PATH = path.join(process.cwd(), ".data", "waitlist.json")

async function clearStore() {
  try {
    await fs.unlink(FILE_PATH)
  } catch {
    // file did not exist
  }
}

describe("waitlist-store", () => {
  afterEach(async () => {
    await clearStore()
    // Forțează cache reset prin re-import? Mai pragmatic — folosim emails unice per test.
  })

  it("normalizează emailul (lowercase, trim)", async () => {
    const result = await signupForWaitlist({
      email: "  TestNorm@FIRMA.RO  ",
      icpSegment: "cabinet-dpo",
      source: "/dpo",
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.entry.email).toBe("testnorm@firma.ro")
    }
  })

  it("respinge email invalid (fără @)", async () => {
    const result = await signupForWaitlist({
      email: "invalid-no-at",
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain("invalid")
    }
  })

  it("respinge email gol", async () => {
    const result = await signupForWaitlist({
      email: "   ",
    })
    expect(result.ok).toBe(false)
  })

  it("idempotent — re-signup actualizează count + timestamp", async () => {
    const first = await signupForWaitlist({
      email: "idempotent-test@firma.ro",
      icpSegment: "cabinet-fiscal",
      source: "/fiscal",
    })
    expect(first.ok).toBe(true)
    if (first.ok) expect(first.alreadyOnList).toBe(false)

    // Așteaptă 5ms ca să avem timestamp diferit
    await new Promise((r) => setTimeout(r, 5))

    const second = await signupForWaitlist({
      email: "idempotent-test@firma.ro",
      icpSegment: "cabinet-fiscal",
      source: "/fiscal",
    })
    expect(second.ok).toBe(true)
    if (second.ok) {
      expect(second.alreadyOnList).toBe(true)
      expect(second.entry.signedUpAgainCount).toBe(1)
      // Timestamp nou e > primul
      if (first.ok) {
        expect(second.entry.signedUpAtISO >= first.entry.signedUpAtISO).toBe(true)
      }
    }
  })

  it("re-signup actualizează context + icpSegment dacă sunt furnizate", async () => {
    await signupForWaitlist({
      email: "update-context@firma.ro",
      icpSegment: "solo",
      source: "/",
    })
    const second = await signupForWaitlist({
      email: "update-context@firma.ro",
      icpSegment: "enterprise",
      source: "/nis2",
      context: "Update: Vrem multi-framework",
    })
    expect(second.ok).toBe(true)
    if (second.ok) {
      expect(second.entry.icpSegment).toBe("enterprise")
      expect(second.entry.source).toBe("/nis2")
      expect(second.entry.context).toBe("Update: Vrem multi-framework")
    }
  })

  it("countByIcpSegment grupează corect", async () => {
    await signupForWaitlist({ email: "a@firma.ro", icpSegment: "cabinet-dpo" })
    await signupForWaitlist({ email: "b@firma.ro", icpSegment: "cabinet-dpo" })
    await signupForWaitlist({ email: "c@firma.ro", icpSegment: "imm-internal" })
    await signupForWaitlist({ email: "d@firma.ro", icpSegment: null })

    const counts = await countByIcpSegment()
    expect(counts["cabinet-dpo"]).toBeGreaterThanOrEqual(2)
    expect(counts["imm-internal"]).toBeGreaterThanOrEqual(1)
    expect(counts["unknown"]).toBeGreaterThanOrEqual(1)
  })

  it("listWaitlistEntries returnează array", async () => {
    const all = await listWaitlistEntries()
    expect(Array.isArray(all)).toBe(true)
  })
})
