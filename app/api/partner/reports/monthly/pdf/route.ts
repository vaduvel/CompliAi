import { POST as generateMonthlyPreview } from "@/app/api/partner/reports/monthly/route"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

export const runtime = "nodejs"

type MonthlyClientEntry = {
  orgName: string
  score: number
  riskLabel: string
  auditReadiness: "audit_ready" | "review_required"
  openFindings: number
  validatedEvidence: number
  pendingEvidence: number
  workDone?: string[]
  activities?: string[]
  openFindingTitles?: string[]
  nextActions?: string[]
}

type MonthlyPayload = {
  reports?: Array<{
    consultantEmail?: string
    month?: string
    clientEntries?: MonthlyClientEntry[]
  }>
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "raport-lunar"
}

function list(items: string[] | undefined, empty: string) {
  const values = (items ?? []).filter(Boolean)
  return values.length > 0 ? values.map((item) => `- ${item}`).join("\n") : `- ${empty}`
}

function buildMarkdown(payload: MonthlyPayload, cabinetName: string, consultantLabel: string) {
  const report = payload.reports?.[0]
  const month = report?.month ?? new Date().toLocaleDateString("ro-RO", { month: "long", year: "numeric" })
  const clients = report?.clientEntries ?? []

  return [
    `# Raport lunar DPO — ${cabinetName}`,
    "",
    `**Perioadă:** ${month}`,
    `**Clienți incluși:** ${clients.length}`,
    `**Consultant:** ${consultantLabel}`,
    "",
    "## Rezumat portofoliu",
    `- Clienți audit ready: ${clients.filter((client) => client.auditReadiness === "audit_ready").length}`,
    `- Clienți review required: ${clients.filter((client) => client.auditReadiness !== "audit_ready").length}`,
    `- Findings deschise: ${clients.reduce((sum, client) => sum + (client.openFindings ?? 0), 0)}`,
    `- Dovezi validate: ${clients.reduce((sum, client) => sum + (client.validatedEvidence ?? 0), 0)}`,
    `- Dovezi pendinte: ${clients.reduce((sum, client) => sum + (client.pendingEvidence ?? 0), 0)}`,
    "",
    ...clients.flatMap((client) => [
      `## ${client.orgName}`,
      "",
      `**Scor:** ${client.score}/100`,
      `**Risc:** ${client.riskLabel}`,
      `**Audit readiness:** ${client.auditReadiness}`,
      `**Findings deschise:** ${client.openFindings}`,
      `**Dovezi:** ${client.validatedEvidence} validate / ${client.pendingEvidence} pendinte`,
      "",
      "### Ce s-a lucrat",
      list(client.workDone?.length ? client.workDone : client.activities, "Nicio acțiune nouă în perioada raportată."),
      "",
      "### Rămâne deschis",
      list(client.openFindingTitles, "Nu există findings deschise."),
      "",
      "### Următorul pas",
      list(client.nextActions, "Monitorizare lunară."),
      "",
    ]),
    "> Raport client-facing pregătit de cabinet. Necesită revizie profesională înainte de trimitere oficială.",
  ].filter((line): line is string => typeof line === "string").join("\n")
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, ["owner", "partner_manager", "compliance", "reviewer"], "export PDF raport lunar")
    const body = new URL(request.url).searchParams.get("clientOrgId")
      ? { clientOrgId: new URL(request.url).searchParams.get("clientOrgId") }
      : {}
    const previewRequest = new Request(new URL("/api/partner/reports/monthly", request.url), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(body),
    })
    const preview = await generateMonthlyPreview(previewRequest)
    const payload = (await preview.json()) as MonthlyPayload & { error?: string }
    if (!preview.ok) {
      return jsonError(payload.error ?? "Nu am putut genera preview-ul raportului lunar.", preview.status, "MONTHLY_PREVIEW_FAILED")
    }

    const whiteLabel = await getWhiteLabelConfig(session.orgId).catch(() => null)
    const cabinetName = whiteLabel?.partnerName?.trim() || session.orgName
    const consultantLabel = whiteLabel?.signerName?.trim() || session.email
    const markdown = buildMarkdown(payload, cabinetName, consultantLabel)
    const pdf = await buildPDFFromMarkdown(markdown, {
      orgName: cabinetName,
      documentType: "Raport lunar DPO",
      generatedAt: new Date().toISOString(),
      signerName: consultantLabel,
    })
    const month = payload.reports?.[0]?.month ?? new Date().toISOString().slice(0, 10)
    const fileName = `raport-lunar-dpo-${slug(cabinetName)}-${slug(month)}.pdf`

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Nu am putut exporta raportul lunar PDF.", 500, "MONTHLY_PDF_EXPORT_FAILED")
  }
}
