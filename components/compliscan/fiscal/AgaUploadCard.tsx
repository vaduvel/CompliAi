"use client"

// Card upload Hotărâre AGA — text liber (paste) sau fișier text.
// Trimite textul la /api/fiscal/extract-aga care folosește Gemini pentru extracție
// structurată. Folosit pentru cross-correlation R2 (AGA ↔ stat plată ↔ D205) și
// R3 (AGA procent ↔ ONRC procent).

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Gavel,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ── Types (mirror parser-aga.ts output) ─────────────────────────────────────

type AgaAssociate = {
  idType: "CNP" | "CUI" | "unknown"
  id: string | null
  name: string | null
  ownershipPercent: number | null
  dividendsAmount: number | null
  dividendsPercent: number | null
}

type AgaResolutionType =
  | "AGA-ordinara"
  | "AGA-extraordinara"
  | "AGOA"
  | "AGEA"
  | "decizie-asociat-unic"
  | "necunoscut"

type AgaExtractedData = {
  resolutionDate: string | null
  financialYear: number | null
  resolutionType: AgaResolutionType
  associates: AgaAssociate[]
  totalDividendsAmount: number | null
  netProfit: number | null
  retainedEarnings: number | null
  aiProvider: string
  confidence: number
  errors: string[]
  warnings: string[]
}

type ParsedAgaRecord = {
  id: string
  resolutionDate: string | null
  financialYear: number | null
  parsedAtISO: string
  source: string
  fileName?: string
  data: AgaExtractedData
  userVerified: boolean
  errors: string[]
  warnings: string[]
}

const RESOLUTION_LABELS: Record<AgaResolutionType, string> = {
  "AGA-ordinara": "AGA ordinară",
  "AGA-extraordinara": "AGA extraordinară",
  AGOA: "AGOA",
  AGEA: "AGEA",
  "decizie-asociat-unic": "Decizie asociat unic",
  necunoscut: "Neclasificat",
}

const RESOLUTION_TONE: Record<AgaResolutionType, string> = {
  "AGA-ordinara": "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  "AGA-extraordinara": "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  AGOA: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  AGEA: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  "decizie-asociat-unic": "border-eos-success/30 bg-eos-success-soft text-eos-success",
  necunoscut: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

function fmtRON(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—"
  return `${n.toFixed(n % 1 === 0 ? 0 : 2)}%`
}

function maskCnp(cnp: string | null): string {
  if (!cnp || cnp.length < 13) return cnp ?? "—"
  return `${cnp.slice(0, 4)}***${cnp.slice(-4)}`
}

function fmtConfidence(c: number): { label: string; tone: string } {
  if (c >= 0.85)
    return { label: "Crescut", tone: "border-eos-success/30 bg-eos-success-soft text-eos-success" }
  if (c >= 0.6)
    return { label: "Mediu", tone: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning" }
  return { label: "Scăzut", tone: "border-eos-error/30 bg-eos-error-soft text-eos-error" }
}

const MIN_TEXT_LEN = 50
const MAX_TEXT_LEN = 50_000

const EXAMPLE_TEXT = `HOTĂRÂREA ADUNĂRII GENERALE A ASOCIAȚILOR
EXEMPLU SRL, CUI RO12345678
Data: 15 aprilie 2026

Asociații prezenți:
1. POPESCU ION, CNP 1850101123456, deține 60% din capital
2. IONESCU MARIA, CNP 2900202234567, deține 40% din capital

HOTĂRĂSC: Distribuire profit net 2025 (100.000 RON) ca dividende:
- POPESCU ION: 60.000 RON
- IONESCU MARIA: 40.000 RON`

// ── Component ────────────────────────────────────────────────────────────────

export function AgaUploadCard() {
  const [records, setRecords] = useState<ParsedAgaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ParsedAgaRecord | null>(null)
  const [textInput, setTextInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/extract-aga", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca AGA.")
        return
      }
      const data = await res.json()
      setRecords(data.records ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function extractText(text: string, fileName?: string) {
    if (text.trim().length < MIN_TEXT_LEN) {
      toast.error(`Text prea scurt. Minim ${MIN_TEXT_LEN} caractere.`)
      return
    }
    if (text.length > MAX_TEXT_LEN) {
      toast.error(`Text prea lung. Maxim ${(MAX_TEXT_LEN / 1000).toFixed(0)}k caractere.`)
      return
    }

    setExtracting(true)
    try {
      const res = await fetch("/api/fiscal/extract-aga", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fileName }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Extracție AGA eșuată.")
        if (Array.isArray(body.errors) && body.errors.length > 0) {
          for (const e of body.errors.slice(0, 3)) toast.error(e)
        }
        return
      }
      const confidence = (body.extracted?.confidence ?? 0) * 100
      toast.success(
        `AGA extrasă: ${body.extracted?.associates?.length ?? 0} asociați · confidence ${confidence.toFixed(0)}%`,
      )
      setSelectedRecord(body.record)
      setTextInput("")
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare extracție.")
    } finally {
      setExtracting(false)
    }
  }

  async function uploadFile(file: File) {
    const name = file.name.toLowerCase()
    if (!name.endsWith(".txt") && !name.endsWith(".md") && file.type !== "text/plain") {
      toast.error("Doar fișiere .txt acceptate. Pentru PDF, copiază textul cu Ctrl+A → Ctrl+C și lipește mai jos.")
      return
    }
    if (file.size > 500 * 1024) {
      toast.error("Fișier prea mare. Maxim 500 KB.")
      return
    }
    const text = await file.text()
    await extractText(text, file.name)
  }

  async function deleteRecord(id: string) {
    try {
      const res = await fetch(`/api/fiscal/extract-aga?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Ștergere eșuată.")
        return
      }
      toast.success("Hotărâre ștearsă.")
      if (selectedRecord?.id === id) setSelectedRecord(null)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    }
  }

  async function toggleVerified(record: ParsedAgaRecord) {
    try {
      const res = await fetch("/api/fiscal/extract-aga", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, userVerified: !record.userVerified }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Actualizare eșuată.")
        return
      }
      toast.success(
        !record.userVerified ? "AGA confirmată manual." : "Confirmare retrasă.",
      )
      setSelectedRecord(body.record)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    }
  }

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const file = e.dataTransfer.files?.[0]
      if (file) await uploadFile(file)
    },
    [],
  )

  const charsLeft = MAX_TEXT_LEN - textInput.length
  const canExtract = textInput.trim().length >= MIN_TEXT_LEN && !extracting

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gavel className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Hotărâre AGA — extracție automată (Gemini)
            </h2>
            <span className="ml-1 inline-flex items-center gap-1 rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              <Sparkles className="size-3" strokeWidth={2.5} />
              AI
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Lipește textul hotărârii AGA (sau încarcă un .txt) și AI-ul extrage:
            asociați (CNP/CUI), procente deținere, dividende per asociat, data
            hotărârii. Folosit pentru cross-correlation cu D205 (R2) și ONRC (R3).
          </p>
        </div>
        {records.length > 0 && (
          <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
            {records.length} extrase
          </span>
        )}
      </header>

      {/* Drop zone fișier */}
      <div
        className={`mt-5 rounded-eos-lg border-2 border-dashed px-6 py-5 text-center transition ${
          dragActive
            ? "border-eos-primary bg-eos-primary-soft"
            : "border-eos-border bg-eos-surface-elevated hover:border-eos-border-strong"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,text/plain"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await uploadFile(file)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }}
        />
        <Upload className="mx-auto size-5 text-eos-text-muted" strokeWidth={1.8} />
        <p
          data-display-text="true"
          className="mt-1.5 font-display text-[12.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Trage aici .txt sau click pentru a alege
        </p>
        <p className="mt-0.5 text-[10.5px] text-eos-text-muted">
          Acceptat: .txt extras din PDF/Word. Maxim 500 KB.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={extracting}
          className="mt-2 inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[11.5px] font-medium text-eos-text shadow-eos-sm transition hover:border-eos-primary disabled:opacity-60"
        >
          <FileText className="size-3.5" strokeWidth={2.5} />
          Selectează .txt
        </button>
      </div>

      {/* Textarea paste */}
      <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="aga-text-input"
            className="flex items-center gap-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
          >
            <ClipboardPaste className="size-3" strokeWidth={2.5} />
            Sau lipește textul hotărârii AGA
          </label>
          <span
            className={`font-mono text-[10px] ${
              charsLeft < 1000 ? "text-eos-warning" : "text-eos-text-tertiary"
            }`}
          >
            {textInput.length.toLocaleString("ro-RO")} / {MAX_TEXT_LEN.toLocaleString("ro-RO")}
          </span>
        </div>
        <textarea
          id="aga-text-input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value.slice(0, MAX_TEXT_LEN))}
          placeholder={EXAMPLE_TEXT}
          rows={8}
          className="mt-2 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 font-mono text-[11.5px] text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-primary focus:outline-none"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[10.5px] text-eos-text-tertiary">
            <Info className="size-3" strokeWidth={2.5} />
            Minim {MIN_TEXT_LEN} caractere. AI-ul detectează automat asociați, procente și dividende.
          </p>
          <button
            type="button"
            onClick={() => extractText(textInput)}
            disabled={!canExtract}
            className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {extracting ? (
              <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
            ) : (
              <Sparkles className="size-3.5" strokeWidth={2.5} />
            )}
            {extracting ? "Extrag..." : "Extrage cu AI"}
          </button>
        </div>
      </div>

      {selectedRecord && (
        <AgaDetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={() => deleteRecord(selectedRecord.id)}
          onToggleVerified={() => toggleVerified(selectedRecord)}
        />
      )}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc istoricul...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
          Nu există hotărâri AGA extrase. Lipește textul hotărârii sau încarcă un
          .txt pentru a permite cross-correlation cu D205 și ONRC.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Hotărâri AGA extrase ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id
              const conf = fmtConfidence(r.data.confidence)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(isSelected ? null : r)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] transition hover:bg-eos-surface ${
                      isSelected ? "bg-eos-surface" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        {RESOLUTION_LABELS[r.data.resolutionType]} ·{" "}
                        {r.resolutionDate ?? "dată ?"}
                        {r.userVerified && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-success">
                            <CheckCircle2 className="size-2.5" strokeWidth={3} />
                            Confirmat
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        An {r.financialYear ?? "?"} · {r.data.associates.length} asociați
                        {r.data.totalDividendsAmount !== null && (
                          <>
                            {" · "}
                            <strong>{fmtRON(r.data.totalDividendsAmount)} RON</strong>{" "}
                            dividende
                          </>
                        )}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-eos-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ${conf.tone}`}>
                      {conf.label} {(r.data.confidence * 100).toFixed(0)}%
                    </span>
                    {(r.errors.length > 0 || r.warnings.length > 0) && (
                      <AlertTriangle className="size-4 shrink-0 text-eos-warning" strokeWidth={2} />
                    )}
                  </button>
                  {isSelected && (
                    <AgaDetailPanel
                      record={r}
                      onClose={() => setSelectedRecord(null)}
                      onDelete={() => deleteRecord(r.id)}
                      onToggleVerified={() => toggleVerified(r)}
                      inline
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function AgaDetailPanel({
  record,
  onClose,
  onDelete,
  onToggleVerified,
  inline = false,
}: {
  record: ParsedAgaRecord
  onClose: () => void
  onDelete: () => void
  onToggleVerified: () => void
  inline?: boolean
}) {
  const conf = fmtConfidence(record.data.confidence)
  const totalOwnership = record.data.associates.reduce(
    (sum, a) => sum + (a.ownershipPercent ?? 0),
    0,
  )
  const totalDividends = record.data.associates.reduce(
    (sum, a) => sum + (a.dividendsAmount ?? 0),
    0,
  )

  return (
    <div
      className={
        inline
          ? "border-t border-eos-border bg-eos-surface px-4 py-3"
          : "mt-5 rounded-eos-md border border-eos-primary/30 bg-eos-primary-soft/40 p-4"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            data-display-text="true"
            className="flex flex-wrap items-center gap-1.5 font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            <CheckCircle2
              className="-mt-0.5 size-3.5 text-eos-success"
              strokeWidth={2.5}
            />
            {record.resolutionDate ?? "dată necunoscută"}
            <span
              className={`rounded-eos-sm border px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] ${RESOLUTION_TONE[record.data.resolutionType]}`}
            >
              {RESOLUTION_LABELS[record.data.resolutionType]}
            </span>
            <span
              className={`rounded-eos-sm border px-1.5 py-0 font-mono text-[9.5px] font-bold ${conf.tone}`}
            >
              Confidence {conf.label} {(record.data.confidence * 100).toFixed(0)}%
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            An financiar {record.financialYear ?? "?"} · {record.fileName ?? "paste din clipboard"} · Provider {record.data.aiProvider}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleVerified}
            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-1 text-[10.5px] transition ${
              record.userVerified
                ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
                : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-success/30 hover:text-eos-success"
            }`}
            title="Confirmare manuală că datele extrase sunt corecte"
          >
            <CheckCircle2 className="size-3" strokeWidth={2.5} />
            {record.userVerified ? "Confirmat" : "Confirmă"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 text-[10.5px] text-eos-text-muted hover:border-eos-error/30 hover:text-eos-error"
          >
            <Trash2 className="size-3" strokeWidth={2} />
          </button>
          {!inline && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 text-[10.5px] text-eos-text-muted"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {record.errors.length > 0 && (
        <div className="mt-3 rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[11px] text-eos-error">
          {record.errors.map((e, i) => (
            <p key={i}>⚠ {e}</p>
          ))}
        </div>
      )}
      {record.warnings.length > 0 && (
        <div className="mt-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-warning">
          {record.warnings.map((w, i) => (
            <p key={i}>⚡ {w}</p>
          ))}
        </div>
      )}

      {/* Tile-uri totale */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            Asociați
          </p>
          <p className="mt-0.5 font-display text-[18px] font-bold text-eos-text">
            {record.data.associates.length}
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            Σ Deținere
          </p>
          <p
            className={`mt-0.5 font-display text-[15px] font-bold ${
              Math.abs(totalOwnership - 100) > 2 ? "text-eos-warning" : "text-eos-text"
            }`}
          >
            {totalOwnership.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            Profit net repartizat
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold text-eos-text">
            {fmtRON(record.data.netProfit)}{" "}
            <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-3 py-2 text-eos-primary">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
            Total dividende
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold">
            {fmtRON(record.data.totalDividendsAmount ?? totalDividends)}{" "}
            <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
      </div>

      {/* Lista asociați */}
      <div className="mt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Asociați extrași ({record.data.associates.length})
        </p>
        {record.data.associates.length === 0 ? (
          <p className="mt-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[11px] text-eos-text-muted">
            AI-ul nu a putut identifica asociați. Verifică textul sau introdu manual.
          </p>
        ) : (
          <table className="mt-1.5 w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="text-left text-eos-text-tertiary">
                <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Tip
                </th>
                <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Identificator
                </th>
                <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Nume
                </th>
                <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Deținere
                </th>
                <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Dividende %
                </th>
                <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Sumă RON
                </th>
              </tr>
            </thead>
            <tbody>
              {record.data.associates.map((a, idx) => {
                const derog =
                  a.ownershipPercent !== null &&
                  a.dividendsPercent !== null &&
                  Math.abs(a.ownershipPercent - a.dividendsPercent) > 0.5
                return (
                  <tr
                    key={idx}
                    className={`border-t border-eos-border ${derog ? "bg-eos-warning-soft/30" : ""}`}
                  >
                    <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text-muted">
                      {a.idType}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text">
                      {a.idType === "CNP" ? maskCnp(a.id) : a.id ?? "—"}
                    </td>
                    <td className="py-1.5 pr-2 text-eos-text">{a.name ?? "—"}</td>
                    <td className="py-1.5 pr-2 text-right font-mono text-eos-text">
                      {fmtPct(a.ownershipPercent)}
                    </td>
                    <td className="py-1.5 pr-2 text-right font-mono text-eos-text">
                      {fmtPct(a.dividendsPercent)}
                      {derog && (
                        <span className="ml-1 inline-block rounded-eos-sm border border-eos-warning/40 bg-eos-warning-soft px-1 py-0 text-[9px] font-bold text-eos-warning">
                          DEROG
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold text-eos-text">
                      {fmtRON(a.dividendsAmount)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-[10px] text-eos-text-tertiary italic">
          CNP-urile sunt mascate pentru afișare (primele 4 + ultimele 4 cifre). Datele complete sunt
          stocate per organizație. GDPR Art. 5(1)(f). Marcaj <strong>DEROG</strong> = distribuție
          dividende ≠ deținere (art. 67 Legea 31/1990 — necesită acord unanim).
        </p>
      </div>

      {!record.userVerified && (
        <div className="mt-3 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-warning">
          <Info className="-mt-0.5 mr-1 inline size-3" strokeWidth={2.5} />
          Extracția AI nu este 100% sigură (~75-85% accuracy). Verifică datele și apasă{" "}
          <strong>Confirmă</strong> pentru a permite folosirea în cross-correlation.
        </div>
      )}
    </div>
  )
}
