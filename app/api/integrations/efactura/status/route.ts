// GET /api/integrations/efactura/status
// Sprint 8 — ANAF Live Readiness
// Returnează modul de operare (mock | real) și starea conexiunii.
// Clientul UI folosește asta pentru a afișa mesaje clare despre ce lipsește.

import { NextResponse } from "next/server"

import { getAnafMode } from "@/lib/server/efactura-anaf-client"
import { readState } from "@/lib/server/mvp-store"

export async function GET() {
  const mode = getAnafMode()
  const state = await readState()

  const isLive = mode === "real"
  const hasCui = !!process.env.ANAF_CUI

  return NextResponse.json({
    mode,
    connected: state.efacturaConnected,
    syncedAtISO: state.efacturaSyncedAtISO ?? null,
    // Guidance pentru UI
    ready: isLive && hasCui,
    missingConfig: [
      !process.env.ANAF_CLIENT_ID && "ANAF_CLIENT_ID",
      !process.env.ANAF_CLIENT_SECRET && "ANAF_CLIENT_SECRET",
      !hasCui && "ANAF_CUI",
    ].filter(Boolean) as string[],
    message: isLive
      ? "Mod real ANAF activ. Verificați periodicitatea sync-ului."
      : "Mod demo activ. Setați ANAF_CLIENT_ID, ANAF_CLIENT_SECRET și ANAF_CUI pentru date reale.",
  })
}
