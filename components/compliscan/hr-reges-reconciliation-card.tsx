"use client"

import { useEffect, useRef, useState } from "react"
import { ClipboardList, Download, Loader2, Upload, Users } from "lucide-react"
import { toast } from "sonner"

import type { HrRegistryReconciliationDerived } from "@/lib/compliance/hr-registry-reconciliation"
import type { HrRegistryReconciliationRecord } from "@/lib/compliance/types"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { Textarea } from "@/components/evidence-os/Textarea"

type HrRegistryReconciliationResponse = {
  findingId: string
  reconciliation: HrRegistryReconciliationRecord | null
  derived: HrRegistryReconciliationDerived
  feedbackMessage?: string
}

type Props = {
  findingId?: string | null
  onEvidenceNoteChange?: (value: string | null) => void
}

export function HrRegesReconciliationCard({ findingId, onEvidenceNoteChange }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rosterSnapshot, setRosterSnapshot] = useState("")
  const [registryChecklistText, setRegistryChecklistText] = useState("")
  const [derived, setDerived] = useState<HrRegistryReconciliationDerived | null>(null)
  const query = findingId ? `?findingId=${encodeURIComponent(findingId)}` : ""

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/hr/reconciliation${query}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | HrRegistryReconciliationResponse
          | { error?: string }
          | null

        if (!response.ok) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Nu am putut încărca reconcilierea REGES."
          )
        }

        if (!cancelled) {
          const data = payload as HrRegistryReconciliationResponse
          setRosterSnapshot(data.reconciliation?.rosterSnapshot ?? "")
          setRegistryChecklistText(data.reconciliation?.registryChecklistText ?? "")
          setDerived(data.derived)
          onEvidenceNoteChange?.(data.derived.readiness === "ready" ? data.derived.handoffEvidenceNote : null)
        }
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setError(fetchError.message)
          setDerived(null)
          onEvidenceNoteChange?.(null)
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
  }, [query, onEvidenceNoteChange])

  async function handleSave() {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/hr/reconciliation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          findingId,
          rosterSnapshot,
          registryChecklistText,
        }),
      })
      const payload = (await response.json().catch(() => null)) as
        | HrRegistryReconciliationResponse
        | { error?: string; feedbackMessage?: string }
        | null

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Nu am putut salva reconcilierea REGES."
        )
      }

      const data = payload as HrRegistryReconciliationResponse
      setDerived(data.derived)
      onEvidenceNoteChange?.(data.derived.readiness === "ready" ? data.derived.handoffEvidenceNote : null)
      toast.success(data.feedbackMessage ?? "Reconcilierea REGES a fost salvată.")
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Nu am putut salva reconcilierea REGES."
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImportCsv(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result
      if (typeof text !== "string") return

      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        toast.error("Fișierul CSV nu conține date suficiente.")
        return
      }

      const header = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""))

      // Detect relevant columns by fuzzy Romanian header names
      const nameIdx = header.findIndex((h) => /^(nume$|nume\s|family|last)/.test(h))
      const firstNameIdx = header.findIndex((h) => /^(prenume|first|given)/.test(h))
      const roleIdx = header.findIndex((h) => /^(functie|funcție|post|rol|job|position)/.test(h))
      const contractIdx = header.findIndex((h) => /^(tip\s*contract|contract|type)/.test(h))
      const dateIdx = header.findIndex((h) => /^(data\s*(angaj|incep|încep)|hire|start)/.test(h))

      const entries: string[] = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""))
        const parts: string[] = []

        const fullName = [
          nameIdx >= 0 ? cols[nameIdx] : "",
          firstNameIdx >= 0 ? cols[firstNameIdx] : "",
        ]
          .filter(Boolean)
          .join(" ")

        if (fullName) parts.push(fullName)
        if (roleIdx >= 0 && cols[roleIdx]) parts.push(cols[roleIdx])
        if (contractIdx >= 0 && cols[contractIdx]) parts.push(cols[contractIdx])
        if (dateIdx >= 0 && cols[dateIdx]) parts.push(`din ${cols[dateIdx]}`)

        if (parts.length > 0) {
          entries.push(`- ${parts.join(" — ")}`)
        }
      }

      if (entries.length === 0) {
        toast.error("Nu am putut extrage intrări din CSV.")
        return
      }

      setRosterSnapshot((prev) => (prev.trim() ? `${prev.trim()}\n${entries.join("\n")}` : entries.join("\n")))
      toast.success(`${entries.length} intrări importate din CSV.`)
    }
    reader.readAsText(file)

    // Reset so same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function handleExportCsv() {
    const lines = rosterSnapshot
      .split("\n")
      .map((l) => l.replace(/^[-•]\s*/, "").trim())
      .filter(Boolean)

    if (lines.length === 0) {
      toast.error("Snapshotul este gol.")
      return
    }

    const csvHeader = "Nr.crt,Intrare"
    const csvRows = lines.map((line, idx) => `${idx + 1},"${line.replace(/"/g, '""')}"`)
    const csvContent = [csvHeader, ...csvRows].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reges-snapshot-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exportat.")
  }

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border-subtle pb-3">
        <div className="space-y-2">
          <CardTitle className="text-sm">Reconciliere snapshot intern vs REGES</CardTitle>
          <p className="text-sm text-eos-text-muted">
            Aici transformi brief-ul generic într-un handoff clar: ce oameni sau contracte urmărești intern și ce
            puncte trebuie verificate în registrul real înainte să revii în cockpit.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" />
            Încărcăm reconcilierea REGES pregătită pentru această firmă.
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
                {derived?.rosterCount ?? 0} intrări în snapshot
              </Badge>
              <Badge variant="outline" className="normal-case tracking-normal">
                {derived?.registryChecklistCount ?? 0} puncte REGES
              </Badge>
              <Badge
                variant={derived?.readiness === "ready" ? "secondary" : "outline"}
                className="normal-case tracking-normal"
              >
                {derived?.readinessLabel ?? "începe reconcilierea"}
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-eos-text">
                    <Users className="size-4 text-eos-primary" />
                    Snapshot intern angajați / contracte active
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleImportCsv}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border px-2 py-1 text-[11px] text-eos-text-muted hover:bg-eos-surface-variant"
                      title="Import din CSV REGES"
                    >
                      <Upload className="size-3" strokeWidth={2} />
                      Import CSV
                    </button>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      disabled={!rosterSnapshot.trim()}
                      className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border px-2 py-1 text-[11px] text-eos-text-muted hover:bg-eos-surface-variant disabled:opacity-30"
                      title="Export snapshot ca CSV"
                    >
                      <Download className="size-3" strokeWidth={2} />
                      Export CSV
                    </button>
                  </div>
                </div>
                <p className="text-xs text-eos-text-muted">
                  Pune câte o intrare pe linie, sau importă direct un CSV exportat din REGES.
                </p>
                <Textarea
                  value={rosterSnapshot}
                  onChange={(event) => setRosterSnapshot(event.target.value)}
                  placeholder={"Ex:\n- Popescu Ana — Office Manager — CIM activ\n- Ionescu Mihai — Sales — modificare salariu martie 2026"}
                  className="min-h-[160px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-eos-text">
                  <ClipboardList className="size-4 text-eos-primary" />
                  Ce verifici sau corectezi în REGES
                </div>
                <p className="text-xs text-eos-text-muted">
                  Notează exact ce trebuie să întoarcă HR / contabilul: contracte lipsă, modificări restante,
                  suspendări, încetări sau dovada exportului final.
                </p>
                <Textarea
                  value={registryChecklistText}
                  onChange={(event) => setRegistryChecklistText(event.target.value)}
                  placeholder={"Ex:\n- Verifică dacă toți angajații activi sunt prezenți în REGES\n- Confirmă modificarea salarială din 15.03.2026\n- Trimite exportul final sau confirmarea scrisă"}
                  className="min-h-[160px]"
                />
              </div>
            </div>

            <div className="rounded-eos-lg border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text-muted">
              {derived?.reconciliationHint ??
                "Completează snapshotul intern și checklistul REGES ca să întorci o dovadă clară în cockpit."}
            </div>

            {(derived?.rosterEntries.length || derived?.registryChecklistItems.length) ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {derived?.rosterEntries.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-tertiary">
                      Snapshot extras
                    </p>
                    <ul className="space-y-1 text-sm text-eos-text-muted">
                      {derived.rosterEntries.slice(0, 5).map((entry) => (
                        <li key={entry} className="flex gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-eos-primary" />
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {derived?.registryChecklistItems.length ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-tertiary">
                      Checklist extras
                    </p>
                    <ul className="space-y-1 text-sm text-eos-text-muted">
                      {derived.registryChecklistItems.slice(0, 5).map((entry) => (
                        <li key={entry} className="flex gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-eos-primary" />
                          <span>{entry}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-eos-text-muted">
                {derived?.readiness === "ready"
                  ? "Dacă revii acum în cockpit, nota de dovadă va include și snapshotul reconcilierii, nu doar brief-ul generic."
                  : "Poți reveni oricând în cockpit, dar nota bună apare după ce salvezi atât snapshotul, cât și checklistul."}
              </p>
              <Button onClick={handleSave} size="sm" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Salvăm
                  </>
                ) : (
                  "Salvează reconcilierea"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
