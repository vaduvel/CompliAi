"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"

// ── SPV Check Tab ────────────────────────────────────────────────────────────

type SpvSignal = { messageId: string; type: string; date: string; detail: string; converted: boolean }
type SpvCheckResult = {
  cui: string
  spvRegistered: boolean | null
  tokenAvailable: boolean
  messagesChecked: number
  newFindings: number
  signals: SpvSignal[]
}

export function SpvCheckTab() {
  const [result, setResult] = useState<SpvCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/spv-check", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la verificare.")
      setResult(data as SpvCheckResult)
      if (data.newFindings > 0) toast.success(`${data.newFindings} finding(s) noi create din semnale SPV.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-eos-text-muted">
          Verifica daca firma e inregistrata in SPV si citeste semnalele de eroare ANAF.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => void runCheck()} disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />}
          Verifica SPV
        </Button>
      </div>

      {error && (
        <Card className="border-eos-error/30 bg-eos-error-soft">
          <CardContent className="py-3">
            <p className="text-sm text-eos-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Rezultat verificare SPV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">CUI:</span>
                <span className="font-mono text-eos-text">{result.cui}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">SPV:</span>
                {result.spvRegistered === true && (
                  <Badge variant="default" className="gap-1 bg-eos-success-soft text-eos-success">
                    <CheckCircle2 className="size-3" /> Inregistrat
                  </Badge>
                )}
                {result.spvRegistered === false && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="size-3" /> Neinregistrat
                  </Badge>
                )}
                {result.spvRegistered === null && (
                  <Badge variant="outline" className="gap-1">
                    Nu s-a putut determina
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-eos-text-muted">Token ANAF:</span>
                <Badge variant={result.tokenAvailable ? "default" : "outline"}>
                  {result.tokenAvailable ? "Conectat" : "Neconectat"}
                </Badge>
              </div>
              {result.messagesChecked > 0 && (
                <p className="text-sm text-eos-text-muted">
                  {result.messagesChecked} mesaje verificate · {result.newFindings} findings noi
                </p>
              )}
            </CardContent>
          </Card>

          {result.signals.length > 0 && (
            <Card className="border-eos-border bg-eos-surface">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Semnale detectate</CardTitle>
              </CardHeader>
              {result.signals.map((s) => (
                <CardContent key={s.messageId} className="border-t border-eos-border py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-eos-text">{s.type}</p>
                      <p className="text-xs text-eos-text-muted">{s.detail}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">{s.date}</p>
                    </div>
                    {s.converted && (
                      <Badge variant="default" className="shrink-0 bg-eos-primary/20 text-eos-primary">
                        Finding creat
                      </Badge>
                    )}
                  </div>
                </CardContent>
              ))}
            </Card>
          )}

          {result.signals.length === 0 && result.spvRegistered && (
            <EmptyState
              icon={CheckCircle2}
              title="Fără semnale de eroare"
              label="Nu au fost detectate facturi respinse sau erori XML în ultimele 30 de zile."
            />
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <EmptyState
          icon={ShieldCheck}
          title="Verificare SPV"
          label="Apasa butonul pentru a verifica inregistrarea SPV si a citi semnalele ANAF."
        />
      )}
    </div>
  )
}
