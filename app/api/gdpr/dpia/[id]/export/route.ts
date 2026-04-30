import { NextResponse } from "next/server"

import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type { ComplianceEvent, DpiaRecord } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { mutateFreshStateForOrg, readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { READ_ROLES } from "@/lib/server/rbac"

export const runtime = "nodejs"

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "dpia"
}

function list(items: string[], empty: string) {
  return items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : `- ${empty}`
}

function bool(value: boolean) {
  return value ? "Da" : "Nu"
}

function buildDpiaMarkdown(record: DpiaRecord, orgName: string) {
  return [
    `# DPIA — ${record.title}`,
    "",
    `**Organizație:** ${orgName}`,
    `**Status:** ${record.status}`,
    `**Risc rezidual:** ${record.residualRisk}`,
    `**Owner:** ${record.owner}`,
    record.dueAtISO ? `**Termen:** ${new Date(record.dueAtISO).toLocaleDateString("ro-RO")}` : null,
    record.approvedAtISO ? `**Aprobat la:** ${new Date(record.approvedAtISO).toLocaleString("ro-RO")}` : null,
    record.approvedBy ? `**Aprobat de:** ${record.approvedBy}` : null,
    "",
    "## 1. Descrierea prelucrării",
    record.processingDescription,
    "",
    "## 2. Scop și temei legal",
    `**Scop:** ${record.processingPurpose}`,
    `**Temei legal:** ${record.legalBasis}`,
    "",
    "## 3. Categorii de date și persoane vizate",
    "**Categorii date:**",
    list(record.dataCategories, "De completat"),
    "",
    "**Persoane vizate:**",
    list(record.dataSubjects, "De completat"),
    "",
    "## 4. Factori DPIA",
    `- Categorii speciale de date: ${bool(record.specialCategories)}`,
    `- Decizie automată / profiling: ${bool(record.automatedDecisionMaking)}`,
    `- Prelucrare la scară largă: ${bool(record.largeScaleProcessing)}`,
    record.linkedRopaEntryLabel
      ? `- Legătură RoPA: ${record.linkedRopaEntryLabel}`
      : "- Legătură RoPA: de completat",
    "",
    "## 5. Necesitate și proporționalitate",
    `**Necesitate:** ${record.necessityAssessment}`,
    "",
    `**Proporționalitate:** ${record.proportionalityAssessment}`,
    "",
    "## 6. Riscuri pentru drepturile persoanelor",
    list(record.risks, "Nu există riscuri documentate încă"),
    "",
    "## 7. Măsuri de mitigare",
    list(record.mitigationMeasures, "Nu există măsuri documentate încă"),
    "",
    "## 8. Dovadă și decizie",
    record.evidenceNote ? record.evidenceNote : "Dovada implementării măsurilor trebuie atașată în Dosar.",
    record.evidenceFileName ? `\n\nFișier dovadă: ${record.evidenceFileName}` : "",
    "",
    "## Checklist final",
    `- [${record.linkedRopaEntryLabel || record.linkedRopaDocumentId ? "x" : " "}] RoPA actualizat / legat`,
    `- [${record.mitigationMeasures.length > 0 ? "x" : " "}] Măsuri de mitigare documentate`,
    `- [${record.evidenceNote || record.evidenceFileName ? "x" : " "}] Dovadă atașată`,
    `- [${record.status === "approved" || record.status === "completed" ? "x" : " "}] Revizie DPO aprobată`,
    "",
    "> Document de lucru pregătit pentru revizia consultantului DPO. Nu reprezintă opinie juridică finală fără validare profesională.",
  ].filter((line): line is string => typeof line === "string").join("\n")
}

function eventActor(session: Awaited<ReturnType<typeof requireFreshRole>>) {
  return {
    id: session.email,
    label: session.email,
    role: session.role as ComplianceEvent["actorRole"],
    source: "session" as const,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "export DPIA")
    const { id } = await params
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    const record = (state?.dpiaRecords ?? []).find((item) => item.id === id)
    if (!record) return jsonError("DPIA nu a fost găsită.", 404, "NOT_FOUND")

    const markdown = buildDpiaMarkdown(record, session.orgName)
    const format = new URL(request.url).searchParams.get("format")
    const nowISO = new Date().toISOString()

    await mutateFreshStateForOrg(
      session.orgId,
      (current) => ({
        ...current,
        dpiaRecords: (current.dpiaRecords ?? []).map((item) =>
          item.id === record.id ? { ...item, exportedAtISO: nowISO, updatedAtISO: nowISO } : item
        ),
        events: appendComplianceEvents(current, [
          createComplianceEvent(
            {
              type: "gdpr.dpia.exported",
              entityType: "system",
              entityId: record.id,
              message: `DPIA exportată: ${record.title}`,
              createdAtISO: nowISO,
              metadata: {
                status: record.status,
                residualRisk: record.residualRisk,
              },
            },
            eventActor(session)
          ),
        ]),
      }),
      session.orgName
    )

    const fileStem = `dpia-${slug(session.orgName)}-${slug(record.title)}-${nowISO.slice(0, 10)}`
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
      documentType: "DPIA GDPR Art. 35",
      generatedAt: nowISO,
      auditReadiness: record.status === "completed" ? "audit_ready" : "review_required",
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
    return jsonError("Nu am putut exporta DPIA.", 500, "DPIA_EXPORT_FAILED")
  }
}
