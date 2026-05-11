import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import type { GdprTrainingRecord } from "@/lib/compliance/types"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { READ_ROLES } from "@/lib/server/rbac"

export const runtime = "nodejs"

function list(items: string[] | undefined, empty: string) {
  const values = (items ?? []).filter(Boolean)
  return values.length > 0 ? values.map((item) => `- ${item}`).join("\n") : `- ${empty}`
}

function buildMarkdown(records: GdprTrainingRecord[], orgName: string) {
  const completed = records.filter((record) => record.status === "completed")
  const open = records.filter((record) => record.status !== "completed")
  return [
    `# Registru training GDPR — ${orgName}`,
    "",
    `**Generat:** ${new Date().toLocaleString("ro-RO")}`,
    `**Traininguri totale:** ${records.length}`,
    `**Completate:** ${completed.length}`,
    `**Deschise:** ${open.length}`,
    `**Participanți acoperiți:** ${completed.reduce((sum, record) => sum + record.participantCount, 0)}`,
    "",
    ...records.flatMap((record) => [
      `## ${record.title}`,
      "",
      `**Status:** ${record.status}`,
      `**Audiență:** ${record.audience}`,
      `**Participanți:** ${record.participantCount}`,
      record.dueAtISO ? `**Termen:** ${new Date(record.dueAtISO).toLocaleDateString("ro-RO")}` : null,
      record.completedAtISO ? `**Completat:** ${new Date(record.completedAtISO).toLocaleString("ro-RO")}` : null,
      record.certificateTitle ? `**Certificat / material:** ${record.certificateTitle}` : null,
      record.evidenceFileName ? `**Dovadă fișier:** ${record.evidenceFileName}` : null,
      record.evidenceValidatedAtISO ? `**Dovadă validată:** ${new Date(record.evidenceValidatedAtISO).toLocaleString("ro-RO")}` : null,
      "",
      "### Participanți",
      list(record.participantNames, "Participanții sunt păstrați în lista originală / atașament."),
      "",
      "### Dovadă",
      record.evidenceNote ?? "Dovada trebuie atașată înainte de audit.",
      "",
    ]),
    "> Registru de lucru pentru accountability GDPR Art. 39. Necesită revizie profesională înainte de transmitere oficială.",
  ].filter((line): line is string => typeof line === "string").join("\n")
}

function slug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "training-gdpr"
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "export training GDPR")
    const state = await readFreshStateForOrg(session.orgId, session.orgName)
    const records = state?.gdprTrainingRecords ?? []
    const markdown = buildMarkdown(records, session.orgName)
    const pdf = await buildPDFFromMarkdown(markdown, {
      orgName: session.orgName,
      documentType: "Registru training GDPR",
      generatedAt: new Date().toISOString(),
      signerName: session.email,
    })
    const fileName = `registru-training-gdpr-${slug(session.orgName)}-${new Date().toISOString().slice(0, 10)}.pdf`
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
    return jsonError("Nu am putut exporta registrul de training.", 500, "GDPR_TRAINING_EXPORT_FAILED")
  }
}
