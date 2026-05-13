"use client"

// Card upload D100 XML — Declarație obligații buget de stat (lunar/trimestrial)
// pentru impozit profit, micro, dividende, salarii. Folosit pentru R5
// cross-correlation (Σ D100 lunare componenta dividende ↔ D205 anual).

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

type TaxCategory =
  | "dividende"
  | "profit_anual"
  | "microintreprindere"
  | "salarii"
  | "altele"
  | "necunoscut"

type D100Line = {
  code: string
  label: string
  category: TaxCategory
  amountDue: number
  amountToPay: number
  amountToRecover: number
}

type D100Period = {
  year: number
  month: number | null
  quarter: number | null
  period: string
  frequency: "monthly" | "quarterly" | "unknown"
}

type SummaryByCategory = Record<
  TaxCategory,
  { count: number; totalDue: number; totalToPay: number }
>

type D100ParsedData = {
  declarantCui: string | null
  period: D100Period | null
  isRectification: boolean
  lines: D100Line[]
  totalDue: number
  totalToPay: number
  summaryByCategory: SummaryByCategory
  errors: string[]
  warnings: string[]
}

type ParsedRecord = {
  id: string
  type: "d100"
  period: string | null
  cui: string | null
  isRectification: boolean
  parsedAtISO: string
  source: string
  fileName?: string
  data: D100ParsedData
  errors: string[]
  warnings: string[]
}

const CATEGORY_LABELS: Record<TaxCategory, string> = {
  dividende: "Dividende",
  profit_anual: "Impozit profit",
  microintreprindere: "Microîntreprindere",
  salarii: "Salarii",
  altele: "Alte",
  necunoscut: "Necunoscut",
}

const CATEGORY_TONE: Record<TaxCategory, string> = {
  dividende: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  profit_anual: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  microintreprindere: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  salarii: "border-eos-border bg-eos-surface-elevated text-eos-text",
  altele: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  necunoscut: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

function fmtRON(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPeriod(p: D100Period | null): string {
  if (!p) return "—"
  if (p.month) {
    const months = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun", "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[p.month - 1]} ${p.year}`
  }
  if (p.quarter) return `Q${p.quarter} ${p.year}`
  return String(p.year)
}

export function D100UploadCard() {
  const [records, setRecords] = useState<ParsedRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ParsedRecord | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/parse-d100", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca D100.")
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

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error("Doar XML acceptat momentan.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Fișier prea mare.`)
      return
    }

    setUploading(true)
    try {
      const xml = await file.text()
      const res = await fetch("/api/fiscal/parse-d100", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, fileName: file.name }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Parsare D100 eșuată.")
        return
      }
      toast.success(`D100 parsat: ${body.record.period ?? "?"}.`)
      setSelectedRecord(body.record)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setUploading(false)
    }
  }

  async function deleteRecord(id: string) {
    try {
      const res = await fetch(`/api/fiscal/parse-d100?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Ștergere eșuată.")
        return
      }
      toast.success("Declarație ștearsă.")
      if (selectedRecord?.id === id) setSelectedRecord(null)
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

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await uploadFile(file)
  }, [])

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              D100 — Obligații buget de stat (parser XML)
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Trage XML-uri D100 lunare/trimestriale descărcate din SPV sau exportate din Saga.
            Parser-ul recunoaște codurile ANAF (480 dividende, 101 profit, 401 micro, 201
            salarii, etc.) — fundație pentru R5 (Σ D100 lunare ↔ D205 anual).
          </p>
        </div>
        {records.length > 0 && (
          <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
            {records.length} parsate
          </span>
        )}
      </header>

      <div
        className={`mt-5 rounded-eos-lg border-2 border-dashed px-6 py-8 text-center transition ${
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
          accept=".xml,application/xml,text/xml"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (file) await uploadFile(file)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }}
        />
        <Upload className="mx-auto size-6 text-eos-text-muted" strokeWidth={1.8} />
        <p
          data-display-text="true"
          className="mt-2 font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          {uploading ? "Parsez D100..." : "Trage XML-ul aici sau click pentru a alege"}
        </p>
        <p className="mt-1 text-[11px] text-eos-text-muted">
          Acceptat: XML D100 (Saga, SmartBill, ANAF export). Maxim 5 MB.
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-3 inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3.5 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
          ) : (
            <Upload className="size-3.5" strokeWidth={2.5} />
          )}
          {uploading ? "Procesez..." : "Selectează fișier XML"}
        </button>
      </div>

      {selectedRecord && (
        <D100DetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={() => deleteRecord(selectedRecord.id)}
        />
      )}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc istoricul...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
          Nu există declarații D100 parsate. Încarcă XML-uri lunare pentru a începe reconcilierea
          cu D205 anual.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Declarații D100 parsate ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id
              const dividendsAmt = r.data.summaryByCategory.dividende?.totalDue ?? 0
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(isSelected ? null : r)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] transition hover:bg-eos-surface ${isSelected ? "bg-eos-surface" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        D100 · {fmtPeriod(r.data.period)}
                        {r.isRectification && (
                          <span className="ml-1.5 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-warning">
                            RECTIF.
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        CUI {r.cui ?? "?"} · Total datorat <strong>{fmtRON(r.data.totalDue)} RON</strong>
                        {dividendsAmt > 0 && (
                          <span className="ml-2 rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1.5 py-0 text-[10px] text-eos-primary">
                            Dividende {fmtRON(dividendsAmt)} RON
                          </span>
                        )}
                      </p>
                    </div>
                    {r.errors.length > 0 && (
                      <AlertTriangle className="size-4 shrink-0 text-eos-warning" strokeWidth={2} />
                    )}
                  </button>
                  {isSelected && (
                    <D100DetailPanel
                      record={r}
                      onClose={() => setSelectedRecord(null)}
                      onDelete={() => deleteRecord(r.id)}
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

function D100DetailPanel({
  record,
  onClose,
  onDelete,
  inline = false,
}: {
  record: ParsedRecord
  onClose: () => void
  onDelete: () => void
  inline?: boolean
}) {
  const summaryEntries = (
    Object.entries(record.data.summaryByCategory) as Array<
      [TaxCategory, SummaryByCategory[TaxCategory]]
    >
  ).filter(([, v]) => v.count > 0)

  return (
    <div
      className={
        inline
          ? "border-t border-eos-border bg-eos-surface px-4 py-3"
          : "mt-5 rounded-eos-md border border-eos-primary/30 bg-eos-primary-soft/40 p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            data-display-text="true"
            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            <CheckCircle2 className="-mt-0.5 mr-1.5 inline size-3.5 text-eos-success" strokeWidth={2.5} />
            D100 · {fmtPeriod(record.data.period)}
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            CUI {record.cui ?? "?"} · {record.fileName ?? "fără nume"}
          </p>
        </div>
        <div className="flex items-center gap-1">
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
          {record.errors.map((e, i) => <p key={i}>⚠ {e}</p>)}
        </div>
      )}
      {record.warnings.length > 0 && (
        <div className="mt-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-warning">
          {record.warnings.map((w, i) => <p key={i}>⚡ {w}</p>)}
        </div>
      )}

      {/* Tile totale */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            Linii impozit
          </p>
          <p className="mt-0.5 font-display text-[18px] font-bold text-eos-text">
            {record.data.lines.length}
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-3 py-2 text-eos-primary">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
            Total datorat
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold">
            {fmtRON(record.data.totalDue)} <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-eos-warning">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
            Total de plată
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold">
            {fmtRON(record.data.totalToPay)} <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
      </div>

      {/* Summary per categorie */}
      <div className="mt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Pe categorii
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {summaryEntries.map(([cat, agg]) => (
            <span
              key={cat}
              className={`rounded-eos-sm border px-2 py-0.5 text-[11px] ${CATEGORY_TONE[cat]}`}
            >
              <strong>{CATEGORY_LABELS[cat]}</strong> · {agg.count} · {fmtRON(agg.totalDue)} RON
            </span>
          ))}
        </div>
      </div>

      {/* Linii detaliate */}
      <div className="mt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Linii impozit ({record.data.lines.length})
        </p>
        <table className="mt-1.5 w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="text-left text-eos-text-tertiary">
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">Cod</th>
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">Descriere</th>
              <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">Datorat</th>
              <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">De plată</th>
            </tr>
          </thead>
          <tbody>
            {record.data.lines.map((line, idx) => (
              <tr key={`${line.code}-${idx}`} className="border-t border-eos-border">
                <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text-muted">{line.code}</td>
                <td className="py-1.5 pr-2 text-eos-text">{line.label}</td>
                <td className="py-1.5 pr-2 text-right font-mono text-eos-text">{fmtRON(line.amountDue)}</td>
                <td className="py-1.5 text-right font-mono font-semibold text-eos-text">{fmtRON(line.amountToPay)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
