// Partner portal: list all organizations where the current user has a membership.
// Returns org summaries with compliance scores for multi-client dashboard.

import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest, listUserMemberships } from "@/lib/server/auth"
import { normalizeComplianceState, computeDashboardSummary } from "@/lib/compliance/engine"
import type { ComplianceState } from "@/lib/compliance/types"
import type { UserMembershipSummary } from "@/lib/server/auth"
import { readNis2State } from "@/lib/server/nis2-store"
import { detectEntityType } from "@/lib/compliance/nis2-rules"
import { buildMockEFacturaSignals, summarizeEFacturaSignals } from "@/lib/compliance/efactura-risk"

const DATA_DIR = path.join(process.cwd(), ".data")

async function readOrgState(orgId: string): Promise<ComplianceState | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `state-${orgId}.json`), "utf8")
    return JSON.parse(raw) as ComplianceState
  } catch {
    return null
  }
}

export type PartnerClientSummary = {
  orgId: string
  orgName: string
  role: UserMembershipSummary["role"]
  status: UserMembershipSummary["status"]
  membershipId: string
  createdAtISO: string
  compliance: {
    score: number
    riskLabel: string
    openAlerts: number
    redAlerts: number
    scannedDocuments: number
    gdprProgress: number
    highRisk: number
    efacturaConnected: boolean
    hasData: boolean
    // V3 P0.4 — Accountant Hub signals
    nis2RescueNeeded: boolean     // entity is NIS2-applicable but registration not confirmed
    efacturaRiskCount: number     // rejected + xml-error signals
  } | null
}

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const memberships = await listUserMemberships(session.userId)

    // Load compliance + NIS2 state for each org in parallel (max 20 orgs)
    const efacturaSignals = buildMockEFacturaSignals()
    const efacturaSummary = summarizeEFacturaSignals(efacturaSignals)

    const clients: PartnerClientSummary[] = await Promise.all(
      memberships.slice(0, 20).map(async (m) => {
        const [state, nis2State] = await Promise.all([
          readOrgState(m.orgId),
          readNis2State(m.orgId),
        ])
        let compliance: PartnerClientSummary["compliance"] = null

        if (state) {
          const normalized = normalizeComplianceState(state)
          const summary = computeDashboardSummary(normalized)

          // V3 P0.4: NIS2 rescue needed if entity is applicable but not confirmed
          const sector = nis2State.assessment?.sector ?? "general"
          const entityType = detectEntityType(sector)
          const dnscStatus = nis2State.dnscRegistrationStatus ?? "not-started"
          const nis2RescueNeeded =
            entityType !== "not-applicable" && dnscStatus !== "confirmed"

          compliance = {
            score: summary.score,
            riskLabel: summary.riskLabel,
            openAlerts: summary.openAlerts,
            redAlerts: summary.redAlerts,
            scannedDocuments: normalized.scannedDocuments,
            gdprProgress: normalized.gdprProgress,
            highRisk: normalized.highRisk,
            efacturaConnected: normalized.efacturaConnected,
            hasData: summary.score > 0 || normalized.scannedDocuments > 0,
            nis2RescueNeeded,
            efacturaRiskCount: efacturaSummary.rejected + efacturaSummary.xmlErrors,
          }
        }

        return {
          orgId: m.orgId,
          orgName: m.orgName,
          role: m.role,
          status: m.status,
          membershipId: m.membershipId,
          createdAtISO: m.createdAtISO,
          compliance,
        }
      })
    )

    return NextResponse.json({ clients, total: memberships.length })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Eroare la incarcarea clientilor.", 500, "PARTNER_CLIENTS_FAILED")
  }
}
