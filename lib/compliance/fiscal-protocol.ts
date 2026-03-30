import type {
  ComplianceState,
  FiscalProtocolActionStatus,
  FiscalProtocolFindingType,
  FiscalProtocolRecord,
} from "@/lib/compliance/types"

export type FiscalProtocolDerived = {
  findingId: string
  findingTypeId: FiscalProtocolFindingType
  actionStatusLabel: string
  readiness: "draft" | "ready"
  readinessLabel: string
  invoiceRefLabel: string
  checklist: string[]
  missingItems: string[]
  protocolHint: string
  handoffEvidenceNote: string
}

export const FISCAL_PROTOCOL_ACTION_LABELS: Record<FiscalProtocolActionStatus, string> = {
  checked_pending: "verificat, încă în așteptare",
  transmitted: "transmis în SPV",
  retransmitted: "retransmis în SPV",
  ok: "confirmat ok în SPV",
  rejected: "respins din nou",
  escalated: "escaladat către contabil / ERP / ANAF",
}

export function getFiscalProtocolKey(findingId?: string | null) {
  const normalized = findingId?.trim()
  return normalized || "fiscal-protocol"
}

export function normalizeFiscalProtocols(
  value: ComplianceState["fiscalProtocols"] | undefined
): Record<string, FiscalProtocolRecord> {
  if (!value || typeof value !== "object") return {}

  return Object.entries(value).reduce<Record<string, FiscalProtocolRecord>>((acc, [key, entry]) => {
    if (!entry || typeof entry !== "object") return acc

    const findingId = typeof entry.findingId === "string" && entry.findingId.trim()
      ? entry.findingId.trim()
      : key.trim()
    const findingTypeId =
      entry.findingTypeId === "EF-004" || entry.findingTypeId === "EF-005"
        ? entry.findingTypeId
        : null

    if (!findingId || !findingTypeId || !isValidIso(entry.updatedAtISO)) {
      return acc
    }

    const invoiceRef = normalizeOptionalText(entry.invoiceRef)
    const spvReference = normalizeOptionalText(entry.spvReference)
    const evidenceLocation = normalizeOptionalText(entry.evidenceLocation)
    const operatorNote = normalizeOptionalText(entry.operatorNote)
    const actionStatus = normalizeActionStatus(entry.actionStatus)

    if (!invoiceRef && !spvReference && !evidenceLocation && !operatorNote && !actionStatus) {
      return acc
    }

    acc[findingId] = {
      findingId,
      findingTypeId,
      invoiceRef,
      actionStatus,
      spvReference,
      evidenceLocation,
      operatorNote,
      updatedAtISO: entry.updatedAtISO,
    }

    return acc
  }, {})
}

export function buildFiscalProtocolDerived(
  record: FiscalProtocolRecord | null,
  context: {
    findingId: string
    findingTypeId: FiscalProtocolFindingType
    orgName: string
  }
): FiscalProtocolDerived {
  const findingTypeId = record?.findingTypeId ?? context.findingTypeId
  const actionStatus = record?.actionStatus ?? "checked_pending"
  const invoiceRef = record?.invoiceRef?.trim() ?? ""
  const spvReference = record?.spvReference?.trim() ?? ""
  const evidenceLocation = record?.evidenceLocation?.trim() ?? ""
  const operatorNote = record?.operatorNote?.trim() ?? ""

  const invoiceRefLabel =
    findingTypeId === "EF-004" ? "Factură urmărită / mesaj ANAF" : "Factură transmisă / retransmisă"
  const checklist =
    findingTypeId === "EF-004"
      ? [
          "notează factura sau mesajul ANAF urmărit în SPV",
          "confirmă dacă blocajul persistă sau dacă ai retransmis",
          "salvează referința SPV, screenshotul sau locul dovezii finale",
        ]
      : [
          "notează factura care trebuia transmisă în SPV",
          "confirmă transmiterea sau retransmiterea manuală",
          "salvează recipisa SPV ori locul exact unde rămâne dovada finală",
        ]

  const missingItems: string[] = []
  if (!invoiceRef) {
    missingItems.push("referința facturii sau a mesajului urmărit")
  }
  if (actionStatus === "checked_pending") {
    missingItems.push("statusul acțiunii efective din SPV")
  }
  if (!spvReference && !evidenceLocation && !operatorNote) {
    missingItems.push("urma de dovadă: referință SPV, locația dovezii sau nota operatorului")
  }

  const readiness = missingItems.length === 0 ? "ready" : "draft"
  const readinessLabel =
    readiness === "ready" ? "gata de întoarcere în cockpit" : "mai lipsesc detalii de execuție"

  const protocolHint =
    readiness === "ready"
      ? "Protocolul fiscal este suficient de clar ca să întorci o notă auditabilă în cockpit."
      : `Completează ${missingItems.join(", ")} înainte să revii în cockpit cu dovada finală.`

  const evidenceParts = [
    `Protocol fiscal actualizat pentru ${context.orgName}.`,
    invoiceRef ? `${invoiceRefLabel}: ${invoiceRef}.` : null,
    `Status operațional: ${FISCAL_PROTOCOL_ACTION_LABELS[actionStatus]}.`,
    spvReference ? `Referință SPV: ${spvReference}.` : null,
    evidenceLocation ? `Dovada este salvată la: ${evidenceLocation}.` : null,
    operatorNote ? `Notă operator: ${operatorNote}.` : null,
  ].filter(Boolean)

  return {
    findingId: record?.findingId ?? context.findingId,
    findingTypeId,
    actionStatusLabel: FISCAL_PROTOCOL_ACTION_LABELS[actionStatus],
    readiness,
    readinessLabel,
    invoiceRefLabel,
    checklist,
    missingItems,
    protocolHint,
    handoffEvidenceNote: evidenceParts.join(" "),
  }
}

function normalizeOptionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeActionStatus(value: unknown): FiscalProtocolActionStatus | undefined {
  return value === "checked_pending" ||
    value === "transmitted" ||
    value === "retransmitted" ||
    value === "ok" ||
    value === "rejected" ||
    value === "escalated"
    ? value
    : undefined
}

function isValidIso(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
}
