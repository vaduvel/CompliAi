"use client"

// Public lead-magnet calculator pentru SAF-T D406.
// Permite upload unul sau mai multe fișiere XML, parse + scor afișat efemer.
// Nu necesită auth, nu salvează nimic în state.

import { useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  Loader2,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import type { SAFTHygieneStatus, SAFTIndicator } from "@/lib/compliance/saft-hygiene"

type PerFile = {
  fileName: string
  period: string
  cif: string | null
  isRectification: boolean
  rectificationCount: number
  errors: string[]
  warnings: string[]
}

type CalcResponse = {
  ok: boolean
  filesProcessed?: number
  filings?: number
  perFile?: PerFile[]
  hygiene?: SAFTHygieneStatus
  findings?: Array<{ id: string; title: string; severity: string; detail: string }>
  cta?: { message: string; registerUrl: string }
  error?: string
}

const HYGIENE_TONE: Record<SAFTHygieneStatus["hygieneLabel"], string> = {
  excelent: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  bun: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  acceptabil: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  slab: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  critic: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const INDICATOR_TONE: Record<SAFTIndicator["status"], string> = {
  ok: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  warning: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
}

const MAX_FILES = 6

export function SaftHygieneCalculator() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CalcResponse | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  function pickFiles(list: FileList | null) {
    if (!list) return
    const xmlFiles = Array.from(list).filter((f) => /\.xml$/i.test(f.name)).slice(0, MAX_FILES)
    if (xmlFiles.length === 0) {
      setErrMsg("Selectează cel puțin un fișier .xml.")
      return
    }
    setFiles(xmlFiles)
    setErrMsg(null)
  }

  async function runCalculator() {
    if (files.length === 0) return
    setBusy(true)
    setResult(null)
    setErrMsg(null)
    try {
      const filesPayload = await Promise.all(
        files.map(async (f) => ({
          fileName: f.name,
          xml: await f.text(),
        })),
      )
      const res = await fetch("/api/free-tools/saft-hygiene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesPayload }),
      })
      const data = (await res.json()) as CalcResponse
      if (!res.ok || !data.ok) {
        setErrMsg(data.error ?? "Calculatorul a eșuat.")
        return
      }
      setResult(data)
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setBusy(false)
    }
  }

  const hygiene = result?.hygiene
  const tone = hygiene
    ? HYGIENE_TONE[hygiene.hygieneLabel]
    : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"

  return (
    <section className="space-y-5 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Calculator igienă SAF-T D406
        </p>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          pickFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-eos-md border border-dashed border-eos-border-strong bg-eos-surface-variant px-6 py-10 text-center hover:bg-eos-secondary-hover"
      >
        <FileCode2 className="size-6 text-eos-primary" strokeWidth={2} />
        <p className="text-[13.5px] font-semibold text-eos-text">
          {files.length > 0
            ? `${files.length} fișier(e) selectat(e)`
            : "Trage XML aici sau click pentru selecție"}
        </p>
        <p className="text-[11.5px] text-eos-text-muted">
          {files.length === 0
            ? `Maximum ${MAX_FILES} fișiere · 6 MB total · nu salvăm nimic`
            : files.map((f) => f.name).join(" · ")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          multiple
          className="hidden"
          onChange={(e) => pickFiles(e.target.files)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => void runCalculator()} disabled={files.length === 0 || busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Calculez...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 size-3.5" strokeWidth={2} /> Calculează scorul
            </>
          )}
        </Button>
        {files.length > 0 && !busy && (
          <Button
            variant="ghost"
            onClick={() => {
              setFiles([])
              setResult(null)
            }}
          >
            Șterge selecția
          </Button>
        )}
      </div>

      {errMsg && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3 text-[12.5px] text-eos-error">
          {errMsg}
        </div>
      )}

      {result?.ok && hygiene && (
        <div className="space-y-4">
          {/* Score card */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-surface-elevated p-4">
            <div>
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Scor de igienă
              </p>
              <p
                data-display-text="true"
                className="mt-1 font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                {result.filesProcessed} fișier(e) procesate · {result.filings} valid(e)
              </p>
            </div>
            <div className={`flex flex-col items-center rounded-eos-md border px-4 py-2 ${tone}`}>
              <span className="font-display text-[28px] font-semibold leading-none">
                {hygiene.hygieneScore}
              </span>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em]">
                {hygiene.hygieneLabel}
              </span>
            </div>
          </div>

          {/* Per-file breakdown */}
          {result.perFile && result.perFile.length > 0 && (
            <div className="overflow-x-auto rounded-eos-md border border-eos-border">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                    <th className="px-3 py-2">Fișier</th>
                    <th className="px-3 py-2">Perioadă</th>
                    <th className="px-3 py-2">CIF</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.perFile.map((f) => (
                    <tr key={f.fileName} className="border-b border-eos-border/50">
                      <td className="px-3 py-2 font-mono text-eos-text">{f.fileName}</td>
                      <td className="px-3 py-2 text-eos-text-muted">{f.period || "—"}</td>
                      <td className="px-3 py-2 font-mono text-eos-text-muted">{f.cif ?? "—"}</td>
                      <td className="px-3 py-2">
                        {f.errors.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-2 py-0.5 font-mono text-[10px] text-eos-error">
                            <XCircle className="size-3" strokeWidth={2} /> {f.errors[0].slice(0, 30)}
                          </span>
                        ) : f.isRectification ? (
                          <span className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-0.5 font-mono text-[10px] text-eos-warning">
                            <AlertTriangle className="size-3" strokeWidth={2} /> Rectif #
                            {f.rectificationCount}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10px] text-eos-success">
                            <CheckCircle2 className="size-3" strokeWidth={2} /> OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Indicators */}
          {hygiene.indicators.length > 0 && (
            <div className="grid gap-2 md:grid-cols-2">
              {hygiene.indicators.map((ind) => {
                const Icon = ind.status === "ok" ? CheckCircle2 : ind.status === "warning" ? AlertTriangle : ShieldCheck
                return (
                  <div
                    key={ind.id}
                    className={`flex items-start gap-3 rounded-eos-md border px-3 py-2.5 ${INDICATOR_TONE[ind.status]}`}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-eos-text">{ind.label}</p>
                      <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{ind.detail}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* CTA — convert to lead */}
          {result.cta && (
            <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/10 p-4">
              <p className="text-[13px] text-eos-text">{result.cta.message}</p>
              <a
                href={result.cta.registerUrl}
                className="mt-3 inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-eos-primary/90"
              >
                Cont gratuit CompliScan →
              </a>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
