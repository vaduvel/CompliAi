"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Download } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type EvidencePack = {
  generatedAtISO: string
  overallCompliance: number
  deadline: string | null
  systems: Array<{
    systemId: string
    systemName: string
    riskClass: "prohibited" | "high_risk" | "limited_risk" | "minimal_risk"
    obligations: Array<{
      id: string
      label: string
      status: "done" | "pending" | "overdue"
      evidenceTitle?: string
    }>
    annexIvGenerated: boolean
    annexIvApproved: boolean
    euDbSubmitted: boolean
    findingsResolved: number
    findingsOpen: number
  }>
}

function riskLabel(riskClass: EvidencePack["systems"][number]["riskClass"]) {
  if (riskClass === "prohibited") return "interzis"
  if (riskClass === "high_risk") return "high risk"
  if (riskClass === "limited_risk") return "limited risk"
  return "minimal risk"
}

export function AIActEvidencePackCard() {
  const [pack, setPack] = useState<EvidencePack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/exports/ai-act-evidence-pack", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Nu am putut încărca Evidence Pack.")
        }
        return (await response.json()) as EvidencePack
      })
      .then((payload) => {
        if (!active) return
        setPack(payload)
        setError(null)
      })
      .catch((cause) => {
        if (!active) return
        setError(cause instanceof Error ? cause.message : "Nu am putut încărca pack-ul.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const overdueCount = useMemo(
    () =>
      pack?.systems.reduce(
        (total, system) => total + system.obligations.filter((obligation) => obligation.status === "overdue").length,
        0
      ) ?? 0,
    [pack]
  )

  async function downloadPack() {
    const response = await fetch("/api/exports/ai-act-evidence-pack", { cache: "no-store" })
    if (!response.ok) throw new Error("Exportul a eșuat.")

    const blob = await response.blob()
    const disposition = response.headers.get("content-disposition") ?? ""
    const match = disposition.match(/filename=\"?([^\";]+)\"?/)
    const fileName = match?.[1] ?? "ai-act-evidence-pack.json"
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">AI Act Evidence Pack</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Vezi per sistem ce obligații sunt gata, ce intră în Dosar și ce rămâne blocant înainte de 2 august 2026.
            </p>
          </div>
          {pack ? (
            <Badge variant={overdueCount > 0 ? "warning" : "outline"} className="normal-case tracking-normal">
              {pack.overallCompliance}% complet
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {loading ? (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
            Încărcăm AI Act Evidence Pack...
          </div>
        ) : error ? (
          <div className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft/50 p-4 text-sm text-eos-error">
            {error}
          </div>
        ) : pack ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Sisteme în pack" value={String(pack.systems.length)} />
              <Metric label="Obligații overdue" value={String(overdueCount)} tone={overdueCount > 0 ? "warning" : "success"} />
              <Metric label="Deadline următor" value={pack.deadline ?? "fără deadline"} />
            </div>

            <div className="space-y-3">
              {pack.systems.slice(0, 4).map((system) => (
                <div key={system.systemId} className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">{system.systemName}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {riskLabel(system.riskClass)} · {system.findingsResolved} rezolvate · {system.findingsOpen} deschise
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={system.annexIvApproved ? "success" : system.annexIvGenerated ? "warning" : "outline"} className="normal-case tracking-normal">
                        Annex IV {system.annexIvApproved ? "aprobat" : system.annexIvGenerated ? "draft" : "lipsă"}
                      </Badge>
                      <Badge variant={system.euDbSubmitted ? "success" : "outline"} className="normal-case tracking-normal">
                        EU DB {system.euDbSubmitted ? "trimis" : "pending"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {system.obligations.map((obligation) => (
                      <Badge
                        key={obligation.id}
                        variant={
                          obligation.status === "done"
                            ? "success"
                            : obligation.status === "overdue"
                              ? "warning"
                              : "outline"
                        }
                        className="normal-case tracking-normal"
                      >
                        {obligation.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void downloadPack()}>
                <Download className="size-4" strokeWidth={2} />
                Descarcă Evidence Pack
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/actiuni/remediere">
                  Vezi cazurile AI Act
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
            Nu există încă sisteme AI confirmate în inventar.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "warning" | "success"
}) {
  const className =
    tone === "warning"
      ? "text-eos-warning"
      : tone === "success"
        ? "text-eos-success"
        : "text-eos-text"

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${className}`}>{value}</p>
    </div>
  )
}
