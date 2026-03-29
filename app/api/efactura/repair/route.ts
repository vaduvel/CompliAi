import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { repairEFacturaXml } from "@/lib/compliance/efactura-xml-repair"
import type { EFacturaXmlRepairRecord } from "@/lib/compliance/types"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { mutateState } from "@/lib/server/mvp-store"

type RepairPayload = {
  documentName?: string
  xml?: string
  errorCodes?: string[]
}

function normalizeErrorCodes(errorCodes?: string[]) {
  if (!Array.isArray(errorCodes)) return []
  return Array.from(
    new Set(
      errorCodes
        .map((code) => code.trim().toUpperCase())
        .filter((code) => /^[A-Z]\d{3}$/.test(code))
    )
  )
}

export async function POST(request: Request) {
  const body = (await request.json()) as RepairPayload
  const actor = await resolveOptionalEventActor(request)
  const xml = body.xml?.trim() || ""

  if (!xml) {
    return NextResponse.json({ error: "Lipseste continutul XML." }, { status: 400 })
  }

  const nowISO = new Date().toISOString()
  const requestedErrorCodes = normalizeErrorCodes(body.errorCodes)
  const repaired = repairEFacturaXml(xml, requestedErrorCodes.length > 0 ? requestedErrorCodes : undefined)

  const repair: EFacturaXmlRepairRecord = {
    documentName: body.documentName?.trim() || "Factura XML",
    originalXml: repaired.originalXml,
    repairedXml: repaired.repairedXml,
    requestedErrorCodes,
    appliedFixes: repaired.appliedFixes,
    canAutoFix: repaired.canAutoFix,
    createdAtISO: nowISO,
  }

  const nextState = await mutateState((current) => ({
    ...current,
    events: appendComplianceEvents(current, [
      createComplianceEvent(
        {
          type: "integration.efactura-xml-repair-generated",
          entityType: "integration",
          entityId: repair.documentName,
          message:
            repair.appliedFixes.length > 0
              ? `XML reparat pentru ${repair.documentName}.`
              : `Nu au fost aplicate corectii automate pentru ${repair.documentName}.`,
          createdAtISO: nowISO,
          metadata: {
            fixes: repair.appliedFixes.length,
            canAutoFix: repair.canAutoFix,
            requestedCodes: repair.requestedErrorCodes.join(",") || "auto",
          },
        },
        actor
      ),
    ]),
  }))

  return NextResponse.json({
    ...(await buildDashboardPayload(nextState)),
    repair,
    message:
      repair.appliedFixes.length > 0
        ? "Am pregatit corectiile sigure pentru XML-ul e-Factura."
        : "Nu am gasit corectii automate sigure pentru acest XML.",
  })
}
