"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { ReportsTabs } from "@/components/compliscan/reports-tabs"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { DenseListItem } from "@/components/evidence-os/DenseListItem"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import type { OrgPolicyAcknowledgments } from "@/lib/server/policy-store"

// ─── Policy templates ─────────────────────────────────────────────────────────

interface PolicyTemplate {
  id: string
  title: string
  category: string
  description: string
  version: string
  lastUpdated: string
  requiredFor: string[]
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "privacy-policy",
    title: "Politică de Confidențialitate",
    category: "GDPR",
    description:
      "Informează utilizatorii despre prelucrarea datelor personale conform Art. 13 GDPR.",
    version: "v1.0",
    lastUpdated: "2026-01-15",
    requiredFor: ["GDPR Art. 13", "GDPR Art. 14"],
  },
  {
    id: "dpa-template",
    title: "Acord de Prelucrare a Datelor (DPA)",
    category: "GDPR",
    description: "Contract obligatoriu cu procesatorii de date conform Art. 28 GDPR.",
    version: "v1.0",
    lastUpdated: "2026-01-15",
    requiredFor: ["GDPR Art. 28"],
  },
  {
    id: "aup",
    title: "Politică de Utilizare Acceptabilă",
    category: "Securitate",
    description:
      "Regulile de utilizare acceptabilă a sistemelor și datelor organizației.",
    version: "v1.0",
    lastUpdated: "2026-01-10",
    requiredFor: ["ISO 27001 A.5.10"],
  },
  {
    id: "incident-response",
    title: "Plan de Răspuns la Incidente",
    category: "Securitate",
    description:
      "Procedura de răspuns la incidente de securitate și breșe de date (72h GDPR).",
    version: "v1.0",
    lastUpdated: "2026-01-10",
    requiredFor: ["GDPR Art. 33", "GDPR Art. 34"],
  },
  {
    id: "ai-governance",
    title: "Politică de Guvernanță AI",
    category: "EU AI Act",
    description:
      "Cadrul de guvernanță pentru sistemele AI de risc înalt conform EU AI Act.",
    version: "v1.0",
    lastUpdated: "2026-02-01",
    requiredFor: ["EU AI Act Art. 9", "EU AI Act Art. 17"],
  },
  {
    id: "dpia-template",
    title: "Template DPIA",
    category: "GDPR",
    description:
      "Evaluarea impactului asupra protecției datelor pentru activitățile cu risc ridicat.",
    version: "v1.0",
    lastUpdated: "2026-01-20",
    requiredFor: ["GDPR Art. 35"],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-")
  return `${day}.${month}.${year}`
}

function formatAcknowledgedAt(iso: string): string {
  const d = new Date(iso)
  const zi = String(d.getDate()).padStart(2, "0")
  const luna = String(d.getMonth() + 1).padStart(2, "0")
  const an = d.getFullYear()
  const ora = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${zi}.${luna}.${an} ${ora}:${min}`
}

function categoryBadgeVariant(
  category: string
): "default" | "secondary" | "warning" | "success" | "destructive" | "outline" {
  switch (category) {
    case "GDPR":
      return "default"
    case "Securitate":
      return "secondary"
    case "EU AI Act":
      return "warning"
    default:
      return "outline"
  }
}

// ─── PolicyCard ───────────────────────────────────────────────────────────────

interface PolicyCardProps {
  policy: PolicyTemplate
  ack: OrgPolicyAcknowledgments[string] | undefined
  saving: boolean
  onAcknowledge: (id: string) => void
}

function PolicyCard({ policy, ack, saving, onAcknowledge }: PolicyCardProps) {
  const acknowledged = Boolean(ack)
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{policy.title}</CardTitle>
          <Badge variant={categoryBadgeVariant(policy.category)} className="shrink-0">
            {policy.category}
          </Badge>
        </div>
        <p className="text-xs text-eos-text-muted">
          {policy.version} &middot; actualizat {formatDate(policy.lastUpdated)}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <p className="text-sm leading-6 text-eos-text-muted">{policy.description}</p>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
            Cerințe legale acoperite
          </p>
          <div className="space-y-1">
            {policy.requiredFor.map((req) => (
              <DenseListItem key={req}>
                <div className="px-3 py-1.5">
                  <p className="text-xs font-medium text-eos-text">{req}</p>
                </div>
              </DenseListItem>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-stretch gap-3 border-t border-eos-border-subtle pt-4">
        <div className="flex items-center justify-between gap-2">
          {acknowledged && ack ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success" dot>
                Confirmat
              </Badge>
              <span className="text-xs text-eos-text-muted">
                pe {formatAcknowledgedAt(ack.acknowledgedAtISO)}
              </span>
              {ack.userEmail && (
                <span className="text-xs text-eos-text-muted">· {ack.userEmail}</span>
              )}
            </div>
          ) : (
            <Badge variant="warning" dot>
              Neconfirmat
            </Badge>
          )}
        </div>

        <Button
          variant={acknowledged ? "ghost" : "default"}
          size="sm"
          disabled={saving}
          onClick={() => onAcknowledge(policy.id)}
        >
          {saving ? "Se salvează…" : acknowledged ? "Reconfirmă" : "Am citit și înțeles"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReportsPoliciesPageSurface() {
  const [acknowledgments, setAcknowledgments] = useState<OrgPolicyAcknowledgments>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    void fetchAcknowledgments()
  }, [])

  async function fetchAcknowledgments() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/policies", { cache: "no-store" })
      if (!res.ok) throw new Error("Nu am putut incarca starea politicilor.")
      const data = (await res.json()) as { acknowledgments: OrgPolicyAcknowledgments }
      setAcknowledgments(data.acknowledgments)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
  }

  async function handleAcknowledge(policyId: string) {
    setSavingId(policyId)
    try {
      const res = await fetch("/api/policies/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId }),
      })
      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Salvarea a esuat.")
      }
      const data = (await res.json()) as { acknowledgments: OrgPolicyAcknowledgments }
      setAcknowledgments(data.acknowledgments)
      toast.success("Politică confirmată", { description: policyId })
    } catch (err) {
      toast.error("Eroare la confirmare", {
        description: err instanceof Error ? err.message : "Incearca din nou.",
      })
    } finally {
      setSavingId(null)
    }
  }

  if (error) return <ErrorScreen message={error} variant="section" />
  if (loading) return <LoadingScreen variant="section" />

  const totalCount = POLICY_TEMPLATES.length
  const confirmedCount = POLICY_TEMPLATES.filter((p) => Boolean(acknowledgments[p.id])).length
  const unconfirmedCount = totalCount - confirmedCount

  const summaryItems: SummaryStripItem[] = [
    {
      label: "Total politici",
      value: `${totalCount}`,
      hint: "template-uri aprobate",
      tone: "neutral",
    },
    {
      label: "Confirmate",
      value: `${confirmedCount}`,
      hint: confirmedCount === totalCount ? "toate politicile citite" : "citite și înțelese",
      tone: confirmedCount === totalCount ? "success" : confirmedCount > 0 ? "accent" : "neutral",
    },
    {
      label: "Neconfirmate",
      value: `${unconfirmedCount}`,
      hint: unconfirmedCount > 0 ? "necesită confirmare" : "nicio politică în așteptare",
      tone: unconfirmedCount > 0 ? "warning" : "success",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Politici"
        title="Politici și proceduri interne"
        description="Template-uri aprobate pentru GDPR, AI Act și conformitate operațională."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {confirmedCount}/{totalCount} confirmate
            </Badge>
            {unconfirmedCount > 0 ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                {unconfirmedCount} neconfirmate
              </Badge>
            ) : (
              <Badge variant="success" className="normal-case tracking-normal">
                toate confirmate
              </Badge>
            )}
          </>
        }
      />

      <ReportsTabs />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Stare confirmare"
            title="Progres politici"
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {POLICY_TEMPLATES.map((policy) => (
          <PolicyCard
            key={policy.id}
            policy={policy}
            ack={acknowledgments[policy.id]}
            saving={savingId === policy.id}
            onAcknowledge={handleAcknowledge}
          />
        ))}
      </div>
    </div>
  )
}
