import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { computeDashboardSummary } from "@/lib/compliance/engine"
import { buildRemediationPlan } from "@/lib/compliance/remediation"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/api-response"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { buildCompliScanSnapshot } from "@/lib/server/compliscan-export"
import { eventActorFromSession } from "@/lib/server/event-actor"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { getOrgContext } from "@/lib/server/org-context"

type BaselineAction = "set" | "clear"

export async function POST(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance"],
      "administrarea baseline-ului"
    )
    const actor = eventActorFromSession(session)

    const body = (await request.json().catch(() => ({}))) as { action?: BaselineAction }
    const action = body.action === "clear" ? "clear" : "set"
    const nowISO = new Date().toISOString()

    const nextState = await mutateStateForOrg(session.orgId, (current) => {
      if (action === "clear") {
        return {
          ...current,
          validatedBaselineSnapshotId: undefined,
          events: appendComplianceEvents(current, [
            createComplianceEvent({
              type: "baseline.cleared",
              entityType: "drift",
              entityId: "baseline",
              message: "Baseline-ul validat a fost eliminat.",
              createdAtISO: nowISO,
            }, actor),
          ]),
        }
      }

      const currentSnapshot =
        current.snapshotHistory[0] ??
        buildCompliScanSnapshot({
          state: current,
          summary: computeDashboardSummary(current),
          remediationPlan: buildRemediationPlan(current),
          workspace: {
            orgId: session.orgId,
            orgName: session.orgName,
            workspaceLabel: session.orgName,
            workspaceOwner: session.email,
            workspaceInitials: initialsFromName(session.orgName),
            userRole: session.role,
          },
        })
      const snapshotHistory =
        current.snapshotHistory[0]?.snapshotId === currentSnapshot.snapshotId
          ? current.snapshotHistory
          : [currentSnapshot, ...current.snapshotHistory].slice(0, 12)

      return {
        ...current,
        snapshotHistory,
        validatedBaselineSnapshotId: currentSnapshot.snapshotId,
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "baseline.set",
            entityType: "drift",
            entityId: currentSnapshot.snapshotId,
            message: "Snapshot-ul curent a fost validat ca baseline.",
            createdAtISO: nowISO,
          }, actor),
        ]),
      }
    }, session.orgName)

    const workspace = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState, workspace)),
      message:
        action === "clear"
          ? "Baseline-ul validat a fost eliminat. Drift-ul va compara din nou cu ultimul snapshot."
          : "Snapshot-ul curent a fost salvat ca baseline validat pentru drift.",
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }

    return jsonError(
      error instanceof Error && error.message === "BASELINE_REQUIRES_SNAPSHOT"
        ? "Ai nevoie de cel putin un snapshot real inainte sa setezi baseline-ul."
        : error instanceof Error
          ? error.message
          : "Nu am putut actualiza baseline-ul.",
      400,
      "BASELINE_UPDATE_FAILED"
    )
  }
}

function initialsFromName(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "CS"
}
