"use client"

// PatternAAutoApprove — Pattern A din taxonomia fiscală (auto-approve).
//
// Aplicabilitate:
//   • EF-003 — Factură respinsă ANAF (safe-code list lock-uită)
//   • EF-006 — Date client invalide (cu auto-fix CUI lookup ANAF API)
//
// Flow:
//   1. Fetch XML original al facturii din finding metadata (sau prompt user upload)
//   2. POST /api/efactura/repair cu codurile de eroare → primește repairedXml + appliedFixes
//   3. Show XmlDiffViewer pentru transparență
//   4. Disclaimer CECCAR Art. 14 (obligatoriu pentru auto-fix)
//   5. ResolveCTAButton chain:
//      - validate XML reparat (locally)
//      - submit la ANAF SPV (sandbox/prod în funcție de mode)
//      - wait status confirmation (max 30s)
//      - save evidence to dosar (XML + ANAF response + audit entry)
//      - mark finding as "resolved"
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import { Loader2, RefreshCw, Wand2 } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"
import { XmlDiffViewer } from "@/components/compliscan/fiscal/resolve/XmlDiffViewer"
import {
  ResolveCTAButton,
  type ChainStep,
} from "@/components/compliscan/fiscal/resolve/ResolveCTAButton"

type RepairContext = {
  originalXml: string
  repairedXml: string
  errorCodes: string[]
  documentName: string
  findingId: string
  submitId?: string
  statusOk?: boolean
}

type PatternAProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternAAutoApprove({ finding, onResolved }: PatternAProps) {
  const [originalXml, setOriginalXml] = useState<string>("")
  const [repairedXml, setRepairedXml] = useState<string>("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [hasAutoFixSafe, setHasAutoFixSafe] = useState(false)

  // Extract error codes from finding for repair call.
  const errorCodes = extractErrorCodes(finding)
  const documentName =
    extractDocumentName(finding) ?? `factura-${finding.id.slice(0, 8)}.xml`

  useEffect(() => {
    if (!finding) return
    setPreviewLoading(true)
    setPreviewError(null)
    void (async () => {
      try {
        // 1. Try to load original XML from finding metadata (e.g., from
        //    state.efacturaValidations or attached evidence).
        const origRes = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/xml`, {
          cache: "no-store",
        })
        let origXml = ""
        if (origRes.ok) {
          const data = (await origRes.json()) as { xml?: string }
          origXml = data.xml ?? ""
        }

        if (!origXml) {
          setPreviewError(
            "XML-ul facturii nu e disponibil în finding. Folosește validatorul XML pentru a urca manual și rezolvă acolo.",
          )
          setPreviewLoading(false)
          return
        }
        setOriginalXml(origXml)

        // 2. POST repair to get preview
        const repairRes = await fetch("/api/efactura/repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName,
            xml: origXml,
            errorCodes,
          }),
        })
        if (!repairRes.ok) {
          throw new Error("Repair endpoint a returnat eroare.")
        }
        const repairData = (await repairRes.json()) as {
          repair?: {
            repairedXml: string
            canAutoFix: boolean
            appliedFixes: { errorCode: string }[]
          }
        }
        if (repairData.repair) {
          setRepairedXml(repairData.repair.repairedXml)
          setHasAutoFixSafe(repairData.repair.canAutoFix)
        }
      } catch (err) {
        setPreviewError(err instanceof Error ? err.message : "Eroare la preview repair.")
      } finally {
        setPreviewLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finding.id])

  if (previewLoading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3">
        <Loader2 className="size-4 animate-spin text-eos-primary" strokeWidth={2} />
        <span className="text-[12.5px] text-eos-text-muted">
          Pregătesc preview repair (rulez validatorul pe XML original)…
        </span>
      </div>
    )
  }

  if (previewError) {
    return (
      <div className="space-y-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] px-4 py-3">
        <p className="text-[12.5px] text-eos-text">
          <strong className="text-eos-warning">Auto-fix indisponibil:</strong> {previewError}
        </p>
        <p className="text-[11.5px] text-eos-text-muted">
          Mergi manual la{" "}
          <a
            href="/dashboard/fiscal/validare"
            className="text-eos-text-link underline hover:no-underline"
          >
            Validare & emitere
          </a>{" "}
          ca să urci XML-ul și să-l repari.
        </p>
      </div>
    )
  }

  if (!hasAutoFixSafe) {
    return (
      <div className="space-y-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] px-4 py-3">
        <p className="text-[12.5px] text-eos-text">
          <strong className="text-eos-warning">Eroare non-safe pentru auto-fix:</strong> Codurile{" "}
          {errorCodes.join(", ")} necesită intervenție manuală în softul tău de facturare.
          CompliScan a generat o sugestie de XML reparat, dar NU îl trimite automat — îl
          verifici tu și retransmiți manual.
        </p>
        <XmlDiffViewer original={originalXml} repaired={repairedXml} />
        <p className="text-[11.5px] text-eos-text-muted">
          Pentru retransmisia manuală, mergi la{" "}
          <a
            href="/dashboard/fiscal/transmitere"
            className="text-eos-text-link underline hover:no-underline"
          >
            Transmitere & SPV
          </a>
          .
        </p>
      </div>
    )
  }

  // Auto-fix safe — chain de 4 pași: validate → submit → wait status → save evidence
  const chainSteps: ChainStep<RepairContext>[] = [
    {
      id: "validate",
      label: "Validare XML reparat (V001-V038, BR-XX, BR-RO)",
      run: async (ctx) => {
        const res = await fetch("/api/efactura/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentName: ctx.documentName, xml: ctx.repairedXml }),
        })
        if (!res.ok) throw new Error("Validare locală a eșuat.")
        const data = (await res.json()) as { validation?: { valid: boolean; errors: string[] } }
        if (!data.validation?.valid) {
          throw new Error(
            `Validare locală a returnat ${data.validation?.errors.length ?? 0} erori. Nu trimit la ANAF.`,
          )
        }
        return ctx
      },
    },
    {
      id: "submit",
      label: "Transmitere la ANAF SPV",
      run: async (ctx) => {
        const res = await fetch("/api/fiscal/submit-spv/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentName: ctx.documentName,
            xml: ctx.repairedXml,
            findingId: ctx.findingId,
          }),
        })
        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string }
          throw new Error(errData.error ?? "Transmiterea ANAF a eșuat.")
        }
        const data = (await res.json()) as { submitId?: string; uploadIndex?: string }
        return { ...ctx, submitId: data.submitId ?? data.uploadIndex }
      },
    },
    {
      id: "wait-status",
      label: "Aștept confirmare status SPV (până la 30s)",
      run: async (ctx) => {
        if (!ctx.submitId) return ctx
        // Poll status max 30s
        for (let i = 0; i < 10; i++) {
          await new Promise((r) => setTimeout(r, 3000))
          const res = await fetch(
            `/api/fiscal/submit-spv/${encodeURIComponent(ctx.submitId)}/status`,
            { cache: "no-store" },
          )
          if (!res.ok) continue
          const data = (await res.json()) as { status?: string }
          if (data.status === "ok" || data.status === "accepted") {
            return { ...ctx, statusOk: true }
          }
          if (data.status === "rejected") {
            throw new Error("ANAF a respins din nou XML-ul. Verifică manual.")
          }
        }
        // Timeout — nu blocăm, marcăm ca pending
        return { ...ctx, statusOk: false }
      },
    },
    {
      id: "mark-resolved",
      label: "Marchez finding rezolvat + audit log",
      run: async (ctx) => {
        const res = await fetch(`/api/findings/${encodeURIComponent(ctx.findingId)}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evidence: {
              type: "auto-fix-resubmit",
              originalXml: ctx.originalXml,
              repairedXml: ctx.repairedXml,
              submitId: ctx.submitId,
              statusOk: ctx.statusOk,
              appliedFixes: ctx.errorCodes,
            },
          }),
        })
        if (!res.ok) {
          throw new Error("Nu am putut marca finding-ul ca rezolvat. Audit log e salvat oricum.")
        }
        return ctx
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-4">
        <header className="mb-2 flex items-center gap-2">
          <Wand2 className="size-4 text-eos-primary" strokeWidth={1.5} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Auto-fix safe — Codurile {errorCodes.join(", ")}
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-auto inline-flex items-center gap-1 text-[10px] text-eos-text-tertiary transition hover:text-eos-text-muted"
            aria-label="Refresh preview"
          >
            <RefreshCw className="size-3" strokeWidth={2} />
            Refresh
          </button>
        </header>
        <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
          Preview-ul de mai jos arată modificările pe care le va aplica CompliScan automat.
          Verifică diff-ul, bifează disclaimer-ul CECCAR Art. 14, apoi apasă „Rezolvă automat”.
          Lanțul rulează: validare → transmitere ANAF → așteptare confirmare → salvare dovadă.
        </p>
      </div>

      <XmlDiffViewer original={originalXml} repaired={repairedXml} />

      <ResolveCTAButton<RepairContext>
        label="Rezolvă automat (repair + retransmit + salvează)"
        steps={chainSteps}
        initialContext={{
          originalXml,
          repairedXml,
          errorCodes,
          documentName,
          findingId: finding.id,
        }}
        requireDisclaimerLabel={
          "Am revizuit modificările propuse și le aprob conform Codului Deontologic CECCAR Art. 14 (responsabilitate profesională contabilă). Înțeleg că factura reparată va fi transmisă la ANAF SPV în numele clientului."
        }
        onComplete={() => {
          toast.success("Finding rezolvat. XML reparat transmis la ANAF + dovada salvată la dosar.")
          onResolved()
        }}
        onError={(err) => {
          toast.error(`Lanț întrerupt: ${err.message}`)
        }}
      />
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractErrorCodes(finding: ScanFinding): string[] {
  const codes: string[] = []
  const re = /\b(V\d{2,3}|T\d{2,3}|BR-[A-Z]+-?\d{0,4}|BR-CO-\d+|BR-S-\d+)\b/g
  const haystack = `${finding.title}\n${finding.detail}`
  let match
  while ((match = re.exec(haystack)) !== null) {
    if (!codes.includes(match[1])) codes.push(match[1])
  }
  return codes
}

function extractDocumentName(finding: ScanFinding): string | null {
  // Tentativă: extract din finding.sourceDocument sau detail dacă conține "F2026-..." pattern
  const re = /(F[0-9A-Z\-_]+(?:\.xml)?)/i
  const match = `${finding.sourceDocument ?? ""}\n${finding.detail}\n${finding.title}`.match(re)
  if (match) return match[1].endsWith(".xml") ? match[1] : `${match[1]}.xml`
  return null
}
