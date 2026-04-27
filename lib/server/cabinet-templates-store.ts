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
}

const DATA_DIR = path.join(process.cwd(), ".data")
const MAX_TEMPLATES_PER_ORG = 50
const MAX_CONTENT_BYTES = 200 * 1024

const cache = new Map<string, CabinetTemplate[]>()

function safeOrgId(orgId: string): string {
  return orgId.replace(/[^a-zA-Z0-9._-]+/g, "-")
}

function templatesFile(orgId: string): string {
  return path.join(DATA_DIR, `cabinet-templates-${safeOrgId(orgId)}.json`)
}

function detectVariables(content: string): string[] {
  const found = new Set<string>()
  const regex = /\{\{\s*([A-Z][A-Z0-9_]*)\s*\}\}/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    found.add(match[1])
  }
  return Array.from(found).sort()
}

async function readDisk(orgId: string): Promise<CabinetTemplate[]> {
  try {
    const raw = await fs.readFile(templatesFile(orgId), "utf8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is CabinetTemplate => {
      return (
        entry !== null &&
        typeof entry === "object" &&
        typeof (entry as { id?: unknown }).id === "string" &&
        typeof (entry as { content?: unknown }).content === "string"
      )
    })
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
  cache.set(orgId, fromDisk)
  return fromDisk
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
      if (t.id === templateId) return { ...t, active: true, updatedAtISO: nowISO }
      if (t.documentType === target.documentType && t.active) {
        return { ...t, active: false, updatedAtISO: nowISO }
      }
      return t
    })
  } else {
    next = existing.map((t) =>
      t.id === templateId ? { ...t, active: false, updatedAtISO: nowISO } : t
    )
  }
  cache.set(orgId, next)
  await writeDisk(orgId, next)
  const updated = next.find((t) => t.id === templateId)!
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
