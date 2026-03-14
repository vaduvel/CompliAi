"use client"

import { startTransition, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { FloatingAssistant } from "@/components/compliscan/floating-assistant"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { MobileBottomNav } from "@/components/compliscan/mobile-bottom-nav"
import {
  dashboardPrimaryNavItems,
  isNavItemActive,
  mobileNavItems,
} from "@/components/compliscan/navigation"

type CurrentUser = {
  email: string
  orgName: string
  orgId: string
  role: "owner" | "compliance" | "reviewer" | "viewer"
  membershipId: string | null
} | null

type UserMembership = {
  membershipId: string
  orgId: string
  orgName: string
  role: "owner" | "compliance" | "reviewer" | "viewer"
  createdAtISO: string
  status: "active" | "inactive"
}

export function DashboardShell({
  children,
  initialUser,
  initialMemberships,
}: {
  children: React.ReactNode
  initialUser: CurrentUser
  initialMemberships: UserMembership[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [switchingMembershipId, setSwitchingMembershipId] = useState<string | null>(null)
  const currentUser = initialUser
  const memberships = initialMemberships

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    toast.success("Deconectat")
    router.push("/login")
  }

  async function handleSwitchOrganization(membershipId: string) {
    setSwitchingMembershipId(membershipId)
    try {
      const response = await fetch("/api/auth/switch-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipId }),
      })
      const payload = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut schimba organizatia activa.")
      }

      toast.success("Organizatie schimbata", {
        description: payload.message || "Sesiunea a fost mutata pe organizatia selectata.",
      })
      setUserMenuOpen(false)
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      toast.error("Schimbarea organizatiei a esuat", {
        description: error instanceof Error ? error.message : "Incearca din nou.",
      })
    } finally {
      setSwitchingMembershipId(null)
    }
  }

  const initials = currentUser?.orgName
    ? currentUser.orgName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join("")
    : "CS"

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--bg-subtle),var(--bg-canvas))] text-[var(--color-on-surface)]">
      <div className="mx-auto flex max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-[var(--color-border)] bg-[var(--bg-subtle)] p-4 backdrop-blur-xl md:flex md:flex-col">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <CompliScanLogoLockup
              variant="flat"
              size="md"
              subtitle="scanare, control si dovada cu validare umana"
              titleClassName="text-[var(--color-on-surface)]"
              subtitleClassName="text-[var(--color-muted)]"
            />
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            <div>
              <p className="px-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Flux principal
              </p>
              <nav className="mt-3 space-y-2">
                {dashboardPrimaryNavItems.map((item) => {
                  const active = isNavItemActive(pathname, item)
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`group ring-focus flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        active
                          ? "border-[var(--border-subtle)] bg-[var(--bg-active)] text-[var(--text-primary)]"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                      }`}
                    >
                      <item.icon
                        className={`size-4 transition-colors ${
                          active
                            ? "text-[var(--text-primary)]"
                            : "text-[var(--icon-secondary)] group-hover:text-[var(--text-secondary)]"
                        }`}
                        strokeWidth={2.25}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block font-medium">{item.label}</span>
                        <span className="block truncate text-[11px] text-[var(--color-muted)]">
                          {item.id === "dashboard"
                            ? "Readiness, drift si urmatorul pas"
                            : item.id === "scanare"
                            ? "Surse, verdict curent si istoric"
                            : item.id === "control"
                              ? "Discovery, sisteme, baseline si drift"
                              : item.id === "dovada"
                                ? "Remediere, dovezi si livrabil"
                                : "Workspace, integrari, acces si operational"}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 text-xs text-[var(--color-muted)]">
              Sub-sectiunile apar ca tabs in fiecare pagina pentru a pastra fluxul clar.
            </div>
          </div>

          <div className="mt-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left hover:bg-[var(--color-surface-hover)]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-active)] text-sm font-semibold text-[var(--text-primary)]">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-on-surface)]">
                      {currentUser.orgName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-muted)]">
                      {currentUser.email}
                    </p>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-[var(--color-muted)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
                    {memberships.filter((membership) => membership.status === "active").length > 1 && (
                      <div className="mb-2 border-b border-[var(--color-border)] pb-2">
                        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--color-muted)]">
                          Organizatie activa
                        </p>
                        <div className="space-y-1">
                          {memberships
                            .filter((membership) => membership.status === "active")
                            .map((membership) => {
                              const active = membership.membershipId === currentUser?.membershipId
                              return (
                                <button
                                  key={membership.membershipId}
                                  onClick={() => void handleSwitchOrganization(membership.membershipId)}
                                  disabled={active || switchingMembershipId === membership.membershipId}
                                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate font-medium">{membership.orgName}</p>
                                    <p className="truncate text-xs text-[var(--color-muted)]">
                                      Rol: {membership.role}
                                    </p>
                                  </div>
                                  {active ? (
                                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--text-primary)]">
                                      Activ
                                    </span>
                                  ) : null}
                                </button>
                              )
                            })}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => void handleLogout()}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--color-error)] hover:bg-[var(--color-error-muted)]"
                    >
                      <LogOut className="size-4" strokeWidth={2.25} />
                      Deconectare
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-16 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-40 pt-5 md:px-6 md:pb-12 md:pt-8 lg:px-8">
          {children}
        </main>
      </div>

      <FloatingAssistant pathname={pathname} />
      <MobileBottomNav items={[...mobileNavItems]} activeHref={pathname} />
    </div>
  )
}
