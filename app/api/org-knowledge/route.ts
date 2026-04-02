// GET  /api/org-knowledge — citește cunoștințele organizației
// POST /api/org-knowledge — confirma/adaugă itemi noi
// DELETE /api/org-knowledge?id=... — șterge un item

import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { mutateStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import {
  makeKnowledgeItem,
  mergeKnowledgeItems,
  withStaleFlags,
} from "@/lib/compliance/org-knowledge"
import type { OrgKnowledgeCategory, OrgKnowledgeSource } from "@/lib/compliance/org-knowledge"

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "citirea cunoștințelor organizației")

    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const knowledge = state.orgKnowledge ?? { items: [], lastUpdatedAtISO: new Date().toISOString() }
    const itemsWithStale = withStaleFlags(knowledge.items)
    const hasStale = itemsWithStale.some((i) => i.stale)

    return NextResponse.json({ knowledge: { ...knowledge, items: itemsWithStale }, hasStale })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la citirea cunoștințelor.", 500, "ORG_KNOWLEDGE_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "actualizarea cunoștințelor organizației")

    const body = await request.json() as {
      items?: Array<{
        category: OrgKnowledgeCategory
        value: string
        source: OrgKnowledgeSource
        sourceLabel?: string
        confidence?: "high" | "medium" | "low"
      }>
    }

    if (!body.items?.length) return jsonError("items lipsesc.", 400, "MISSING_ITEMS")

    const now = new Date()
    const dateLabel = now.toLocaleDateString("ro-RO")

    const incoming = body.items.map((it) =>
      makeKnowledgeItem(
        it.category,
        it.value,
        it.source,
        it.sourceLabel ?? `Manual la ${dateLabel}`,
        it.confidence ?? "medium",
      )
    )

    const updated = await mutateStateForOrg(session.orgId, (state) => {
      const existing = state.orgKnowledge?.items ?? []
      state.orgKnowledge = {
        items: mergeKnowledgeItems(existing, incoming),
        lastUpdatedAtISO: now.toISOString(),
      }
      return state
    }, session.orgName)

    return NextResponse.json({ knowledge: updated.orgKnowledge })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la salvarea cunoștințelor.", 500, "ORG_KNOWLEDGE_WRITE_FAILED")
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(request, "ștergerea cunoștințelor organizației")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return jsonError("id lipsește.", 400, "MISSING_ID")

    await mutateStateForOrg(session.orgId, (state) => {
      if (state.orgKnowledge) {
        state.orgKnowledge.items = state.orgKnowledge.items.filter((i) => i.id !== id)
        state.orgKnowledge.lastUpdatedAtISO = new Date().toISOString()
      }
      return state
    }, session.orgName)

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la ștergerea itemului.", 500, "ORG_KNOWLEDGE_DELETE_FAILED")
  }
}
