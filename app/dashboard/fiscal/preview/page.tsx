"use client"

// Standalone preview page — paste raw UBL XML → printable HTML view.
// Closes the "factura primită în SPV e XML, nu pot citi" pain that competitor
// SaaS (arhivaspv.ro, ispv.ro) built entire businesses around.

import { useState } from "react"
import { FileText, Loader2, Printer, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"

export default function FiscalPreviewPage() {
  const [xml, setXml] = useState("")
  const [html, setHtml] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function generate() {
    if (!xml.trim()) {
      toast.error("Lipește XML-ul facturii întâi.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/efactura/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xml, format: "html" }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "HTTP " + res.status)
      }
      const body = await res.text()
      setHtml(body)
      toast.success("Previzualizare gata")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la generare.")
      setHtml(null)
    } finally {
      setBusy(false)
    }
  }

  function printPreview() {
    const iframe = document.getElementById("invoice-iframe") as HTMLIFrameElement | null
    iframe?.contentWindow?.focus()
    iframe?.contentWindow?.print()
  }

  return (
    <FiscalSubpageShell
      title="Previzualizare factură (XML → PDF)"
      description="Lipește XML-ul UBL CIUS-RO al unei facturi (de la SmartBill, Saga, Oblio sau descărcată din SPV). Generăm o vedere umană printabilă, gata pentru tipărit sau salvat ca PDF."
      breadcrumb="Previzualizare"
    >
      <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4">
        <p
          data-display-text="true"
          className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          <FileText className="mr-1.5 inline size-3.5 align-text-bottom text-eos-primary" strokeWidth={2} />
          XML factură UBL CIUS-RO
        </p>
        <textarea
          value={xml}
          onChange={(e) => setXml(e.target.value)}
          rows={10}
          placeholder='<?xml version="1.0"?>\n<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ...>'
          className="w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[11px] text-eos-text outline-none focus:border-eos-border-strong"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={generate} disabled={busy}>
            {busy ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
            ) : (
              <Sparkles className="mr-1.5 size-3.5" strokeWidth={2} />
            )}
            Generează previzualizare
          </Button>
          {html && (
            <Button size="sm" variant="outline" onClick={printPreview}>
              <Printer className="mr-1.5 size-3.5" strokeWidth={2} />
              Print / Salvează PDF
            </Button>
          )}
        </div>
        <p className="text-[11px] text-eos-text-muted">
          Procesat local (server-side, fără salvare). Conținutul rămâne privat — XML-ul nu se
          stochează după închiderea paginii.
        </p>
      </section>

      {html && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-white">
          <iframe
            id="invoice-iframe"
            title="Invoice preview"
            srcDoc={html}
            className="h-[800px] w-full border-0"
            sandbox="allow-same-origin allow-modals"
          />
        </section>
      )}
    </FiscalSubpageShell>
  )
}
