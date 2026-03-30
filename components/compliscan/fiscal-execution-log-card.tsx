"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ClipboardCheck, Loader2, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Textarea } from "@/components/evidence-os/Textarea"
import {
  FISCAL_PROTOCOL_ACTION_LABELS,
  type FiscalProtocolDerived,
} from "@/lib/compliance/fiscal-protocol"
import type { FiscalProtocolActionStatus, FiscalProtocolFindingType, FiscalProtocolRecord } from "@/lib/compliance/types"

type FiscalProtocolResponse = {
  findingId: string
  findingTypeId: FiscalProtocolFindingType
  protocol: FiscalProtocolRecord | null
  derived: FiscalProtocolDerived
  feedbackMessage?: string
}

type Props = {
  findingId: string
  findingTypeId: FiscalProtocolFindingType
}

function copyWithFallback(text: string) {
  return navigator.clipboard.writeText(text).catch(() => {
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "absolute"
    area.style.left = "-9999px"
    document.body.appendChild(area)
    area.focus()
    area.select()
    area.setSelectionRange(0, area.value.length)
    const copied = document.execCommand("copy")
    document.body.removeChild(area)

    if (!copied) {
      throw new Error("COPY_FAILED")
    }
  })
}

export function FiscalExecutionLogCard({ findingId, findingTypeId }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invoiceRef, setInvoiceRef] = useState("")
  const [actionStatus, setActionStatus] = useState<FiscalProtocolActionStatus>("checked_pending")
  const [spvReference, setSpvReference] = useState("")
  const [evidenceLocation, setEvidenceLocation] = useState("")
  const [operatorNote, setOperatorNote] = useState("")
  const [derived, setDerived] = useState<FiscalProtocolDerived | null>(null)

  const query = useMemo(
    () =>
      `?findingId=${encodeURIComponent(findingId)}&findingTypeId=${encodeURIComponent(findingTypeId)}`,
    [findingId, findingTypeId]
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/fiscal/protocol${query}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | FiscalProtocolResponse
          | { error?: string }
          | null

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Nu am putut încărca protocolul fiscal."
          )
        }

        if (cancelled) return
        const data = payload as FiscalProtocolResponse
        setInvoiceRef(data.protocol?.invoiceRef ?? "")
        setActionStatus(data.protocol?.actionStatus ?? "checked_pending")
        setSpvReference(data.protocol?.spvReference ?? "")
        setEvidenceLocation(data.protocol?.evidenceLocation ?? "")
        setOperatorNote(data.protocol?.operatorNote ?? "")
        setDerived(data.derived)
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setError(fetchError.message)
          setDerived(null)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [query])

  const returnHref = derived
    ? `/dashboard/resolve/${encodeURIComponent(findingId)}?fiscalStatusFlow=done&evidenceNote=${encodeURIComponent(derived.handoffEvidenceNote)}`
    : `/dashboard/resolve/${encodeURIComponent(findingId)}?fiscalStatusFlow=done`

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/fiscal/protocol", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingId,
          findingTypeId,
          invoiceRef,
          actionStatus,
          spvReference,
          evidenceLocation,
          operatorNote,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | FiscalProtocolResponse
        | { error?: string; feedbackMessage?: string }
        | null

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Nu am putut salva protocolul fiscal."
        )
      }

      const data = payload as FiscalProtocolResponse
      setDerived(data.derived)
      toast.success(data.feedbackMessage ?? "Protocolul fiscal a fost salvat.")
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Nu am putut salva protocolul fiscal."
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyNote() {
    if (!derived) return

    try {
      await copyWithFallback(derived.handoffEvidenceNote)
      toast.success("Nota fiscală pentru cockpit a fost copiată.")
    } catch {
      toast.error("Nu am putut copia nota fiscală.")
    }
  }

  return (
    <Card className="border-eos-border bg-eos-surface" data-testid="fiscal-execution-log-card">
      <CardHeader className="border-b border-eos-border-subtle pb-3">
        <div className="space-y-2">
          <CardTitle className="text-sm">Jurnal de execuție fiscală</CardTitle>
          <p className="text-sm text-eos-text-muted">
            Aici transformi protocolul fiscal într-o urmă reală: ce factură ai urmărit, ce ai făcut în SPV și unde rămâne dovada finală pentru cockpit și audit.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" />
            Încărcăm jurnalul de execuție fiscală.
          </div>
        ) : (
          <>
            {error ? (
              <div className="rounded-eos-lg border border-eos-danger/30 bg-eos-danger/[0.08] px-4 py-3 text-sm text-eos-text">
                {error}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="normal-case tracking-normal">
                {findingTypeId}
              </Badge>
              <Badge
                variant={derived?.readiness === "ready" ? "secondary" : "outline"}
                className="normal-case tracking-normal"
              >
                {derived?.readinessLabel ?? "completează protocolul"}
              </Badge>
              <Badge variant="outline" className="normal-case tracking-normal">
                {derived?.actionStatusLabel ?? FISCAL_PROTOCOL_ACTION_LABELS.checked_pending}
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-eos-text">
                  {derived?.invoiceRefLabel ?? "Referință factură / mesaj"}
                </span>
                <input
                  value={invoiceRef}
                  onChange={(event) => setInvoiceRef(event.target.value)}
                  placeholder={findingTypeId === "EF-004" ? "Ex: INV-2026-114 / mesaj ANAF 2231" : "Ex: INV-2026-114"}
                  className="ring-focus h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-eos-text">Status operațional</span>
                <select
                  value={actionStatus}
                  onChange={(event) => setActionStatus(event.target.value as FiscalProtocolActionStatus)}
                  className="ring-focus h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
                >
                  {(Object.entries(FISCAL_PROTOCOL_ACTION_LABELS) as [FiscalProtocolActionStatus, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-eos-text">Referință SPV / recipisă</span>
                <input
                  value={spvReference}
                  onChange={(event) => setSpvReference(event.target.value)}
                  placeholder="Ex: MSG-ANAF-2026-00412"
                  className="ring-focus h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-eos-text">Unde rămâne dovada</span>
                <input
                  value={evidenceLocation}
                  onChange={(event) => setEvidenceLocation(event.target.value)}
                  placeholder="Ex: Dosar / Fiscal / recipise / martie-2026"
                  className="ring-focus h-10 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-eos-text">Notă operator / contabil</span>
              <Textarea
                value={operatorNote}
                onChange={(event) => setOperatorNote(event.target.value)}
                placeholder="Ex: XML-ul a fost retransmis din ERP la 09:42. Așteptăm confirmarea finală din SPV."
                className="min-h-[140px]"
              />
            </label>

            <div className="rounded-eos-lg border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text-muted">
              {derived?.protocolHint ?? "Completează acțiunea fiscală și urma de dovadă înainte să revii în cockpit."}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-tertiary">
                  Checklist protocol
                </p>
                <ul className="space-y-1 text-sm text-eos-text-muted">
                  {(derived?.checklist ?? []).map((entry) => (
                    <li key={entry} className="flex gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-eos-primary" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-tertiary">
                  Ce mai lipsește
                </p>
                {derived?.missingItems.length ? (
                  <ul className="space-y-1 text-sm text-eos-text-muted">
                    {derived.missingItems.map((entry) => (
                      <li key={entry} className="flex gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-eos-warning" />
                        <span>{entry}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-eos-text-muted">
                    Protocolul are destul context pentru întoarcerea în cockpit și închiderea cu dovadă clară.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Nota pregătită pentru cockpit</p>
              <Textarea
                readOnly
                value={derived?.handoffEvidenceNote ?? ""}
                rows={5}
                className="mt-3 min-h-[120px]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-eos-text-muted">
                Salvezi întâi jurnalul, apoi revii în cockpit cu nota pregătită și atașezi dovada finală.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => void handleCopyNote()}>
                  <ClipboardCheck className="size-3.5" />
                  Copiază nota
                </Button>
                <Button asChild variant="ghost" size="sm" className="gap-1.5">
                  <Link href={returnHref}>
                    <Undo2 className="size-3.5" />
                    Revino în cockpit
                  </Link>
                </Button>
                <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Salvăm
                    </>
                  ) : (
                    "Salvează jurnalul"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
