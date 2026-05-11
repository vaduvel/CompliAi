// V3 P0.3 — e-Factura Risk Signals endpoint
// GET: returns signals (real from ANAF SPV when token+CUI present, mock otherwise)
// POST: persists findings derived from those signals

import { NextResponse } from "next/server"

import { ensureValidToken, fetchSpvMessages, markTokenUsed } from "@/lib/anaf-spv-client"
import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { getAnafMode } from "@/lib/server/efactura-anaf-client"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { mutateStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import {
  buildMockEFacturaSignals,
  buildEFacturaRiskFindings,
  EFACTURA_RISK_FINDING_PREFIX,
  type EFacturaInvoiceSignal,
} from "@/lib/compliance/efactura-risk"
import {
  pickRejectionMessages,
  spvMessageToFinding,
  spvMessageToInvoiceSignal,
} from "@/lib/server/anaf-spv-findings"
import type { ScanFinding } from "@/lib/compliance/types"

const SPV_REAL_FINDING_PREFIX = "spv-"

type SignalSource = "real" | "mock"

async function loadSignals(
  orgId: string,
  cui: string,
  nowISO: string,
): Promise<{ signals: EFacturaInvoiceSignal[]; source: SignalSource; rejections: number }> {
  if (!cui) {
    return { signals: buildMockEFacturaSignals(), source: "mock", rejections: 0 }
  }
  const { token } = await ensureValidToken(orgId, nowISO)
  if (!token) {
    return { signals: buildMockEFacturaSignals(), source: "mock", rejections: 0 }
  }
  const messages = await fetchSpvMessages(token.accessToken, cui, 30)
  if (!messages) {
    return { signals: buildMockEFacturaSignals(), source: "mock", rejections: 0 }
  }
  await markTokenUsed(orgId, nowISO)
  const rejections = pickRejectionMessages(messages.mesaje ?? [])
  return {
    signals: rejections.map(spvMessageToInvoiceSignal),
    source: "real",
    rejections: rejections.length,
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "citirea semnalelor e-Factura",
    )
    const mode = getAnafMode()
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)

    const cui = state.orgProfile?.cui?.replace(/^RO/i, "").trim() ?? ""
    const nowISO = new Date().toISOString()
    const { signals, source } = await loadSignals(session.orgId, cui, nowISO)

    return NextResponse.json({
      signals,
      mode,
      connected: state.efacturaConnected,
      syncedAtISO: state.efacturaSyncedAtISO ?? null,
      demo: source === "mock" && mode === "mock",
      sandbox: mode === "test",
      source,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut incarca semnalele e-Factura.", 500, "EFACTURA_SIGNALS_READ_FAILED")
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "generarea findingurilor din semnalele e-Factura",
    )
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const cui = state.orgProfile?.cui?.replace(/^RO/i, "").trim() ?? ""
    const nowISO = new Date().toISOString()

    let newFindings: ScanFinding[] = []
    let source: SignalSource = "mock"

    if (cui) {
      const { token } = await ensureValidToken(session.orgId, nowISO)
      if (token) {
        const messages = await fetchSpvMessages(token.accessToken, cui, 30)
        if (messages) {
          await markTokenUsed(session.orgId, nowISO)
        }
        if (messages?.mesaje) {
          newFindings = pickRejectionMessages(messages.mesaje).map((m) =>
            spvMessageToFinding(m, nowISO),
          )
          source = "real"
        }
      }
    }

    if (source === "mock") {
      const mockSignals = buildMockEFacturaSignals()
      newFindings = buildEFacturaRiskFindings(mockSignals, nowISO)
    }

    await mutateStateForOrg(
      session.orgId,
      (current) => ({
        ...current,
        findings: [
          ...current.findings.filter(
            (f) =>
              f.category !== "E_FACTURA" ||
              (!f.id.startsWith(EFACTURA_RISK_FINDING_PREFIX) &&
                !f.id.startsWith(SPV_REAL_FINDING_PREFIX)),
          ),
          ...newFindings,
        ],
      }),
      session.orgName,
    )

    return NextResponse.json({
      generated: newFindings.length,
      findings: newFindings,
      source,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      "Nu am putut genera findings din semnalele e-Factura.",
      500,
      "EFACTURA_FINDINGS_FAILED",
    )
  }
}
