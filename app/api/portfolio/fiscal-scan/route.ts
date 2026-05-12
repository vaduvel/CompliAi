/**
 * Fiscal Scan Orchestrator — Faza 2 REVISED (2026-05-12)
 *
 * POST /api/portfolio/fiscal-scan
 *
 * Iterează clienții cabinet-fiscal-ului (memberships partner_manager active)
 * și pentru fiecare CUI:
 *   1. Probează ANAF SPV cu token-ul cabinetului (listaMesajeFactura?cif=X)
 *   2. Convertește mesajele SPV în EFacturaInvoiceSignal-uri
 *   3. Generează findings (rejected / xml-error / processing-delayed)
 *   4. Salvează findings în state.findings al client-org-ului
 *   5. Stream progress per CUI via Server-Sent Events
 *
 * La final, emite event `fiscal.setup.scan.completed` în state.events al
 * CABINETULUI (NU al client-org-urilor). Acest event e folosit de routing
 * guard SSR ca să detecteze că setup-ul e complet.
 *
 * Comportament error handling:
 *   - CUI fără împuternicire ANAF activă (403/401) → marcăm clientul cu
 *     status="failed" + message="Împuternicire ANAF lipsă"
 *   - Network error / timeout → marcăm "failed" + message error
 *   - Niciun mesaj relevant (succes dar 0 findings) → marcăm "complete" cu 0
 */

import { cookies } from "next/headers"
import {
  SESSION_COOKIE,
  listUserMemberships,
  refreshSessionPayload,
  verifySessionToken,
} from "@/lib/server/auth"
import {
  buildEFacturaRiskFindings,
  type EFacturaInvoiceSignal,
} from "@/lib/compliance/efactura-risk"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { ensureValidToken, fetchSpvMessages, type SpvMessage } from "@/lib/anaf-spv-client"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// ── Helpers ──────────────────────────────────────────────────────────────────

function spvMessageToSignal(msg: SpvMessage): EFacturaInvoiceSignal {
  const tipLower = msg.tip.toLowerCase()
  const detaliiLower = msg.detalii.toLowerCase()
  let status: EFacturaInvoiceSignal["status"] = "rejected"
  if (tipLower.includes("xml") || detaliiLower.includes("xml")) {
    status = "xml-error"
  } else if (
    tipLower.includes("prelucrare") ||
    detaliiLower.includes("in prelucrare") ||
    detaliiLower.includes("așteapt")
  ) {
    status = "processing-delayed"
  }
  const vendorMatch = msg.detalii.match(
    /(?:furnizor|emitent|vânzător|seller)\s*[:=-]?\s*([^,\n]+)/i,
  )
  const vendorName = vendorMatch?.[1]?.trim().slice(0, 80) ?? `CIF ${msg.cif}`
  return {
    id: `spv-${msg.id}`,
    vendorName,
    date: msg.dataCreare,
    status,
    reason: msg.detalii.slice(0, 200),
    isTechVendor: false,
  }
}

type ScanItem = {
  cui: string
  orgName: string
  status: "pending" | "scanning" | "complete" | "failed"
  findingsCount?: number
  message?: string
}

function sseEvent(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

// ── Main handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  const verifiedSession = sessionToken ? verifySessionToken(sessionToken) : null
  const session = verifiedSession ? await refreshSessionPayload(verifiedSession) : null
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Determinăm cabinet's own org (owner membership) — DIFERIT de session.orgId
  // care poate fi client curent în partner mode.
  const memberships = await listUserMemberships(session.userId)
  const ownerMembership = memberships.find((m) => m.role === "owner")
  const cabinetOrgId = ownerMembership?.orgId ?? session.orgId

  // Verifică că suntem cabinet-fiscal (defensive)
  try {
    const wl = await getWhiteLabelConfig(cabinetOrgId)
    if (wl.icpSegment !== "cabinet-fiscal") {
      return new Response(
        JSON.stringify({ error: "Scan-ul fiscal e disponibil doar pentru cabinet-fiscal." }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      )
    }
  } catch {
    return new Response(JSON.stringify({ error: "ICP lookup eșuat." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Lista clienților = partner_manager memberships ≠ cabinetOrgId
  const clientMemberships = memberships.filter(
    (m) => m.status === "active" && m.role === "partner_manager" && m.orgId !== cabinetOrgId,
  )

  if (clientMemberships.length === 0) {
    return new Response(
      JSON.stringify({ error: "Niciun client în portofoliu. Importă întâi (CSV/ERP)." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    )
  }

  const nowISO = new Date().toISOString()

  // Build SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (payload: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseEvent(payload)))

      try {
        let totalFindings = 0
        const allItems: ScanItem[] = []

        for (const membership of clientMemberships) {
          // Citește state-ul client-org-ului pentru a obține CUI
          const clientState = await readStateForOrg(membership.orgId).catch(() => null)
          const cui = clientState?.orgProfile?.cui
          const orgName = membership.orgName

          // Mark scanning
          const baseItem: ScanItem = {
            cui: cui ?? membership.orgId,
            orgName,
            status: "scanning",
          }
          emit({ type: "item", item: baseItem })

          if (!cui) {
            // Client fără CUI completat → skip cu warning
            const skipItem: ScanItem = {
              ...baseItem,
              status: "failed",
              message: "CUI lipsă pe profil — completează manual sau re-import.",
            }
            allItems.push(skipItem)
            emit({ type: "item", item: skipItem })
            continue
          }

          // Token ANAF ESTE pe cabinet, NU pe client. Probăm SPV cu cabinet token
          // dar pentru CUI client.
          const { token, expired } = await ensureValidToken(cabinetOrgId, nowISO)
          if (!token || expired) {
            const failItem: ScanItem = {
              ...baseItem,
              status: "failed",
              message: "Token ANAF cabinet lipsă sau expirat — reconectează SPV.",
            }
            allItems.push(failItem)
            emit({ type: "item", item: failItem })
            continue
          }

          try {
            const cleanCif = cui.replace(/^RO/i, "")
            const response = await fetchSpvMessages(token.accessToken, cleanCif, 30)

            if (!response) {
              const failItem: ScanItem = {
                ...baseItem,
                status: "failed",
                message: "Eroare conexiune ANAF SPV.",
              }
              allItems.push(failItem)
              emit({ type: "item", item: failItem })
              continue
            }

            if (response.eroare) {
              // 403/401 = împuternicire lipsă
              const isAuthError = /neautoriz|forbidden|403|401/i.test(response.eroare)
              const msg = isAuthError
                ? "Împuternicire ANAF lipsă pentru acest CUI. Descarcă template PDF din finding."
                : `Eroare ANAF: ${response.eroare.slice(0, 100)}`
              const failItem: ScanItem = { ...baseItem, status: "failed", message: msg }
              allItems.push(failItem)
              emit({ type: "item", item: failItem })
              continue
            }

            const messages = response.mesaje ?? []
            const relevantMessages = messages.filter((m) => {
              const tip = m.tip.toLowerCase()
              const det = m.detalii.toLowerCase()
              return (
                tip.includes("erori") ||
                tip.includes("xml") ||
                det.includes("respins") ||
                det.includes("xml") ||
                det.includes("prelucrare")
              )
            })

            const signals = relevantMessages.map(spvMessageToSignal)
            const findings = buildEFacturaRiskFindings(signals, nowISO)

            // Salvăm findings în client-org state
            if (clientState && findings.length > 0) {
              const existingIds = new Set(clientState.findings.map((f) => f.id))
              const newFindings = findings.filter((f) => !existingIds.has(f.id))
              clientState.findings = [...clientState.findings, ...newFindings]
              await writeStateForOrg(membership.orgId, clientState)
            }

            const completeItem: ScanItem = {
              ...baseItem,
              status: "complete",
              findingsCount: findings.length,
              message:
                findings.length === 0
                  ? "0 findings — client curat"
                  : `${findings.length} findings detectate`,
            }
            allItems.push(completeItem)
            totalFindings += findings.length
            emit({ type: "item", item: completeItem })
          } catch (err) {
            const failItem: ScanItem = {
              ...baseItem,
              status: "failed",
              message: err instanceof Error ? err.message.slice(0, 120) : "Eroare necunoscută.",
            }
            allItems.push(failItem)
            emit({ type: "item", item: failItem })
          }
        }

        // Emit scan.completed event pe state-ul CABINETULUI
        const cabinetState = await readStateForOrg(cabinetOrgId).catch(() => null)
        if (cabinetState) {
          const completedEvent = createComplianceEvent(
            {
              type: "fiscal.setup.scan.completed",
              entityType: "system",
              entityId: `setup-scan-${cabinetOrgId}`,
              message: `Setup fiscal scan completat — ${allItems.length} clienți, ${totalFindings} findings.`,
              createdAtISO: new Date().toISOString(),
              metadata: {
                clientsScanned: allItems.length,
                totalFindings,
                successCount: allItems.filter((i) => i.status === "complete").length,
                failedCount: allItems.filter((i) => i.status === "failed").length,
              },
            },
            { id: "setup-fiscal-orchestrator", label: "Setup Fiscal Orchestrator", source: "system" },
          )
          const updatedCabinetState = {
            ...cabinetState,
            events: appendComplianceEvents(cabinetState, [completedEvent]),
          }
          await writeStateForOrg(cabinetOrgId, updatedCabinetState)
        }

        emit({
          type: "complete",
          totalClients: allItems.length,
          totalFindings,
          successCount: allItems.filter((i) => i.status === "complete").length,
          failedCount: allItems.filter((i) => i.status === "failed").length,
        })
      } catch (err) {
        emit({
          type: "error",
          message: err instanceof Error ? err.message : "Eroare necunoscută orchestrator.",
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  })
}
