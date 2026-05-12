"use client"

// PatternFGenerateDoc — Pattern F (generate-doc) cu AI generator pentru
// răspuns ANAF, D300 draft, notă explicativă, PFA Form 082, etc.
//
// Aplicabilitate:
//   • ETVA-LATE — răspuns ANAF cu countdown
//   • D300-MISSING — draft D300 generat
//   • PFA-FORM082 — generator + depunere
//   • EF-SEQUENCE (alternativ) — notă explicativă serie ratată
//   • EMPUTERNICIRE-MISSING — template PDF împuternicire pre-completat
//
// Flow: textarea cu context Mircea → "Generează" → AI compune draft →
// editare inline → "Descarcă PDF" + "Marchez trimis + dovadă upload".
//
// Faza 3.3 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { Download, FileText, Loader2, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternFProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternFGenerateDoc({ finding, onResolved }: PatternFProps) {
  const config = resolveDocConfig(finding)
  const [contextNote, setContextNote] = useState("")
  const [draft, setDraft] = useState<string>("")
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(config.generateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          findingId: finding.id,
          findingTypeId: finding.findingTypeId,
          contextNote: contextNote.trim(),
          docType: config.docType,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "AI generator a returnat eroare.")
      }
      const data = (await res.json()) as { draft?: string; content?: string }
      const generated = data.draft ?? data.content ?? ""
      if (!generated) throw new Error("AI nu a returnat conținut.")
      setDraft(generated)
      toast.success("Draft generat. Verifică + editează înainte de trimitere.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare AI generator."
      setError(msg)
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  async function handleMarkSent() {
    if (!draft.trim()) {
      setError("Generează întâi draftul.")
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: {
            type: "doc-generated",
            docType: config.docType,
            content: draft,
            contextNote,
          },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut marca rezolvat.")
      toast.success("Document salvat la dosar + finding rezolvat.")
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setSending(false)
    }
  }

  function handleDownloadPdf() {
    if (!draft.trim()) return
    // Endpoint server-side pentru render PDF din draft text + brand cabinet
    const url = `/api/findings/${encodeURIComponent(finding.id)}/doc-pdf?type=${encodeURIComponent(config.docType)}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-3">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
          <Sparkles className="size-3.5" strokeWidth={1.5} />
          Generator AI · {config.title}
        </p>
        <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">
          {config.hint}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Context suplimentar (opțional)
        </label>
        <textarea
          value={contextNote}
          onChange={(e) => setContextNote(e.target.value)}
          placeholder={config.contextPlaceholder}
          rows={3}
          disabled={generating || sending}
          className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 font-mono text-[11.5px] text-eos-text outline-none focus:border-eos-primary disabled:opacity-50"
        />
      </div>

      <button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={generating || sending}
        className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Generez draft cu AI…
          </>
        ) : (
          <>
            <Sparkles className="size-4" strokeWidth={2} />
            {draft ? "Re-generează" : "Generează draft"}
          </>
        )}
      </button>

      {draft && (
        <>
          <div className="space-y-1.5">
            <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Draft generat — editabil
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={10}
              disabled={sending}
              className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 font-mono text-[11.5px] leading-[1.55] text-eos-text outline-none focus:border-eos-primary disabled:opacity-50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              <Download className="size-3.5" strokeWidth={2} />
              Descarcă PDF (brand cabinet)
            </button>
            <button
              type="button"
              onClick={() => void handleMarkSent()}
              disabled={sending}
              className="inline-flex items-center gap-1.5 rounded-eos-md bg-eos-primary px-3 py-2 text-[12.5px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
                  Salvez…
                </>
              ) : (
                <>
                  <Send className="size-3.5" strokeWidth={2} />
                  Marchez trimis + salvez la dosar
                </>
              )}
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
          {error}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type DocConfig = {
  docType: string
  title: string
  hint: string
  contextPlaceholder: string
  generateEndpoint: string
}

function resolveDocConfig(finding: ScanFinding): DocConfig {
  const typeId = finding.findingTypeId ?? ""
  if (typeId === "ETVA-LATE" || typeId === "ETVA-GAP") {
    return {
      docType: "anaf-response-etva",
      title: "Răspuns ANAF e-TVA",
      hint: "AI compune scrisoare către ANAF cu bază legală Cod Procedură Fiscală Art. 105 + atașament dovezi (facturi cauzatoare).",
      contextPlaceholder:
        "ex: Facturile B2C aprilie au fost emise în SmartBill dar nu raportate în SAF-T D406 din cauza unei configurări greșite. Corecția e în lucru.",
      generateEndpoint: "/api/efactura/explain-errors",
    }
  }
  if (typeId === "D300-MISSING") {
    return {
      docType: "d300-draft",
      title: "Draft D300 — depunere lunară TVA",
      hint: "Generăm draft D300 cu valorile pre-completate din SAF-T + facturi SPV. Verifici + depui prin SPV.",
      contextPlaceholder: "ex: perioada aprilie 2026, regim TVA lunar",
      generateEndpoint: "/api/fiscal/d300-draft",
    }
  }
  if (typeId === "PFA-FORM082") {
    return {
      docType: "pfa-form082",
      title: "PFA Form 082 — generator",
      hint: "Form 082 obligatoriu pentru PFA cu CNP. Generăm draft + ghid depunere SPV.",
      contextPlaceholder: "ex: CNP, codul fiscal PFA, perioada de raportare",
      generateEndpoint: "/api/fiscal/pfa-form082",
    }
  }
  // Fallback — explainer text
  return {
    docType: "fiscal-note",
    title: "Notă explicativă",
    hint: "Generăm o notă explicativă pe baza contextului finding-ului. Editabilă înainte de salvare.",
    contextPlaceholder: "ex: justificare profesională contabilă",
    generateEndpoint: "/api/efactura/explain-errors",
  }
}
