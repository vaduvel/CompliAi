// S1.1 — Cabinet custom templates store.
// Cabinet poate uploada template-uri Markdown personalizate pentru fiecare
// DocumentType. La generare, dacă există template ACTIVE pe acel tip, sistemul
// folosește conținutul cabinet în loc de fallback-ul determinist intern.
//
// Storage: per-org JSON file `.data/cabinet-templates-{orgId}.json` cu Map cache.
// Limita pragmatică: 50 templates per org, 200KB content per template (Markdown).

import { promises as fs } from "node:fs"
import path from "node:path"

import { writeFileSafe } from "@/lib/server/fs-safe"
import type { DocumentType } from "@/lib/server/document-generator"

export type CabinetTemplate = {
  id: string
  orgId: string
  documentType: DocumentType
  name: string
  description?: string | null
  versionLabel: string
  sourceFileName?: string | null
  status: "draft" | "active" | "archived"
  revision: number
  /** Markdown content. Variabilele `{{ORG_NAME}}` etc. sunt înlocuite la generare. */
  content: string
  uploadedAtISO: string
  updatedAtISO: string
  active: boolean
  /** Variabile detectate auto din content (`{{ORG_NAME}}` etc.). */
  detectedVariables: string[]
  sizeBytes: number
}

export type CabinetTemplateInput = {
  documentType: DocumentType
  name: string
  content: string
  active?: boolean
  description?: string | null
  versionLabel?: string | null
  sourceFileName?: string | null
}

export type CabinetTemplateUpdateInput = {
  active?: boolean
  status?: CabinetTemplate["status"]
  name?: string
  description?: string | null
  content?: string
  versionLabel?: string | null
  sourceFileName?: string | null
}

const DATA_DIR = path.join(process.cwd(), ".data")
const MAX_TEMPLATES_PER_ORG = 50
const MAX_CONTENT_BYTES = 200 * 1024
const DEFAULT_TEMPLATE_TIMESTAMP = "2026-01-01T00:00:00.000Z"

const cache = new Map<string, CabinetTemplate[]>()

function safeOrgId(orgId: string): string {
  return orgId.replace(/[^a-zA-Z0-9._-]+/g, "-")
}

function templatesFile(orgId: string): string {
  return path.join(DATA_DIR, `cabinet-templates-${safeOrgId(orgId)}.json`)
}

function detectVariables(content: string): string[] {
  const found = new Set<string>()
  const regex = /\{\{\s*([A-Za-zÀ-ž_][A-Za-zÀ-ž0-9_]*)\s*\}\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1])
  }
  return Array.from(found).sort()
}

function sanitizeOptionalText(value: string | null | undefined, max = 240) {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

function normalizeVersionLabel(value: string | null | undefined, fallback: string) {
  return sanitizeOptionalText(value, 80) ?? fallback
}

function buildDefaultTemplate(
  orgId: string,
  input: {
    id: string
    documentType: DocumentType
    name: string
    description: string
    content: string
    active?: boolean
  }
): CabinetTemplate {
  const active = input.active ?? true
  return {
    id: input.id,
    orgId,
    documentType: input.documentType,
    name: input.name,
    description: input.description,
    versionLabel: "CompliScan default v1",
    sourceFileName: "CompliScan default library",
    status: active ? "active" : "draft",
    revision: 1,
    content: input.content,
    uploadedAtISO: DEFAULT_TEMPLATE_TIMESTAMP,
    updatedAtISO: DEFAULT_TEMPLATE_TIMESTAMP,
    active,
    detectedVariables: detectVariables(input.content),
    sizeBytes: Buffer.byteLength(input.content, "utf8"),
  }
}

function buildDefaultCabinetTemplates(orgId: string): CabinetTemplate[] {
  return [
    buildDefaultTemplate(orgId, {
      id: "default-dsar-access-response",
      documentType: "dsar-response",
      name: "Răspuns DSAR — acces la date",
      description: "Template de pornire pentru cereri Art. 15 GDPR, înainte ca biroul să urce varianta proprie.",
      content:
        "# Răspuns DSAR — {{ORG_NAME}}\n\n" +
        "Solicitant: {{REQUESTER_NAME}}\n\n" +
        "Referință cerere: {{DSAR_ID}}\n\n" +
        "Pregătit de: {{PREPARED_BY}} · {{DPO_EMAIL}}\n\n" +
        "Confirmăm primirea cererii de acces și descriem categoriile de date, scopurile, destinatarii, perioada de retenție și drepturile disponibile. Documentul trebuie revizuit de consultantul DPO înainte de trimitere.\n",
    }),
    buildDefaultTemplate(orgId, {
      id: "default-dsar-erasure-refusal",
      documentType: "dsar-response",
      name: "Răspuns DSAR — refuz ștergere motivat",
      description: "Variantă draft pentru cazurile în care ștergerea nu poate fi executată integral.",
      active: false,
      content:
        "# Răspuns DSAR — refuz ștergere motivat pentru {{ORG_NAME}}\n\n" +
        "Solicitant: {{REQUESTER_NAME}}\n\n" +
        "Referință cerere: {{DSAR_ID}}\n\n" +
        "Pregătit de: {{PREPARED_BY}} · {{DPO_EMAIL}}\n\n" +
        "Explicăm temeiul pentru păstrarea anumitor date, categoriile afectate, durata de retenție și dreptul persoanei vizate de a depune plângere. Consultantul DPO trebuie să valideze motivarea legală înainte de trimitere.\n",
    }),
    buildDefaultTemplate(orgId, {
      id: "default-vendor-dpa-scc",
      documentType: "dpa",
      name: "DPA furnizor — vendor SaaS / SCC",
      description: "Template de pornire pentru furnizori care procesează date în numele clientului.",
      content:
        "# DPA furnizor — {{ORG_NAME}} × {{COUNTERPARTY_NAME}}\n\n" +
        "Pregătit de: {{PREPARED_BY}} · {{DPO_EMAIL}}\n\n" +
        "Acest draft acoperă obiectul prelucrării, durata, categoriile de date, subprocessori, măsuri tehnice și organizatorice, notificarea incidentelor, asistența DSAR și transferurile internaționale/SCC unde este cazul.\n",
    }),
    buildDefaultTemplate(orgId, {
      id: "default-anspdcp-breach-72h",
      documentType: "nis2-incident-response",
      name: "Breach ANSPDCP — notificare 72h",
      description: "Runbook și draft de notificare pentru incidente cu date personale.",
      content:
        "# Notificare incident date personale — {{ORG_NAME}}\n\n" +
        "Pregătit de: {{PREPARED_BY}} · {{DPO_EMAIL}}\n\n" +
        "Completează data detectării, natura incidentului, categoriile și numărul estimat de persoane vizate, consecințele probabile, măsurile luate și persoana de contact. Această notificare este separată de orice raportare DNSC/NIS2.\n",
    }),
    buildDefaultTemplate(orgId, {
      id: "default-annual-gdpr-audit-report",
      documentType: "ropa",
      name: "Raport audit anual GDPR — cabinet",
      description: "Structură minimă pentru revizia anuală: RoPA, DSAR, DPA, training, breach, dovezi.",
      content:
        "# Raport audit anual GDPR — {{ORG_NAME}}\n\n" +
        "Pregătit de: {{PREPARED_BY}} · {{DPO_EMAIL}}\n\n" +
        "Include sumar executiv, schimbări în activități de prelucrare, RoPA, cereri DSAR, furnizori și DPA-uri, training angajați, incidente, dovezi validate, riscuri rămase și recomandări pentru următoarea perioadă.\n",
    }),
  ]
}

function normalizeTemplate(entry: CabinetTemplate): CabinetTemplate {
  const active = Boolean(entry.active)
  const status =
    entry.status === "archived" || entry.status === "draft" || entry.status === "active"
      ? entry.status
      : active
        ? "active"
        : "draft"

  return {
    ...entry,
    description: sanitizeOptionalText(entry.description ?? null),
    versionLabel: normalizeVersionLabel(entry.versionLabel, "v1"),
    sourceFileName: sanitizeOptionalText(entry.sourceFileName ?? null, 180),
    status,
    revision: Number.isFinite(entry.revision) && entry.revision > 0 ? Math.floor(entry.revision) : 1,
    active: status === "active" && active,
    detectedVariables: Array.isArray(entry.detectedVariables)
      ? entry.detectedVariables
      : detectVariables(entry.content),
    sizeBytes: Number.isFinite(entry.sizeBytes)
      ? entry.sizeBytes
      : Buffer.byteLength(entry.content, "utf8"),
  }
}

async function readDisk(orgId: string): Promise<CabinetTemplate[]> {
  try {
    const raw = await fs.readFile(templatesFile(orgId), "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry): entry is CabinetTemplate => {
        return (
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { id?: unknown }).id === "string" &&
        typeof (entry as { content?: unknown }).content === "string"
        )
      })
      .map(normalizeTemplate)
  } catch {
    return []
  }
}

async function writeDisk(orgId: string, templates: CabinetTemplate[]): Promise<void> {
  await writeFileSafe(templatesFile(orgId), JSON.stringify(templates, null, 2))
}

export async function listCabinetTemplates(orgId: string): Promise<CabinetTemplate[]> {
  if (cache.has(orgId)) {
    return cache.get(orgId) ?? []
  }
  const fromDisk = await readDisk(orgId)
  const templates = fromDisk.length === 0 ? buildDefaultCabinetTemplates(orgId) : fromDisk
  cache.set(orgId, templates)
  if (fromDisk.length === 0) {
    await writeDisk(orgId, templates)
  }
  return templates
}

export async function getActiveTemplateForType(
  orgId: string,
  documentType: DocumentType
): Promise<CabinetTemplate | null> {
  const all = await listCabinetTemplates(orgId)
  return (
    all
      .filter((t) => t.documentType === documentType && t.active)
      .sort((a, b) => b.updatedAtISO.localeCompare(a.updatedAtISO))[0] ?? null
  )
}

export async function saveCabinetTemplate(
  orgId: string,
  input: CabinetTemplateInput
): Promise<{ ok: true; template: CabinetTemplate } | { ok: false; error: string }> {
  const trimmedName = input.name.trim()
  if (!trimmedName) {
    return { ok: false, error: "Numele template-ului este obligatoriu." }
  }
  if (trimmedName.length > 120) {
    return { ok: false, error: "Numele template-ului trebuie să aibă maxim 120 caractere." }
  }
  const content = input.content
  if (typeof content !== "string" || content.length < 50) {
    return { ok: false, error: "Conținutul template-ului trebuie să aibă minim 50 caractere." }
  }
  const sizeBytes = Buffer.byteLength(content, "utf8")
  if (sizeBytes > MAX_CONTENT_BYTES) {
    return {
      ok: false,
      error: `Conținut prea mare (${Math.round(sizeBytes / 1024)}KB > ${Math.round(
        MAX_CONTENT_BYTES / 1024
      )}KB).`,
    }
  }

  const existing = await listCabinetTemplates(orgId)
  if (existing.length >= MAX_TEMPLATES_PER_ORG) {
    return {
      ok: false,
      error: `Limita de ${MAX_TEMPLATES_PER_ORG} template-uri per cabinet este atinsă.`,
    }
  }

  const nowISO = new Date().toISOString()
  const id = `tpl-${input.documentType}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`
  const newTemplate: CabinetTemplate = {
    id,
    orgId,
    documentType: input.documentType,
    name: trimmedName,
    description: sanitizeOptionalText(input.description ?? null),
    versionLabel: normalizeVersionLabel(input.versionLabel, "v1"),
    sourceFileName: sanitizeOptionalText(input.sourceFileName ?? null, 180),
    status: input.active === false ? "draft" : "active",
    revision: 1,
    content,
    uploadedAtISO: nowISO,
    updatedAtISO: nowISO,
    active: input.active ?? true,
    detectedVariables: detectVariables(content),
    sizeBytes,
  }

  // Dacă noul template e activ, dezactivăm celelalte ACTIVE pe același documentType
  // (un singur template activ per tip — last-write-wins).
  let next: CabinetTemplate[] = existing
  if (newTemplate.active) {
    next = existing.map((t) =>
      t.documentType === newTemplate.documentType && t.active
        ? { ...t, active: false, updatedAtISO: nowISO }
        : t
    )
  }
  next = [...next, newTemplate]

  cache.set(orgId, next)
  await writeDisk(orgId, next)
  return { ok: true, template: newTemplate }
}

export async function setTemplateActive(
  orgId: string,
  templateId: string,
  active: boolean
): Promise<{ ok: true; template: CabinetTemplate } | { ok: false; error: string }> {
  const existing = await listCabinetTemplates(orgId)
  const target = existing.find((t) => t.id === templateId)
  if (!target) {
    return { ok: false, error: "Template-ul nu există." }
  }
  const nowISO = new Date().toISOString()
  // Dacă activăm, dezactivăm restul pe același documentType.
  let next: CabinetTemplate[] = existing
  if (active) {
    next = existing.map((t) => {
      if (t.id === templateId) return { ...t, active: true, status: "active" as const, updatedAtISO: nowISO }
      if (t.documentType === target.documentType && t.active) {
        return { ...t, active: false, status: "draft" as const, updatedAtISO: nowISO }
      }
      return t
    })
  } else {
    next = existing.map((t) =>
      t.id === templateId ? { ...t, active: false, status: "draft" as const, updatedAtISO: nowISO } : t
    )
  }
  cache.set(orgId, next)
  await writeDisk(orgId, next)
  const updated = next.find((t) => t.id === templateId)!
  return { ok: true, template: updated }
}

export async function updateCabinetTemplate(
  orgId: string,
  templateId: string,
  input: CabinetTemplateUpdateInput
): Promise<{ ok: true; template: CabinetTemplate } | { ok: false; error: string }> {
  const existing = await listCabinetTemplates(orgId)
  const target = existing.find((t) => t.id === templateId)
  if (!target) {
    return { ok: false, error: "Template-ul nu există." }
  }

  let nextName = target.name
  if (typeof input.name === "string") {
    nextName = input.name.trim()
    if (!nextName) return { ok: false, error: "Numele template-ului este obligatoriu." }
    if (nextName.length > 120) {
      return { ok: false, error: "Numele template-ului trebuie să aibă maxim 120 caractere." }
    }
  }

  let nextContent = target.content
  if (typeof input.content === "string") {
    if (input.content.length < 50) {
      return { ok: false, error: "Conținutul template-ului trebuie să aibă minim 50 caractere." }
    }
    const sizeBytes = Buffer.byteLength(input.content, "utf8")
    if (sizeBytes > MAX_CONTENT_BYTES) {
      return {
        ok: false,
        error: `Conținut prea mare (${Math.round(sizeBytes / 1024)}KB > ${Math.round(
          MAX_CONTENT_BYTES / 1024
        )}KB).`,
      }
    }
    nextContent = input.content
  }

  const nowISO = new Date().toISOString()
  const explicitActive = typeof input.active === "boolean" ? input.active : undefined
  const explicitStatus = input.status
  const nextStatus: CabinetTemplate["status"] =
    explicitStatus === "archived" || explicitStatus === "draft" || explicitStatus === "active"
      ? explicitStatus
      : explicitActive === true
        ? "active"
        : explicitActive === false
          ? "draft"
          : target.status
  const nextActive = nextStatus === "active"

  const updated: CabinetTemplate = {
    ...target,
    name: nextName,
    description:
      "description" in input
        ? sanitizeOptionalText(input.description ?? null)
        : target.description ?? null,
    versionLabel:
      "versionLabel" in input
        ? normalizeVersionLabel(input.versionLabel ?? null, target.versionLabel)
        : target.versionLabel,
    sourceFileName:
      "sourceFileName" in input
        ? sanitizeOptionalText(input.sourceFileName ?? null, 180)
        : target.sourceFileName ?? null,
    content: nextContent,
    sizeBytes: Buffer.byteLength(nextContent, "utf8"),
    detectedVariables: detectVariables(nextContent),
    status: nextStatus,
    active: nextActive,
    revision: target.revision + 1,
    updatedAtISO: nowISO,
  }

  const next = existing.map((t) => {
    if (t.id === templateId) return updated
    if (nextActive && t.documentType === target.documentType && t.active) {
      return { ...t, active: false, status: "draft" as const, updatedAtISO: nowISO }
    }
    return t
  })

  cache.set(orgId, next)
  await writeDisk(orgId, next)
  return { ok: true, template: updated }
}

export async function deleteCabinetTemplate(
  orgId: string,
  templateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await listCabinetTemplates(orgId)
  if (!existing.some((t) => t.id === templateId)) {
    return { ok: false, error: "Template-ul nu există." }
  }
  const next = existing.filter((t) => t.id !== templateId)
  cache.set(orgId, next)
  await writeDisk(orgId, next)
  return { ok: true }
}
