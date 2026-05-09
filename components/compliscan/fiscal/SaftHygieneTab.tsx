"use client"

// GAP #4 (Sprint 3) — SAF-T D406 Hygiene Tab.
//
// Tab pentru upload XML SAF-T D406, parse metadata, vizualizare hygiene score,
// indicatori și istorie.
//
// UX:
//   - Drop zone XML (file input + textarea pentru paste)
//   - După upload: hygiene score, 4 indicatori, consistency issues
//   - Istorie raportări SAF-T existente
//   - Warnings parser afișate ca alertă, errors = blocked

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, FileCode2, FileText, Loader2, ShieldCheck, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import type { SAFTHygieneStatus, SAFTIndicator } from "@/lib/compliance/saft-hygiene"

type UploadResponse = {
  ok: boolean
  filing?: FilingRecord
  hygiene?: SAFTHygieneStatus
  warnings?: string[]
  errors?: string[]
  meta?: {
    period: string
    cif: string | null
    isRectification: boolean
    rectificationCount: number
  }
}

type HygieneSnapshot = {
  hygiene: SAFTHygieneStatus
  saftFilings: FilingRecord[]
  d406EvidenceSubmitted: boolean
}

const HYGIENE_TONE: Record<SAFTHygieneStatus["hygieneLabel"], string> = {
  excelent: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  bun: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  acceptabil: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  slab: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  critic: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const INDICATOR_TONE: Record<SAFTIndicator["status"], string> = {
  ok: "border-eos-success/30 bg-eos-success-soft",
  warning: "border-eos-warning/30 bg-eos-warning-soft",
  critical: "border-eos-error/30 bg-eos-error-soft",
}

const INDICATOR_ICON_TONE: Record<SAFTIndicator["status"], string> = {
  ok: "text-eos-success",
  warning: "text-eos-warning",
  critical: "text-eos-error",
}

function fmtDate(iso?: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  } catch {
    return iso
  }
}

export function SaftHygieneTab() {
  const [snapshot, setSnapshot] = useState<HygieneSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [xml, setXml] = useState("")
  const [fileName, setFileName] = useState("")
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null)

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/d406-upload", { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut încărca starea SAF-T.")
      const data = (await res.json()) as HygieneSnapshot
      setSnapshot(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la încărcare.")
    } finally {
      setLoading(false)
    }
  }

  async function handleFileChange(file: File | null) {
    if (!file) return
    setFileName(file.name)
    try {
      const text = await file.text()
      setXml(text)
    } catch {
      toast.error("Nu am putut citi fișierul XML.")
    }
  }

  async function handleUpload() {
    if (!xml.trim()) {
      toast.error("Lipsește conținutul XML.")
      return
    }
    setUploading(true)
    try {
      const res = await fetch("/api/fiscal/d406-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, fileName: fileName || "upload.xml" }),
      })
      const data = (await res.json()) as UploadResponse
      setLastUpload(data)

      if (!res.ok || !data.ok) {
        toast.error("Upload SAF-T eșuat", {
          description: (data.errors ?? []).slice(0, 2).join(" · ") || "Verifică XML-ul.",
        })
        return
      }

      toast.success("SAF-T procesat", {
        description: data.meta
          ? `Perioada ${data.meta.period}${data.meta.isRectification ? " (rectificare)" : ""}.`
          : "Hygiene score recalculat.",
      })
      setXml("")
      setFileName("")
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la upload.")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă SAF-T hygiene...
      </div>
    )
  }

  const hygiene = snapshot?.hygiene
  const saftFilings = snapshot?.saftFilings ?? []
  const tone = hygiene
    ? HYGIENE_TONE[hygiene.hygieneLabel]
    : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"

  return (
    <div className="space-y-6">
      {/* Hygiene score card */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
              SAF-T Hygiene
            </p>
            <p
              data-display-text="true"
              className="mt-1 font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              D406 — Igienă raportare fiscală
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">
              Încarcă fișiere SAF-T XML pentru parsare automată, calcul scor și findings recomandate.
            </p>
          </div>
          {hygiene && (
            <div
              className={`flex flex-col items-center justify-center rounded-eos-md border px-4 py-2 ${tone}`}
            >
              <span className="font-display text-[26px] font-semibold leading-none">
                {hygiene.hygieneScore}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                {hygiene.hygieneLabel}
              </span>
            </div>
          )}
        </div>

        {hygiene && hygiene.totalFilings > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">La timp</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{hygiene.onTime}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Întârziere</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{hygiene.late}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Lipsă</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{hygiene.missing}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Rectificate</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{hygiene.rectified}</p>
            </div>
          </div>
        )}
      </section>

      {/* Upload zone */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-eos-primary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Încarcă raportare D406 (SAF-T XML)
          </p>
        </div>
        <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
          Fișierul rămâne local — extragem doar metadata (perioadă, CIF, rectificare). Nu trimitem nimic la ANAF.
        </p>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-3">
            <label className="ring-focus flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-eos-md border border-dashed border-eos-border-strong bg-eos-surface-variant px-5 text-center text-[12.5px] text-eos-text-muted hover:bg-eos-secondary-hover">
              <FileCode2 className="size-5 text-eos-primary" strokeWidth={2} />
              <span>{fileName ? `Selectat: ${fileName}` : "Click pentru fișier XML sau lipește mai jos"}</span>
              <input
                type="file"
                accept=".xml,text/xml,application/xml"
                className="hidden"
                onChange={(event) => {
                  void handleFileChange(event.target.files?.[0] ?? null)
                }}
              />
            </label>

            <input
              value={fileName}
              onChange={(event) => setFileName(event.target.value)}
              placeholder="Nume fișier (opțional)"
              className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
            />

            <Button
              onClick={() => void handleUpload()}
              disabled={!xml.trim() || uploading}
              className="w-full"
              data-testid="saft-upload"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Se procesează...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-3.5" strokeWidth={2} /> Procesează D406
                </>
              )}
            </Button>
          </div>

          <textarea
            value={xml}
            onChange={(event) => setXml(event.target.value)}
            rows={10}
            placeholder='<?xml version="1.0"?><AuditFile>...</AuditFile>'
            className="ring-focus min-h-[200px] w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-3 font-mono text-[12px] text-eos-text outline-none placeholder:text-eos-text-muted"
          />
        </div>

        {lastUpload && lastUpload.errors && lastUpload.errors.length > 0 && (
          <div className="mt-3 rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-error">
              Erori parser
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-eos-error">
              {lastUpload.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        {lastUpload && lastUpload.warnings && lastUpload.warnings.length > 0 && (
          <div className="mt-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
              Atenționări
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-eos-warning">
              {lastUpload.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Indicators */}
      {hygiene && hygiene.indicators.length > 0 && (
        <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Indicatori
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {hygiene.indicators.map((ind) => {
              const Icon =
                ind.status === "ok"
                  ? CheckCircle2
                  : ind.status === "warning"
                    ? AlertTriangle
                    : ShieldCheck
              return (
                <div
                  key={ind.id}
                  className={`flex items-start gap-3 rounded-eos-md border px-3 py-2.5 ${INDICATOR_TONE[ind.status]}`}
                >
                  <Icon
                    className={`mt-0.5 size-4 shrink-0 ${INDICATOR_ICON_TONE[ind.status]}`}
                    strokeWidth={2}
                  />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold text-eos-text">{ind.label}</p>
                    <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{ind.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Consistency issues */}
      {hygiene && hygiene.consistencyIssues.length > 0 && (
        <section className="rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-eos-warning" strokeWidth={2} />
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Probleme de consistență
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {hygiene.consistencyIssues.map((issue, i) => (
              <li
                key={i}
                className="rounded-eos-md border border-eos-warning/30 bg-eos-surface px-3 py-2 text-[12.5px]"
              >
                <p className="font-semibold text-eos-text">
                  {issue.type === "repeated_rectification"
                    ? "Rectificări repetate"
                    : issue.type === "gap"
                      ? "Perioadă lipsă"
                      : issue.type === "sequence_break"
                        ? "Discontinuitate sequencing"
                        : "Cross-filing mismatch"}
                </p>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{issue.message}</p>
                {issue.periods.length > 0 && (
                  <p className="mt-1 font-mono text-[10.5px] text-eos-text-muted">
                    Perioade: {issue.periods.join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* History of past SAF-T filings */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-eos-text-tertiary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Raportări SAF-T anterioare ({saftFilings.length})
          </p>
        </div>
        {saftFilings.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-eos-text-muted">
            Nu ai încărcat nicio raportare SAF-T D406 încă. Folosește zona de upload de mai sus pentru prima depunere.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-eos-border text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                  <th className="py-2 pr-4">Perioadă</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Depusă</th>
                  <th className="py-2 pr-4">Rectificări</th>
                </tr>
              </thead>
              <tbody>
                {saftFilings
                  .slice()
                  .sort((a, b) => (b.period > a.period ? 1 : -1))
                  .map((f) => (
                    <tr key={f.id} className="border-b border-eos-border/50">
                      <td className="py-2 pr-4 font-mono text-eos-text">{f.period}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] ${
                            f.status === "on_time"
                              ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                              : f.status === "rectified"
                                ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                                : "border-eos-error/30 bg-eos-error-soft text-eos-error"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-eos-text-muted">{fmtDate(f.filedAtISO)}</td>
                      <td className="py-2 pr-4 text-eos-text-muted">{f.rectificationCount ?? 0}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
