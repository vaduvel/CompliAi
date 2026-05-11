"use client"

// Saga import card — drag-drop XML/ZIP cu detecție automată format.
// Pattern: Saga nu are REST API, dar exportă 3 formate XML diferite —
// Saga native (Antet/Detalii/Sumar), UBL CIUS-RO (din TEMP\Facturi), și
// SAF-T D406. Endpoint-ul /api/integrations/saga/upload procesează Saga
// native; restul rutate la endpoint-urile existing.

import { useRef, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  FileText,
  Loader2,
  Package,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { detectSagaExport, SAGA_EXPORT_STEPS } from "@/lib/integrations/saga-format-detect"
import type { BulkValidationSummary } from "@/lib/compliance/efactura-bulk-zip"

type SagaResultPerFile = {
  fileName: string
  detectedAs: string
  ok: boolean
  parserErrors: string[]
  parserWarnings: string[]
  validationFindings: Array<{ code: string; severity: "error" | "warning"; message: string }>
  invoice: {
    number: string
    date: string
    supplierName: string
    supplierCif: string
    customerName: string
    customerCif: string
    grandTotal: number
    efacturaSubmitted: boolean
  } | null
}

type SagaUploadSummary = {
  totalFiles: number
  sagaNativeCount: number
  ublCount: number
  saftCount: number
  unknownCount: number
  validInvoices: number
  invalidInvoices: number
  totalErrors: number
  totalWarnings: number
  results: SagaResultPerFile[]
  durationMs: number
}

type DispatchResult =
  | { kind: "saga-native"; summary: SagaUploadSummary }
  | { kind: "bulk-zip"; summary: BulkValidationSummary }
  | { kind: "saft"; period: string; hygieneScore: number }
  | { kind: "single-xml"; valid: boolean; errors: number; warnings: number }
  | { kind: "unsupported"; reason: string }

const RESULT_TONE: Record<"valid" | "invalid" | "error" | "warning", string> = {
  valid: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  invalid: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  error: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  warning: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
}

export function SagaImportCard() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<DispatchResult | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  async function uploadToSagaEndpoint(file: File) {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/integrations/saga/upload", { method: "POST", body: fd })
    const data = (await res.json()) as {
      ok?: boolean
      summary?: SagaUploadSummary
      error?: string
    }
    if (!res.ok || !data.ok || !data.summary) {
      setErrMsg(data.error ?? "Saga upload eșuat.")
      return null
    }
    return data.summary
  }

  async function handleFile(file: File | null) {
    if (!file) return
    setBusy(true)
    setResult(null)
    setErrMsg(null)

    try {
      // ZIP — trimitem la Saga endpoint pentru detect + parse mix
      if (/\.zip$/i.test(file.name)) {
        const summary = await uploadToSagaEndpoint(file)
        if (!summary) return

        // Dacă conține predominant UBL non-Saga, sugerăm bulk validator
        if (summary.sagaNativeCount === 0 && summary.ublCount > 0) {
          // Re-upload la bulk e-Factura
          const fd = new FormData()
          fd.append("file", file)
          const res = await fetch("/api/efactura/bulk-upload", { method: "POST", body: fd })
          const data = (await res.json()) as {
            ok?: boolean
            summary?: BulkValidationSummary
            error?: string
          }
          if (data.ok && data.summary) {
            setResult({ kind: "bulk-zip", summary: data.summary })
            toast.success("ZIP UBL procesat", {
              description: `${data.summary.validCount}/${data.summary.xmlFiles} valide.`,
            })
            return
          }
        }

        setResult({ kind: "saga-native", summary })
        toast.success("ZIP Saga procesat", {
          description: `${summary.sagaNativeCount} Saga native, ${summary.ublCount} UBL, ${summary.saftCount} SAF-T.`,
        })
        return
      }

      // XML individual — detect tip
      if (/\.xml$/i.test(file.name)) {
        const xml = await file.text()
        const detection = detectSagaExport(file.name, xml)

        if (detection.recommendedHandler === "saga-native-parser") {
          const summary = await uploadToSagaEndpoint(file)
          if (summary) {
            setResult({ kind: "saga-native", summary })
            const r = summary.results[0]
            toast[r?.ok ? "success" : "warning"](
              r?.ok ? "Factură Saga validată" : "Factură Saga cu probleme",
              {
                description: r?.invoice
                  ? `${r.invoice.number} · ${r.invoice.grandTotal.toFixed(2)} RON`
                  : `${summary.totalErrors} erori, ${summary.totalWarnings} warnings`,
              },
            )
          }
          return
        }

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
            {
              description: `${data.validation.errors.length} erori · ${data.validation.warnings.length} warnings.`,
            },
          )
          return
        }

        setResult({ kind: "unsupported", reason: detection.hint ?? "Format nerecunoscut." })
        return
      }

      // DBF / alt format
      setResult({
        kind: "unsupported",
        reason: "Doar XML și ZIP. Pentru DBF, exportă din Saga ca XML (Saga native, UBL sau SAF-T).",
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
        Saga nu expune REST API — are 3 formate XML: Saga native (
        <code className="rounded bg-eos-surface-elevated px-1 font-mono text-[11px]">F_&lt;cif&gt;_&lt;num&gt;_&lt;data&gt;.xml</code>
        ) cu Antet/Detalii/Sumar, UBL CIUS-RO (din{" "}
        <code className="rounded bg-eos-surface-elevated px-1 font-mono text-[11px]">TEMP\Facturi</code>
        ), și SAF-T D406. Detectăm automat tipul.
      </p>

      {/* Workflow steps */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {SAGA_EXPORT_STEPS.map((s) => (
          <div
            key={s.step}
            className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3"
          >
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Pas {s.step}
            </span>
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
          Acceptăm: Saga native (F_*.xml), UBL CIUS-RO XML, SAF-T D406 XML, ZIP cu mai multe
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

      {result && result.kind === "saga-native" && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-3 py-2 text-eos-success">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Saga native</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">
                {result.summary.sagaNativeCount}
              </p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-eos-text">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">UBL</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{result.summary.ublCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 text-eos-text">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">SAF-T</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{result.summary.saftCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-eos-error">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Cu probleme</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">
                {result.summary.invalidInvoices}
              </p>
            </div>
          </div>

          {result.summary.results.length > 0 && (
            <div className="overflow-x-auto rounded-eos-md border border-eos-border">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                    <th className="px-3 py-2">Fișier</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">Factură</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.summary.results.map((r) => {
                    const cls = !r.ok ? "invalid" : "valid"
                    const Icon = r.ok ? CheckCircle2 : XCircle
                    return (
                      <tr key={r.fileName} className="border-b border-eos-border/50">
                        <td className="px-3 py-2 font-mono text-[12px] text-eos-text">{r.fileName}</td>
                        <td className="px-3 py-2 font-mono text-[10.5px] text-eos-text-muted">
                          {r.detectedAs}
                        </td>
                        <td className="px-3 py-2 text-eos-text-muted">
                          {r.invoice ? (
                            <span>
                              {r.invoice.number}
                              <span className="block text-[10.5px] text-eos-text-tertiary">
                                {r.invoice.supplierName} → {r.invoice.customerName}
                              </span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-eos-text">
                          {r.invoice ? r.invoice.grandTotal.toFixed(2) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] uppercase ${RESULT_TONE[cls]}`}
                          >
                            <Icon className="size-3" strokeWidth={2} />
                            {r.ok ? "OK" : "Probleme"}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result.summary.unknownCount > 0 && (
            <p className="text-[11.5px] text-eos-text-muted">
              {result.summary.unknownCount} fișier(e) cu format nerecunoscut. Verifică manual sau
              folosește alt tab (Validator XML pentru UBL, SAF-T Hygiene pentru D406).
            </p>
          )}
        </div>
      )}

      {result && result.kind === "bulk-zip" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-3 py-2 text-eos-success">
            <p className="font-mono text-[10px] uppercase">Valide UBL</p>
            <p className="mt-0.5 font-display text-[18px] font-semibold">
              {result.summary.validCount}
            </p>
          </div>
          <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-eos-error">
            <p className="font-mono text-[10px] uppercase">Invalide</p>
            <p className="mt-0.5 font-display text-[18px] font-semibold">
              {result.summary.invalidCount}
            </p>
          </div>
          <div className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-eos-warning">
            <p className="font-mono text-[10px] uppercase">Erori</p>
            <p className="mt-0.5 font-display text-[18px] font-semibold">
              {result.summary.errorCount}
            </p>
          </div>
        </div>
      )}

      {result && result.kind === "saft" && (
        <div className="mt-4 rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12.5px] text-eos-text">
          <FileText className="mr-1 inline size-3.5 align-text-bottom text-eos-success" strokeWidth={2} />
          SAF-T procesat — perioada <strong>{result.period}</strong>, scor de igienă{" "}
          <strong>{result.hygieneScore}/100</strong>. Detalii pe tab-ul SAF-T Hygiene.
        </div>
      )}

      {result && result.kind === "single-xml" && (
        <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-surface p-3 text-[12.5px] text-eos-text">
          <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom text-eos-success" strokeWidth={2} />
          {result.valid ? "XML UBL valid" : "XML UBL cu probleme"} ·{" "}
          <strong>{result.errors}</strong> erori · <strong>{result.warnings}</strong> warnings.
        </div>
      )}

      {result && result.kind === "unsupported" && (
        <div className="mt-4 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12.5px] text-eos-text">
          <AlertTriangle className="mr-1 inline size-3.5 align-text-bottom text-eos-warning" strokeWidth={2} />
          {result.reason}
        </div>
      )}
    </section>
  )
}
