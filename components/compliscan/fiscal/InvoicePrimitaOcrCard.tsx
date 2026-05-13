"use client"

// Card upload facturi PRIMITE cu OCR (Gemini Vision) — persistă în state.
// Folosit pentru cross-correlation R1: Σ TVA facturi primite ↔ D300 rd24-rd33.
// Suportă: drag-drop imagine, camera mobile, PDF inline.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Edit3,
  FileImage,
  Loader2,
  Receipt,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ── Types (mirror parsed-invoices.ts) ───────────────────────────────────────

type InvoiceDirection = "primita" | "emisa"

type ExtractedInvoiceLine = {
  description: string
  quantity?: number
  unitPriceRON?: number
  totalRON: number
  vatRate?: number
}

type ExtractedInvoiceData = {
  supplierCif?: string
  supplierName?: string
  customerCif?: string
  customerName?: string
  invoiceNumber?: string
  issueDateISO?: string
  totalNetRON?: number
  totalVatRON?: number
  totalGrossRON?: number
  currency?: string
  vatRate?: number
  lines?: ExtractedInvoiceLine[]
  confidence?: "high" | "medium" | "low"
  rawNotes?: string
}

type ParsedInvoiceRecord = {
  id: string
  direction: InvoiceDirection
  invoiceNumber: string | null
  issueDateISO: string | null
  period: string | null
  partnerCif: string | null
  partnerName: string | null
  totalNetRON: number | null
  totalVatRON: number | null
  totalGrossRON: number | null
  currency: string | null
  confidence: "high" | "medium" | "low" | null
  aiProvider: string
  parsedAtISO: string
  source: string
  fileName?: string
  data: ExtractedInvoiceData
  userVerified: boolean
  errors: string[]
  warnings: string[]
}

type Summary = {
  total: number
  byDirection: Record<InvoiceDirection, number>
  verified: number
  lowConfidence: number
  totalVatPrimita: number
  totalVatEmisa: number
}

function fmtRON(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function confidenceTone(c: ParsedInvoiceRecord["confidence"]): string {
  if (c === "high")
    return "border-eos-success/30 bg-eos-success-soft text-eos-success"
  if (c === "medium")
    return "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
  if (c === "low")
    return "border-eos-error/30 bg-eos-error-soft text-eos-error"
  return "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
}

function confidenceLabel(c: ParsedInvoiceRecord["confidence"]): string {
  if (c === "high") return "Crescut"
  if (c === "medium") return "Mediu"
  if (c === "low") return "Scăzut"
  return "?"
}

async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(",")[1] ?? ""
      resolve({ base64, mimeType: file.type || "image/jpeg" })
    }
    reader.onerror = () => reject(new Error("Eroare la citirea fișierului."))
    reader.readAsDataURL(file)
  })
}

// ── Component ────────────────────────────────────────────────────────────────

export function InvoicePrimitaOcrCard() {
  const [records, setRecords] = useState<ParsedInvoiceRecord[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ParsedInvoiceRecord | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/invoice-ocr?direction=primita", {
        cache: "no-store",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca facturile OCR.")
        return
      }
      const data = await res.json()
      setRecords(data.records ?? [])
      setSummary(data.summary ?? null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File) {
    if (file.size > 9 * 1024 * 1024) {
      toast.error("Fișier prea mare (max 9 MB).")
      return
    }
    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"
    if (!isImage && !isPdf) {
      toast.error("Doar imagini (JPG/PNG/HEIC) sau PDF.")
      return
    }
    setExtracting(true)
    try {
      const { base64, mimeType } = await fileToBase64(file)
      if (isImage) setPreview(`data:${mimeType};base64,${base64.slice(0, 200_000)}`)
      else setPreview(null)

      const res = await fetch("/api/fiscal/invoice-ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType,
          direction: "primita",
          mode: "cloud", // Gemini Vision cloud direct (Gemma local optional)
          fileName: file.name,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Extracție OCR eșuată.")
        return
      }
      const conf = body.extracted?.confidence ?? "?"
      toast.success(
        `Factură OCR-ată: ${body.record.partnerName ?? "?"} — ${fmtRON(body.record.totalVatRON)} RON TVA · confidence ${conf}`,
      )
      setSelectedRecord(body.record)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare upload.")
    } finally {
      setExtracting(false)
    }
  }

  async function deleteRecord(id: string) {
    try {
      const res = await fetch(`/api/fiscal/invoice-ocr?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Ștergere eșuată.")
        return
      }
      toast.success("Factură ștearsă.")
      if (selectedRecord?.id === id) setSelectedRecord(null)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    }
  }

  async function patchRecord(
    record: ParsedInvoiceRecord,
    patch: {
      userVerified?: boolean
      overrides?: Record<string, string | number | null>
    },
  ) {
    try {
      const res = await fetch("/api/fiscal/invoice-ocr", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, ...patch }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Actualizare eșuată.")
        return null
      }
      setSelectedRecord(body.record)
      await loadRecords()
      return body.record as ParsedInvoiceRecord
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
      return null
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

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Facturi primite — OCR automat (Gemini Vision)
            </h2>
            <span className="ml-1 inline-flex items-center gap-1 rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              <Sparkles className="size-3" strokeWidth={2.5} />
              AI
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Fotografiază sau încarcă imaginea facturii primite de la furnizor. AI-ul
            extrage CIF, sume, TVA, articole. Folosit pentru cross-correlation R1:
            Σ TVA facturi primite ↔ D300 TVA deductibil (rd24-rd33).
          </p>
        </div>
        {summary && summary.byDirection.primita > 0 && (
          <div className="text-right text-[11px]">
            <p className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
              {summary.byDirection.primita} primite
            </p>
            <p className="mt-1 font-mono text-eos-text-muted">
              Σ TVA: <strong className="text-eos-text">{fmtRON(summary.totalVatPrimita)}</strong> RON
            </p>
          </div>
        )}
      </header>

      {/* Drop zone + camera */}
      <div
        className={`mt-5 grid gap-3 ${preview ? "md:grid-cols-[1fr_200px]" : ""}`}
      >
        <div
          className={`rounded-eos-lg border-2 border-dashed px-6 py-8 text-center transition ${
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
            accept="image/*,application/pdf"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) await uploadFile(file)
              if (fileInputRef.current) fileInputRef.current.value = ""
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) await uploadFile(file)
              if (cameraInputRef.current) cameraInputRef.current.value = ""
            }}
          />
          <Upload className="mx-auto size-6 text-eos-text-muted" strokeWidth={1.8} />
          <p
            data-display-text="true"
            className="mt-2 font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            {extracting ? "Extrag datele cu AI..." : "Trage imagine/PDF aici sau alege"}
          </p>
          <p className="mt-1 text-[11px] text-eos-text-muted">
            Acceptat: JPG, PNG, HEIC, PDF. Maxim 9 MB.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:opacity-60"
            >
              {extracting ? (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
              ) : (
                <FileImage className="size-3.5" strokeWidth={2.5} />
              )}
              {extracting ? "Procesez..." : "Alege fișier"}
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={extracting}
              className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-[12px] font-medium text-eos-text shadow-eos-sm transition hover:border-eos-primary disabled:opacity-60"
            >
              <Camera className="size-3.5" strokeWidth={2.5} />
              Cameră
            </button>
          </div>
        </div>

        {preview && (
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface-elevated p-2">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Preview
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview factură"
              className="mt-1 max-h-[180px] w-full rounded-eos-sm object-contain"
            />
          </div>
        )}
      </div>

      {selectedRecord && (
        <InvoiceDetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={() => deleteRecord(selectedRecord.id)}
          onPatch={(patch) => patchRecord(selectedRecord, patch)}
        />
      )}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc istoricul...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
          Nu există facturi primite OCR-ate. Încarcă prima factură pentru a permite
          cross-correlation cu D300.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Facturi primite OCR-ate ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id
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
                        {r.invoiceNumber ?? "fără număr"} · {r.partnerName ?? "?"}
                        {r.userVerified && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-success">
                            <CheckCircle2 className="size-2.5" strokeWidth={3} />
                            Confirmat
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        {r.issueDateISO ?? "data ?"} · CIF {r.partnerCif ?? "?"} ·{" "}
                        <strong>{fmtRON(r.totalGrossRON)}</strong> brut · TVA{" "}
                        <strong>{fmtRON(r.totalVatRON)}</strong>
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-eos-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ${confidenceTone(r.confidence)}`}
                    >
                      {confidenceLabel(r.confidence)}
                    </span>
                    {(r.errors.length > 0 || r.warnings.length > 0) && (
                      <AlertTriangle
                        className="size-4 shrink-0 text-eos-warning"
                        strokeWidth={2}
                      />
                    )}
                  </button>
                  {isSelected && (
                    <InvoiceDetailPanel
                      record={r}
                      onClose={() => setSelectedRecord(null)}
                      onDelete={() => deleteRecord(r.id)}
                      onPatch={(patch) => patchRecord(r, patch)}
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

// ── Detail panel cu edit inline ──────────────────────────────────────────────

function InvoiceDetailPanel({
  record,
  onClose,
  onDelete,
  onPatch,
  inline = false,
}: {
  record: ParsedInvoiceRecord
  onClose: () => void
  onDelete: () => void
  onPatch: (
    patch: {
      userVerified?: boolean
      overrides?: Record<string, string | number | null>
    },
  ) => Promise<ParsedInvoiceRecord | null>
  inline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [edit, setEdit] = useState({
    invoiceNumber: record.invoiceNumber ?? "",
    issueDateISO: record.issueDateISO ?? "",
    partnerCif: record.partnerCif ?? "",
    partnerName: record.partnerName ?? "",
    totalNetRON: record.totalNetRON?.toString() ?? "",
    totalVatRON: record.totalVatRON?.toString() ?? "",
    totalGrossRON: record.totalGrossRON?.toString() ?? "",
  })

  // Reset edit state when record changes
  useEffect(() => {
    setEdit({
      invoiceNumber: record.invoiceNumber ?? "",
      issueDateISO: record.issueDateISO ?? "",
      partnerCif: record.partnerCif ?? "",
      partnerName: record.partnerName ?? "",
      totalNetRON: record.totalNetRON?.toString() ?? "",
      totalVatRON: record.totalVatRON?.toString() ?? "",
      totalGrossRON: record.totalGrossRON?.toString() ?? "",
    })
  }, [record.id])

  async function saveEdits() {
    const overrides: Record<string, string | number | null> = {}
    if (edit.invoiceNumber !== (record.invoiceNumber ?? ""))
      overrides.invoiceNumber = edit.invoiceNumber || null
    if (edit.issueDateISO !== (record.issueDateISO ?? ""))
      overrides.issueDateISO = edit.issueDateISO || null
    if (edit.partnerCif !== (record.partnerCif ?? ""))
      overrides.partnerCif = edit.partnerCif || null
    if (edit.partnerName !== (record.partnerName ?? ""))
      overrides.partnerName = edit.partnerName || null
    const netNum = parseFloat(edit.totalNetRON.replace(",", "."))
    const vatNum = parseFloat(edit.totalVatRON.replace(",", "."))
    const grossNum = parseFloat(edit.totalGrossRON.replace(",", "."))
    if (edit.totalNetRON !== (record.totalNetRON?.toString() ?? ""))
      overrides.totalNetRON = Number.isFinite(netNum) ? netNum : null
    if (edit.totalVatRON !== (record.totalVatRON?.toString() ?? ""))
      overrides.totalVatRON = Number.isFinite(vatNum) ? vatNum : null
    if (edit.totalGrossRON !== (record.totalGrossRON?.toString() ?? ""))
      overrides.totalGrossRON = Number.isFinite(grossNum) ? grossNum : null

    if (Object.keys(overrides).length === 0) {
      setEditing(false)
      return
    }
    const result = await onPatch({ overrides })
    if (result) {
      toast.success("Modificări salvate.")
      setEditing(false)
    }
  }

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
            <CheckCircle2 className="-mt-0.5 size-3.5 text-eos-success" strokeWidth={2.5} />
            {record.invoiceNumber ?? "factură fără număr"}
            <span
              className={`rounded-eos-sm border px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] ${confidenceTone(record.confidence)}`}
            >
              Confidence {confidenceLabel(record.confidence)}
            </span>
            <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-text-muted">
              {record.aiProvider}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            {record.fileName ?? "fără nume"} · Procesată {new Date(record.parsedAtISO).toLocaleString("ro-RO")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-1 text-[10.5px] transition ${
              editing
                ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
                : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-primary hover:text-eos-primary"
            }`}
          >
            <Edit3 className="size-3" strokeWidth={2.5} />
            {editing ? "Anulează" : "Editează"}
          </button>
          <button
            type="button"
            onClick={() => onPatch({ userVerified: !record.userVerified })}
            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-1 text-[10.5px] transition ${
              record.userVerified
                ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
                : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-success/30 hover:text-eos-success"
            }`}
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

      {record.warnings.length > 0 && (
        <div className="mt-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-warning">
          {record.warnings.map((w, i) => (
            <p key={i}>⚡ {w}</p>
          ))}
        </div>
      )}

      {editing ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Field label="Număr factură" value={edit.invoiceNumber} onChange={(v) => setEdit({ ...edit, invoiceNumber: v })} />
          <Field label="Data emiterii (YYYY-MM-DD)" value={edit.issueDateISO} onChange={(v) => setEdit({ ...edit, issueDateISO: v })} type="date" />
          <Field label="CIF furnizor" value={edit.partnerCif} onChange={(v) => setEdit({ ...edit, partnerCif: v })} />
          <Field label="Nume furnizor" value={edit.partnerName} onChange={(v) => setEdit({ ...edit, partnerName: v })} />
          <Field label="Total net RON" value={edit.totalNetRON} onChange={(v) => setEdit({ ...edit, totalNetRON: v })} />
          <Field label="Total TVA RON" value={edit.totalVatRON} onChange={(v) => setEdit({ ...edit, totalVatRON: v })} />
          <Field label="Total brut RON" value={edit.totalGrossRON} onChange={(v) => setEdit({ ...edit, totalGrossRON: v })} />
          <div className="flex items-end">
            <button
              type="button"
              onClick={saveEdits}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3 py-2 text-[12px] font-medium text-white shadow-eos-sm hover:bg-eos-primary/90"
            >
              <Save className="size-3.5" strokeWidth={2.5} />
              Salvează modificările
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <Tile label="Furnizor" value={record.partnerName ?? "—"} sub={record.partnerCif ?? ""} />
          <Tile label="Total net" value={`${fmtRON(record.totalNetRON)} RON`} />
          <Tile label="Total TVA" value={`${fmtRON(record.totalVatRON)} RON`} highlight />
          <Tile label="Total brut" value={`${fmtRON(record.totalGrossRON)} RON`} />
        </div>
      )}

      {/* Lines */}
      {record.data.lines && record.data.lines.length > 0 && (
        <div className="mt-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Articole extrase ({record.data.lines.length})
          </p>
          <table className="mt-1.5 w-full border-collapse text-[11.5px]">
            <thead>
              <tr className="text-left text-eos-text-tertiary">
                <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Descriere
                </th>
                <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Cant
                </th>
                <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Preț unitar
                </th>
                <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  TVA%
                </th>
                <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {record.data.lines.map((l, idx) => (
                <tr key={idx} className="border-t border-eos-border">
                  <td className="py-1.5 pr-2 text-eos-text">{l.description}</td>
                  <td className="py-1.5 pr-2 text-right font-mono text-eos-text-muted">
                    {l.quantity ?? "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-eos-text-muted">
                    {fmtRON(l.unitPriceRON)}
                  </td>
                  <td className="py-1.5 pr-2 text-right font-mono text-eos-text-muted">
                    {l.vatRate !== undefined ? `${l.vatRate}%` : "—"}
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold text-eos-text">
                    {fmtRON(l.totalRON)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!record.userVerified && (
        <p className="mt-3 text-[10.5px] text-eos-text-tertiary italic">
          OCR-ul nu este 100% sigur. Editează valorile dacă AI-ul a greșit, apoi apasă{" "}
          <strong>Confirmă</strong> pentru a permite folosirea în cross-correlation R1.
        </p>
      )}
    </div>
  )
}

function Tile({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-eos-sm border px-3 py-2 ${
        highlight
          ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
          : "border-eos-border bg-eos-surface text-eos-text"
      }`}
    >
      <p
        className={`font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
          highlight ? "opacity-80" : "text-eos-text-muted"
        }`}
      >
        {label}
      </p>
      <p
        data-display-text="true"
        className={`mt-0.5 font-display text-[14px] font-bold ${
          highlight ? "" : ""
        }`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`mt-0.5 font-mono text-[10px] ${
            highlight ? "opacity-70" : "text-eos-text-tertiary"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: "text" | "date"
}) {
  return (
    <label className="block">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1.5 font-mono text-[11.5px] text-eos-text focus:border-eos-primary focus:outline-none"
      />
    </label>
  )
}
