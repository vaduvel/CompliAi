"use client"

// F#3 SPV Duplicate Detector UI Card.
// Mircea fix (2026-05-11): featurea era lib-only, invizibilă pentru user.
// Cabinetul vrea să detecteze facturi duplicate în SPV ANAF (bug ANAF cunoscut:
// aceeași factură apare 96+ ori cu ID-uri diferite). Cabinet poate uploada
// CSV/JSON lista de upload-uri SPV și obține grup duplicate cu recomandare keep.

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Copy, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import {
  detectSpvDuplicates,
  type DedupResult,
  type SpvInvoiceRow,
} from "@/lib/compliance/spv-duplicate-detector"

const DEMO_JSON = JSON.stringify(
  [
    {
      spvUploadId: "SPV-2026-04-001",
      invoiceNumber: "F2026-100",
      supplierCif: "RO11223344",
      issueDateISO: "2026-04-15",
      totalAmount: 1190,
      receivedAtISO: "2026-04-16T08:00:00.000Z",
    },
    {
      spvUploadId: "SPV-2026-04-099",
      invoiceNumber: "F-100",
      supplierCif: "RO11223344",
      issueDateISO: "2026-04-15",
      totalAmount: 1190,
      receivedAtISO: "2026-04-22T11:30:00.000Z",
    },
    {
      spvUploadId: "SPV-2026-04-150",
      invoiceNumber: "F2026-101",
      supplierCif: "RO11223344",
      issueDateISO: "2026-04-18",
      totalAmount: 595,
      receivedAtISO: "2026-04-19T09:00:00.000Z",
    },
  ],
  null,
  2,
)

export function SpvDuplicateDetectorCard() {
  const [input, setInput] = useState(DEMO_JSON)
  const [fuzzy, setFuzzy] = useState(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<DedupResult | null>(null)

  function runDetection() {
    setBusy(true)
    try {
      const parsed = JSON.parse(input) as SpvInvoiceRow[]
      if (!Array.isArray(parsed)) throw new Error("JSON-ul trebuie să fie un array.")
      const r = detectSpvDuplicates(parsed, { fuzzy })
      setResult(r)
      if (r.duplicateGroups.length === 0) {
        toast.success(
          `Niciun duplicat detectat în ${r.totalRows} upload-uri SPV (${r.uniqueInvoices} facturi unice).`,
        )
      } else {
        toast.warning(
          `${r.duplicateGroups.length} grupuri duplicate (${r.duplicateRowsCount} upload-uri redundante de exclus).`,
        )
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "JSON invalid sau parse eșuat.")
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p className="flex items-start gap-2">
          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-eos-primary" strokeWidth={2} />
          <span>
            <strong>Detector duplicate SPV (F#3):</strong> bug ANAF cunoscut — aceeași
            factură poate apărea de mai multe ori în SPV cu ID-uri upload diferite,
            inflando TVA dedus / colectat. Detector caută grupuri cu același{" "}
            <strong>invoiceNumber + CIF furnizor + dată emitere</strong>. Mode fuzzy
            normalizează prefixe (F-123 ≡ F 123 ≡ Fac 123 ≡ FCT-00123). Recomandă care
            upload e originalul (primit primul) și care sunt redundante.
          </span>
        </p>
      </section>

      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
        <p
          data-display-text="true"
          className="mb-3 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Lipește lista upload-uri SPV (JSON)
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={8}
          className="w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[11px] text-eos-text outline-none focus:border-eos-border-strong"
          placeholder="[ { spvUploadId, invoiceNumber, supplierCif, issueDateISO, totalAmount, receivedAtISO } ]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={runDetection} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Detectează duplicate
          </Button>

          <label className="flex cursor-pointer items-center gap-2 text-[11.5px] text-eos-text-muted">
            <input
              type="checkbox"
              checked={fuzzy}
              onChange={(e) => setFuzzy(e.target.checked)}
              className="size-3.5"
            />
            Fuzzy match (F-123 ≡ Fac 123 ≡ FCT-00123)
          </label>
        </div>
      </section>

      {result && (
        <section className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Total upload-uri" value={String(result.totalRows)} tone="text-eos-text" />
            <Stat label="Facturi unice" value={String(result.uniqueInvoices)} tone="text-eos-success" />
            <Stat
              label="Upload-uri redundante"
              value={String(result.duplicateRowsCount)}
              tone={result.duplicateRowsCount > 0 ? "text-eos-error" : "text-eos-text-muted"}
            />
          </div>

          {result.duplicateGroups.length === 0 ? (
            <div className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12.5px] text-eos-success">
              <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
              Niciun duplicat detectat în upload-urile analizate.
            </div>
          ) : (
            <ul className="space-y-2">
              {result.duplicateGroups.map((g) => (
                <li
                  key={g.key}
                  className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className="mt-0.5 size-4 shrink-0 text-eos-error"
                      strokeWidth={2}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        data-display-text="true"
                        className="font-display text-[12.5px] font-semibold tracking-[-0.015em] text-eos-text"
                      >
                        {g.invoiceNumber} · CIF {g.supplierCif} · {g.issueDateISO} ·{" "}
                        <span className="text-eos-error">{g.count} upload-uri</span>
                      </p>
                      <p className="mt-1 text-[11.5px] text-eos-text">
                        <strong>Păstrează:</strong>{" "}
                        <code className="rounded-sm bg-eos-surface px-1 py-0.5 font-mono text-[10.5px]">
                          {g.recommendedKeepUploadId}
                        </code>{" "}
                        (primit primul)
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-eos-text-muted">
                        <span>Exclude din calcule fiscale:</span>
                        {g.duplicateUploadIds.map((id) => (
                          <code
                            key={id}
                            className="rounded-sm border border-eos-border bg-eos-surface px-1 py-0.5 font-mono text-[10px]"
                          >
                            {id}
                          </code>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(g.duplicateUploadIds.join(", "))
                            toast.success("ID-uri copiate")
                          }}
                          className="inline-flex items-center gap-1 text-eos-text-link hover:underline"
                        >
                          <Copy className="size-3" strokeWidth={2} /> copy
                        </button>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <p className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft p-2.5 text-[11px] text-eos-text">
            <strong>CECCAR Art. 14:</strong> AI detectează — contabilul confirmă manual înainte
            de a exclude upload-uri din TVA dedus/colectat. Sistemul e informativ, nu
            decisiv.
          </p>
        </section>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
        {label}
      </p>
      <p className={`mt-0.5 font-display text-[18px] font-semibold ${tone}`}>{value}</p>
    </div>
  )
}
