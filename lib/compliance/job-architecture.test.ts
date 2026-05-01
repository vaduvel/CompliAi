// Pay Transparency — Job Architecture tests
// Tests pentru types + buildJobArchitecture + computeSalaryRange

import { describe, expect, it } from "vitest"

import {
  buildJobArchitecture,
  computeSalaryRange,
  type JobArchitecture,
} from "./job-architecture"

describe("job-architecture", () => {
  describe("buildJobArchitecture", () => {
    it("builds architecture with deduped + sorted levels and roles", () => {
      const arch = buildJobArchitecture({
        levels: ["mid", "junior", "senior", "junior"],
        roles: ["dev", "marketing", "dev"],
        bands: [],
      })
      expect(arch.levels).toEqual(["junior", "mid", "senior"])
      expect(arch.roles).toEqual(["dev", "marketing"])
      expect(arch.bands).toEqual([])
    })

    it("preserves bands as provided", () => {
      const arch = buildJobArchitecture({
        levels: ["junior", "mid", "senior"],
        roles: ["marketing-specialist"],
        bands: [
          { level: "junior", role: "marketing-specialist", min: 4000, max: 5500 },
          { level: "mid", role: "marketing-specialist", min: 5500, max: 7500 },
          { level: "senior", role: "marketing-specialist", min: 7500, max: 11000 },
        ],
      })
      expect(arch.bands.length).toBe(3)
      expect(arch.bands[0].min).toBe(4000)
      expect(arch.bands[2].max).toBe(11000)
    })

    it("handles empty input gracefully", () => {
      const arch = buildJobArchitecture({ levels: [], roles: [], bands: [] })
      expect(arch.levels).toEqual([])
      expect(arch.roles).toEqual([])
      expect(arch.bands).toEqual([])
    })
  })

  describe("computeSalaryRange", () => {
    const arch: JobArchitecture = buildJobArchitecture({
      levels: ["mid", "senior"],
      roles: ["dev", "marketing"],
      bands: [
        { level: "mid", role: "dev", min: 8000, max: 12000 },
        { level: "senior", role: "dev", min: 12000, max: 18000 },
        { level: "mid", role: "marketing", min: 5500, max: 7500 },
      ],
    })

    it("returns min/mid/max for valid level+role", () => {
      const range = computeSalaryRange(arch, "mid", "dev")
      expect(range).toEqual({ min: 8000, mid: 10000, max: 12000 })
    })

    it("rounds mid value to integer", () => {
      const range = computeSalaryRange(arch, "mid", "marketing")
      expect(range).toEqual({ min: 5500, mid: 6500, max: 7500 })
    })

    it("returns null for missing band combo", () => {
      expect(computeSalaryRange(arch, "junior", "dev")).toBeNull()
      expect(computeSalaryRange(arch, "ceo", "marketing")).toBeNull()
    })

    it("returns null for empty architecture", () => {
      const empty = buildJobArchitecture({ levels: [], roles: [], bands: [] })
      expect(computeSalaryRange(empty, "any", "thing")).toBeNull()
    })

    it("computes mid correctly for asymmetric bands", () => {
      const range = computeSalaryRange(arch, "senior", "dev")
      expect(range).toEqual({ min: 12000, mid: 15000, max: 18000 })
    })
  })
})
