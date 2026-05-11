// ANAF status monitor — pain #9 validat: "Zero alerte status sistem la
// downtime ANAF — contabilii descoperă prin încercări".
//
// Soluție: probe periodic endpoint-urile critice ANAF (TVA registry public,
// e-Factura ping, SPV OAuth) și raportează istoric uptime + downtime events.

export type AnafEndpointId = "tva_registry" | "efactura_oauth" | "spv_messages"

export type AnafProbeResult = {
  endpoint: AnafEndpointId
  ok: boolean
  durationMs: number
  statusCode?: number
  errorMessage?: string
  probedAtISO: string
}

export type AnafStatusSnapshot = {
  /** Per endpoint: status curent + uptime % ultimele 24h. */
  endpoints: Array<{
    id: AnafEndpointId
    label: string
    currentStatus: "operational" | "degraded" | "down" | "unknown"
    last24hUptimePct: number
    lastIncidentAtISO?: string
    lastProbeAtISO?: string
  }>
  /** Toate event-urile downtime din ultimele 7 zile. */
  recentIncidents: Array<{
    endpoint: AnafEndpointId
    startISO: string
    endISO?: string
    durationMin?: number
  }>
}

export const ANAF_ENDPOINTS: Record<AnafEndpointId, { label: string; url: string; timeoutMs: number }> = {
  tva_registry: {
    label: "Registry TVA public ANAF",
    url: "https://webservicesp.anaf.ro/PlatitorTvaRest/api/v9/ws/tva",
    timeoutMs: 5_000,
  },
  efactura_oauth: {
    label: "e-Factura OAuth",
    url: "https://logincert.anaf.ro/anaf-oauth2/v1/authorize",
    timeoutMs: 5_000,
  },
  spv_messages: {
    label: "SPV mesaje API",
    url: "https://api.anaf.ro/prod/FCTEL/rest/listaMesajeFactura",
    timeoutMs: 5_000,
  },
}

/**
 * Probe un endpoint ANAF. Returnează rezultat normalizat.
 * Folosește HEAD/GET ușor — fără payload — doar verificare disponibilitate.
 */
export async function probeAnafEndpoint(
  id: AnafEndpointId,
  nowISO: string,
): Promise<AnafProbeResult> {
  const config = ANAF_ENDPOINTS[id]
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs)
    const res = await fetch(config.url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    }).catch(() => null)
    clearTimeout(timeout)
    const durationMs = Date.now() - start
    if (!res) {
      return {
        endpoint: id,
        ok: false,
        durationMs,
        errorMessage: "Connection failed / timeout",
        probedAtISO: nowISO,
      }
    }
    // ANAF returnează adesea 405 pentru HEAD pe endpoint-uri POST — acceptăm
    // orice cod < 500 ca "endpoint reachable, server up".
    const isUp = res.status < 500
    return {
      endpoint: id,
      ok: isUp,
      durationMs,
      statusCode: res.status,
      errorMessage: isUp ? undefined : `HTTP ${res.status}`,
      probedAtISO: nowISO,
    }
  } catch (err) {
    return {
      endpoint: id,
      ok: false,
      durationMs: Date.now() - start,
      errorMessage: err instanceof Error ? err.message : "unknown error",
      probedAtISO: nowISO,
    }
  }
}

/**
 * Computes snapshot din istoric probes (ultima oră / 24h / 7d).
 * History: lista probe-uri ordonate cronologic.
 */
export function buildSnapshot(
  history: AnafProbeResult[],
  nowISO: string,
): AnafStatusSnapshot {
  const nowMs = new Date(nowISO).getTime()
  const day24Ms = nowMs - 24 * 3_600_000
  const day7Ms = nowMs - 7 * 24 * 3_600_000

  const endpoints = (Object.keys(ANAF_ENDPOINTS) as AnafEndpointId[]).map((id) => {
    const probesForEndpoint = history.filter((p) => p.endpoint === id)
    const last24h = probesForEndpoint.filter(
      (p) => new Date(p.probedAtISO).getTime() >= day24Ms,
    )
    const upCount = last24h.filter((p) => p.ok).length
    const last24hUptimePct = last24h.length > 0
      ? Math.round((upCount / last24h.length) * 100)
      : 0
    const lastProbe = probesForEndpoint[probesForEndpoint.length - 1]
    const lastFailure = probesForEndpoint.filter((p) => !p.ok).pop()

    let currentStatus: "operational" | "degraded" | "down" | "unknown" = "unknown"
    if (lastProbe) {
      if (lastProbe.ok && last24hUptimePct >= 95) currentStatus = "operational"
      else if (lastProbe.ok && last24hUptimePct >= 70) currentStatus = "degraded"
      else if (!lastProbe.ok) currentStatus = "down"
      else currentStatus = "degraded"
    }

    return {
      id,
      label: ANAF_ENDPOINTS[id].label,
      currentStatus,
      last24hUptimePct,
      lastIncidentAtISO: lastFailure?.probedAtISO,
      lastProbeAtISO: lastProbe?.probedAtISO,
    }
  })

  // Incidents = perioade consecutive de down per endpoint în ultimele 7 zile.
  const recentIncidents: AnafStatusSnapshot["recentIncidents"] = []
  for (const id of Object.keys(ANAF_ENDPOINTS) as AnafEndpointId[]) {
    const probesFor = history
      .filter((p) => p.endpoint === id && new Date(p.probedAtISO).getTime() >= day7Ms)
      .sort((a, b) => a.probedAtISO.localeCompare(b.probedAtISO))
    let incidentStart: string | null = null
    for (let i = 0; i < probesFor.length; i++) {
      const p = probesFor[i]
      if (!p.ok && incidentStart === null) {
        incidentStart = p.probedAtISO
      } else if (p.ok && incidentStart !== null) {
        const startMs = new Date(incidentStart).getTime()
        const endMs = new Date(p.probedAtISO).getTime()
        recentIncidents.push({
          endpoint: id,
          startISO: incidentStart,
          endISO: p.probedAtISO,
          durationMin: Math.round((endMs - startMs) / 60_000),
        })
        incidentStart = null
      }
    }
    if (incidentStart !== null) {
      recentIncidents.push({
        endpoint: id,
        startISO: incidentStart,
      })
    }
  }

  return { endpoints, recentIncidents: recentIncidents.sort((a, b) => b.startISO.localeCompare(a.startISO)) }
}
