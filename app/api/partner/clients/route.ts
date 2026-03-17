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
  } | null
}

export async function GET(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) {
      return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")
    }

    const memberships = await listUserMemberships(session.userId)

    // Load compliance state for each org in parallel (max 20 orgs)
    const clients: PartnerClientSummary[] = await Promise.all(
      memberships.slice(0, 20).map(async (m) => {
        const state = await readOrgState(m.orgId)
        let compliance: PartnerClientSummary["compliance"] = null

        if (state) {
          const normalized = normalizeComplianceState(state)
          const summary = computeDashboardSummary(normalized)
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
