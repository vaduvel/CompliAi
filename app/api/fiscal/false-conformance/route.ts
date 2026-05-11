// False conformance detector endpoint — primește notificări manual înregistrate
// (sau detectate automat din SPV viitor) + verifică dacă pot fi false pozitiv
// pe baza facturilor reale primite în SPV + documentelor justificative existente.

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import {
  detectFalseConformance,
  type AnafNotification,
  type OrgFiscalEvidence,
} from "@/lib/compliance/false-conformance-detector"
import { ensureValidToken, fetchSpvMessages } from "@/lib/anaf-spv-client"
import type { ComplianceState } from "@/lib/compliance/types"

export async function POST(request: Request) {
  let session
  try {
    session = await requireFreshAuthenticatedSession(request, "false conformance check")
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const e = err as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Auth eșuată.", 401, "FC_AUTH_FAILED")
  }

  let body: { notification?: AnafNotification }
  try {
    body = (await request.json()) as { notification?: AnafNotification }
  } catch {
    return jsonError("Body invalid.", 400, "FC_INVALID_BODY")
  }

  if (!body.notification || !body.notification.type) {
    return jsonError("Notificarea lipsește din body.", 400, "FC_NO_NOTIFICATION")
  }

  const state = (await readStateForOrg(session.orgId)) as ComplianceState | null
  if (!state) return jsonError("State indisponibil.", 500, "FC_STATE_UNAVAILABLE")

  const cui = state.orgProfile?.cui
  let receivedInvoices: OrgFiscalEvidence["receivedInvoices"] = []

  if (cui) {
    try {
      const tokenResult = await ensureValidToken(session.orgId, new Date().toISOString())
      if (tokenResult.token && !tokenResult.expired) {
        const cleanCif = cui.replace(/^RO/i, "")
        const spv = await fetchSpvMessages(tokenResult.token.accessToken, cleanCif, 90)
        if (spv && !spv.eroare && spv.mesaje) {
          receivedInvoices = spv.mesaje
            .filter((m) => /factur|primit/i.test(m.tip + m.detalii))
            .map((m) => {
              const numMatch = m.detalii.match(/(?:factura|nr|nr\.)\s*([A-Z]+[-]?\d+)/i)
              const cifMatch = m.detalii.match(/RO?\d{6,10}/i)
              return {
                invoiceNumber: numMatch?.[1] ?? "",
                supplierCif: (cifMatch?.[0] ?? "").replace(/^RO/i, ""),
                issueDate: m.dataCreare,
                spvIndex: m.id,
                receivedAtISO: m.dataCreare,
              }
            })
            .filter((i) => i.invoiceNumber)
        }
      }
    } catch {
      // SPV unavailable — proceed cu receivedInvoices empty
    }
  }

  const evidence: OrgFiscalEvidence = {
    receivedInvoices,
    expenseDocuments: [], // TODO: viitor — vine din state.clientPortalDocuments + alte surse
    p300Items: [], // TODO: viitor — vine din state.p300Checks
  }

  const assessment = detectFalseConformance(body.notification, evidence)

  return NextResponse.json({
    ok: true,
    assessment,
    evidence: {
      receivedInvoicesCount: receivedInvoices.length,
      expenseDocumentsCount: 0,
      p300ItemsCount: 0,
    },
  })
}
