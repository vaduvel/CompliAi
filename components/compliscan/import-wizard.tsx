"use client"

import { useCallback, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card } from "@/components/evidence-os/Card"
import type { ImportColumnId, ImportParseResult, ImportRowParsed } from "@/lib/server/import-parser"
import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"

// ── Types ────────────────────────────────────────────────────────────────────

type WizardStep = "upload" | "mapping" | "review" | "progress"

type AnafPrefillResult = {
  cui: string
  status: "ok" | "not_found" | "error"
  prefill: OrgProfilePrefill | null
}

type ImportExecuteResult = {
  ok: boolean
  orgId?: string
  orgName: string
  tags?: string[]
  error?: string
}

const COLUMN_LABELS: Record<ImportColumnId, string> = {
  orgName: "Nume firmă",
  cui: "CUI / Cod fiscal",
  sector: "Sector / Domeniu",
  employeeCount: "Nr. angajați",
  email: "Email contact",
  website: "Website",
}

// ── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({
  onFileSelected,
  loading,
  error,
}: {
  onFileSelected: (file: File) => void
  loading: boolean
  error: string | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  return (
    <div className="space-y-4">
      <div
        className={`flex flex-col items-center justify-center rounded-eos-lg border-2 border-dashed px-6 py-12 transition ${
          dragOver
            ? "border-eos-primary bg-eos-primary-soft"
            : "border-eos-border-subtle bg-eos-bg-inset"
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <FileSpreadsheet className="mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
        <p className="text-sm font-medium text-eos-text">
          Trage fișierul aici sau click pentru a alege
        </p>
        <p className="mt-1 text-xs text-eos-text-muted">
          Formate acceptate: .xlsx, .xls, .csv — maxim 200 rânduri
        </p>
        <Button
          size="sm"
          variant="outline"
          className="mt-4 gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="size-4" strokeWidth={2} />
          )}
          {loading ? "Se procesează..." : "Alege fișier"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFileSelected(file)
          }}
        />
      </div>

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
          {error}
        </div>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">Coloanele sunt detectate automat</p>
        <p className="mt-1">
          Putem detecta: Nume firmă, CUI, Sector, Nr. angajați, Email contact — indiferent
          de cum sunt numite coloanele în fișierul tău.
        </p>
      </div>
    </div>
  )
}

// ── Step 2: Mapping ──────────────────────────────────────────────────────────

function MappingStep({
  parseResult,
  mapping,
  onUpdateMapping,
}: {
  parseResult: ImportParseResult
  mapping: Record<ImportColumnId, number | null>
  onUpdateMapping: (colId: ImportColumnId, headerIndex: number | null) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge
          variant={parseResult.mappingConfidence === "high" ? "success" : parseResult.mappingConfidence === "medium" ? "warning" : "destructive"}
        >
          Încredere: {parseResult.mappingConfidence}
        </Badge>
        <span className="text-xs text-eos-text-muted">
          {parseResult.totalRows} rânduri detectate
        </span>
      </div>

      <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
        {(Object.keys(COLUMN_LABELS) as ImportColumnId[]).map((colId) => (
          <div key={colId} className="flex items-center gap-4 px-4 py-3">
            <div className="w-36 shrink-0">
              <span className="text-sm font-medium text-eos-text">{COLUMN_LABELS[colId]}</span>
              {colId === "orgName" && (
                <span className="ml-1 text-[10px] text-eos-error">*</span>
              )}
            </div>
            <select
              value={mapping[colId] ?? ""}
              onChange={(e) =>
                onUpdateMapping(colId, e.target.value === "" ? null : Number(e.target.value))
              }
              className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text focus:outline-none"
            >
              <option value="">— nu mapează —</option>
              {parseResult.headers.map((header, idx) => (
                <option key={idx} value={idx}>
                  {header}
                </option>
              ))}
            </select>
            {mapping[colId] !== null && (
              <Check className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
            )}
          </div>
        ))}
      </Card>

      {parseResult.unmappedHeaders.length > 0 && (
        <p className="text-xs text-eos-text-muted">
          Coloane ignorate: {parseResult.unmappedHeaders.join(", ")}
        </p>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-3">
        <p className="text-xs font-medium text-eos-text">Preview primele 3 rânduri:</p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-eos-border-subtle">
                {(Object.keys(COLUMN_LABELS) as ImportColumnId[])
                  .filter((id) => mapping[id] !== null)
                  .map((id) => (
                    <th key={id} className="px-2 py-1.5 text-left font-medium text-eos-text-muted">
                      {COLUMN_LABELS[id]}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {parseResult.rows.slice(0, 3).map((row) => (
                <tr key={row.rowIndex} className="border-b border-eos-border-subtle last:border-0">
                  {(Object.keys(COLUMN_LABELS) as ImportColumnId[])
                    .filter((id) => mapping[id] !== null)
                    .map((id) => (
                      <td key={id} className="px-2 py-1.5 text-eos-text">
                        {id === "orgName" ? row.orgName
                          : id === "cui" ? row.cui ?? ""
                          : id === "sector" ? row.sector ?? row.sectorRaw ?? ""
                          : id === "employeeCount" ? row.employeeCount ?? row.employeeCountRaw ?? ""
                          : id === "email" ? row.email ?? ""
                          : ""}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Review ───────────────────────────────────────────────────────────

function ReviewStep({
  rows,
  excluded,
  onToggle,
}: {
  rows: ImportRowParsed[]
  excluded: Set<number>
  onToggle: (idx: number) => void
}) {
  const valid = rows.filter((r) => r.errors.length === 0 && !excluded.has(r.rowIndex))
  const withWarnings = rows.filter(
    (r) => r.warnings.length > 0 && r.errors.length === 0 && !excluded.has(r.rowIndex)
  )
  const withErrors = rows.filter((r) => r.errors.length > 0)
  const excludedRows = rows.filter((r) => excluded.has(r.rowIndex) && r.errors.length === 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-eos-success">{valid.length}</p>
          <p className="text-[10px] text-eos-text-muted">De importat</p>
        </div>
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-eos-warning">{withWarnings.length}</p>
          <p className="text-[10px] text-eos-text-muted">Cu avertismente</p>
        </div>
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-eos-error">{withErrors.length}</p>
          <p className="text-[10px] text-eos-text-muted">Cu erori</p>
        </div>
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-3 py-2.5 text-center">
          <p className="text-lg font-semibold text-eos-text-muted">{excludedRows.length}</p>
          <p className="text-[10px] text-eos-text-muted">Excluse</p>
        </div>
      </div>

      <Card className="max-h-[400px] divide-y divide-eos-border-subtle overflow-y-auto border-eos-border bg-eos-surface">
        {rows.map((row) => {
          const hasErrors = row.errors.length > 0
          const isExcluded = excluded.has(row.rowIndex)
          return (
            <div
              key={row.rowIndex}
              className={`flex items-start gap-3 px-4 py-3 ${
                hasErrors ? "bg-eos-error-soft/30" : isExcluded ? "opacity-50" : ""
              }`}
            >
              {!hasErrors && (
                <button
                  type="button"
                  onClick={() => onToggle(row.rowIndex)}
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition ${
                    isExcluded
                      ? "border-eos-border bg-eos-bg-inset"
                      : "border-eos-primary bg-eos-primary text-white"
                  }`}
                >
                  {!isExcluded && <Check className="size-3" strokeWidth={3} />}
                </button>
              )}
              {hasErrors && (
                <XCircle className="mt-0.5 size-5 shrink-0 text-eos-error" strokeWidth={2} />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-eos-text">
                    {row.orgName || "(fără nume)"}
                  </span>
                  {row.cuiNormalized && (
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                      {row.cuiNormalized}
                    </Badge>
                  )}
                  {row.sector && (
                    <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                      {row.sector}
                    </Badge>
                  )}
                  {row.isDuplicate && (
                    <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
                      Duplicat
                    </Badge>
                  )}
                </div>

                {row.email && (
                  <p className="mt-0.5 text-xs text-eos-text-muted">{row.email}</p>
                )}

                {row.errors.map((err, i) => (
                  <p key={i} className="mt-1 text-xs text-eos-error">{err}</p>
                ))}
                {row.warnings.map((warn, i) => (
                  <p key={i} className="mt-1 text-xs text-eos-warning">{warn}</p>
                ))}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}

// ── Step 4: Progress ─────────────────────────────────────────────────────────

function ProgressStep({
  results,
  anafResults,
  importing,
  scanningCount,
  totalToScan,
}: {
  results: ImportExecuteResult[]
  anafResults: AnafPrefillResult[]
  importing: boolean
  scanningCount: number
  totalToScan: number
}) {
  const successful = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  if (importing) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <Loader2 className="size-8 animate-spin text-eos-primary" strokeWidth={2} />
        <div className="text-center">
          <p className="text-sm font-medium text-eos-text">
            {scanningCount > 0 ? `Se scanează firmele (${scanningCount}/${totalToScan})...` : "Se importă firmele..."}
          </p>
          <p className="mt-1 text-xs text-eos-text-muted">
            {scanningCount > 0 
              ? "Pregătim baseline-ul de conformitate pentru fiecare firmă (ANAF, E-Factura, Website)."
              : results.length > 0
                ? `${successful.length} importate, ${failed.length} erori`
                : "Se creează organizațiile și se rulează applicability..."}
          </p>
          {anafResults.length > 0 && scanningCount === 0 && (
            <p className="mt-1 text-xs text-eos-text-muted">
              ANAF prefill: {anafResults.filter((r) => r.status === "ok").length}/{anafResults.length} completat
            </p>
          )}
          {scanningCount > 0 && (
            <div className="mx-auto mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-eos-bg-inset">
              <div 
                className="h-full bg-eos-primary transition-all duration-500" 
                style={{ width: `${(scanningCount / totalToScan) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-eos-lg border border-eos-success/30 bg-eos-success-soft px-5 py-4">
        <CheckCircle2 className="size-6 text-eos-success" strokeWidth={2} />
        <div>
          <p className="text-sm font-semibold text-eos-text">
            {successful.length} firme importate cu succes
          </p>
          {failed.length > 0 && (
            <p className="text-xs text-eos-error">{failed.length} erori</p>
          )}
        </div>
      </div>

      <Card className="max-h-[350px] divide-y divide-eos-border-subtle overflow-y-auto border-eos-border bg-eos-surface">
        {results.map((result, idx) => (
          <div key={idx} className="flex items-center gap-3 px-4 py-2.5">
            {result.ok ? (
              <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
            ) : (
              <XCircle className="size-4 shrink-0 text-eos-error" strokeWidth={2} />
            )}
            <div className="min-w-0 flex-1">
              <span className="text-sm text-eos-text">{result.orgName}</span>
              {result.ok && result.tags && result.tags.length > 0 && (
                <span className="ml-2 text-[10px] text-eos-text-muted">
                  {result.tags.join(", ")}
                </span>
              )}
              {!result.ok && result.error && (
                <p className="text-xs text-eos-error">{result.error}</p>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ── Main Wizard ──────────────────────────────────────────────────────────────

export function ImportWizard({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<WizardStep>("upload")
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null)
  const [mapping, setMapping] = useState<Record<ImportColumnId, number | null>>({
    orgName: null,
    cui: null,
    sector: null,
    employeeCount: null,
    email: null,
    website: null,
  })
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportExecuteResult[]>([])
  const [anafResults, setAnafResults] = useState<AnafPrefillResult[]>([])
  const [scanningCount, setScanningCount] = useState(0)
  const [totalToScan, setTotalToScan] = useState(0)

  const handleFileSelected = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/partner/import/preview", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error ?? "Eroare la procesarea fișierului.")
      }

      const result = (await response.json()) as ImportParseResult
      setParseResult(result)
      setMapping(result.mapping)

      // Auto-exclude rows with errors and duplicates
      const autoExclude = new Set<number>()
      for (const row of result.rows) {
        if (row.isDuplicate) autoExclude.add(row.rowIndex)
      }
      setExcluded(autoExclude)

      setStep("mapping")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }, [])

  function handleUpdateMapping(colId: ImportColumnId, headerIndex: number | null) {
    setMapping((prev) => ({ ...prev, [colId]: headerIndex }))
  }

  function handleToggleRow(rowIndex: number) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }

  async function handleExecuteImport() {
    if (!parseResult) return
    setImporting(true)
    setStep("progress")
    setImportResults([])
    setAnafResults([])

    const rowsToImport = parseResult.rows.filter(
      (r) => r.errors.length === 0 && !excluded.has(r.rowIndex)
    )

    // Phase 1: ANAF prefill for rows with CUI
    const cuisToLookup = rowsToImport
      .filter((r) => r.cuiNormalized)
      .map((r) => r.cuiNormalized!)

    if (cuisToLookup.length > 0) {
      try {
        const prefillRes = await fetch("/api/partner/import/anaf-prefill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cuis: cuisToLookup }),
        })
        if (prefillRes.ok) {
          const prefillData = (await prefillRes.json()) as { results: AnafPrefillResult[] }
          setAnafResults(prefillData.results)
        }
      } catch {
        // ANAF prefill is best-effort, continue import
      }
    }

    // Phase 2: Execute import
    const confirmedRows = rowsToImport.map((row) => ({
      orgName: row.orgName,
      cui: row.cuiNormalized,
      sector: row.sector,
      employeeCount: row.employeeCount,
      email: row.email,
      website: row.website,
    }))

    try {
      const response = await fetch("/api/partner/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: confirmedRows }),
      })

      const data = (await response.json()) as {
        results?: Array<{ ok: boolean; orgId?: string; orgName: string; tags?: string[]; error?: string }>
        error?: string
      }

      let createdResults: ImportExecuteResult[] = []
      if (!response.ok) {
        const errMsg = data.error ?? `Eroare server (${response.status})`
        createdResults = confirmedRows.map((r) => ({ ok: false, orgName: r.orgName, error: errMsg }))
        setImportResults(createdResults)
      } else {
        createdResults = data.results ?? []
        setImportResults(createdResults)
      }

      // Phase 3: Sequential baseline scan — ANAF lookup + intake findings per org
      const successfulOrgs = createdResults.filter(r => r.ok && r.orgId)
      if (successfulOrgs.length > 0) {
        setTotalToScan(successfulOrgs.length)
        setScanningCount(0)

        for (let i = 0; i < successfulOrgs.length; i++) {
          const org = successfulOrgs[i]
          const matchedRow = confirmedRows.find(r => r.orgName === org.orgName)
          try {
            setScanningCount(i + 1)
            await fetch("/api/partner/import/baseline-scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orgId: org.orgId,
                cui: matchedRow?.cui ?? null,
                website: matchedRow?.website ?? null,
              }),
            })
          } catch (e) {
            console.error(`Baseline scan failed for ${org.orgName}`, e)
          }
        }
      }
    } catch {
      setImportResults([{ ok: false, orgName: "Import", error: "Eroare de rețea" }])
    } finally {
      setImporting(false)
    }
  }

  const activeRowCount = parseResult
    ? parseResult.rows.filter((r) => r.errors.length === 0 && !excluded.has(r.rowIndex)).length
    : 0

  const steps: { key: WizardStep; label: string }[] = [
    { key: "upload", label: "1. Încarcă" },
    { key: "mapping", label: "2. Mapare" },
    { key: "review", label: "3. Verifică" },
    { key: "progress", label: "4. Import" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-eos-xl border border-eos-border bg-eos-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-eos-border-subtle px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-eos-text">Import firme</h2>
            <p className="text-xs text-eos-text-muted">
              Excel sau CSV — detectăm coloanele automat
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-eos-md text-eos-text-muted hover:bg-eos-bg-inset hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex border-b border-eos-border-subtle">
          {steps.map((s) => (
            <div
              key={s.key}
              className={`flex-1 px-4 py-2.5 text-center text-[11px] font-medium ${
                s.key === step
                  ? "border-b-2 border-eos-primary text-eos-primary"
                  : "text-eos-text-muted"
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === "upload" && (
            <UploadStep
              onFileSelected={(file) => void handleFileSelected(file)}
              loading={loading}
              error={error}
            />
          )}
          {step === "mapping" && parseResult && (
            <MappingStep
              parseResult={parseResult}
              mapping={mapping}
              onUpdateMapping={handleUpdateMapping}
            />
          )}
          {step === "review" && parseResult && (
            <ReviewStep
              rows={parseResult.rows}
              excluded={excluded}
              onToggle={handleToggleRow}
            />
          )}
          {step === "progress" && (
            <ProgressStep
              results={importResults}
              anafResults={anafResults}
              importing={importing}
              scanningCount={scanningCount}
              totalToScan={totalToScan}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-eos-border-subtle px-6 py-4">
          <div>
            {step === "mapping" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep("upload")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" strokeWidth={2} />
                Înapoi
              </Button>
            )}
            {step === "review" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setStep("mapping")}
                className="gap-2"
              >
                <ArrowLeft className="size-4" strokeWidth={2} />
                Înapoi
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step !== "progress" && (
              <Button size="sm" variant="ghost" onClick={onClose}>
                Anulează
              </Button>
            )}

            {step === "mapping" && (
              <Button
                size="sm"
                onClick={() => setStep("review")}
                disabled={mapping.orgName === null}
                className="gap-2"
              >
                Verifică rândurile
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            )}

            {step === "review" && (
              <Button
                size="sm"
                onClick={() => void handleExecuteImport()}
                disabled={activeRowCount === 0}
                className="gap-2"
              >
                <Upload className="size-4" strokeWidth={2} />
                Importă {activeRowCount} firme
              </Button>
            )}

            {step === "progress" && !importing && (
              <Button
                size="sm"
                onClick={() => {
                  onSuccess()
                  onClose()
                }}
                className="gap-2"
              >
                <Check className="size-4" strokeWidth={2} />
                Închide
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
