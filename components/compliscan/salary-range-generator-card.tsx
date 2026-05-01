"use client"

// Pay Transparency — Salary Range Generator UI
// Format text gata pentru anunțuri job (BestJobs/LinkedIn/eJobs/Generic)

import { useEffect, useState } from "react"
import { Copy, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { computeSalaryRange, type JobArchitecture } from "@/lib/compliance/job-architecture"
import { generateRangeForJobAd, type AdFormat } from "@/lib/compliance/salary-range-generator"

const FORMATS: { id: AdFormat; label: string }[] = [
  { id: "bestjobs", label: "BestJobs.ro" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "ejobs", label: "eJobs.ro" },
  { id: "generic", label: "Generic" },
]

export function SalaryRangeGeneratorCard() {
  const [arch, setArch] = useState<JobArchitecture>({ levels: [], roles: [], bands: [] })
  const [loading, setLoading] = useState(true)
  const [level, setLevel] = useState("")
  const [role, setRole] = useState("")
  const [format, setFormat] = useState<AdFormat>("bestjobs")
  const [currency, setCurrency] = useState<"RON" | "EUR">("RON")
  const [generated, setGenerated] = useState("")

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/job-architecture", { cache: "no-store" })
      const d = await r.json()
      if (r.ok) setArch(d.architecture)
    } finally {
      setLoading(false)
    }
  }

  function generate() {
    if (!level || !role) {
      toast.error("Selectează level și role")
      return
    }
    const range = computeSalaryRange(arch, level, role)
    if (!range) {
      toast.error(
        `Nu există band pentru ${level} / ${role}. Adaugă-l în Job Architecture mai întâi.`,
      )
      return
    }
    const text = generateRangeForJobAd({ role, level, range, currency, format })
    setGenerated(text)
    toast.success("Text generat")
  }

  async function copyToClipboard() {
    if (!generated) return
    try {
      await navigator.clipboard.writeText(generated)
      toast.success("Copiat în clipboard")
    } catch {
      toast.error("Browser-ul a refuzat clipboard access")
    }
  }

  const archEmpty = arch.bands.length === 0

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Generator Salary Range pentru anunțuri</CardTitle>
        <p className="mt-1 text-xs text-eos-text-muted">
          Conform Directivei (UE) 2023/970 — anunțurile job trebuie să includă salariu/range. Selectează
          level + role + format → primești text gata de copiat.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" /> Se încarcă...
          </div>
        ) : archEmpty ? (
          <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 p-4">
            <p className="text-sm font-medium text-eos-text">Lipsește Job Architecture</p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Înainte de a genera salary ranges, adaugă band-uri în{" "}
              <a href="/dashboard/pay-transparency/job-architecture" className="underline">
                Job Architecture
              </a>
              .
            </p>
          </div>
        ) : (
          <>
            {/* Selector grid */}
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-eos-text-muted">
                  Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 text-sm text-eos-text"
                >
                  <option value="">— alege —</option>
                  {arch.levels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-eos-text-muted">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 text-sm text-eos-text"
                >
                  <option value="">— alege —</option>
                  {arch.roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-eos-text-muted">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as AdFormat)}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 text-sm text-eos-text"
                >
                  {FORMATS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-[0.16em] text-eos-text-muted">
                  Monedă
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as "RON" | "EUR")}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 text-sm text-eos-text"
                >
                  <option value="RON">RON</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <Button onClick={generate} className="gap-1.5" disabled={!level || !role}>
              <Sparkles className="size-3.5" />
              Generează text
            </Button>

            {/* Output */}
            {generated && (
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant="outline" className="normal-case tracking-normal">
                    {FORMATS.find((f) => f.id === format)?.label} · {currency}
                  </Badge>
                  <Button onClick={() => void copyToClipboard()} size="sm" variant="outline" className="gap-1.5">
                    <Copy className="size-3.5" />
                    Copiază
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-eos-text">{generated}</pre>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
