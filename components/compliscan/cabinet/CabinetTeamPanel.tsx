"use client"

// Multi-seat cabinet team management UI.
// Layout: header summary + add-member form + members table cu role select +
// deactivate button per row.

import { useEffect, useState } from "react"
import {
  Crown,
  Eye,
  Loader2,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type UserRole = "owner" | "partner_manager" | "compliance" | "reviewer" | "viewer"

type Member = {
  membershipId: string
  userId: string
  email: string
  role: UserRole
  createdAtISO: string
  isCurrentUser: boolean
}

type ListResponse = {
  orgId: string
  orgName: string
  members: Member[]
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; hint: string }> = [
  { value: "owner", label: "Owner", hint: "Acces total + gestionare team" },
  { value: "partner_manager", label: "Partner manager", hint: "Coordonare portofoliu clienți" },
  { value: "compliance", label: "Compliance", hint: "Edit findings + audit" },
  { value: "reviewer", label: "Reviewer", hint: "Aprobă/respinge fixes" },
  { value: "viewer", label: "Viewer", hint: "Doar citire" },
]

const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  partner_manager: "Partner manager",
  compliance: "Compliance",
  reviewer: "Reviewer",
  viewer: "Viewer",
}

const ROLE_ICON: Record<UserRole, typeof Crown> = {
  owner: Crown,
  partner_manager: ShieldCheck,
  compliance: Shield,
  reviewer: Shield,
  viewer: Eye,
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

export function CabinetTeamPanel() {
  const [data, setData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<{ email: string; role: UserRole }>({ email: "", role: "viewer" })

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/cabinet/team", { cache: "no-store" })
      if (!res.ok) {
        if (res.status === 403) {
          toast.error("Doar owner-ul poate gestiona echipa.")
        } else {
          toast.error("Nu am putut încărca echipa.")
        }
        return
      }
      setData((await res.json()) as ListResponse)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("Email invalid.")
      return
    }
    setAdding(true)
    try {
      const res = await fetch("/api/cabinet/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = (await res.json()) as { ok?: boolean; error?: string; code?: string }
      if (!res.ok || !result.ok) {
        toast.error(result.error ?? "Adăugare eșuată.", {
          description:
            result.code === "TEAM_USER_NOT_FOUND"
              ? "Roagă colegul să-și creeze cont gratuit pe /register, apoi adaugă-l aici."
              : undefined,
        })
        return
      }
      toast.success(`Membru adăugat ca ${ROLE_LABEL[form.role]}.`)
      setForm({ email: "", role: "viewer" })
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setAdding(false)
    }
  }

  async function handleRoleChange(membershipId: string, role: UserRole) {
    setBusyId(membershipId)
    try {
      const res = await fetch("/api/cabinet/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId, role }),
      })
      const result = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !result.ok) {
        toast.error(result.error ?? "Update rol eșuat.")
        return
      }
      toast.success(`Rol actualizat la ${ROLE_LABEL[role]}.`)
      await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeactivate(membershipId: string, email: string) {
    if (!confirm(`Sigur dezactivezi membrul ${email}?`)) return
    setBusyId(membershipId)
    try {
      const res = await fetch(`/api/cabinet/team?membershipId=${encodeURIComponent(membershipId)}`, {
        method: "DELETE",
      })
      const result = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !result.ok) {
        toast.error(result.error ?? "Dezactivare eșuată.")
        return
      }
      toast.success("Membru dezactivat.")
      await load()
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă echipa cabinetului...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-eos-md border border-eos-border bg-eos-surface p-6 text-center text-[12.5px] text-eos-text-muted">
        Echipa indisponibilă. Doar owner-ul poate vedea team-ul.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-eos-primary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Echipa {data.orgName}
          </p>
        </div>
        <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
          {data.members.length} membri activi. Owner-ul poate adăuga, schimba rolul sau dezactiva membri.
          Adaugă doar utilizatori care au deja cont CompliScan — dacă nu au, roagă-i să se înregistreze
          gratuit pe /register, apoi adaugă-i aici.
        </p>
      </section>

      {/* Add form */}
      <section
        data-testid="cabinet-team-add"
        className="rounded-eos-lg border border-eos-border bg-eos-surface p-5"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="size-4 text-eos-primary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Adaugă membru
          </p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_auto]">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@cabinet.ro"
            className="ring-focus h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 text-[12.5px] text-eos-text"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button onClick={() => void handleAdd()} disabled={adding || !form.email}>
            {adding ? (
              <>
                <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Adăugare...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 size-3.5" strokeWidth={2} /> Adaugă
              </>
            )}
          </Button>
        </div>
        <p className="mt-2 text-[11.5px] text-eos-text-muted">
          {ROLE_OPTIONS.find((r) => r.value === form.role)?.hint}
        </p>
      </section>

      {/* Members list */}
      <section className="rounded-eos-lg border border-eos-border bg-eos-surface">
        <header className="border-b border-eos-border-subtle px-4 py-3">
          <p
            data-display-text="true"
            className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Membri ({data.members.length})
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Adăugat</th>
                <th className="px-3 py-2 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => {
                const Icon = ROLE_ICON[m.role]
                return (
                  <tr key={m.membershipId} className="border-b border-eos-border/50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Icon className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                        <span className="font-mono text-eos-text">{m.email}</span>
                        {m.isCurrentUser && (
                          <span className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-primary">
                            Tu
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={m.role}
                        disabled={busyId === m.membershipId || m.isCurrentUser}
                        onChange={(e) =>
                          void handleRoleChange(m.membershipId, e.target.value as UserRole)
                        }
                        className="h-7 rounded-eos-sm border border-eos-border bg-eos-surface px-2 text-[11.5px] text-eos-text disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-eos-text-muted">
                      {fmtDate(m.createdAtISO)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!m.isCurrentUser && (
                        <button
                          onClick={() => void handleDeactivate(m.membershipId, m.email)}
                          disabled={busyId === m.membershipId}
                          className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-2 py-1 font-mono text-[10.5px] text-eos-text-muted transition-colors hover:border-eos-error/30 hover:text-eos-error disabled:opacity-50"
                        >
                          {busyId === m.membershipId ? (
                            <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="size-3" strokeWidth={2} />
                          )}
                          Dezactivează
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
