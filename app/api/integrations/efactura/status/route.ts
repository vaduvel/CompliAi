// GET /api/integrations/efactura/status
// Sprint 8 — ANAF Live Readiness
// Returnează modul de operare (mock | test | real) și starea conexiunii.
// Clientul UI folosește asta pentru a afișa mesaje clare despre ce lipsește.

import { NextResponse } from "next/server"

import { loadTokenFromSupabase } from "@/lib/anaf-spv-client"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import {
  getAnafEnvironment,
  getAnafMode,
  isAnafProductionUnlocked,
} from "@/lib/server/efactura-anaf-client"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"

export async function GET(request: Request) {
  const session = await readFreshSessionFromRequest(request)
  const mode = getAnafMode()
  const environment = getAnafEnvironment()
  const state =
    session == null
      ? normalizeComplianceState(initialComplianceState)
      : (await readStateForOrg(session.orgId)) ?? normalizeComplianceState(initialComplianceState)
  const token = session ? await loadTokenFromSupabase(session.orgId) : null

  const isLive = mode === "real"
  const isSandbox = mode === "test"
  const hasCui = Boolean(state.orgProfile?.cui || process.env.ANAF_CUI)
  const tokenState =
    token == null
      ? "missing"
      : new Date(token.expiresAtISO).getTime() > Date.now()
        ? "active"
        : "expired"

  return NextResponse.json({
    mode,
    environment,
    productionUnlocked: isAnafProductionUnlocked(),
    connected: state.efacturaConnected,
    syncedAtISO: state.efacturaSyncedAtISO ?? null,
    tokenState,
    tokenExpiresAtISO: token?.expiresAtISO ?? null,
    // Guidance pentru UI
    ready: mode !== "mock" && hasCui,
    productionReady: isLive && hasCui,
    missingConfig: [
      !process.env.ANAF_CLIENT_ID && "ANAF_CLIENT_ID",
      !process.env.ANAF_CLIENT_SECRET && "ANAF_CLIENT_SECRET",
      !hasCui && "ANAF_CUI",
    ].filter(Boolean) as string[],
    message: isLive
      ? "Mod real ANAF activ. Verificați periodicitatea sync-ului."
      : isSandbox
        ? "Mod ANAF TEST activ. Transmiterea reală este blocată până la unlock explicit de producție."
        : "Mod demo activ. Setați ANAF_CLIENT_ID, ANAF_CLIENT_SECRET și ANAF_CUI pentru conectarea la sandbox-ul ANAF.",
  })
}
