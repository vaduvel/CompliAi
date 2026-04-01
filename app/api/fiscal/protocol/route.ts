import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  buildFiscalProtocolDerived,
  getFiscalProtocolKey,
} from "@/lib/compliance/fiscal-protocol"
import type { FiscalProtocolFindingType, FiscalProtocolRecord } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateState, readState } from "@/lib/server/mvp-store"
import { fireDriftTrigger } from "@/lib/server/drift-trigger-engine"

type FiscalProtocolBody = {
  findingId?: string
  findingTypeId?: FiscalProtocolFindingType
  invoiceRef?: string
  actionStatus?: FiscalProtocolRecord["actionStatus"]
  spvReference?: string
  receiptStatus?: FiscalProtocolRecord["receiptStatus"]
  receiptReceivedAtISO?: string
  evidenceLocation?: string
  operatorNote?: string
}

function normalizeFindingTypeId(value: unknown): FiscalProtocolFindingType | null {
  return value === "EF-004" || value === "EF-005" ? value : null
}

function normalizeActionStatus(value: unknown): FiscalProtocolRecord["actionStatus"] {
  return value === "checked_pending" ||
    value === "transmitted" ||
    value === "retransmitted" ||
    value === "ok" ||
    value === "rejected" ||
    value === "escalated"
    ? value
    : undefined
}

function normalizeReceiptStatus(value: unknown): FiscalProtocolRecord["receiptStatus"] {
  return value === "missing" ||
    value === "received" ||
    value === "accepted" ||
    value === "rejected"
    ? value
    : undefined
}

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance", "reviewer"], "protocolul fiscal")

    const search = new URL(request.url).searchParams
    const findingId = getFiscalProtocolKey(search.get("findingId"))
    const findingTypeId = normalizeFindingTypeId(search.get("findingTypeId"))

    if (!findingTypeId) {
      return jsonError("Protocolul fiscal este disponibil doar pentru EF-004 și EF-005.", 400, "FISCAL_PROTOCOL_TYPE_INVALID")
    }

    const [state, { orgName }] = await Promise.all([readState(), getOrgContext()])
    const protocol = state.fiscalProtocols?.[findingId] ?? null
    const derived = buildFiscalProtocolDerived(protocol, {
      findingId,
      findingTypeId,
      orgName,
    })

    return NextResponse.json({
      findingId,
      findingTypeId,
      protocol,
      derived,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut încărca protocolul fiscal.",
      500,
      "FISCAL_PROTOCOL_READ_FAILED"
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "protocolul fiscal"
    )
    const body = (await request.json().catch(() => null)) as FiscalProtocolBody | null
    const findingId = getFiscalProtocolKey(body?.findingId)
    const findingTypeId = normalizeFindingTypeId(body?.findingTypeId)

    if (!findingTypeId) {
      return jsonError("Protocolul fiscal poate fi salvat doar pentru EF-004 sau EF-005.", 400, "FISCAL_PROTOCOL_TYPE_INVALID")
    }

    const invoiceRef = body?.invoiceRef?.trim() ?? ""
    const spvReference = body?.spvReference?.trim() ?? ""
    const receiptStatus = normalizeReceiptStatus(body?.receiptStatus)
    const receiptReceivedAtISO =
      typeof body?.receiptReceivedAtISO === "string" && !Number.isNaN(Date.parse(body.receiptReceivedAtISO))
        ? new Date(body.receiptReceivedAtISO).toISOString()
        : undefined
    const evidenceLocation = body?.evidenceLocation?.trim() ?? ""
    const operatorNote = body?.operatorNote?.trim() ?? ""
    const actionStatus = normalizeActionStatus(body?.actionStatus)

    if (
      !invoiceRef &&
      !spvReference &&
      (!receiptStatus || receiptStatus === "missing") &&
      !receiptReceivedAtISO &&
      !evidenceLocation &&
      !operatorNote &&
      !actionStatus
    ) {
      return jsonError(
        "Completează măcar un câmp înainte să salvezi protocolul fiscal.",
        400,
        "FISCAL_PROTOCOL_EMPTY"
      )
    }

    const nowISO = new Date().toISOString()
    const { orgId, orgName } = await getOrgContext()
    const currentState = await readState()
    const previousProtocol = currentState.fiscalProtocols?.[findingId] ?? null
    let savedProtocol: FiscalProtocolRecord | null = null

    await mutateState((current) => {
      const protocol: FiscalProtocolRecord = {
        findingId,
        findingTypeId,
        invoiceRef: invoiceRef || undefined,
        actionStatus,
        spvReference: spvReference || undefined,
        receiptStatus,
        receiptReceivedAtISO,
        evidenceLocation: evidenceLocation || undefined,
        operatorNote: operatorNote || undefined,
        updatedAtISO: nowISO,
      }
      savedProtocol = protocol

      return {
        ...current,
        fiscalProtocols: {
          ...(current.fiscalProtocols ?? {}),
          [findingId]: protocol,
        },
        events: appendComplianceEvents(current, [
          createComplianceEvent(
            {
              type: "fiscal.protocol-updated",
              entityType: "integration",
              entityId: findingId,
              message: `Protocolul fiscal a fost actualizat pentru ${orgName}.`,
              createdAtISO: nowISO,
              metadata: {
                findingId,
                findingTypeId,
                actionStatus: actionStatus ?? "unset",
                receiptStatus: receiptStatus ?? "unset",
              },
            },
            {
              id: session.userId,
              label: session.email,
              role: session.role,
              source: "session",
            }
          ),
        ]),
      }
    })

    const derived = buildFiscalProtocolDerived(savedProtocol, {
      findingId,
      findingTypeId,
      orgName,
    })

    if (
      previousProtocol?.actionStatus !== savedProtocol?.actionStatus ||
      previousProtocol?.receiptStatus !== savedProtocol?.receiptStatus
    ) {
      const statusParts = [
        savedProtocol?.actionStatus ? `acțiune: ${savedProtocol.actionStatus}` : null,
        savedProtocol?.receiptStatus ? `recipisă: ${savedProtocol.receiptStatus}` : null,
      ].filter(Boolean)

      await fireDriftTrigger({
        orgId,
        trigger: "efactura_status_change",
        detail: `${findingId} actualizat (${statusParts.join(", ")})`,
      }).catch(() => {})
    }

    return NextResponse.json({
      ok: true,
      findingId,
      findingTypeId,
      protocol: savedProtocol,
      derived,
      feedbackMessage:
        derived.readiness === "ready"
          ? "Protocolul fiscal este pregătit pentru întoarcere în cockpit cu dovadă clară."
          : "Am salvat protocolul fiscal. Mai completează pașii lipsă înainte să revii în cockpit.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut salva protocolul fiscal.",
      500,
      "FISCAL_PROTOCOL_UPDATE_FAILED"
    )
  }
}
