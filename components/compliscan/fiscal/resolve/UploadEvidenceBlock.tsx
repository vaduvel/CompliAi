"use client"

// UploadEvidenceBlock — drag-drop fișier cu validare per type + upload la
// endpoint specific. Folosit de Pattern G (upload-evidence) pentru
// CERT-EXPIRING (cert .p12/.pfx), SAFT-DEADLINE (SAF-T XML), etc.
//
// Faza 3.2 din fiscal-module-final-sprint-2026-05-12.md.

import { useRef, useState } from "react"
import { CheckCircle2, FileUp, Loader2, Upload, XCircle } from "lucide-react"
import { toast } from "sonner"

type UploadEvidenceBlockProps = {
  accept: string
  label: string
  hint?: string
  /** Endpoint POST care primește FormData cu fișierul. */
  uploadEndpoint: string
  /** Câmpuri suplimentare in FormData (ex: parola cert .p12). */
  extraFields?: { name: string; label: string; type?: "text" | "password"; placeholder?: string; required?: boolean }[]
  /** Callback la upload success. */
  onUploaded: (result: Record<string, unknown>) => void
  maxSizeMb?: number
}

export function UploadEvidenceBlock({
  accept,
  label,
  hint,
  uploadEndpoint,
  extraFields = [],
  onUploaded,
  maxSizeMb = 10,
}: UploadEvidenceBlockProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [extraValues, setExtraValues] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleFile(f: File) {
    if (f.size > maxSizeMb * 1024 * 1024) {
      setError(`Fișier prea mare. Maxim ${maxSizeMb} MB.`)
      return
    }
    setError(null)
    setFile(f)
  }

  async function handleUpload() {
    if (!file) {
      setError("Selectează un fișier.")
      return
    }
    for (const f of extraFields) {
      if (f.required && !extraValues[f.name]?.trim()) {
        setError(`Completează câmpul „${f.label}”.`)
        return
      }
    }
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      for (const [k, v] of Object.entries(extraValues)) fd.append(k, v)
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || `Upload eșuat (${res.status}).`)
      }
      const result = (await res.json()) as Record<string, unknown>
      toast.success("Fișier încărcat + procesat cu succes.")
      onUploaded(result)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare upload."
      setError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-eos-lg border border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-eos-primary bg-eos-primary/[0.06]"
            : "border-eos-border-subtle bg-eos-surface-variant/40"
        }`}
      >
        {file ? (
          <>
            <CheckCircle2 className="size-6 text-eos-success" strokeWidth={1.5} />
            <p className="text-[12.5px] font-medium text-eos-text">{file.name}</p>
            <p className="font-mono text-[10px] text-eos-text-tertiary">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="font-mono text-[10px] text-eos-text-link underline hover:no-underline"
            >
              Alege alt fișier
            </button>
          </>
        ) : (
          <>
            <FileUp className="size-6 text-eos-text-muted" strokeWidth={1.5} />
            <p className="text-[12.5px] font-medium text-eos-text">{label}</p>
            {hint && (
              <p className="max-w-md text-[11px] leading-[1.5] text-eos-text-tertiary">{hint}</p>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-1 inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 text-[11.5px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              <Upload className="size-3" strokeWidth={2} />
              Alege fișier
            </button>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </>
        )}
      </div>

      {extraFields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            {f.label}
            {f.required && <span className="ml-1 text-eos-error">*</span>}
          </label>
          <input
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            value={extraValues[f.name] ?? ""}
            onChange={(e) => setExtraValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
            className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12.5px] text-eos-text outline-none focus:border-eos-primary"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => void handleUpload()}
        disabled={!file || uploading}
        className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Procesez fișierul…
          </>
        ) : (
          <>
            <Upload className="size-4" strokeWidth={2} />
            Salvează ca dovadă
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-2 rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
          <XCircle className="size-3.5" strokeWidth={2} />
          {error}
        </div>
      )}
    </div>
  )
}
