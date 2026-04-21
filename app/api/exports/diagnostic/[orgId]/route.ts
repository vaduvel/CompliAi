/**
 * Client Diagnostic Report — Faza 5.2
 *
 * GET /api/exports/diagnostic/[orgId]
 *
 * Single-page PDF lead-magnet for partners (Diana) to send prospects.
 * Format: Executive summary of client's compliance state.
 * - Brand header (partner white-label if configured)
 * - Findings breakdown per severity
 * - Top 3 critical findings with remediation hints
 * - Compliance score + framework tags
 *
 * Used as GTM tool in prospecting flow.
 */
import { NextResponse } from "next/server"

import { jsonError, withRequestIdHeaders } from "@/lib/server/api-response"
import {
  AuthzError,
  listUserMemberships,
  requireFreshAuthenticatedSession,
} from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import type { ScanFinding } from "@/lib/compliance/types"

function severityLabel(sev: ScanFinding["severity"]) {
  switch (sev) {
    case "critical":
      return "Critic"
    case "high":
      return "Ridicat"
    case "medium":
      return "Mediu"
    case "low":
      return "Scăzut"
    default:
      return String(sev)
  }
}

function buildDiagnosticMarkdown(input: {
  clientName: string
  clientCui: string | undefined
  sector: string | undefined
  partnerName: string
  partnerTagline: string | null
  findings: ScanFinding[]
  tags: string[]
}): string {
  const { clientName, clientCui, sector, partnerName, partnerTagline, findings, tags } = input

  const critical = findings.filter((f) => f.severity === "critical")
  const high = findings.filter((f) => f.severity === "high")
  const medium = findings.filter((f) => f.severity === "medium")
  const low = findings.filter((f) => f.severity === "low")
  const total = findings.length || 1
  const score = Math.max(0, Math.min(100, Math.round(((total - critical.length) / total) * 100)))
  const riskLabel = critical.length > 2 ? "Risc Ridicat" : high.length > 3 ? "Risc Mediu" : "Risc Scăzut"

  const top3 = [...findings]
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 } as const
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4)
    })
    .slice(0, 3)

  const lines: string[] = []

  lines.push(`# Diagnostic Compliance`)
  lines.push(``)
  lines.push(`**${clientName}**${clientCui ? ` · CUI ${clientCui}` : ""}${sector ? ` · ${sector}` : ""}`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(`## Rezumat executiv`)
  lines.push(``)
  lines.push(`- **Scor conformitate**: ${score}% (${riskLabel})`)
  lines.push(`- **Framework-uri aplicabile**: ${tags.length ? tags.join(", ").toUpperCase() : "GDPR"}`)
  lines.push(`- **Total findings**: ${findings.length}`)
  lines.push(`- **Critice**: ${critical.length} · **Ridicate**: ${high.length} · **Medii**: ${medium.length} · **Scăzute**: ${low.length}`)
  lines.push(``)

  if (top3.length > 0) {
    lines.push(`## Top ${top3.length} acțiuni prioritare`)
    lines.push(``)
    for (const finding of top3) {
      lines.push(`### ${finding.title}`)
      lines.push(`*${finding.category} · severitate ${severityLabel(finding.severity)}*`)
      lines.push(``)
      lines.push(finding.detail)
      if (finding.remediationHint) {
        lines.push(``)
        lines.push(`**Recomandare**: ${finding.remediationHint}`)
      }
      lines.push(``)
    }
  }

  lines.push(`---`)
  lines.push(``)
  lines.push(`## Ce urmează`)
  lines.push(``)
  lines.push(
    `Acest diagnostic este un punct de plecare. Rezolvarea findings-urilor necesită:`
  )
  lines.push(`- Generare politici personalizate (privacy, cookies, DPA vendors)`)
  lines.push(`- Colectare documentație (ROPA, registru prelucrări, proceduri interne)`)
  lines.push(`- Assessment periodic + monitorizare schimbări normative`)
  lines.push(``)
  lines.push(`Contactează **${partnerName}** pentru o ofertă personalizată.`)
  if (partnerTagline) {
    lines.push(``)
    lines.push(`*${partnerTagline}*`)
  }

  return lines.join("\n")
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const session = await requireFreshAuthenticatedSession(
      request,
      "generarea diagnosticului PDF"
    )
    const { orgId } = await params

    // Verify user has membership to this org (owner for self, partner_manager for client)
    const memberships = await listUserMemberships(session.userId)
    const membership = memberships.find(
      (m) => m.orgId === orgId && m.status === "active"
    )
    if (!membership) {
      return jsonError("Acces interzis sau organizație inexistentă.", 403, "FORBIDDEN")
    }

    // Load client state
    const state = await readFreshStateForOrg(orgId, membership.orgName)
    if (!state) {
      return jsonError("Starea organizației nu a fost găsită.", 404, "STATE_NOT_FOUND")
    }

    // Find partner's OWN owner-role org for white-label (if partner_manager on target)
    const ownerMembership = memberships.find(
      (m) => m.role === "owner" && m.status === "active"
    )
    const whiteLabelOrgId = ownerMembership?.orgId ?? orgId
    const whiteLabel = await getWhiteLabelConfig(whiteLabelOrgId).catch(() => null)

    const clientName = state.orgProfile?.cui
      ? membership.orgName
      : membership.orgName
    const partnerName = whiteLabel?.partnerName?.trim() || ownerMembership?.orgName || "CompliAI"
    const partnerTagline = whiteLabel?.tagline?.trim() || null

    const markdown = buildDiagnosticMarkdown({
      clientName,
      clientCui: state.orgProfile?.cui,
      sector: state.orgProfile?.sector,
      partnerName,
      partnerTagline,
      findings: state.findings ?? [],
      tags: state.applicability?.tags ?? [],
    })

    const pdfBuffer = await buildPDFFromMarkdown(markdown, {
      orgName: partnerName,
      documentType: `Diagnostic ${clientName}`,
      generatedAt: new Date().toISOString(),
    })

    const safeName = clientName.replace(/[^a-z0-9]/gi, "-").toLowerCase()
    const fileName = `Diagnostic-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      ...withRequestIdHeaders(
        {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-store",
            "Content-Length": pdfBuffer.length.toString(),
          },
        }
      ),
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    console.error("[diagnostic-pdf] failed", error)
    return jsonError(
      error instanceof Error ? error.message : "Generarea diagnosticului PDF a eșuat.",
      500,
      "DIAGNOSTIC_PDF_FAILED"
    )
  }
}
