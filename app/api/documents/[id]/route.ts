import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readFreshStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params
    const session = requireRole(request, ["owner", "partner_manager", "compliance", "reviewer"])

    const body = (await request.json()) as {
      validationStatus?: "pending" | "passed"
    }

    if (body.validationStatus !== "passed") {
      return jsonError("Doar validationStatus: 'passed' este acceptat.", 400, "INVALID_OPERATION")
    }

    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    if (!state) {
      return jsonError("Nu există stare de conformitate pentru organizația selectată.", 404, "NO_STATE")
    }
    const docs = state.generatedDocuments ?? []
    const documentIndex = docs.findIndex((d) => d.id === id)

    if (documentIndex === -1) {
      return jsonError("Document inexistent.", 404, "NOT_FOUND")
    }

    const updatedDocs = [...docs]
    updatedDocs[documentIndex] = {
      ...updatedDocs[documentIndex],
      validationStatus: "passed",
      validatedAtISO: new Date().toISOString(),
    }

    await writeStateForOrg(
      session.orgId,
      {
        ...state,
        generatedDocuments: updatedDocs,
      },
      session.orgName
    )

    return NextResponse.json({ id, validationStatus: "passed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare."
    return jsonError(message, 500, "DOCUMENT_UPDATE_FAILED")
  }
}
