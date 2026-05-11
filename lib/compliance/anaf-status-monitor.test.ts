import { describe, expect, it } from "vitest"
import { buildSnapshot, type AnafProbeResult } from "./anaf-status-monitor"

const NOW = "2026-05-11T12:00:00.000Z"

function probe(
  endpoint: AnafProbeResult["endpoint"],
  ok: boolean,
  hoursAgo: number,
): AnafProbeResult {
  const ts = new Date(new Date(NOW).getTime() - hoursAgo * 3_600_000).toISOString()
  return { endpoint, ok, durationMs: 200, probedAtISO: ts }
}

describe("anaf-status-monitor — buildSnapshot", () => {
  it("returnează unknown când nu există probes", () => {
    const snap = buildSnapshot([], NOW)
    for (const ep of snap.endpoints) {
      expect(ep.currentStatus).toBe("unknown")
      expect(ep.last24hUptimePct).toBe(0)
    }
    expect(snap.recentIncidents).toEqual([])
  })

  it("operational când uptime ≥95% + ultimul probe ok", () => {
    const history: AnafProbeResult[] = []
    for (let h = 0; h < 24; h++) history.push(probe("tva_registry", true, h))
    history.push(probe("tva_registry", true, 0))
    const snap = buildSnapshot(history, NOW)
    const tva = snap.endpoints.find((e) => e.id === "tva_registry")!
    expect(tva.currentStatus).toBe("operational")
    expect(tva.last24hUptimePct).toBe(100)
  })

  it("down când ultimul probe a eșuat", () => {
    const history: AnafProbeResult[] = [
      probe("efactura_oauth", true, 23),
      probe("efactura_oauth", true, 12),
      probe("efactura_oauth", false, 1),
      probe("efactura_oauth", false, 0),
    ]
    const snap = buildSnapshot(history, NOW)
    const ef = snap.endpoints.find((e) => e.id === "efactura_oauth")!
    expect(ef.currentStatus).toBe("down")
  })

  it("degraded când uptime între 70-95%", () => {
    const history: AnafProbeResult[] = []
    // 9 OK, 1 fail = 90% uptime
    for (let h = 1; h <= 9; h++) history.push(probe("spv_messages", true, h))
    history.push(probe("spv_messages", false, 10))
    history.push(probe("spv_messages", true, 0))
    const snap = buildSnapshot(history, NOW)
    const spv = snap.endpoints.find((e) => e.id === "spv_messages")!
    expect(spv.currentStatus).toBe("degraded")
  })

  it("detectează incidents (perioade consecutive down)", () => {
    const history: AnafProbeResult[] = [
      probe("tva_registry", true, 5),
      probe("tva_registry", false, 4),
      probe("tva_registry", false, 3),
      probe("tva_registry", true, 2),
      probe("tva_registry", true, 1),
    ]
    const snap = buildSnapshot(history, NOW)
    const tvaIncidents = snap.recentIncidents.filter((i) => i.endpoint === "tva_registry")
    expect(tvaIncidents).toHaveLength(1)
    expect(tvaIncidents[0].durationMin).toBeGreaterThan(0)
    expect(tvaIncidents[0].endISO).toBeDefined()
  })

  it("incident încă activ (fără endISO) când ultimul probe e fail", () => {
    const history: AnafProbeResult[] = [
      probe("tva_registry", false, 2),
      probe("tva_registry", false, 1),
    ]
    const snap = buildSnapshot(history, NOW)
    const inc = snap.recentIncidents.find((i) => i.endpoint === "tva_registry")
    expect(inc).toBeDefined()
    expect(inc?.endISO).toBeUndefined()
  })
})
