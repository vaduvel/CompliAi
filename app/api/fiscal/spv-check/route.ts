// S3.5 — SPV registration check + signal→finding conversion
// POST: checks if org (by CUI) is registered in ANAF SPV
// If ANAF OAuth token is available, fetches recent SPV messages and converts
// rejected/error signals into ScanFindings.
// If no token, performs basic CUI→TVA public check and flags missing SPV.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readState, mutateState } from "@/lib/server/mvp-store"
import { ensureValidToken, fetchSpvMessages, type SpvMessage } from "@/lib/anaf-spv-client"
import type { ScanFinding } from "@/lib/compliance/types"

const WRITE_ROLES = ["owner", "partner_manager", "compliance", "reviewer"] as const

export type SpvCheckResult = {
  cui: string
  spvRegistered: boolean | null  // null = could not determine
  tokenAvailable: boolean
  messagesChecked: number
  newFindings: number
  signals: SpvSignalSummary[]
}

type SpvSignalSummary = {
  messageId: string
  type: string
  date: string
  detail: string
  converted: boolean
}

function spvMessageToFinding(msg: SpvMessage, orgName: string, nowISO: string): ScanFinding {
  const isRejected = msg.tip.toLowerCase().includes("erori") || msg.tip.toLowerCase().includes("respins")
  const severity = isRejected ? "high" : "medium"

  return {
    id: `spv-${msg.id}`,
    title: isRejected
      ? `Factură respinsă ANAF — ${msg.detalii.slice(0, 80)}`
      : `Semnal SPV: ${msg.tip} — ${msg.detalii.slice(0, 80)}`,
    detail: `Mesaj SPV din ${msg.dataCreare}: ${msg.detalii}`,
    category: "E_FACTURA",
    severity,
    risk: severity === "high" ? "high" : "low",
    principles: [],
    createdAtISO: nowISO,
    sourceDocument: "ANAF SPV",
    scanId: `spv-check-${nowISO.split("T")[0]}`,
    impactSummary: isRejected
      ? "Factura a fost respinsă de ANAF. Corectează eroarea și retrimite din programul de facturare."
      : `Semnal ${msg.tip} detectat în SPV. Verifică și acționează conform regulilor ANAF.`,
    remediationHint: isRejected
      ? "Corectează eroarea XML/UBL în programul de facturare și retrimite factura. Confirmă manual în CompliAI după rezolvare."
      : "Verifică mesajul în SPV și acționează dacă este necesar.",
  }
}

function buildMissingSpvFinding(cui: string, nowISO: string): ScanFinding {
  return {
    id: `spv-missing-${cui}`,
    title: "Înregistrare SPV lipsă",
    detail: `Organizația cu CUI ${cui} nu pare a fi înregistrată în Spațiul Privat Virtual ANAF. Înregistrarea este obligatorie pentru e-Factura.`,
    category: "E_FACTURA",
    severity: "high",
    risk: "high",
    principles: [],
    createdAtISO: nowISO,
    sourceDocument: "SPV Check",
    scanId: `spv-check-${nowISO.split("T")[0]}`,
    impactSummary: "Fără SPV nu poți primi/trimite e-Facturi conform obligațiilor ANAF.",
    remediationHint: "Accesează https://www.anaf.ro/anaf/internet/ANAF/despre_anaf/servicii_online/SPV și înregistrează-te cu certificatul digital calificat.",
  }
}

export async function POST(request: Request) {
  try {
    requireRole(request, [...WRITE_ROLES], "verificare SPV")

    const state = await readState()
    const cui = state.orgProfile?.cui
    if (!cui) {
      return jsonError("CUI-ul organizației nu este configurat. Completează profilul mai întâi.", 400, "NO_CUI")
    }

    const orgId = request.headers.get("x-compliscan-org-id") ?? ""
    const orgName = request.headers.get("x-compliscan-org-name") ?? ""
    const nowISO = new Date().toISOString()

    // Try to use ANAF OAuth token for full SPV check
    const { token, expired } = await ensureValidToken(orgId, nowISO)

    const result: SpvCheckResult = {
      cui,
      spvRegistered: null,
      tokenAvailable: !!token,
      messagesChecked: 0,
      newFindings: 0,
      signals: [],
    }

    if (token) {
      // Full SPV check — fetch recent messages (last 30 days)
      const messages = await fetchSpvMessages(token.accessToken, cui.replace(/^RO/i, ""), 30)

      if (messages?.eroare) {
        // ANAF returned an error — likely not registered
        result.spvRegistered = false
      } else if (messages?.mesaje) {
        result.spvRegistered = true
        result.messagesChecked = messages.mesaje.length

        // Convert error/rejection messages to findings
        const errorMessages = messages.mesaje.filter(
          (m) =>
            m.tip.toLowerCase().includes("erori") ||
            m.tip.toLowerCase().includes("respins")
        )

        const existingFindingIds = new Set(state.findings.map((f) => f.id))
        const newFindings: ScanFinding[] = []

        for (const msg of errorMessages) {
          const finding = spvMessageToFinding(msg, orgName, nowISO)
          if (!existingFindingIds.has(finding.id)) {
            newFindings.push(finding)
          }
          result.signals.push({
            messageId: msg.id,
            type: msg.tip,
            date: msg.dataCreare,
            detail: msg.detalii.slice(0, 120),
            converted: !existingFindingIds.has(finding.id),
          })
        }

        if (newFindings.length > 0) {
          await mutateState((s) => {
            s.findings.push(...newFindings)
            return s
          })
          result.newFindings = newFindings.length
        }
      }
    } else {
      // No token — check basic ANAF public API for TVA status
      // This gives us a hint about SPV registration
      try {
        const cleanCui = cui.replace(/^RO/i, "").replace(/\D/g, "")
        const today = new Date().toISOString().split("T")[0]
        const res = await fetch("https://webservicesp.anaf.ro/AsynchWebService/api/v8/ws/tva", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([{ cui: Number(cleanCui), data: today }]),
          signal: AbortSignal.timeout(10_000),
        })
        if (res.ok) {
          const data = (await res.json()) as { found?: Array<{ scpTVA?: boolean }> }
          const record = data.found?.[0]
          // If we get a response, the CUI is valid. SPV registration itself
          // cannot be checked via public API — we mark as unknown.
          result.spvRegistered = record ? null : false
        }
      } catch {
        // Public API unavailable — leave as null
      }

      // If we couldn't confirm SPV and token is expired, add a finding
      if (result.spvRegistered === false) {
        const missingFinding = buildMissingSpvFinding(cui, nowISO)
        const existingIds = new Set(state.findings.map((f) => f.id))
        if (!existingIds.has(missingFinding.id)) {
          await mutateState((s) => {
            s.findings.push(missingFinding)
            return s
          })
          result.newFindings = 1
        }
      }

      if (expired) {
        result.signals.push({
          messageId: "token-expired",
          type: "TOKEN_EXPIRED",
          date: nowISO,
          detail: "Token-ul ANAF OAuth a expirat. Reconectează contul ANAF pentru verificare completă.",
          converted: false,
        })
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Eroare la verificarea SPV.", 500, "SPV_CHECK_FAILED")
  }
}
