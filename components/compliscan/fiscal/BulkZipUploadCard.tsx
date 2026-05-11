"use client"

// GAP #6 (Sprint 5) — Bulk ZIP Upload Card pentru e-Factura.
//
// Drag-drop ZIP cu multiple XML-uri, validare în paralel, summary + tabel
// per fișier. Quick-win UX pentru contabili cu 50+ facturi/lună.

import { useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileArchive,
  Loader2,
  Package,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import type { BulkValidationResult, BulkValidationSummary } from "@/lib/compliance/efactura-bulk-zip"

type UploadResponse = {
  ok: boolean
  fileName?: string
  summary?: BulkValidationSummary
  error?: string
}

const RESULT_TONE: Record<"valid" | "invalid" | "error", string> = {
  valid: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  invalid: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  error: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
}

function classify(r: BulkValidationResult): "valid" | "invalid" | "error" {
  if (r.error) return "error"
  return r.valid ? "valid" : "invalid"
}

export function BulkZipUploadCard() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [summary, setSummary] = useState<BulkValidationSummary | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function pickFile(f: File | null) {
    if (!f) return
    if (!/\.zip$/i.test(f.name)) {
      toast.error("Selectează un fișier .zip.")
      return
    }
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setSummary(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/efactura/bulk-upload", {
        method: "POST",
        body: formData,
      })
      const data = (await res.json()) as UploadResponse
      if (!res.ok || !data.ok || !data.summary) {
        toast.error("Bulk upload eșuat", { description: data.error ?? "Verifică ZIP-ul." })
        return
      }
      setSummary(data.summary)
      toast.success("Bulk validate complet", {
        description: `${data.summary.validCount} valide / ${data.summary.invalidCount} invalide / ${data.summary.errorCount} erori`,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la bulk upload.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <Package className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Bulk validate ZIP — multiple facturi într-un singur upload
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        Trage și plasează un fișier ZIP cu mai multe XML-uri (până la 200 facturi). Validatorul rulează în paralel
        regulile UBL CIUS-RO V001-V011 și raportează status per fișier.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          pickFile(f ?? null)
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-eos-md border border-dashed px-4 py-8 text-center transition-colors ${
          dragOver
            ? "border-eos-primary bg-eos-primary/10"
            : "border-eos-border-strong bg-eos-surface-variant hover:bg-eos-secondary-hover"
        }`}
      >
        <FileArchive className="size-6 text-eos-primary" strokeWidth={2} />
        <p className="text-[13px] font-semibold text-eos-text">
          {file ? file.name : "Trage ZIP aici sau click pentru a selecta"}
        </p>
        <p className="text-[11.5px] text-eos-text-muted">
          {file
            ? `${(file.size / 1024).toFixed(1)} KB · click „Procesează ZIP" pentru a începe`
            : "Maximum 50 MB / 200 fișiere XML"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void handleUpload()}
          disabled={!file || uploading}
          data-testid="bulk-zip-upload"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Validez...
            </>
          ) : (
            <>
              <Package className="mr-2 size-3.5" strokeWidth={2} /> Procesează ZIP
            </>
          )}
        </Button>
        {file && !uploading && (
          <Button variant="ghost" onClick={() => setFile(null)}>
            Anulează selecția
          </Button>
        )}
      </div>

      {summary && (
        <div className="mt-5 space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-3 py-2 text-eos-success">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Valide</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{summary.validCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-eos-error">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Invalide</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{summary.invalidCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-eos-warning">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Erori</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{summary.errorCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-eos-text">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Durată</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">
                {(summary.durationMs / 1000).toFixed(1)}s
              </p>
            </div>
          </div>

          {summary.skippedFiles > 0 && (
            <p className="text-[11.5px] text-eos-text-muted">
              {summary.skippedFiles} fișier(e) sărite — nu sunt XML sau au fost ignorate (ex: __MACOSX).
            </p>
          )}

          <div className="overflow-x-auto rounded-eos-md border border-eos-border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                  <th className="px-3 py-2">Fișier</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Erori UBL</th>
                  <th className="px-3 py-2">Warnings</th>
                </tr>
              </thead>
              <tbody>
                {summary.results.map((r) => {
                  const cls = classify(r)
                  const Icon = cls === "valid" ? CheckCircle2 : cls === "invalid" ? XCircle : AlertTriangle
                  return (
                    <tr key={r.fileName} className="border-b border-eos-border/50">
                      <td className="px-3 py-2 font-mono text-[12px] text-eos-text">{r.fileName}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] uppercase ${RESULT_TONE[cls]}`}
                        >
                          <Icon className="size-3" strokeWidth={2} />
                          {cls === "valid" ? "VALID" : cls === "invalid" ? "INVALID" : "EROARE"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-eos-text-muted">
                        {r.error
                          ? r.error
                          : r.validation
                            ? `${r.validation.errors.length} erori`
                            : "—"}
                      </td>
                      <td className="px-3 py-2 text-eos-text-muted">
                        {r.validation ? `${r.validation.warnings.length} warnings` : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
