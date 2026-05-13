"use client"

// Card upload D205 XML — declarația informativă anuală impozit reținut la
// sursă. Folosit pentru cross-correlation R2 (AGA ↔ stat plată ↔ D205) și
// R5 (D205 ↔ Σ D100 lunare).

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Receipt,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

type IncomeType =
  | "dividende"
  | "drepturi_autor"
  | "dobanzi"
  | "redevente"
  | "alte"
  | "necunoscut"

type Beneficiary = {
  idType: "CNP" | "CUI" | "unknown"
  id: string | null
  name: string | null
  incomeType: IncomeType
  incomeCode: string | null
  grossIncome: number
  withheldTax: number
  country: string
}

type SummaryByType = Record<
  IncomeType,
  { count: number; totalIncome: number; totalTax: number }
>

type D205ParsedData = {
  declarantCui: string | null
  reportingYear: number | null
  isRectification: boolean
  beneficiaries: Beneficiary[]
  summaryByIncomeType: SummaryByType
  totalGrossIncome: number
  totalWithheldTax: number
  errors: string[]
  warnings: string[]
}

type ParsedRecord = {
  id: string
  type: "d205"
  period: string | null
  cui: string | null
  isRectification: boolean
  parsedAtISO: string
  source: string
  fileName?: string
  data: D205ParsedData
  errors: string[]
  warnings: string[]
}

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  dividende: "Dividende",
  drepturi_autor: "Drepturi autor",
  dobanzi: "Dobânzi",
  redevente: "Redevențe",
  alte: "Alte venituri",
  necunoscut: "Neclasificat",
}

const INCOME_TYPE_TONE: Record<IncomeType, string> = {
  dividende: "border-eos-primary/30 bg-eos-primary-soft text-eos-primary",
  drepturi_autor: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  dobanzi: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  redevente: "border-eos-border bg-eos-surface-elevated text-eos-text",
  alte: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  necunoscut: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

function fmtRON(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function maskCnp(cnp: string | null): string {
  if (!cnp || cnp.length < 13) return cnp ?? "—"
  // Show first 4 + last 4 (sex+year+last 4), mask middle
  return `${cnp.slice(0, 4)}***${cnp.slice(-4)}`
}

// ── Component ────────────────────────────────────────────────────────────────

export function D205UploadCard() {
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
      const res = await fetch("/api/fiscal/parse-d205", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca D205.")
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
      toast.error("Doar XML acceptat momentan. Pentru PDF descarcă XML-ul din SPV sau Saga.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Fișier prea mare. Maxim 5 MB.`)
      return
    }

    setUploading(true)
    try {
      const xml = await file.text()
      const res = await fetch("/api/fiscal/parse-d205", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, fileName: file.name }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Parsare D205 eșuată.")
        return
      }
      toast.success(
        `D205 parsat: anul ${body.record.period ?? "?"} — ${body.parsed.beneficiaries.length} beneficiari.`,
      )
      setSelectedRecord(body.record)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare upload.")
    } finally {
      setUploading(false)
    }
  }

  async function deleteRecord(id: string) {
    try {
      const res = await fetch(`/api/fiscal/parse-d205?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
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
            <Receipt className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              D205 — Impozit reținut la sursă (parser XML)
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Trage aici XML-ul D205 anual descărcat din SPV sau exportat din Saga/SmartBill.
            Parser-ul extrage beneficiarii (dividende, drepturi autor, dobânzi) cu sume și
            impozit reținut. Folosit pentru cross-correlation cu AGA și D100 (R2 + R5).
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
          {uploading ? "Parsez D205..." : "Trage XML-ul aici sau click pentru a alege"}
        </p>
        <p className="mt-1 text-[11px] text-eos-text-muted">
          Acceptat: XML D205 (Saga, SmartBill, ANAF export). Maxim 5 MB.
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
        <D205DetailPanel
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
          Nu există declarații D205 parsate. Încarcă primul XML pentru a începe
          cross-correlation cu AGA.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Declarații D205 parsate ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(isSelected ? null : r)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] transition hover:bg-eos-surface ${isSelected ? "bg-eos-surface" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        D205 · Anul {r.period ?? "?"}
                        {r.isRectification && (
                          <span className="ml-1.5 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-warning">
                            RECTIFICATIVĂ
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        CUI {r.cui ?? "?"} · {r.data.beneficiaries.length} beneficiari ·
                        Impozit total <strong>{fmtRON(r.data.totalWithheldTax)} RON</strong>
                      </p>
                    </div>
                    {r.errors.length > 0 && (
                      <AlertTriangle className="size-4 shrink-0 text-eos-warning" strokeWidth={2} />
                    )}
                  </button>
                  {isSelected && (
                    <D205DetailPanel
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

// ── Detail panel ─────────────────────────────────────────────────────────────

function D205DetailPanel({
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
    Object.entries(record.data.summaryByIncomeType) as Array<
      [IncomeType, SummaryByType[IncomeType]]
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
            <CheckCircle2
              className="-mt-0.5 mr-1.5 inline size-3.5 text-eos-success"
              strokeWidth={2.5}
            />
            D205 · Anul {record.period ?? "?"}
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            CUI declarant {record.cui ?? "?"} · {record.fileName ?? "fără nume"}
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
            Beneficiari
          </p>
          <p className="mt-0.5 font-display text-[18px] font-bold text-eos-text">
            {record.data.beneficiaries.length}
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
            Venit total brut
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold text-eos-text">
            {fmtRON(record.data.totalGrossIncome)} <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
        <div className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-3 py-2 text-eos-primary">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
            Impozit reținut total
          </p>
          <p className="mt-0.5 font-display text-[15px] font-bold">
            {fmtRON(record.data.totalWithheldTax)} <span className="text-[10px] font-normal">RON</span>
          </p>
        </div>
      </div>

      {/* Summary per tip venit */}
      <div className="mt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Pe tipuri de venit
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {summaryEntries.map(([type, agg]) => (
            <span
              key={type}
              className={`rounded-eos-sm border px-2 py-0.5 text-[11px] ${INCOME_TYPE_TONE[type]}`}
            >
              <strong>{INCOME_TYPE_LABELS[type]}</strong> · {agg.count} · {fmtRON(agg.totalIncome)} venit · {fmtRON(agg.totalTax)} impozit
            </span>
          ))}
        </div>
      </div>

      {/* Lista beneficiari */}
      <div className="mt-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Lista beneficiari ({record.data.beneficiaries.length})
        </p>
        <table className="mt-1.5 w-full border-collapse text-[11.5px]">
          <thead>
            <tr className="text-left text-eos-text-tertiary">
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Tip ID
              </th>
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Identificator
              </th>
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Nume
              </th>
              <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Venit
              </th>
              <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Brut
              </th>
              <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Impozit
              </th>
            </tr>
          </thead>
          <tbody>
            {record.data.beneficiaries.map((b, idx) => (
              <tr key={idx} className="border-t border-eos-border">
                <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text-muted">
                  {b.idType}
                </td>
                <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text">
                  {b.idType === "CNP" ? maskCnp(b.id) : b.id ?? "—"}
                </td>
                <td className="py-1.5 pr-2 text-eos-text">{b.name ?? "—"}</td>
                <td className="py-1.5 pr-2 text-eos-text-muted">
                  {INCOME_TYPE_LABELS[b.incomeType]}
                  {b.incomeCode && <span className="ml-1 text-[9.5px] text-eos-text-tertiary">({b.incomeCode})</span>}
                </td>
                <td className="py-1.5 pr-2 text-right font-mono text-eos-text">
                  {fmtRON(b.grossIncome)}
                </td>
                <td className="py-1.5 text-right font-mono font-semibold text-eos-text">
                  {fmtRON(b.withheldTax)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10px] text-eos-text-tertiary italic">
          CNP-urile sunt mascate pentru afișare (primele 4 + ultimele 4 cifre). Datele complete
          sunt stocate criptat. GDPR Art. 5(1)(f).
        </p>
      </div>
    </div>
  )
}
