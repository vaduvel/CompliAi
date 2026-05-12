"use client"

// PatternIRetransmit — Pattern I (retransmit) pentru finding-uri unde XML-ul
// există deja valid și trebuie doar re-push la ANAF SPV.
//
// Aplicabilitate:
//   • EF-005 — factură generată local, netransmisă SPV (validare + submit)
//   • EF-004 după 72h — factură blocată în prelucrare > 72h, retransmit
//
// Flow scurt: 1 buton "Retransmite la ANAF" → chain validate → submit
// → wait status → save. Fără diff XML (nu reparăm, doar retransmitem).
//
// Faza 3.2 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"
import {
  ResolveCTAButton,
  type ChainStep,
} from "@/components/compliscan/fiscal/resolve/ResolveCTAButton"

type PatternIContext = {
  xml: string
  documentName: string
  findingId: string
  submitId?: string
}

type PatternIProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternIRetransmit({ finding, onResolved }: PatternIProps) {
  const [xml, setXml] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/findings/${encodeURIComponent(finding.id)}/xml`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<{ xml?: string }>) : { xml: "" }))
      .then((data) => setXml(data.xml ?? ""))
      .catch(() => setError("XML-ul facturii nu e disponibil."))
      .finally(() => setLoading(false))
  }, [finding.id])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3">
        <Loader2 className="size-4 animate-spin text-eos-primary" strokeWidth={2} />
        <span className="text-[12.5px] text-eos-text-muted">Pregătesc XML pentru retransmitere…</span>
      </div>
    )
  }

  if (error || !xml) {
    return (
      <div className="space-y-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] px-4 py-3">
        <p className="text-[12.5px] text-eos-text">
          <strong className="text-eos-warning">XML indisponibil:</strong>{" "}
          {error ?? "Nu am găsit XML-ul în finding metadata."}
        </p>
        <p className="text-[11.5px] text-eos-text-muted">
          Folosește{" "}
          <a
            href="/dashboard/fiscal/transmitere"
            className="text-eos-text-link underline hover:no-underline"
          >
            Transmitere & SPV
          </a>{" "}
          ca să încarci manual și retransmiți.
        </p>
      </div>
    )
  }

  const docName =
    extractDocumentName(finding) ?? `factura-${finding.id.slice(0, 8)}.xml`

  const steps: ChainStep<PatternIContext>[] = [
    {
      id: "validate",
      label: "Validare XML (V001-V038 + BR rules)",
      run: async (ctx) => {
        const res = await fetch("/api/efactura/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentName: ctx.documentName, xml: ctx.xml }),
        })
        if (!res.ok) throw new Error("Validare locală eșuată.")
        const data = (await res.json()) as { validation?: { valid: boolean; errors: string[] } }
        if (!data.validation?.valid) {
          throw new Error(
            `XML invalid: ${data.validation?.errors.length ?? 0} erori detectate. NU trimit la ANAF.`,
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
            xml: ctx.xml,
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
      id: "mark-resolved",
      label: "Marchez finding rezolvat + audit log",
      run: async (ctx) => {
        const res = await fetch(`/api/findings/${encodeURIComponent(ctx.findingId)}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evidence: { type: "retransmit", submitId: ctx.submitId },
          }),
        })
        if (!res.ok) throw new Error("Nu am putut marca finding-ul ca rezolvat.")
        return ctx
      },
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] px-3 py-2">
        <Send className="size-4 text-eos-primary" strokeWidth={1.5} />
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-eos-primary">
          XML deja valid — doar retransmit
        </span>
      </div>
      <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
        Această factură există local și e structurat valid. Lipsește doar push-ul la ANAF.
        Apasă butonul de mai jos ca să rulăm chain-ul: validare → transmitere → audit log.
      </p>
      <ResolveCTAButton<PatternIContext>
        label="Retransmite la ANAF SPV"
        steps={steps}
        initialContext={{
          xml,
          documentName: docName,
          findingId: finding.id,
        }}
        onComplete={() => {
          toast.success("Retransmitere completă. Dovada salvată la dosar.")
          onResolved()
        }}
        onError={(err) => {
          toast.error(`Lanț întrerupt: ${err.message}`)
        }}
      />
    </div>
  )
}

function extractDocumentName(finding: ScanFinding): string | null {
  const re = /(F[0-9A-Z\-_]+(?:\.xml)?)/i
  const match = `${finding.sourceDocument ?? ""}\n${finding.detail}\n${finding.title}`.match(re)
  if (match) return match[1].endsWith(".xml") ? match[1] : `${match[1]}.xml`
  return null
}
