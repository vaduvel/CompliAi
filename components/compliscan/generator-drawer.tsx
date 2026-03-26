"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle2, FileText, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/evidence-os/Sheet"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ORG_SECTOR_LABELS } from "@/lib/compliance/applicability"
import type { DocumentType, GeneratedDocument } from "@/lib/server/document-generator"

// ── Types ────────────────────────────────────────────────────────────────────

type GeneratedDocumentResponse = GeneratedDocument & {
  recordId?: string
  sourceFindingId?: string | null
}

const CONFIRMATION_ITEMS = [
  {
    id: "content-reviewed",
    label: "Am citit draftul si confirm ca reflecta realitatea firmei",
  },
  {
    id: "facts-confirmed",
    label: "Am verificat datele, procesele si specificul firmei fata de ce scrie in draft",
  },
  {
    id: "approved-for-evidence",
    label: "Il aprob ca dovada de conformitate",
  },
] as const

type GeneratorDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  findingId: string
  documentType: DocumentType
  findingTitle: string
  onComplete: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-eos-text">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  "ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"

const textareaClass =
  "ring-focus w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"

// ── Component ────────────────────────────────────────────────────────────────

export function GeneratorDrawer({
  open,
  onOpenChange,
  findingId,
  documentType,
  findingTitle,
  onComplete,
}: GeneratorDrawerProps) {
  const cockpit = useCockpitData()
  const [orgName, setOrgName] = useState("")
  const [dataFlows, setDataFlows] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedDocumentResponse | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [checklist, setChecklist] = useState<string[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  // Pre-fill from org state
  useEffect(() => {
    if (!cockpit.data || orgName) return
    setOrgName(cockpit.data.workspace.orgName)
  }, [cockpit.data, orgName])

  // Reset state when drawer opens with new finding
  useEffect(() => {
    if (open) {
      setResult(null)
      setChecklist([])
    }
  }, [open, findingId])

  async function handleGenerate() {
    const name = orgName.trim()
    if (!name) {
      toast.error("Introdu numele organizatiei")
      return
    }

    setGenerating(true)
    setResult(null)
    setChecklist([])

    try {
      const profile = cockpit.data?.state.orgProfile
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          orgName: name,
          orgSector: profile ? ORG_SECTOR_LABELS[profile.sector] : undefined,
          orgCui: profile?.cui || undefined,
          dataFlows: dataFlows || undefined,
          sourceFindingId: findingId,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Generarea a esuat.")
      }

      const doc = (await res.json()) as GeneratedDocumentResponse
      setResult(doc)
      toast.success(`${doc.title} generat`)

      // Scroll to preview
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Incearca din nou.",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleAttach() {
    if (!result?.recordId) return

    setAttaching(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(findingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: result.recordId,
          confirmationChecklist: checklist,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Nu am putut atasa draftul ca dovada.")
      }

      toast.success("Dovada salvata la dosar")
      onOpenChange(false)
      onComplete()
    } catch (err) {
      toast.error("Eroare", {
        description: err instanceof Error ? err.message : "Incearca din nou.",
      })
    } finally {
      setAttaching(false)
    }
  }

  function toggleItem(id: string) {
    setChecklist((c) => (c.includes(id) ? c.filter((v) => v !== id) : [...c, id]))
  }

  const allChecked = CONFIRMATION_ITEMS.every((item) => checklist.includes(item.id))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl lg:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-eos-primary" strokeWidth={2} />
            Genereaza document
          </SheetTitle>
          <SheetDescription>
            Finding: {findingTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 px-4 pb-6">
          {/* ── Form ── */}
          {!result && (
            <div className="space-y-4">
              <Field label="Numele organizatiei">
                <input
                  className={inputClass}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="SRL-ul tau"
                />
              </Field>

              <Field label="Context suplimentar">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={dataFlows}
                  onChange={(e) => setDataFlows(e.target.value)}
                  placeholder="Detalii relevante pentru documentul generat..."
                />
              </Field>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full gap-2"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" strokeWidth={2} />
                )}
                {generating ? "Se genereaza..." : "Genereaza draftul"}
              </Button>
            </div>
          )}

          {/* ── Preview ── */}
          {result && (
            <div ref={previewRef} className="space-y-4">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Preview draft
                </p>
                <div className="max-h-80 overflow-y-auto text-sm leading-relaxed text-eos-text whitespace-pre-wrap">
                  {result.content}
                </div>
              </div>

              {/* ── Confirmation checklist ── */}
              <div className="space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Confirma inainte de salvare
                </p>
                {CONFIRMATION_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-eos-md border border-eos-border px-4 py-3 transition-colors hover:bg-eos-surface-variant"
                  >
                    <input
                      type="checkbox"
                      checked={checklist.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
                    />
                    <span className="text-sm text-eos-text">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAttach}
                  disabled={!allChecked || attaching}
                  className="flex-1 gap-2"
                >
                  {attaching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" strokeWidth={2} />
                  )}
                  Confirm si salvez dovada
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setResult(null)}
                >
                  Regenereaza
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
