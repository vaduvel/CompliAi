"use client"

// Pay Transparency — Job Architecture Builder UI
// Matrix CRUD pentru level × role × salary band (RON brut/lună)

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import type { JobArchitecture, SalaryBand } from "@/lib/compliance/job-architecture"

type FormState = {
  level: string
  role: string
  min: string
  max: string
}

const EMPTY_FORM: FormState = { level: "", role: "", min: "", max: "" }

export function JobArchitectureBuilder() {
  const [arch, setArch] = useState<JobArchitecture>({ levels: [], roles: [], bands: [] })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await fetch("/api/job-architecture", { cache: "no-store" })
      const d = await r.json()
      if (r.ok) setArch(d.architecture)
      else toast.error(d.error ?? "Eroare la încărcare")
    } catch {
      toast.error("Eroare la încărcare")
    } finally {
      setLoading(false)
    }
  }

  async function addBand() {
    const minN = Number(form.min)
    const maxN = Number(form.max)
    if (!form.level || !form.role || !Number.isFinite(minN) || !Number.isFinite(maxN)) {
      toast.error("Completează toate câmpurile")
      return
    }
    if (minN < 0 || maxN < minN) {
      toast.error("Min/max invalid (max trebuie să fie >= min, ambele >= 0)")
      return
    }
    setBusy(true)
    try {
      const r = await fetch("/api/job-architecture", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: form.level.trim(),
          role: form.role.trim(),
          min: minN,
          max: maxN,
          currency: "RON",
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare salvare")
      setArch(d.architecture)
      setForm(EMPTY_FORM)
      toast.success("Band adăugat")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  async function deleteBand(level: string, role: string) {
    setBusy(true)
    try {
      const r = await fetch(
        `/api/job-architecture?level=${encodeURIComponent(level)}&role=${encodeURIComponent(role)}`,
        { method: "DELETE" },
      )
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare ștergere")
      setArch(d.architecture)
      toast.success("Band șters")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  const sortedBands = useMemo(() => {
    return [...arch.bands].sort((a, b) => {
      if (a.level === b.level) return a.role.localeCompare(b.role, "ro")
      return a.level.localeCompare(b.level, "ro")
    })
  }, [arch.bands])

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Job Architecture</CardTitle>
          <p className="mt-1 text-xs text-eos-text-muted">
            Construiește matricea level × role × salary band (RON brut/lună). Salariile generate
            pentru anunțuri vor folosi această arhitectură.
          </p>
        </div>
        <Badge variant="outline" className="normal-case tracking-normal">
          {arch.bands.length} band-uri
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add new band */}
        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-muted">
            Adaugă band
          </p>
          <div className="grid gap-2 sm:grid-cols-5">
            <input
              type="text"
              placeholder="Level (ex: Mid)"
              className="h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role (ex: Marketing)"
              className="h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            />
            <input
              type="number"
              placeholder="Min RON"
              className="h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text"
              value={form.min}
              onChange={(e) => setForm({ ...form, min: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max RON"
              className="h-9 rounded-eos-md border border-eos-border bg-eos-surface px-3 text-sm text-eos-text"
              value={form.max}
              onChange={(e) => setForm({ ...form, max: e.target.value })}
            />
            <Button onClick={() => void addBand()} disabled={busy} size="sm" className="gap-1.5">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Adaugă
            </Button>
          </div>
        </div>

        {/* Bands list */}
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" /> Se încarcă...
          </div>
        ) : sortedBands.length === 0 ? (
          <EmptyState
            icon={Plus}
            label="Niciun band încă. Adaugă primul level + role + range pentru a începe."
          />
        ) : (
          <div className="overflow-hidden rounded-eos-md border border-eos-border">
            <table className="w-full text-sm">
              <thead className="bg-eos-bg-inset text-[11px] font-medium uppercase tracking-[0.16em] text-eos-text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Level</th>
                  <th className="px-3 py-2 text-left">Role</th>
                  <th className="px-3 py-2 text-right">Min RON</th>
                  <th className="px-3 py-2 text-right">Max RON</th>
                  <th className="px-3 py-2 text-right">Mid</th>
                  <th className="px-3 py-2 text-center" />
                </tr>
              </thead>
              <tbody>
                {sortedBands.map((b: SalaryBand) => {
                  const mid = Math.round((b.min + b.max) / 2)
                  return (
                    <tr key={`${b.level}-${b.role}`} className="border-t border-eos-border-subtle">
                      <td className="px-3 py-2 text-eos-text">{b.level}</td>
                      <td className="px-3 py-2 text-eos-text">{b.role}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-eos-text">
                        {b.min.toLocaleString("ro-RO")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-eos-text">
                        {b.max.toLocaleString("ro-RO")}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-eos-text-muted">
                        {mid.toLocaleString("ro-RO")}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          aria-label={`Șterge ${b.level} / ${b.role}`}
                          className="text-eos-text-muted hover:text-eos-error disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void deleteBand(b.level, b.role)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
