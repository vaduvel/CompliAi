import { describe, expect, it } from "vitest"

import {
  formatDriftLifecycleStatus,
  isDriftLifecycleOpen,
  isDriftSlaBreached,
  normalizeDriftLifecycleStatus,
} from "./drift-lifecycle"

describe("drift-lifecycle", () => {
  it("identifica starile deschise corect", () => {
    expect(isDriftLifecycleOpen("open")).toBe(true)
    expect(isDriftLifecycleOpen("acknowledged")).toBe(true)
    expect(isDriftLifecycleOpen("in_progress")).toBe(true)
    expect(isDriftLifecycleOpen("resolved")).toBe(false)
  })

  it("normalizeaza fallback-ul de status", () => {
    expect(normalizeDriftLifecycleStatus("waived")).toBe("waived")
    expect(normalizeDriftLifecycleStatus("ceva-necunoscut")).toBe("open")
    expect(normalizeDriftLifecycleStatus("ceva-necunoscut", false)).toBe("resolved")
  })

  it("marcheaza SLA breach doar pe drift-uri inca deschise", () => {
    expect(
      isDriftSlaBreached(
        {
          escalationDueAtISO: "2026-03-01T10:00:00.000Z",
          lifecycleStatus: "open",
          open: true,
        },
        "2026-03-13T10:00:00.000Z"
      )
    ).toBe(true)

    expect(
      isDriftSlaBreached(
        {
          escalationDueAtISO: "2026-03-01T10:00:00.000Z",
          lifecycleStatus: "resolved",
          open: false,
        },
        "2026-03-13T10:00:00.000Z"
      )
    ).toBe(false)
  })

  it("formateaza etichetele pentru UI", () => {
    expect(formatDriftLifecycleStatus("open")).toBe("deschis")
    expect(formatDriftLifecycleStatus("in_progress")).toBe("în lucru")
  })
})
