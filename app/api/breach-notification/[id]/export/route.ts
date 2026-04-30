import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceEvent } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State, type AnspdcpBreachNotification, type Nis2Incident } from "@/lib/server/nis2-store"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { READ_ROLES } from "@/lib/server/rbac"

function actorFromSession(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  return {
    id: session.email,
    label: session.email,
    role: session.role as ComplianceEvent["actorRole"],
    source: "session" as const,
  }
}

function safeFileSegment(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "incident"
  )
}

function statusLabel(status: AnspdcpBreachNotification["status"] | undefined) {
  switch (status) {
    case "acknowledged":
      return "Confirmată de ANSPDCP"
    case "submitted":
      return "Trimisă către ANSPDCP"
    default:
      return "Draft / de trimis"
  }
}

function deadlineLabel(deadlineISO: string) {
  const diffMs = new Date(deadlineISO).getTime() - Date.now()
  const hours = Math.round(Math.abs(diffMs) / 3_600_000)
  return diffMs >= 0 ? `${hours}h rămase` : `depășit cu ${hours}h`
}

function buildNotificationMarkdown(params: {
  incident: Nis2Incident
  notification: AnspdcpBreachNotification
  orgName: string
  generatedAtISO: string
  exportedBy: string
}) {
  const { incident, notification, orgName, generatedAtISO, exportedBy } = params
  return [
    "# Dosar notificare ANSPDCP — GDPR Art. 33/34",
    "",
    `Client: ${orgName}`,
    `Incident: ${incident.title}`,
    `Exportat: ${generatedAtISO}`,
    `Exportat de: ${exportedBy}`,
    "",
    "## Status notificare",
    "",
    `- Status: ${statusLabel(notification.status)}`,
    `- Deadline 72h: ${notification.deadlineISO} (${deadlineLabel(notification.deadlineISO)})`,
    `- Descoperit la: ${incident.detectedAtISO}`,
    notification.submittedAtISO ? `- Trimis la: ${notification.submittedAtISO}` : "- Trimis la: încă netrimis",
    notification.anspdcpReference ? `- Nr. înregistrare ANSPDCP: ${notification.anspdcpReference}` : "- Nr. înregistrare ANSPDCP: necompletat",
    "",
    "## Incident",
    "",
    `- Severitate: ${incident.severity}`,
    `- Status NIS2/DNSC: ${incident.status}`,
    `- Sisteme afectate: ${incident.affectedSystems.length ? incident.affectedSystems.join(", ") : "necompletat"}`,
    `- Descriere: ${incident.description || "necompletat"}`,
    incident.attackType ? `- Tip atac: ${incident.attackType}` : null,
    incident.attackVector ? `- Vector atac: ${incident.attackVector}` : null,
    incident.operationalImpact ? `- Impact operațional: ${incident.operationalImpact}` : null,
    incident.operationalImpactDetails ? `- Detalii impact: ${incident.operationalImpactDetails}` : null,
    "",
    "## Conținut obligatoriu Art. 33(3)",
    "",
    `- Categorii date afectate: ${notification.dataCategories.length ? notification.dataCategories.join(", ") : "necompletat"}`,
    `- Persoane vizate estimate: ${notification.estimatedDataSubjects ?? "necompletat"}`,
    `- DPO / contact conformitate: ${notification.dpoContact || "necompletat"}`,
    `- Consecințe probabile: ${notification.consequencesDescription || "necompletat"}`,
    `- Măsuri luate / propuse: ${notification.measuresTaken || incident.measuresTaken || "necompletat"}`,
    "",
    "## Art. 34 — persoane vizate",
    "",
    `- Notificare individuală necesară: ${notification.notifyDataSubjects ? "Da" : "Nu / de evaluat"}`,
    notification.dataSubjectsNotifiedAtISO
      ? `- Persoane vizate notificate la: ${notification.dataSubjectsNotifiedAtISO}`
      : "- Persoane vizate notificate la: necompletat",
    "",
    "## Checklist transmitere",
    "",
    `- [${notification.dataCategories.length ? "x" : " "}] Categorii de date afectate completate`,
    `- [${notification.estimatedDataSubjects != null ? "x" : " "}] Număr aproximativ persoane vizate completat`,
    `- [${notification.dpoContact ? "x" : " "}] Contact DPO completat`,
    `- [${notification.consequencesDescription ? "x" : " "}] Consecințe probabile completate`,
    `- [${notification.measuresTaken || incident.measuresTaken ? "x" : " "}] Măsuri luate/propuse completate`,
    `- [${notification.status === "submitted" || notification.status === "acknowledged" ? "x" : " "}] Notificare marcată ca transmisă`,
    `- [${notification.anspdcpReference ? "x" : " "}] Număr de înregistrare salvat`,
    "",
    "## Notă de utilizare",
    "",
    "Acest dosar este un instrument de lucru pentru cabinetul DPO. Necesită validare profesională înainte de transmiterea oficială sau arhivarea finală.",
    "",
  ]
    .filter((line): line is string => line !== null)
    .join("\n")
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(
      request,
      READ_ROLES,
      "exportul dosarului ANSPDCP"
    )
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")
    const state = await readNis2State(session.orgId)
    const incident = state.incidents.find((entry) => entry.id === id)
    if (!incident) return jsonError("Incidentul nu a fost găsit.", 404, "INCIDENT_NOT_FOUND")
    if (!incident.involvesPersonalData) {
      return jsonError(
        "Incidentul nu este marcat ca implicând date personale.",
        400,
        "ANSPDCP_NOT_REQUIRED"
      )
    }

    const notification: AnspdcpBreachNotification =
      incident.anspdcpNotification ?? {
        required: true,
        deadlineISO: new Date(new Date(incident.detectedAtISO).getTime() + 72 * 3_600_000).toISOString(),
        status: "pending",
        dataCategories: [],
        estimatedDataSubjects: null,
        notifyDataSubjects: false,
      }
    const generatedAtISO = new Date().toISOString()
    const markdown = buildNotificationMarkdown({
      incident,
      notification,
      orgName: session.orgName,
      generatedAtISO,
      exportedBy: session.email,
    })
    const fileStem = `anspdcp-${safeFileSegment(session.orgName)}-${safeFileSegment(incident.title)}-${generatedAtISO.slice(0, 10)}`

    await mutateFreshStateForOrg(
      session.orgId,
      (state) => ({
        ...state,
        events: appendComplianceEvents(state, [
          createComplianceEvent(
            {
              type: "anspdcp.package.exported",
              entityType: "system",
              entityId: incident.id,
              message: `Dosar ANSPDCP exportat: ${incident.title}`,
              createdAtISO: generatedAtISO,
              metadata: {
                status: notification.status,
                deadlineISO: notification.deadlineISO,
              },
            },
            actorFromSession(session)
          ),
        ]),
      }),
      session.orgName
    )

    if (format === "md") {
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileStem}.md"`,
          "Cache-Control": "no-store",
        },
      })
    }

    const pdf = await buildPDFFromMarkdown(markdown, {
      orgName: session.orgName,
      documentType: "anspdcp-breach-notification",
      generatedAt: generatedAtISO,
      signerName: session.email,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileStem}.pdf"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Exportul dosarului ANSPDCP a eșuat.",
      500,
      "ANSPDCP_EXPORT_FAILED"
    )
  }
}
