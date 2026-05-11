import { NextResponse } from "next/server"

import { ensureValidToken, fetchSpvMessages, markTokenUsed } from "@/lib/anaf-spv-client"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import { buildDashboardPayload } from "@/lib/server/dashboard-response"
import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import { resolveOptionalEventActor } from "@/lib/server/event-actor"
import { getAnafEnvironment, getAnafMode } from "@/lib/server/efactura-anaf-client"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { mutateStateForOrg } from "@/lib/server/mvp-store"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext, getRequestDurationMs } from "@/lib/server/request-context"
import {
  pickRejectionMessages,
  spvMessageToFinding,
} from "@/lib/server/anaf-spv-findings"
import type { ScanFinding } from "@/lib/compliance/types"

type SyncOutcome =
  | { kind: "no-cui" }
  | { kind: "no-token"; expired: boolean }
  | { kind: "anaf-error"; message: string }
  | {
      kind: "ok"
      messagesChecked: number
      newFindings: ScanFinding[]
      rejectedCount: number
    }

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/integrations/efactura/sync")

  try {
    const session = await requireFreshAuthenticatedSession(request, "sincronizarea e-Factura")
    const nowISO = new Date().toISOString()
    const actor = await resolveOptionalEventActor(request)
    const mode = getAnafMode()
    const environment = getAnafEnvironment()

    let outcome: SyncOutcome = { kind: "no-cui" }

    const nextState = await mutateStateForOrg(
      session.orgId,
      (current) => {
        const cuiRaw = current.orgProfile?.cui?.trim() ?? ""
        if (!cuiRaw) {
          outcome = { kind: "no-cui" }
          return {
            ...current,
            efacturaConnected: true,
            efacturaSyncedAtISO: nowISO,
            events: appendComplianceEvents(current, [
              createComplianceEvent(
                {
                  type: "integration.efactura-synced",
                  entityType: "integration",
                  entityId: "efactura",
                  message:
                    "Sync e-Factura: CUI lipsă în profilul organizației — completează profilul pentru a importa mesajele SPV.",
                  createdAtISO: nowISO,
                  metadata: { connected: true, mode, environment, outcome: "no-cui" },
                },
                actor,
              ),
            ]),
          }
        }
        return current
      },
      session.orgName,
    )

    // Live ANAF sync only if mode === "real" or "test" (skip in mock to avoid wasted calls)
    if (outcome.kind !== "no-cui" || nextState.orgProfile?.cui) {
      const cif = (nextState.orgProfile?.cui ?? "").replace(/^RO/i, "").trim()
      if (cif && (mode === "real" || mode === "test")) {
        const { token, expired } = await ensureValidToken(session.orgId, nowISO)
        if (!token) {
          outcome = { kind: "no-token", expired }
        } else {
          const messages = await fetchSpvMessages(token.accessToken, cif, 30)
          if (messages) {
            await markTokenUsed(session.orgId, nowISO)
          }
          if (!messages) {
            outcome = { kind: "anaf-error", message: "ANAF SPV nu a răspuns la cerere." }
          } else if (messages.eroare) {
            outcome = { kind: "anaf-error", message: messages.eroare }
          } else {
            const rejected = pickRejectionMessages(messages.mesaje)
            outcome = {
              kind: "ok",
              messagesChecked: messages.mesaje.length,
              newFindings: [],
              rejectedCount: rejected.length,
            }
            if (rejected.length > 0) {
              const existingIds = new Set(nextState.findings.map((f) => f.id))
              const fresh = rejected
                .map((m) => spvMessageToFinding(m, nowISO))
                .filter((f) => !existingIds.has(f.id))
              outcome.newFindings = fresh
            }
          }
        }
      }
    }

    const finalState = await mutateStateForOrg(
      session.orgId,
      (current) => {
        const findings =
          outcome.kind === "ok" && outcome.newFindings.length > 0
            ? [...current.findings, ...outcome.newFindings]
            : current.findings
        const eventMessage = buildSyncEventMessage(outcome, mode)
        return {
          ...current,
          efacturaConnected: true,
          efacturaSyncedAtISO: nowISO,
          findings,
          events: appendComplianceEvents(current, [
            createComplianceEvent(
              {
                type: "integration.efactura-synced",
                entityType: "integration",
                entityId: "efactura",
                message: eventMessage,
                createdAtISO: nowISO,
                metadata: {
                  connected: true,
                  mode,
                  environment,
                  outcome: outcome.kind,
                  ...(outcome.kind === "ok"
                    ? {
                        messagesChecked: outcome.messagesChecked,
                        rejectedCount: outcome.rejectedCount,
                        newFindings: outcome.newFindings.length,
                      }
                    : {}),
                },
              },
              actor,
            ),
          ]),
        }
      },
      session.orgName,
    )

    const workspaceOverride = {
      ...(await getOrgContext({ request })),
      orgId: session.orgId,
      orgName: session.orgName,
      userRole: session.role,
    }

    return NextResponse.json(
      {
        ...(await buildDashboardPayload(finalState, workspaceOverride)),
        mode,
        environment,
        message: buildSyncResponseMessage(outcome, mode),
        sync: {
          outcome: outcome.kind,
          messagesChecked: outcome.kind === "ok" ? outcome.messagesChecked : 0,
          newFindings: outcome.kind === "ok" ? outcome.newFindings.length : 0,
          rejectedCount: outcome.kind === "ok" ? outcome.rejectedCount : 0,
          tokenExpired: outcome.kind === "no-token" ? outcome.expired : false,
        },
      },
      withRequestIdHeaders(undefined, context),
    )
  } catch (error) {
    await logRouteError(context, error, {
      code: "EFACTURA_SYNC_FAILED",
      durationMs: getRequestDurationMs(context),
      status: 500,
    })
    return jsonError(
      "Nu am putut porni sync-ul e-Factura.",
      500,
      "EFACTURA_SYNC_FAILED",
      undefined,
      context,
    )
  }
}

function buildSyncEventMessage(outcome: SyncOutcome, mode: string): string {
  switch (outcome.kind) {
    case "no-cui":
      return "Sync e-Factura: CUI lipsă în profilul organizației."
    case "no-token":
      return outcome.expired
        ? "Sync e-Factura: token-ul ANAF a expirat. Reautorizează conexiunea SPV."
        : "Sync e-Factura: nu există token ANAF salvat. Autorizează conexiunea SPV."
    case "anaf-error":
      return `Sync e-Factura: ANAF a răspuns cu eroare — ${outcome.message}.`
    case "ok":
      if (outcome.messagesChecked === 0) {
        return mode === "real"
          ? "Sync e-Factura: ANAF SPV nu raportează mesaje noi în ultimele 30 zile."
          : "Sync e-Factura sandbox: ANAF SPV nu raportează mesaje noi."
      }
      return outcome.rejectedCount > 0
        ? `Sync e-Factura: ${outcome.messagesChecked} mesaje SPV procesate (${outcome.rejectedCount} respinse → findings noi: ${outcome.newFindings.length}).`
        : `Sync e-Factura: ${outcome.messagesChecked} mesaje SPV procesate, fără respingeri.`
  }
}

function buildSyncResponseMessage(outcome: SyncOutcome, mode: string): string {
  if (mode === "mock") {
    return "Integrarea e-Factura rulează în modul local (mock). Setează ANAF_CLIENT_ID și ANAF_CLIENT_SECRET pentru sandbox-ul ANAF."
  }
  switch (outcome.kind) {
    case "no-cui":
      return "Completează CUI-ul organizației în profil înainte de a sincroniza cu ANAF SPV."
    case "no-token":
      return outcome.expired
        ? "Token-ul ANAF a expirat. Reautorizează conexiunea SPV pentru a relua sync-ul."
        : "Nu există un token ANAF salvat. Autorizează conexiunea SPV din /dashboard/fiscal."
    case "anaf-error":
      return `ANAF SPV a respins cererea: ${outcome.message}.`
    case "ok":
      return outcome.messagesChecked === 0
        ? mode === "real"
          ? "Sync-ul a reușit, dar SPV nu raportează mesaje noi în ultimele 30 zile."
          : "Sync-ul sandbox a reușit, fără mesaje noi în ultimele 30 zile."
        : `Sync-ul a importat ${outcome.messagesChecked} mesaje SPV (${outcome.newFindings.length} findings noi).`
  }
}
