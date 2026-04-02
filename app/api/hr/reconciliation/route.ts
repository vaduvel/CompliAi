import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import {
  buildHrRegistryReconciliationDerived,
  getHrRegistryReconciliationKey,
} from "@/lib/compliance/hr-registry-reconciliation"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import type { HrRegistryReconciliationRecord } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { mutateStateForOrg, readStateForOrg } from "@/lib/server/mvp-store"

type ReconciliationBody = {
  findingId?: string
  rosterSnapshot?: string
  registryChecklistText?: string
}

export async function GET(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "reconcilierea HR / REGES"
    )

    const requestedFindingId = new URL(request.url).searchParams.get("findingId")
    const reconciliationKey = getHrRegistryReconciliationKey(requestedFindingId)
    const state =
      (await readStateForOrg(session.orgId)) ??
      normalizeComplianceState(initialComplianceState)
    const reconciliation = state.hrRegistryReconciliations?.[reconciliationKey] ?? null
    const derived = buildHrRegistryReconciliationDerived(reconciliation, {
      orgName: session.orgName,
      employeeCount: state.orgProfile?.employeeCount ?? null,
    })

    return NextResponse.json({
      findingId: reconciliationKey,
      reconciliation,
      derived,
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut încărca reconcilierea REGES.",
      500,
      "HR_REGISTRY_RECONCILIATION_READ_FAILED"
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer"],
      "reconcilierea HR / REGES"
    )
    const body = (await request.json().catch(() => null)) as ReconciliationBody | null
    const reconciliationKey = getHrRegistryReconciliationKey(body?.findingId)
    const rosterSnapshot = body?.rosterSnapshot?.trim() ?? ""
    const registryChecklistText = body?.registryChecklistText?.trim() ?? ""

    if (!rosterSnapshot && !registryChecklistText) {
      return jsonError(
        "Completează snapshotul intern sau lista de verificare înainte să salvezi reconcilierea REGES.",
        400,
        "HR_REGISTRY_RECONCILIATION_EMPTY"
      )
    }

    const nowISO = new Date().toISOString()
    const orgName = session.orgName
    let savedReconciliation: HrRegistryReconciliationRecord | null = null

    const nextState = await mutateStateForOrg(session.orgId, (current) => {
      const reconciliation: HrRegistryReconciliationRecord = {
        findingId: reconciliationKey,
        rosterSnapshot,
        registryChecklistText,
        updatedAtISO: nowISO,
      }
      savedReconciliation = reconciliation

      return {
        ...current,
        hrRegistryReconciliations: {
          ...(current.hrRegistryReconciliations ?? {}),
          [reconciliationKey]: reconciliation,
        },
        events: appendComplianceEvents(current, [
          createComplianceEvent(
            {
              type: "hr.reges-reconciliation-updated",
              entityType: "system",
              entityId: reconciliationKey,
              message: `Reconcilierea REGES a fost actualizată pentru ${orgName}.`,
              createdAtISO: nowISO,
              metadata: {
                findingId: reconciliationKey,
                rosterSnapshotLength: rosterSnapshot.length,
                registryChecklistLength: registryChecklistText.length,
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
    }, session.orgName)

    const derived = buildHrRegistryReconciliationDerived(savedReconciliation, {
      orgName,
      employeeCount: nextState.orgProfile?.employeeCount ?? null,
    })

    return NextResponse.json({
      ok: true,
      findingId: reconciliationKey,
      reconciliation: savedReconciliation,
      derived,
      feedbackMessage:
        derived.readiness === "ready"
          ? "Reconcilierea REGES este pregătită pentru handoff și poate întoarce o notă mai clară în cockpit."
          : "Am salvat reconcilierea REGES. Completează și partea lipsă înainte să revii în cockpit.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error ? error.message : "Nu am putut salva reconcilierea REGES.",
      500,
      "HR_REGISTRY_RECONCILIATION_UPDATE_FAILED"
    )
  }
}
