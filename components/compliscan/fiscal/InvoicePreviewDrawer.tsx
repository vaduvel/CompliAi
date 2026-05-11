"use client"

import { useEffect, useState } from "react"
import { Loader2, Printer, X } from "lucide-react"
import { toast } from "sonner"

/**
 * Drawer that converts UBL XML to a printable HTML view via /api/efactura/preview.
 * Pass `xml` directly, or `xmlUrl` to fetch lazily on open.
 */
export function InvoicePreviewDrawer({
  open,
  onClose,
  xml,
  title,
}: {
  open: boolean
  onClose: () => void
  xml: string
  title?: string
}) {
  const [html, setHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !xml) {
      setHtml(null)
      return
    }
    let cancelled = false
    setLoading(true)
    fetch("/api/efactura/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ xml, format: "html" }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status)
        return res.text()
      })
      .then((body) => {
        if (!cancelled) setHtml(body)
      })
      .catch(() => {
        if (!cancelled) toast.error("Nu am putut genera previzualizarea.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, xml])

  function printPreview() {
    const iframe = document.getElementById("invoice-preview-iframe") as HTMLIFrameElement | null
    iframe?.contentWindow?.focus()
    iframe?.contentWindow?.print()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-eos-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-eos-border px-4 py-3">
          <div>
            <p
              data-display-text="true"
              className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Previzualizare factură
            </p>
            <p className="text-[11.5px] text-eos-text-muted">
              {title ?? "UBL CIUS-RO → vedere umană"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printPreview}
              disabled={!html}
              className="flex items-center gap-1 rounded-eos-sm px-2 py-1 text-[11.5px] text-eos-text hover:bg-eos-surface-elevated disabled:opacity-40"
            >
              <Printer className="size-3.5" strokeWidth={2} /> Print / Salvează PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-eos-sm p-1.5 text-eos-text-muted hover:bg-eos-surface-elevated"
              aria-label="Închide"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden bg-white">
          {loading && (
            <div className="flex h-full items-center justify-center text-eos-text-muted">
              <Loader2 className="size-5 animate-spin" strokeWidth={2} />
            </div>
          )}
          {!loading && html && (
            <iframe
              id="invoice-preview-iframe"
              title="Invoice preview"
              srcDoc={html}
              className="h-full w-full border-0"
              sandbox="allow-same-origin allow-modals"
            />
          )}
        </div>
      </div>
    </div>
  )
}
