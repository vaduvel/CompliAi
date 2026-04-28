"use client"

// S1.1 — Cabinet templates UI: list + upload + activate/delete.
// Cabinet poate uploada template-uri Markdown personalizate per documentType.
// Template activ înlocuiește skeleton-ul intern + servește ca structură pentru
// Gemini la generare AI.

import { useEffect, useState } from "react"
import {
  CheckCircle2,
  FileText,
  Loader2,
  Power,
  PowerOff,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import {
  V3KpiStrip,
  V3PageHero,
  type V3KpiItem,
} from "@/components/compliscan/v3"
import type { DocumentType } from "@/lib/server/document-generator"

type CabinetTemplate = {
  id: string
  orgId: string
  documentType: DocumentType
  name: string
  description?: string | null
  versionLabel: string
  sourceFileName?: string | null
  status: "draft" | "active" | "archived"
  revision: number
  content: string
  uploadedAtISO: string
  updatedAtISO: string
  active: boolean
  detectedVariables: string[]
  sizeBytes: number
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: "privacy-policy", label: "Privacy Policy" },
  { value: "cookie-policy", label: "Cookie Policy" },
  { value: "dpa", label: "DPA (Data Processing Agreement)" },
  { value: "retention-policy", label: "Retention Policy" },
  { value: "nis2-incident-response", label: "NIS2 Incident Response" },
  { value: "ai-governance", label: "AI Governance" },
  { value: "annex-iv", label: "Annex IV (AI Act)" },
  { value: "job-description", label: "Job Description" },
  { value: "hr-internal-procedures", label: "HR Internal Procedures" },
  { value: "reges-correction-brief", label: "REGES Correction Brief" },
  { value: "contract-template", label: "Contract Template" },
  { value: "nda", label: "NDA" },
  { value: "supplier-contract", label: "Supplier Contract" },
  { value: "deletion-attestation", label: "Deletion Attestation" },
  { value: "pay-gap-report", label: "Pay-Gap Report" },
  { value: "ropa", label: "RoPA (Records of Processing)" },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CabinetTemplatesPageSurface() {
  const [templates, setTemplates] = useState<CabinetTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Upload form state
  const [formOpen, setFormOpen] = useState(false)
  const [formDocumentType, setFormDocumentType] = useState<DocumentType>("privacy-policy")
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formVersionLabel, setFormVersionLabel] = useState("v1")
  const [formSourceFileName, setFormSourceFileName] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formFile, setFormFile] = useState<File | null>(null)

  async function loadTemplates() {
    try {
      const res = await fetch("/api/cabinet/templates", { cache: "no-store" })
      const data = (await res.json()) as { ok?: boolean; error?: string; templates?: CabinetTemplate[] }
      if (!res.ok) {
        setError(data.error ?? "Eroare la listarea template-urilor.")
        setTemplates([])
        return
      }
      setTemplates(data.templates ?? [])
      setError(null)
    } catch {
      setError("Eroare de rețea la listarea template-urilor.")
      setTemplates([])
    }
  }

  useEffect(() => {
    void loadTemplates()
  }, [])

  async function handleUpload() {
    if (!formName.trim() || (!formFile && formContent.trim().length < 50)) {
      toast.error("Completează numele și un conținut de minim 50 caractere sau atașează un fișier .docx/.md/.txt.")
      return
    }
    setBusy(true)
    try {
      const res = formFile
        ? await uploadTemplateFile()
        : await fetch("/api/cabinet/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentType: formDocumentType,
              name: formName.trim(),
              description: formDescription.trim() || null,
              versionLabel: formVersionLabel.trim() || "v1",
              sourceFileName: formSourceFileName.trim() || null,
              content: formContent,
              active: true,
            }),
          })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Eroare la upload.")
        return
      }
      toast.success("Template salvat și activat.")
      setFormOpen(false)
      setFormName("")
      setFormDescription("")
      setFormVersionLabel("v1")
      setFormSourceFileName("")
      setFormContent("")
      setFormFile(null)
      await loadTemplates()
    } finally {
      setBusy(false)
    }
  }

  async function uploadTemplateFile() {
    const body = new FormData()
    body.set("documentType", formDocumentType)
    body.set("name", formName.trim())
    body.set("description", formDescription.trim())
    body.set("versionLabel", formVersionLabel.trim() || "v1")
    body.set("sourceFileName", formSourceFileName.trim() || formFile?.name || "")
    body.set("active", "true")
    if (formContent.trim()) body.set("content", formContent)
    if (formFile) body.set("file", formFile)

    return fetch("/api/cabinet/templates", {
      method: "POST",
      body,
    })
  }

  async function handleToggleActive(template: CabinetTemplate) {
    setBusy(true)
    try {
      const res = await fetch(`/api/cabinet/templates/${encodeURIComponent(template.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !template.active }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error ?? "Eroare la activare/dezactivare.")
        return
      }
      toast.success(template.active ? "Template dezactivat." : "Template activat.")
      await loadTemplates()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(template: CabinetTemplate) {
    if (!window.confirm(`Ștergi template-ul "${template.name}"?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/cabinet/templates/${encodeURIComponent(template.id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(data?.error ?? "Eroare la ștergere.")
        return
      }
      toast.success("Template șters.")
      await loadTemplates()
    } finally {
      setBusy(false)
    }
  }

  if (!templates) {
    return <LoadingScreen variant="section" />
  }

  const activeCount = templates.filter((t) => t.active).length
  const distinctTypes = new Set(templates.filter((t) => t.active).map((t) => t.documentType)).size

  const kpiItems: V3KpiItem[] = [
    {
      id: "total",
      label: "Template-uri",
      value: templates.length,
      stripe: "info",
      detail: `${MAX_TEMPLATES_HINT} maxim per cabinet`,
    },
    {
      id: "active",
      label: "Active",
      value: activeCount,
      stripe: activeCount > 0 ? "success" : undefined,
      valueTone: activeCount > 0 ? "success" : "neutral",
      detail: activeCount > 0 ? "se folosesc la generare" : "niciunul nu e activat",
    },
    {
      id: "covered",
      label: "Tipuri acoperite",
      value: distinctTypes,
      stripe: distinctTypes > 0 ? "info" : undefined,
      detail: `din ${DOCUMENT_TYPE_OPTIONS.length} disponibile`,
    },
  ]

  return (
    <div className="space-y-5 pb-20 sm:pb-0" role="main">
      <V3PageHero
        breadcrumbs={[{ label: "Cabinet" }, { label: "Template-uri", current: true }]}
        title="Template-uri cabinet"
        description={
          <>
            Uploadă template-uri Markdown personalizate per tip de document. Template-ul activ
            înlocuiește skeleton-ul intern și servește ca structură pentru AI la generare.
            Folosește variabile <code className="font-mono text-[12px]">{"{{ORG_NAME}}"}</code>,{" "}
            <code className="font-mono text-[12px]">{"{{ORG_CUI}}"}</code>,{" "}
            <code className="font-mono text-[12px]">{"{{PREPARED_BY}}"}</code> etc.
          </>
        }
        actions={
          <button
            type="button"
            onClick={() => setFormOpen((prev) => !prev)}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary-hover"
          >
            <Upload className="size-3.5" strokeWidth={2.5} />
            {formOpen ? "Închide formular" : "Upload template"}
          </button>
        }
      />

      <V3KpiStrip items={kpiItems} />

      {error && (
        <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
          {error}
        </div>
      )}

      {formOpen && (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <h2 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-eos-text">
            Upload template nou
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-eos-text-muted">Tip document</span>
              <select
                className="mt-1.5 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                value={formDocumentType}
                onChange={(e) => setFormDocumentType(e.target.value as DocumentType)}
              >
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-eos-text-muted">Nume template</span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                placeholder="ex: Privacy Policy DPO Complet 2026"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                maxLength={120}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="block md:col-span-2">
              <span className="text-xs font-medium text-eos-text-muted">Descriere / scop pilot</span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                placeholder="ex: DPA standard pentru procesatori SaaS, validat de cabinet"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                maxLength={240}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-eos-text-muted">Versiune</span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                placeholder="v2026.1"
                value={formVersionLabel}
                onChange={(e) => setFormVersionLabel(e.target.value)}
                maxLength={80}
              />
            </label>
            <label className="block md:col-span-3">
              <span className="text-xs font-medium text-eos-text-muted">Fișier sursă / istoric migrare (opțional)</span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                placeholder="ex: Drive:/DPO Complet/Templates/DPA-procesatori-v2026.docx"
                value={formSourceFileName}
                onChange={(e) => setFormSourceFileName(e.target.value)}
                maxLength={180}
              />
            </label>
          </div>
          <label className="mt-4 block rounded-eos-lg border border-dashed border-eos-border bg-eos-bg-inset p-4">
            <span className="text-xs font-medium text-eos-text-muted">
              Import fișier real cabinet (.docx, .md, .txt)
            </span>
            <input
              className="mt-2 block w-full text-sm text-eos-text-muted file:mr-3 file:rounded-eos-sm file:border-0 file:bg-eos-surface-variant file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-eos-text"
              type="file"
              accept=".docx,.md,.markdown,.txt"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setFormFile(file)
                if (file && !formSourceFileName.trim()) setFormSourceFileName(file.name)
              }}
            />
            <p className="mt-2 text-[11px] leading-5 text-eos-text-tertiary">
              Pentru pilot, importăm documente Word murdare din cabinet și extragem textul în template editabil. Poți păstra textarea ca override manual.
            </p>
            {formFile ? (
              <p className="mt-2 font-mono text-[11px] text-eos-text-muted">
                selectat: {formFile.name} · {Math.round(formFile.size / 1024)}KB
              </p>
            ) : null}
          </label>
          <label className="mt-4 block">
            <span className="text-xs font-medium text-eos-text-muted">
              Conținut Markdown / override manual (variabile permise: {"{{ORG_NAME}}"}, {"{{ORG_CUI}}"}, {"{{ORG_WEBSITE}}"}, {"{{DPO_EMAIL}}"}, {"{{PREPARED_BY}}"}, {"{{DOCUMENT_DATE}}"}, {"{{DOCUMENT_TITLE}}"})
            </span>
            <textarea
              className="mt-1.5 h-72 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 py-2 font-mono text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
              placeholder={`# Politica de confidențialitate\n\n**Organizație:** {{ORG_NAME}}\n**CUI:** {{ORG_CUI}}\n\n## 1. Cine suntem\n...`}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
            />
            <p className="mt-1 text-[11px] text-eos-text-tertiary">
              Min 50 caractere · max ~200KB · ultima editare salvată local doar la upload
            </p>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleUpload()}
              className="inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy && <Loader2 className="size-4 animate-spin" strokeWidth={2} />}
              <Upload className="size-4" strokeWidth={2} />
              Upload + activează
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setFormName("")
                setFormDescription("")
                setFormVersionLabel("v1")
                setFormSourceFileName("")
                setFormContent("")
                setFormFile(null)
              }}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-4 py-2 text-sm font-medium text-eos-text-muted transition-colors hover:text-eos-text disabled:opacity-50"
            >
              Renunță
            </button>
          </div>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-10 text-center">
          <FileText className="mx-auto size-8 text-eos-text-tertiary" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-eos-text">Niciun template uploadat</p>
          <p className="mt-1 text-xs text-eos-text-tertiary">
            Click „Upload template&rdquo; pentru a începe. Template-ul tău va înlocui skeleton-ul intern
            CompliScan la generarea documentelor.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <TemplateRow
              key={tpl.id}
              template={tpl}
              busy={busy}
              onToggleActive={() => void handleToggleActive(tpl)}
              onDelete={() => void handleDelete(tpl)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const MAX_TEMPLATES_HINT = "50"

function TemplateRow({
  template,
  busy,
  onToggleActive,
  onDelete,
}: {
  template: CabinetTemplate
  busy: boolean
  onToggleActive: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5 transition-colors hover:border-eos-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {template.active ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                activ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-eos-border/30 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                inactiv
              </span>
            )}
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              {template.documentType}
            </span>
          </div>
          <h3
            data-display-text="true"
            className="mt-2 font-display text-[16px] font-semibold tracking-[-0.01em] text-eos-text"
          >
            {template.name}
          </h3>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
            {template.versionLabel} · rev. {template.revision} · {template.status} · uploadat {formatDate(template.uploadedAtISO)} · {Math.round(template.sizeBytes / 1024)}KB
          </p>
          {template.description && (
            <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-eos-text-muted">
              {template.description}
            </p>
          )}
          {template.sourceFileName && (
            <p className="mt-1 font-mono text-[10.5px] text-eos-text-tertiary">
              sursă: {template.sourceFileName}
            </p>
          )}
          {template.detectedVariables.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {template.detectedVariables.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center rounded-eos-sm bg-eos-surface-variant px-2 py-0.5 font-mono text-[10.5px] text-eos-text-muted"
                >
                  {`{{${v}}}`}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onToggleActive}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text disabled:opacity-50"
          >
            {template.active ? (
              <PowerOff className="size-3.5" strokeWidth={2} />
            ) : (
              <Power className="size-3.5" strokeWidth={2} />
            )}
            {template.active ? "Dezactivează" : "Activează"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-eos-sm border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-[12px] font-medium text-rose-500 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
            Șterge
          </button>
        </div>
      </div>
    </div>
  )
}
