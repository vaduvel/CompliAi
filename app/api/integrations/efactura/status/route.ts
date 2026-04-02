// GET /api/integrations/efactura/status
// Sprint 8 — ANAF Live Readiness
// Returnează modul de operare (mock | test | real) și starea conexiunii.
// Clientul UI folosește asta pentru a afișa mesaje clare despre ce lipsește.

import { NextResponse } from "next/server"

import { loadTokenFromSupabase } from "@/lib/anaf-spv-client"
import type { SPVSubmissionStatus } from "@/lib/fiscal/spv-submission"
import { readFreshSessionFromRequest } from "@/lib/server/auth"
import {
  getAnafEnvironment,
  getAnafMode,
  isAnafProductionUnlocked,
} from "@/lib/server/efactura-anaf-client"
import { diagnoseAnafSubmissionError, listSubmissions } from "@/lib/server/anaf-submit-flow"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { hasSupabaseConfig } from "@/lib/server/supabase-rest"

export async function GET(request: Request) {
  const session = await readFreshSessionFromRequest(request)
  const mode = getAnafMode()
  const environment = getAnafEnvironment()
  const state =
    session == null
      ? normalizeComplianceState(initialComplianceState)
      : (await readStateForOrg(session.orgId)) ?? normalizeComplianceState(initialComplianceState)
  const token = session ? await loadTokenFromSupabase(session.orgId) : null
  const recentSubmissions = session ? await listSubmissions(session.orgId, 5) : []
  const persistenceBackend = hasSupabaseConfig() ? "supabase" : "local"
  const lastExecution =
    recentSubmissions.find((submission) =>
      submission.status !== "pending_approval" &&
      submission.status !== "approved" &&
      submission.status !== "rejected"
    ) ?? null

  const isLive = mode === "real"
  const isSandbox = mode === "test"
  const hasCui = Boolean(state.orgProfile?.cui || process.env.ANAF_CUI)
  const missingConfig = [
    !process.env.ANAF_CLIENT_ID && "ANAF_CLIENT_ID",
    !process.env.ANAF_CLIENT_SECRET && "ANAF_CLIENT_SECRET",
    !hasCui && "ANAF_CUI",
  ].filter(Boolean) as string[]
  const tokenState =
    token == null
      ? "missing"
      : new Date(token.expiresAtISO).getTime() > Date.now()
        ? "present"
        : "expired"
  const lastSyncAgeMs = state.efacturaSyncedAtISO
    ? Date.now() - new Date(state.efacturaSyncedAtISO).getTime()
    : null
  const syncIsStale = lastSyncAgeMs != null && lastSyncAgeMs > 24 * 60 * 60 * 1000
  const lastExecutionStatus = lastExecution?.status ?? null
  const lastExecutionError = lastExecution?.errorDetail ?? lastExecution?.anafMessage ?? null
  const lastExecutionDiagnosis = diagnoseAnafSubmissionError(lastExecutionError)
  const lastExecutionAtISO =
    lastExecution?.submittedAtISO ?? lastExecution?.resolvedAtISO ?? lastExecution?.createdAtISO ?? null
  const lastExecutionWasUnauthorized = Boolean(
    lastExecutionError && /401|unauthorized/i.test(lastExecutionError)
  )
  const lastExecutionSucceeded =
    lastExecutionStatus === "submitted" || lastExecutionStatus === "ok"
  const lastExecutionNeedsAttention =
    lastExecutionStatus === "error" || lastExecutionStatus === "nok"

  const operationalState =
    mode === "mock"
      ? "demo_only"
      : missingConfig.length > 0
        ? "not_configured"
        : tokenState === "missing"
          ? "connect_required"
          : tokenState === "expired"
            ? "reauth_required"
            : lastExecutionWasUnauthorized
              ? "reauth_required"
              : !state.efacturaConnected
                ? "authorized_pending_sync"
              : lastExecutionSucceeded
                ? "operational"
                : lastExecutionNeedsAttention
                  ? "attention_required"
              : syncIsStale
                ? "attention_required"
                : lastExecution == null
                  ? "authorized_pending_sync"
                  : "operational"

  const statusLabelMap = {
    demo_only: "Demo local",
    not_configured: "Configurare incompletă",
    connect_required: "Conectare necesară",
    reauth_required: "Reautentificare necesară",
    authorized_pending_sync: "Token prezent",
    attention_required: "Necesită verificare",
    operational: "Operațional",
  } as const
  const statusDetailMap = {
    demo_only:
      "Rulezi fără ANAF conectat. Poți testa doar fluxul local până setezi credențialele și CUI-ul.",
    not_configured:
      "Lipsesc elemente obligatorii pentru conectarea sandbox sau producție. Completează configurarea înainte de upload.",
    connect_required:
      "Nu există încă o autorizare ANAF salvată pentru firma curentă. Fă o conectare înainte de transmitere.",
    reauth_required:
      lastExecutionDiagnosis?.userMessage ??
      "Autorizarea ANAF a expirat. Reautentifică firma înainte de orice upload nou.",
    authorized_pending_sync:
      "Există token ANAF salvat, dar nu avem încă o execuție recentă care să confirme uploadul. Tratează conexiunea ca prezentă, nu ca validată operațional.",
    attention_required:
      lastExecutionNeedsAttention && lastExecutionDiagnosis
        ? `${lastExecutionDiagnosis.userMessage} ${lastExecutionError ? `Detaliu: ${lastExecutionError}` : ""}`.trim()
        : lastExecutionNeedsAttention && lastExecutionError
        ? `Ultima execuție ANAF a semnalat o problemă: ${lastExecutionError}`
        : "Conexiunea există, dar ultimul sync este vechi sau ultima execuție a cerut atenție. Verifică starea înainte de a trata integrarea ca fiind sănătoasă.",
    operational:
      lastExecutionSucceeded
        ? "Avem token valid și o execuție ANAF recentă care confirmă funcționarea mediului curent."
        : "Conectarea, tokenul și sync-ul recent indică o integrare funcțională pentru mediul curent.",
  } as const

  return NextResponse.json({
    mode,
    environment,
    productionUnlocked: isAnafProductionUnlocked(),
    connected: state.efacturaConnected,
    syncedAtISO: state.efacturaSyncedAtISO ?? null,
    tokenState,
    tokenExpiresAtISO: token?.expiresAtISO ?? null,
    persistenceBackend,
    operationalState,
    lastSubmissionStatus: lastExecutionStatus as SPVSubmissionStatus | null,
    lastSubmissionAtISO: lastExecutionAtISO,
    lastSubmissionError: lastExecutionError,
    lastSubmissionErrorCategory: lastExecutionDiagnosis?.category ?? null,
    lastSubmissionNextStep: lastExecutionDiagnosis?.nextStep ?? null,
    statusLabel: statusLabelMap[operationalState],
    statusDetail: statusDetailMap[operationalState],
    ready: mode !== "mock" && hasCui,
    productionReady: isLive && hasCui,
    canAttemptUpload:
      mode !== "mock" &&
      tokenState === "present" &&
      missingConfig.length === 0 &&
      !lastExecutionWasUnauthorized,
    missingConfig,
    message: isLive
      ? "Mod real ANAF activ. Verificați periodicitatea sync-ului."
      : isSandbox
        ? "Mod ANAF TEST activ. Transmiterea reală este blocată până la unlock explicit de producție."
        : "Mod demo activ. Setați ANAF_CLIENT_ID, ANAF_CLIENT_SECRET și ANAF_CUI pentru conectarea la sandbox-ul ANAF.",
  })
}
