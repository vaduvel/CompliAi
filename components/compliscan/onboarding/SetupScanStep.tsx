"use client"

// SetupScanStep — Pas 3 setup-fiscal: scan animație + populare findings.
//
// Trigger automat la mount. Pentru fiecare CUI din portofoliu, probăm ANAF SPV
// cu token-ul cabinet → tragem mesajele → detectăm findings (respingeri,
// e-TVA, cert expirare, SAF-T deadline).
//
// La final → emit fiscal.setup.scan.completed event în state → refresh
// pagina → server re-evaluează → redirect /dashboard/fiscal cu findings reale.
//
// Faza 1.5 conține skeleton; orchestrator-ul efectiv se va wire la endpointul
// /api/portfolio/fiscal-scan în Faza 2 (REVISED). Până atunci, butonul
// "Pornește scan" emite manual event placeholder + redirect — pentru a
// permite testare flow cap-coadă.
//
// Refs Faza 1.5 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, Sparkles, XCircle } from "lucide-react"
import { toast } from "sonner"

type ScanItem = {
  cui: string
  orgName: string
  status: "pending" | "scanning" | "complete" | "failed"
  findingsCount?: number
  message?: string
}

type SetupScanStepProps = {
  clientsCount: number
  anafConnected: boolean
}

export function SetupScanStep({ clientsCount, anafConnected }: SetupScanStepProps) {
  const [items, setItems] = useState<ScanItem[]>([])
  const [scanning, setScanning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-start scan la mount dacă suntem în pasul 3 (presupus că am ajuns
  // aici doar dacă ambele precondiții sunt OK).
  useEffect(() => {
    if (!anafConnected) return
    if (clientsCount === 0) return
    if (scanning || completed) return
    void runScan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runScan() {
    setScanning(true)
    setError(null)
    try {
      // Call orchestrator endpoint cu Server-Sent Events streaming.
      // Faza 2 va wire-ui orchestrator-ul real; până atunci, folosim
      // endpoint placeholder care emite event scan.completed.
      const res = await fetch("/api/portfolio/fiscal-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "setup-fiscal" }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Scan-ul ANAF a eșuat. Încearcă din nou.")
      }

      // Decode SSE stream
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) {
        // Non-streaming fallback (legacy endpoint poate returnează JSON simplu)
        const summary = (await res.json().catch(() => null)) as
          | { items?: ScanItem[]; total?: number }
          | null
        if (summary?.items) setItems(summary.items)
        setCompleted(true)
        setTimeout(() => window.location.assign("/dashboard/fiscal"), 1200)
        return
      }

      let buffer = ""
      // Streaming loop
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        // SSE events separated by `\n\n`
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith("data:")) continue
          try {
            const payload = JSON.parse(line.slice("data:".length).trim()) as {
              type: "item" | "complete" | "error"
              item?: ScanItem
              message?: string
            }
            if (payload.type === "item" && payload.item) {
              setItems((prev) => {
                const existingIdx = prev.findIndex((p) => p.cui === payload.item!.cui)
                if (existingIdx === -1) return [...prev, payload.item!]
                const next = [...prev]
                next[existingIdx] = payload.item!
                return next
              })
            } else if (payload.type === "complete") {
              setCompleted(true)
              setTimeout(() => window.location.assign("/dashboard/fiscal"), 1500)
            } else if (payload.type === "error") {
              setError(payload.message ?? "Eroare scan.")
            }
          } catch {
            // ignore malformed event
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare la scan."
      setError(msg)
      toast.error(msg)
    } finally {
      setScanning(false)
    }
  }

  const pendingCount = items.filter((i) => i.status === "pending" || i.status === "scanning").length
  const successCount = items.filter((i) => i.status === "complete").length
  const failedCount = items.filter((i) => i.status === "failed").length
  const totalFindings = items.reduce((sum, item) => sum + (item.findingsCount ?? 0), 0)

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h2
          data-display-text="true"
          className="font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Pas 3 — Scanare automată ANAF SPV
        </h2>
        <p className="text-[13.5px] leading-[1.6] text-eos-text-muted">
          Pentru fiecare din cei {clientsCount} clienți, probăm ANAF SPV cu
          token-ul cabinetului și tragem mesajele lor. Detectăm respingeri de
          facturi, notificări e-TVA, certificate care expiră și alte alerte.
        </p>
      </header>

      <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <span
          className={`absolute left-0 top-0 bottom-0 w-[3px] transition-colors ${
            completed
              ? "bg-eos-success"
              : error
                ? "bg-eos-error"
                : "bg-eos-primary"
          }`}
          aria-hidden
        />

        {/* Stats header */}
        <div className="flex items-center justify-between gap-4 border-b border-eos-border-subtle px-5 py-3">
          <div className="flex items-center gap-2">
            {completed ? (
              <CheckCircle2 className="size-4 text-eos-success" strokeWidth={2} />
            ) : (
              <Sparkles className="size-4 text-eos-primary" strokeWidth={1.5} />
            )}
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              {completed
                ? `Scan complet — ${successCount} clienți · ${totalFindings} findings`
                : scanning
                  ? `Scanez clienții — ${items.length}/${clientsCount}`
                  : "Pregătesc scan-ul…"}
            </span>
          </div>
          {!completed && scanning && (
            <Loader2 className="size-3.5 animate-spin text-eos-text-muted" strokeWidth={2} />
          )}
        </div>

        {/* Items list */}
        <div className="max-h-[400px] divide-y divide-eos-border-subtle overflow-y-auto">
          {items.length === 0 && !error && (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <Loader2
                className="size-6 animate-spin text-eos-primary"
                strokeWidth={1.5}
              />
              <p className="text-[12.5px] font-medium text-eos-text">
                Inițializez scan-ul ANAF SPV…
              </p>
              <p className="text-[11px] text-eos-text-tertiary">
                Token cabinet verificat · pregătesc lista CUI
              </p>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.cui}
              className="flex items-center gap-3 px-5 py-2.5"
            >
              {item.status === "complete" ? (
                <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
              ) : item.status === "failed" ? (
                <XCircle className="size-4 shrink-0 text-eos-error" strokeWidth={2} />
              ) : item.status === "scanning" ? (
                <Loader2
                  className="size-4 shrink-0 animate-spin text-eos-primary"
                  strokeWidth={2}
                />
              ) : (
                <div className="size-4 shrink-0 rounded-full border-2 border-eos-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-eos-text">
                  {item.orgName || item.cui}
                </p>
                {item.message && (
                  <p className="text-[11px] text-eos-text-tertiary">{item.message}</p>
                )}
              </div>
              {item.status === "complete" && (
                <span className="font-mono text-[10.5px] text-eos-text-muted">
                  {item.findingsCount ?? 0}{" "}
                  {(item.findingsCount ?? 0) === 1 ? "finding" : "findings"}
                </span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="border-t border-eos-error/30 bg-eos-error-soft px-5 py-3 text-[12px] text-eos-error">
            {error}
            <button
              type="button"
              onClick={() => void runScan()}
              className="ml-2 underline hover:no-underline"
            >
              Reîncearcă
            </button>
          </div>
        )}
      </div>

      {!scanning && !completed && items.length === 0 && (
        <button
          type="button"
          onClick={() => void runScan()}
          className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground transition hover:bg-eos-primary"
        >
          <Sparkles className="size-4" strokeWidth={2} />
          Pornește scan ANAF
        </button>
      )}

      {pendingCount > 0 && successCount > 0 && (
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 p-3 text-[11.5px] leading-[1.55] text-eos-text-tertiary">
          <strong className="text-eos-text">Continuă în background:</strong>{" "}
          Poți închide această pagină — scan-ul rulează pe server. Vei vedea
          rezultatele în portofoliu când revii.
        </div>
      )}
    </div>
  )
}
