"use client"

// Pay Transparency — Cabinet HR cross-client portfolio dashboard
// Aggregate view pentru toate firmele client.
// MVP: folosește /api/partner/portfolio (existent) + adaugă badge Pay
// Transparency status. Versiune avansată va pull data per-client.

import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, Loader2 } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { ContractConfidentialityChecker } from "@/components/compliscan/contract-confidentiality-checker"

type ClientSummary = {
  orgId: string
  orgName: string
  cui?: string | null
  applicabilityFrameworks?: string[]
  signalsLevel?: "ok" | "warning" | "critical" | null
}

export function PortfolioPayTransparencyClient() {
  const [clients, setClients] = useState<ClientSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/partner/portfolio", { cache: "no-store" })
      if (!r.ok) {
        // Endpoint requires partner mode — solo sau imm-internal vor primi 403.
        setClients([])
        return
      }
      const d = await r.json()
      const portfolio = (d.clients ?? d.portfolio ?? []) as ClientSummary[]
      setClients(portfolio)
    } catch {
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" /> Se încarcă portofoliul...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {clients.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Portofoliu gol sau acces limitat"
          label="Activează modul partner cabinet-hr și adaugă firme client pentru a vedea cross-client Pay Transparency dashboard."
        />
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <Card key={client.orgId} className="border border-eos-border bg-eos-surface">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 px-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{client.orgName}</p>
                    <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                      Pay Transparency
                    </Badge>
                    {client.signalsLevel === "critical" && (
                      <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                        Atenție
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-eos-text-muted">
                    {client.cui ? `CUI: ${client.cui}` : "fără CUI"}
                  </p>
                </div>
                <a
                  href={`/dashboard/pay-transparency?client=${encodeURIComponent(client.orgId)}`}
                  className="flex items-center gap-1 text-xs text-eos-primary hover:underline"
                >
                  Deschide <ArrowRight className="size-3" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Anti-confidentiality contract checker — utilitar cabinet */}
      <ContractConfidentialityChecker />
    </div>
  )
}
