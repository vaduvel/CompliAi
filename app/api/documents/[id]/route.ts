import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import { readFreshState, mutateState } from "@/lib/server/mvp-store"

type Params = {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: Request,
  { params }: Params
) {
  try {
    const { id } = await params
    requireRole(request, ["owner", "partner_manager", "compliance", "reviewer"])

    const body = (await request.json()) as {
      validationStatus?: "pending" | "passed"
    }

    if (body.validationStatus !== "passed") {
      return jsonError("Doar validationStatus: 'passed' este acceptat.", 400, "INVALID_OPERATION")
    }

    const state = await readFreshState()
    const docs = state.generatedDocuments ?? []
    const documentIndex = docs.findIndex((d) => d.id === id)

    if (documentIndex === -1) {
      return jsonError("Document inexistent.", 404, "NOT_FOUND")
    }

    await mutateState((current) => {
      const updatedDocs = [...(current.generatedDocuments ?? [])]
      updatedDocs[documentIndex] = {
        ...updatedDocs[documentIndex],
        validationStatus: "passed",
        validatedAtISO: new Date().toISOString(),
      }
      return { ...current, generatedDocuments: updatedDocs }
    })

    return NextResponse.json({ id, validationStatus: "passed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare."
    return jsonError(message, 500, "DOCUMENT_UPDATE_FAILED")
  }
}

