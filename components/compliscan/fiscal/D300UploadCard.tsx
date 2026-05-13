"use client"

// Card upload D300 XML — utilizatorul descarcă D300 din SPV ANAF (PDF inteligent
// cu XFA-XML embedded sau XML pur exportat din Saga/SmartBill), îl trage aici,
// parser-ul extrage conținutul (perioada, CUI, baze TVA per cotă, totale).
//
// Foundation pentru R1 cross-correlation: Σ facturi SmartBill ↔ bază TVA D300.

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ── Types reflect API response ──────────────────────────────────────────────

type D300Line = {
  code: string
  label: string
  vatRate: number | null
  base: number
  vat: number
  category: "collected" | "deductible" | "summary"
}

type D300Period = {
  year: number
  month: number | null
  quarter: number | null
  period: string
  frequency: "monthly" | "quarterly" | "unknown"
}

type D300ParsedData = {
  cui: string | null
  period: D300Period | null
  isRectification: boolean
  lines: D300Line[]
  totalCollectedBase: number
  totalCollectedVat: number
  totalDeductibleBase: number
  totalDeductibleVat: number
  vatToPay: number
  vatToRefund: number
  errors: string[]
  warnings: string[]
}

type ParsedRecord = {
  id: string
  type: "d300"
  period: string | null
  cui: string | null
  isRectification: boolean
  parsedAtISO: string
  source: string
  fileName?: string
  data: D300ParsedData
  errors: string[]
  warnings: string[]
}

type ListResponse = {
  ok: boolean
  records: ParsedRecord[]
  summary: {
    total: number
    byType: { d300: number; d205: number; d100: number }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtRON(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPeriod(period: D300Period | null): string {
  if (!period) return "—"
  if (period.frequency === "monthly" && period.month) {
    const months = [
      "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
      "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
    ]
    return `${months[period.month - 1]} ${period.year}`
  }
  if (period.frequency === "quarterly" && period.quarter) {
    return `Trimestrul ${period.quarter} ${period.year}`
  }
  return String(period.year)
}

// ── Component ────────────────────────────────────────────────────────────────

export function D300UploadCard() {
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
      const res = await fetch("/api/fiscal/parse-d300", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca lista D300.")
        return
      }
      const data = (await res.json()) as ListResponse
      setRecords(data.records ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".xml")) {
      toast.error(
        "Doar fișiere XML acceptate momentan. Pentru PDF descarcă XML-ul din SPV sau ERP.",
      )
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Fișier prea mare (${(file.size / 1024 / 1024).toFixed(1)} MB). Maxim 5 MB.`)
      return
    }

    setUploading(true)
    try {
      const xml = await file.text()
      const res = await fetch("/api/fiscal/parse-d300", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, fileName: file.name }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Parsare D300 eșuată.")
        return
      }
      toast.success(
        `D300 parsat: ${body.record.period ?? "perioadă necunoscută"} (CUI ${body.record.cui ?? "?"}).`,
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
      const res = await fetch(`/api/fiscal/parse-d300?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
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

  // Drag & drop handlers
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
            <FileCode2 className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              D300 — Decont TVA (parser XML)
            </h2>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Trage aici XML-ul D300 descărcat din SPV ANAF (sau exportat din Saga / SmartBill).
            Parser-ul extrage perioada, CUI, baze TVA per cotă și totale. Folosit pentru
            cross-correlation cu facturi (R1: Σ facturi ↔ bază D300).
          </p>
        </div>
        {records.length > 0 && (
          <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
            {records.length} parsate
          </span>
        )}
      </header>

      {/* Drop zone */}
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
        <Upload
          className="mx-auto size-6 text-eos-text-muted"
          strokeWidth={1.8}
        />
        <p
          data-display-text="true"
          className="mt-2 font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          {uploading ? "Parsez D300..." : "Trage XML-ul aici sau click pentru a alege"}
        </p>
        <p className="mt-1 text-[11px] text-eos-text-muted">
          Acceptat: XML D300 (Saga, SmartBill, ANAF export). Maxim 5 MB.
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

      {/* Selected record detail (after upload) */}
      {selectedRecord && (
        <D300DetailPanel
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          onDelete={() => deleteRecord(selectedRecord.id)}
        />
      )}

      {/* History list */}
      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc istoricul...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
          Nu există declarații D300 parsate încă. Încarcă primul XML pentru a începe
          cross-correlation cu facturile.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Declarații D300 parsate ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.id === r.id
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRecord(isSelected ? null : r)
                    }
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] transition hover:bg-eos-surface ${isSelected ? "bg-eos-surface" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        D300 · {fmtPeriod(r.data.period)}
                        {r.isRectification && (
                          <span className="ml-1.5 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-warning">
                            RECTIFICATIVĂ
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        CUI {r.cui ?? "necunoscut"} · TVA plată{" "}
                        <strong>{fmtRON(r.data.vatToPay)} RON</strong> ·{" "}
                        {r.fileName ?? "fără nume fișier"} · parsat{" "}
                        {new Date(r.parsedAtISO).toLocaleDateString("ro-RO")}
                      </p>
                    </div>
                    {r.errors.length > 0 && (
                      <AlertTriangle
                        className="size-4 shrink-0 text-eos-warning"
                        strokeWidth={2}
                      />
                    )}
                  </button>
                  {isSelected && (
                    <D300DetailPanel
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

// ── Detail panel (date parsate) ─────────────────────────────────────────────

function D300DetailPanel({
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
  const collected = record.data.lines.filter((l) => l.category === "collected")
  const deductible = record.data.lines.filter((l) => l.category === "deductible")
  const summary = record.data.lines.filter((l) => l.category === "summary")

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
            D300 · {fmtPeriod(record.data.period)}
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            CUI {record.cui ?? "necunoscut"} · {record.fileName ?? "fără nume"}
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

      {/* Errors / warnings */}
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

      {/* Tiles totaluri */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <TotalTile label="TVA colectat" value={fmtRON(record.data.totalCollectedVat)} tone="primary" />
        <TotalTile label="TVA deductibil" value={fmtRON(record.data.totalDeductibleVat)} tone="info" />
        <TotalTile label="TVA de plată" value={fmtRON(record.data.vatToPay)} tone="warning" />
        <TotalTile label="TVA de restituit" value={fmtRON(record.data.vatToRefund)} tone="success" />
      </div>

      {/* Linii detaliate */}
      {collected.length > 0 && (
        <LineTable title="Livrări (TVA colectat)" lines={collected} />
      )}
      {deductible.length > 0 && (
        <LineTable title="Achiziții (TVA deductibil)" lines={deductible} />
      )}
      {summary.length > 0 && (
        <LineTable title="Totale" lines={summary} hideRate />
      )}
    </div>
  )
}

function TotalTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "primary" | "info" | "warning" | "success"
}) {
  const toneClass =
    tone === "primary"
      ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
      : tone === "warning"
        ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
        : tone === "success"
          ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
          : "border-eos-border bg-eos-surface text-eos-text"
  return (
    <div className={`rounded-eos-sm border px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[15px] font-bold">{value}</p>
      <p className="text-[9.5px] opacity-70">RON</p>
    </div>
  )
}

function LineTable({
  title,
  lines,
  hideRate = false,
}: {
  title: string
  lines: D300Line[]
  hideRate?: boolean
}) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
        {title}
      </p>
      <table className="mt-1.5 w-full border-collapse text-[11.5px]">
        <thead>
          <tr className="text-left text-eos-text-tertiary">
            <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              Cod
            </th>
            <th className="py-1 pr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              Descriere
            </th>
            {!hideRate && (
              <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                Cotă
              </th>
            )}
            <th className="py-1 pr-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              Bază
            </th>
            <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              TVA
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.code} className="border-t border-eos-border">
              <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text-muted">
                {line.code}
              </td>
              <td className="py-1.5 pr-2 text-eos-text">{line.label}</td>
              {!hideRate && (
                <td className="py-1.5 pr-2 text-right text-eos-text-muted">
                  {line.vatRate !== null ? `${line.vatRate}%` : "—"}
                </td>
              )}
              <td className="py-1.5 pr-2 text-right font-mono text-eos-text">
                {fmtRON(line.base)}
              </td>
              <td className="py-1.5 text-right font-mono font-semibold text-eos-text">
                {fmtRON(line.vat)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
