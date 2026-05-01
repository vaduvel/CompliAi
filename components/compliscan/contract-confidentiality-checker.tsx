"use client"

// Pay Transparency — Anti-confidentiality contract checker UI
// Utilitar pentru cabinet HR / HR Director: paste contract text, vezi findings.

import { useState } from "react"
import { AlertTriangle, CheckCircle2, FileSearch, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type CheckResult = {
  findings: Array<{
    matchIndex: number
    pattern: string
    excerpt: string
    recommendation: string
  }>
  severity: "ok" | "warning" | "critical"
  directiveCompliant: boolean
}

export function ContractConfidentialityChecker() {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CheckResult | null>(null)

  async function check() {
    if (!text.trim()) {
      toast.error("Lipiți textul contractului mai întâi")
      return
    }
    setBusy(true)
    try {
      const r = await fetch("/api/contracts/check-confidentiality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare scan")
      setResult({
        findings: d.findings,
        severity: d.severity,
        directiveCompliant: d.directiveCompliant,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Anti-Confidentiality Checker</CardTitle>
        <p className="mt-1 text-xs text-eos-text-muted">
          Lipește textul unui contract de muncă/colaborare → vezi clauzele de confidențialitate
          salarială interzise de Directiva (UE) 2023/970 (aplicabilă din 7 iunie 2026).
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <textarea
          rows={8}
          placeholder="Lipește textul contractului aici (max 100K caractere)..."
          className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <Button onClick={() => void check()} disabled={busy || !text.trim()} className="gap-1.5">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <FileSearch className="size-3.5" />}
            Scanează contractul
          </Button>
          {result && (
            <Badge
              variant={result.directiveCompliant ? "default" : "destructive"}
              className="normal-case tracking-normal"
            >
              {result.findings.length} clauze interzise găsite
            </Badge>
          )}
        </div>

        {result && (
          <div className="space-y-3">
            {result.directiveCompliant ? (
              <div className="rounded-eos-md border border-eos-success/30 bg-eos-success/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-eos-success" />
                  <p className="text-sm font-semibold text-eos-text">Conform Directivei 2023/970</p>
                </div>
                <p className="mt-1 text-xs text-eos-text-muted">
                  Nu am detectat clauze de confidențialitate salarială interzise. Contractul poate fi
                  utilizat fără modificări pe această zonă.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-eos-error" />
                    <p className="text-sm font-semibold text-eos-text">
                      Contract NEconform — necesită modificare
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    Au fost detectate {result.findings.length} clauze de confidențialitate salarială.
                    Conform Directivei (UE) 2023/970 și legislației naționale aplicabile din 7 iunie
                    2026, aceste clauze trebuie șterse sau înlocuite.
                  </p>
                </div>

                <div className="space-y-2">
                  {result.findings.map((f, idx) => (
                    <Card key={idx} className="border border-eos-error/30 border-l-[3px] border-l-eos-error bg-eos-surface">
                      <CardContent className="space-y-2 py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-[10px] normal-case tracking-normal">
                            Clauză #{idx + 1}
                          </Badge>
                          <span className="text-xs font-medium text-eos-text">{f.pattern}</span>
                        </div>
                        <p className="rounded-eos-md bg-eos-bg-inset p-2 text-xs italic text-eos-text-muted">
                          „...{f.excerpt}..."
                        </p>
                        <p className="text-xs text-eos-text">
                          <strong>Recomandare:</strong> {f.recommendation}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
