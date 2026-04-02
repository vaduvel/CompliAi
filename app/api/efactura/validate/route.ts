import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { validateEFacturaXml } from "@/lib/compliance/efactura-validator"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"

type ValidationPayload = {
  documentName?: string
  xml?: string
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "validarea XML-ului e-Factura")
    const body = (await request.json()) as ValidationPayload
    const actor = await resolveOptionalEventActor(request)
    const xml = body.xml?.trim() || ""

    if (!xml) {
      return NextResponse.json({ error: "Lipseste continutul XML." }, { status: 400 })
    }

    const nowISO = new Date().toISOString()
    const result = validateEFacturaXml({
      documentName: body.documentName?.trim() || "Factura XML",
      xml,
      nowISO,
    })

    const nextState = await mutateStateForOrg(session.orgId, (current) => ({
      ...current,
      efacturaValidations: [result, ...current.efacturaValidations].slice(0, 25),
      events: appendComplianceEvents(current, [
        createComplianceEvent({
          type: "integration.efactura-xml-validated",
          entityType: "integration",
          entityId: result.id,
          message: result.valid
            ? `XML validat pentru ${result.documentName}.`
            : `XML invalid pentru ${result.documentName}.`,
          createdAtISO: nowISO,
          metadata: {
            valid: result.valid,
            errors: result.errors.length,
            warnings: result.warnings.length,
          },
        }, actor),
      ]),
    }), session.orgName)
    const workspaceOverride = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspaceOverride)),
      validation: result,
      message: result.valid
        ? "XML-ul trece validarile structurale de baza pentru e-Factura."
        : "XML-ul are erori structurale si trebuie corectat inainte de transmitere.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    return NextResponse.json({ error: "Nu am putut valida XML-ul e-Factura." }, { status: 500 })
  }
}
