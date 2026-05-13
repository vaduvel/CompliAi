"use client"

// Card lookup ONRC — fetch ANAF + asociați manual din certificat ONRC.
// Fundație pentru R3 (AGA procent ↔ ONRC procent) — comparare la rulare
// cross-correlation pentru a detecta neconcordanțe în deținere.

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

// ── Types ────────────────────────────────────────────────────────────────────

type OnrcAssociate = {
  idType: "CNP" | "CUI" | "unknown"
  id: string | null
  name: string
  ownershipPercent: number
  role?: string
}

type OnrcSnapshotRecord = {
  id: string
  cui: string
  companyName: string | null
  mainCaen: string | null
  legalForm: string | null
  registeredAddress: string | null
  fiscalStatus: string | null
  vatRegistered: boolean
  efacturaRegistered: boolean
  registrationNumber: string | null
  associates: OnrcAssociate[]
  majorityOwner: OnrcAssociate | null
  totalOwnershipPercent: number
  sources: string[]
  anafFetchedAtISO: string | null
  associatesConfirmedAtISO: string | null
  isComplete: boolean
  parsedAtISO: string
  errors: string[]
  warnings: string[]
}

function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(n % 1 === 0 ? 0 : 2)}%`
}

function maskCnp(cnp: string | null): string {
  if (!cnp) return "—"
  if (cnp.length < 13) return cnp
  return `${cnp.slice(0, 4)}***${cnp.slice(-4)}`
}

// ── Component ────────────────────────────────────────────────────────────────

export function OnrcSnapshotCard() {
  const [records, setRecords] = useState<OnrcSnapshotRecord[]>([])
  const [recomEnabled, setRecomEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [cuiInput, setCuiInput] = useState("")
  const [selectedRecord, setSelectedRecord] = useState<OnrcSnapshotRecord | null>(null)

  useEffect(() => {
    void loadRecords()
  }, [])

  async function loadRecords() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/onrc-lookup", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body.error ?? "Nu am putut încărca ONRC.")
        return
      }
      const data = await res.json()
      setRecords(data.records ?? [])
      setRecomEnabled(Boolean(data.recomEnabled))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function lookupCui() {
    const trimmed = cuiInput.trim()
    if (!trimmed) {
      toast.error("Introdu un CUI.")
      return
    }
    setSearching(true)
    try {
      const res = await fetch("/api/fiscal/onrc-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui: trimmed }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Lookup ONRC eșuat.")
        return
      }
      const r = body.record as OnrcSnapshotRecord
      toast.success(
        `${r.companyName ?? "Firmă"} (${r.cui}) · ${r.associates.length} asociați din ${r.sources.join("+")}`,
      )
      setSelectedRecord(r)
      setCuiInput("")
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare lookup.")
    } finally {
      setSearching(false)
    }
  }

  async function saveAssociates(record: OnrcSnapshotRecord, associates: OnrcAssociate[]) {
    try {
      const res = await fetch("/api/fiscal/onrc-lookup", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui: record.cui, associates }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Salvare asociați eșuată.")
        return null
      }
      toast.success(
        `${body.record.associates.length} asociați salvați (${body.record.totalOwnershipPercent.toFixed(1)}% total).`,
      )
      setSelectedRecord(body.record as OnrcSnapshotRecord)
      await loadRecords()
      return body.record as OnrcSnapshotRecord
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare salvare.")
      return null
    }
  }

  async function deleteRecord(cui: string) {
    try {
      const res = await fetch(`/api/fiscal/onrc-lookup?cui=${encodeURIComponent(cui)}`, {
        method: "DELETE",
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(body.error ?? "Ștergere eșuată.")
        return
      }
      toast.success("Snapshot șters.")
      if (selectedRecord?.cui === cui) setSelectedRecord(null)
      await loadRecords()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    }
  }

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-eos-primary" strokeWidth={2} />
            <h2
              data-display-text="true"
              className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              ONRC — snapshot firmă + asociați
            </h2>
            <span
              className={`ml-1 inline-flex items-center gap-1 rounded-eos-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${
                recomEnabled
                  ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                  : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
              }`}
              title={
                recomEnabled
                  ? "ONRC RECOM SOAP conectat (asociații se aduc automat)"
                  : "RECOM nu e conectat — introdu asociații manual din certificat"
              }
            >
              <Sparkles className="size-3" strokeWidth={2.5} />
              {recomEnabled ? "RECOM ON" : "Manual"}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-[12.5px] text-eos-text-muted">
            Caută firmă după CUI: aducem datele de bază de la ANAF (denumire, CAEN, status TVA).
            Asociații (CNP + procent deținere) se aduc automat dacă ONRC RECOM e conectat;
            altfel introduce-i manual din certificatul ONRC pentru cross-correlation R3
            (AGA procent ↔ ONRC procent).
          </p>
        </div>
        {records.length > 0 && (
          <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
            {records.length} firme
          </span>
        )}
      </header>

      {/* CUI search */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void lookupCui()
        }}
        className="mt-5 flex gap-2"
      >
        <input
          type="text"
          value={cuiInput}
          onChange={(e) => setCuiInput(e.target.value)}
          placeholder="RO12345678 sau 12345678"
          className="flex-1 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[13px] text-eos-text focus:border-eos-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={searching || cuiInput.trim().length === 0}
          className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-4 py-2 text-[12px] font-medium text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {searching ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
          ) : (
            <Search className="size-3.5" strokeWidth={2.5} />
          )}
          {searching ? "Caut..." : "Caută CUI"}
        </button>
      </form>
      <p className="mt-1 text-[10.5px] text-eos-text-tertiary">
        ANAF v9 (free, sub 1s). Cache 90 zile. Pentru asociați + cote, fie RECOM SOAP
        (subscripție portaljust.ro), fie completare manuală.
      </p>

      {selectedRecord && (
        <OnrcDetailPanel
          record={selectedRecord}
          recomEnabled={recomEnabled}
          onClose={() => setSelectedRecord(null)}
          onDelete={() => deleteRecord(selectedRecord.cui)}
          onSave={(associates) => saveAssociates(selectedRecord, associates)}
        />
      )}

      {loading ? (
        <div className="mt-5 flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Încarc snapshot-urile...
        </div>
      ) : records.length === 0 ? (
        <div className="mt-5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-4 py-3 text-[12px] text-eos-text-muted">
          Nu există snapshot-uri ONRC. Introdu un CUI mai sus pentru a începe.
        </div>
      ) : (
        <div className="mt-5">
          <p
            data-display-text="true"
            className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Snapshot-uri ONRC ({records.length})
          </p>
          <ul className="mt-2 divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface-elevated">
            {records.map((r) => {
              const isSelected = selectedRecord?.cui === r.cui
              return (
                <li key={r.cui}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(isSelected ? null : r)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[12px] transition hover:bg-eos-surface ${
                      isSelected ? "bg-eos-surface" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        {r.companyName ?? "(fără denumire)"}{" "}
                        <span className="font-mono text-[10.5px] text-eos-text-muted">
                          · CUI {r.cui}
                        </span>
                        {r.isComplete && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-success">
                            <CheckCircle2 className="size-2.5" strokeWidth={3} />
                            Complet
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        {r.legalForm ?? "?"} · {r.mainCaen ?? "?"} ·{" "}
                        {r.associates.length} asociați · {r.totalOwnershipPercent.toFixed(1)}%
                        {r.fiscalStatus && (
                          <span
                            className={`ml-1 ${r.fiscalStatus.includes("INACTIV") ? "text-eos-error" : "text-eos-success"}`}
                          >
                            · {r.fiscalStatus}
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-eos-text-tertiary">
                      {r.sources.join("+")}
                    </span>
                    {!r.isComplete && r.associates.length === 0 && (
                      <AlertTriangle className="size-4 shrink-0 text-eos-warning" strokeWidth={2} />
                    )}
                  </button>
                  {isSelected && (
                    <OnrcDetailPanel
                      record={r}
                      recomEnabled={recomEnabled}
                      onClose={() => setSelectedRecord(null)}
                      onDelete={() => deleteRecord(r.cui)}
                      onSave={(associates) => saveAssociates(r, associates)}
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

// ── Detail panel cu editor asociați ──────────────────────────────────────────

function OnrcDetailPanel({
  record,
  recomEnabled,
  onClose,
  onDelete,
  onSave,
  inline = false,
}: {
  record: OnrcSnapshotRecord
  recomEnabled: boolean
  onClose: () => void
  onDelete: () => void
  onSave: (associates: OnrcAssociate[]) => Promise<OnrcSnapshotRecord | null>
  inline?: boolean
}) {
  const [editing, setEditing] = useState(record.associates.length === 0)
  const [associates, setAssociates] = useState<OnrcAssociate[]>(
    record.associates.length > 0
      ? record.associates
      : [{ idType: "CNP", id: "", name: "", ownershipPercent: 100 }],
  )

  // reset when record changes
  useEffect(() => {
    setAssociates(
      record.associates.length > 0
        ? record.associates
        : [{ idType: "CNP", id: "", name: "", ownershipPercent: 100 }],
    )
    setEditing(record.associates.length === 0)
  }, [record.id])

  const totalOwnership = useMemo(
    () => associates.reduce((s, a) => s + (a.ownershipPercent || 0), 0),
    [associates],
  )

  function addRow() {
    setAssociates([
      ...associates,
      { idType: "CNP", id: "", name: "", ownershipPercent: 0 },
    ])
  }

  function removeRow(idx: number) {
    setAssociates(associates.filter((_, i) => i !== idx))
  }

  function updateRow(idx: number, patch: Partial<OnrcAssociate>) {
    setAssociates(
      associates.map((a, i) => (i === idx ? { ...a, ...patch } : a)),
    )
  }

  async function handleSave() {
    const cleaned = associates.filter((a) => a.name.trim() && a.ownershipPercent > 0)
    if (cleaned.length === 0) {
      toast.error("Cel puțin un asociat cu nume + procent.")
      return
    }
    const result = await onSave(cleaned)
    if (result) setEditing(false)
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
            {record.companyName ?? "(fără denumire)"}
            <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-1.5 py-0 font-mono text-[9.5px] font-bold text-eos-text-muted">
              CUI {record.cui}
            </span>
            {record.registrationNumber && (
              <span className="rounded-eos-sm border border-eos-border bg-eos-surface px-1.5 py-0 font-mono text-[9.5px] font-bold text-eos-text-muted">
                {record.registrationNumber}
              </span>
            )}
            {record.isComplete && (
              <span className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-eos-success">
                Complet
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-eos-text-muted">
            {record.legalForm ?? "?"} · {record.mainCaen ?? "?"} ·{" "}
            {record.fiscalStatus ?? "status ?"} · Surse:{" "}
            <span className="font-mono">{record.sources.join("+")}</span>
          </p>
          {record.registeredAddress && (
            <p className="mt-0.5 text-[11px] text-eos-text-muted">
              Sediu: {record.registeredAddress}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-1 text-[10.5px] transition ${
              editing
                ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
                : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-primary"
            }`}
          >
            {editing ? "Anulează" : "Editează asociați"}
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

      {/* Indicators */}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Pill label="TVA înregistrat" value={record.vatRegistered ? "DA" : "NU"} positive={record.vatRegistered} />
        <Pill label="e-Factura" value={record.efacturaRegistered ? "DA" : "NU"} positive={record.efacturaRegistered} />
        <Pill label="Asociați" value={record.associates.length.toString()} />
        <Pill
          label="Σ Deținere"
          value={fmtPct(record.totalOwnershipPercent)}
          warn={record.associates.length > 0 && Math.abs(record.totalOwnershipPercent - 100) > 2}
        />
      </div>

      {/* Associates list / editor */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Asociați ({editing ? associates.length : record.associates.length})
          </p>
          {editing && (
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 text-[10.5px] text-eos-text-muted hover:border-eos-primary hover:text-eos-primary"
            >
              <Plus className="size-3" strokeWidth={2.5} />
              Adaugă rând
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            {associates.map((a, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-2 text-[11px]"
              >
                <select
                  value={a.idType}
                  onChange={(e) =>
                    updateRow(idx, {
                      idType: e.target.value as OnrcAssociate["idType"],
                    })
                  }
                  className="col-span-2 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-2 py-1 font-mono text-[10.5px] text-eos-text focus:border-eos-primary focus:outline-none"
                >
                  <option value="CNP">CNP</option>
                  <option value="CUI">CUI</option>
                  <option value="unknown">?</option>
                </select>
                <input
                  type="text"
                  value={a.id ?? ""}
                  placeholder="ID"
                  onChange={(e) => updateRow(idx, { id: e.target.value || null })}
                  className="col-span-3 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-2 py-1 font-mono text-[10.5px] text-eos-text focus:border-eos-primary focus:outline-none"
                />
                <input
                  type="text"
                  value={a.name}
                  placeholder="Nume"
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  className="col-span-5 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-2 py-1 text-eos-text focus:border-eos-primary focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={a.ownershipPercent}
                  onChange={(e) =>
                    updateRow(idx, {
                      ownershipPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="col-span-1 rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-1 py-1 text-right font-mono text-[10.5px] text-eos-text focus:border-eos-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="col-span-1 flex items-center justify-center rounded-eos-sm border border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-error/30 hover:text-eos-error"
                >
                  <Trash2 className="size-3" strokeWidth={2} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2 rounded-eos-sm border border-dashed border-eos-border bg-eos-surface-elevated px-3 py-2 text-[11px]">
              <span className="font-mono text-eos-text-tertiary">
                Σ cote = <strong className={Math.abs(totalOwnership - 100) > 2 ? "text-eos-warning" : "text-eos-success"}>
                  {totalOwnership.toFixed(1)}%
                </strong>{" "}
                {Math.abs(totalOwnership - 100) > 2 && "(așteptat ~100%)"}
              </span>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-primary bg-eos-primary px-3 py-1.5 text-[12px] font-medium text-white shadow-eos-sm hover:bg-eos-primary/90"
              >
                <Save className="size-3.5" strokeWidth={2.5} />
                Salvează
              </button>
            </div>
            <p className="text-[10px] text-eos-text-tertiary italic">
              Datele provin din certificatul ONRC. CNP-urile sunt mascate la afișare
              (primele 4 + ultimele 4) — datele complete sunt stocate per organizație. GDPR Art. 5(1)(f).
            </p>
          </div>
        ) : record.associates.length === 0 ? (
          <div className="mt-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-[11px] text-eos-warning">
            Niciun asociat înregistrat. {recomEnabled ? "RECOM API n-a returnat date." : "RECOM nu e conectat — folosește butonul 'Editează asociați' pentru a-i introduce manual."}
          </div>
        ) : (
          <table className="mt-2 w-full border-collapse text-[11.5px]">
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
                <th className="py-1 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  Deținere
                </th>
              </tr>
            </thead>
            <tbody>
              {record.associates.map((a, idx) => {
                const isMajor = record.majorityOwner && a.name === record.majorityOwner.name
                return (
                  <tr key={idx} className="border-t border-eos-border">
                    <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text-muted">
                      {a.idType}
                    </td>
                    <td className="py-1.5 pr-2 font-mono text-[10.5px] text-eos-text">
                      {a.idType === "CNP" ? maskCnp(a.id) : a.id ?? "—"}
                    </td>
                    <td className="py-1.5 pr-2 text-eos-text">
                      {a.name}
                      {isMajor && (
                        <span className="ml-1.5 inline-block rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-1 py-0 font-mono text-[9px] font-bold uppercase text-eos-primary">
                          MAJORITAR
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-right font-mono font-semibold text-eos-text">
                      {fmtPct(a.ownershipPercent)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {record.associatesConfirmedAtISO && !editing && (
        <p className="mt-2 flex items-center gap-1 text-[10.5px] text-eos-success">
          <Check className="size-3" strokeWidth={2.5} />
          Asociați confirmați manual la{" "}
          {new Date(record.associatesConfirmedAtISO).toLocaleString("ro-RO")}.
        </p>
      )}
    </div>
  )
}

function Pill({
  label,
  value,
  positive,
  warn,
}: {
  label: string
  value: string
  positive?: boolean
  warn?: boolean
}) {
  return (
    <div
      className={`rounded-eos-sm border px-3 py-2 ${
        warn
          ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
          : positive
            ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
            : "border-eos-border bg-eos-surface text-eos-text"
      }`}
    >
      <p
        className={`font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] ${warn || positive ? "opacity-80" : "text-eos-text-muted"}`}
      >
        {label}
      </p>
      <p data-display-text="true" className="mt-0.5 font-display text-[14px] font-bold">
        {value}
      </p>
    </div>
  )
}
