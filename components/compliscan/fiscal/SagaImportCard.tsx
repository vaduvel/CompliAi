"use client"

// Saga import card — Saga nu are REST API, deci doar drag-drop XML/ZIP cu
// detectare automată a formatului. Reutilizează endpoint-urile existing
// (/api/efactura/bulk-upload pentru ZIP, /api/fiscal/d406-upload pentru SAF-T).

import { useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, FileCode2, FileText, Loader2, Package } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { detectSagaExport, SAGA_EXPORT_STEPS } from "@/lib/integrations/saga-format-detect"
import type { BulkValidationSummary } from "@/lib/compliance/efactura-bulk-zip"

type DispatchResult =
  | { kind: "bulk-zip"; summary: BulkValidationSummary }
  | { kind: "saft"; period: string; hygieneScore: number }
  | { kind: "single-xml"; valid: boolean; errors: number; warnings: number }
  | { kind: "unsupported"; reason: string }

export function SagaImportCard() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<DispatchResult | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  async function handleFile(file: File | null) {
    if (!file) return
    setBusy(true)
    setResult(null)
    setErrMsg(null)

    try {
      // Pentru ZIP — direct bulk endpoint
      if (/\.zip$/i.test(file.name)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/efactura/bulk-upload", { method: "POST", body: fd })
        const data = (await res.json()) as { ok?: boolean; summary?: BulkValidationSummary; error?: string }
        if (!res.ok || !data.ok || !data.summary) {
          setErrMsg(data.error ?? "Bulk upload eșuat.")
          return
        }
        setResult({ kind: "bulk-zip", summary: data.summary })
        toast.success("ZIP procesat", {
          description: `${data.summary.validCount}/${data.summary.xmlFiles} valide.`,
        })
        return
      }

      // XML — detect tip
      if (/\.xml$/i.test(file.name)) {
        const xml = await file.text()
        const detection = detectSagaExport(file.name, xml)

        if (detection.recommendedHandler === "saft-parser") {
          const res = await fetch("/api/fiscal/d406-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ xml, fileName: file.name }),
          })
          const data = (await res.json()) as {
            ok?: boolean
            meta?: { period: string }
            hygiene?: { hygieneScore: number }
            errors?: string[]
          }
          if (!res.ok || !data.ok) {
            setErrMsg((data.errors ?? []).join("; ") || "Upload SAF-T eșuat.")
            return
          }
          setResult({
            kind: "saft",
            period: data.meta?.period ?? "—",
            hygieneScore: data.hygiene?.hygieneScore ?? 0,
          })
          toast.success(`SAF-T procesat — perioada ${data.meta?.period ?? "—"}`)
          return
        }

        if (detection.recommendedHandler === "efactura-validator") {
          const res = await fetch("/api/efactura/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentName: file.name, xml }),
          })
          const data = (await res.json()) as {
            error?: string
            validation?: { valid: boolean; errors: string[]; warnings: string[] }
          }
          if (!res.ok || !data.validation) {
            setErrMsg(data.error ?? "Validare eșuată.")
            return
          }
          setResult({
            kind: "single-xml",
            valid: data.validation.valid,
            errors: data.validation.errors.length,
            warnings: data.validation.warnings.length,
          })
          toast[data.validation.valid ? "success" : "warning"](
            data.validation.valid ? "XML valid" : "XML cu probleme",
            { description: `${data.validation.errors.length} erori · ${data.validation.warnings.length} warnings.` },
          )
          return
        }

        setResult({ kind: "unsupported", reason: detection.hint ?? "Format nerecunoscut." })
        return
      }

      // DBF / alt format
      setResult({
        kind: "unsupported",
        reason: "Doar XML și ZIP. Pentru DBF, exportă din Saga ca XML SAF-T sau UBL.",
      })
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : "Eroare la procesare.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <FileCode2 className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Import din Saga (drag-drop XML/ZIP)
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        Saga nu expune REST API. Exportă XML/ZIP din Saga și trage-l aici — detectăm automat tipul (e-Factura
        UBL sau SAF-T D406) și rulăm validatorul corespunzător.
      </p>

      {/* Workflow steps */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SAGA_EXPORT_STEPS.map((s) => (
          <div
            key={s.step}
            className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                Pas {s.step}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] font-semibold text-eos-text">{s.title}</p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-eos-text-muted">{s.detail}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void handleFile(e.dataTransfer.files?.[0] ?? null)
        }}
        onClick={() => inputRef.current?.click()}
        className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-eos-md border border-dashed border-eos-border-strong bg-eos-surface-variant px-4 py-8 text-center hover:bg-eos-secondary-hover"
      >
        {busy ? (
          <Loader2 className="size-6 animate-spin text-eos-primary" strokeWidth={2} />
        ) : (
          <Package className="size-6 text-eos-primary" strokeWidth={2} />
        )}
        <p className="text-[13px] font-semibold text-eos-text">
          {busy ? "Detectez formatul și procesez..." : "Trage XML sau ZIP din Saga aici"}
        </p>
        <p className="text-[11.5px] text-eos-text-muted">
          Acceptăm: UBL e-Factura XML, SAF-T D406 XML, ZIP cu mai multe XML-uri
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xml,.zip,application/xml,application/zip"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {errMsg && (
        <div className="mt-3 rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3 text-[12.5px] text-eos-error">
          <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
          {errMsg}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12.5px] text-eos-text">
          {result.kind === "bulk-zip" && (
            <>
              <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom text-eos-success" strokeWidth={2} />
              ZIP procesat: <strong>{result.summary.validCount}</strong> valide ·{" "}
              <strong>{result.summary.invalidCount}</strong> invalide ·{" "}
              <strong>{result.summary.errorCount}</strong> erori. Detalii pe tab-ul Validator XML.
            </>
          )}
          {result.kind === "saft" && (
            <>
              <FileText className="mr-1 inline size-3.5 align-text-bottom text-eos-success" strokeWidth={2} />
              SAF-T procesat — perioada <strong>{result.period}</strong>, scor de igienă{" "}
              <strong>{result.hygieneScore}/100</strong>. Detalii pe tab-ul SAF-T Hygiene.
            </>
          )}
          {result.kind === "single-xml" && (
            <>
              <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom text-eos-success" strokeWidth={2} />
              {result.valid ? "XML validat OK" : "XML cu probleme"} ·{" "}
              <strong>{result.errors}</strong> erori · <strong>{result.warnings}</strong> warnings.
            </>
          )}
          {result.kind === "unsupported" && (
            <>
              <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom text-eos-warning" strokeWidth={2} />
              {result.reason}
            </>
          )}
        </div>
      )}
    </section>
  )
}
