import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { mutateState } from "@/lib/server/mvp-store"

type BaselineAction = "set" | "clear"

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { action?: BaselineAction }
  const action = body.action === "clear" ? "clear" : "set"
  const nowISO = new Date().toISOString()

  try {
    const nextState = await mutateState((current) => {
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
            }),
          ]),
        }
      }

      const currentSnapshot = current.snapshotHistory[0]
      if (!currentSnapshot) {
        throw new Error("BASELINE_REQUIRES_SNAPSHOT")
      }

      return {
        ...current,
        validatedBaselineSnapshotId: currentSnapshot.snapshotId,
        events: appendComplianceEvents(current, [
          createComplianceEvent({
            type: "baseline.set",
            entityType: "drift",
            entityId: currentSnapshot.snapshotId,
            message: "Snapshot-ul curent a fost validat ca baseline.",
            createdAtISO: nowISO,
          }),
        ]),
      }
    })

    return NextResponse.json({
      ...(await buildDashboardPayload(nextState)),
      message:
        action === "clear"
          ? "Baseline-ul validat a fost eliminat. Drift-ul va compara din nou cu ultimul snapshot."
          : "Snapshot-ul curent a fost salvat ca baseline validat pentru drift.",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "BASELINE_REQUIRES_SNAPSHOT"
            ? "Ai nevoie de cel putin un snapshot real inainte sa setezi baseline-ul."
            : error instanceof Error
              ? error.message
              : "Nu am putut actualiza baseline-ul.",
      },
      { status: 400 }
    )
  }
}
