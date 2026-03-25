"use client"

import { startTransition, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft, Check, ChevronsUpDown, LogOut, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { TrialBanner } from "@/components/compliscan/billing/trial-banner"
import { FloatingAssistant } from "@/components/compliscan/floating-assistant"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { MobileBottomNav } from "@/components/compliscan/mobile-bottom-nav"
import { NotificationBell } from "@/components/compliscan/notification-bell"
import {
  DashboardRuntimeProvider,
  type DashboardRuntimeMembership as DashboardShellUserMembership,
  type DashboardRuntimeUser as DashboardShellCurrentUser,
} from "@/components/compliscan/dashboard-runtime"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { isNavItemActive, type DashboardNavItem } from "@/components/compliscan/navigation"
import { useOptionalCockpitData } from "@/components/compliscan/use-cockpit"
import { WorkspaceModeSwitcher } from "@/components/compliscan/workspace-mode-switcher"
import { Avatar, AvatarFallback } from "@/components/evidence-os/Avatar"
import { Button } from "@/components/evidence-os/Button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/evidence-os/DropdownMenu"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { canSwitchToPortfolio, getMobileNavItems, getSidebarNavSections } from "@/lib/compliscan/nav-config"
import type { WorkspaceMode } from "@/lib/server/auth"

export function DashboardShell({
  children,
  initialUser,
  initialMemberships,
}: {
  children: React.ReactNode
  initialUser: DashboardShellCurrentUser
  initialMemberships: DashboardShellUserMembership[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [switchingMembershipId, setSwitchingMembershipId] = useState<string | null>(null)
  const [switchingWorkspaceMode, setSwitchingWorkspaceMode] = useState<WorkspaceMode | null>(null)
  const currentUser = initialUser
  const memberships = initialMemberships

  // Badge-ul din "De rezolvat" trebuie să reflecte problemele încă active, nu doar severitățile mari.
  const cockpit = useOptionalCockpitData()
  const [dsarActiveCount, setDsarActiveCount] = useState(0)
  useEffect(() => {
    fetch("/api/dsar", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.requests) return
        const active = (d.requests as Array<{ status: string }>).filter(
          (r) => r.status !== "responded" && r.status !== "refused"
        ).length
        setDsarActiveCount(active)
      })
      .catch(() => {})
  }, [])
  const activeFindingsCount = cockpit?.data
    ? cockpit.data.state.findings.filter(
        (finding) =>
          finding.findingStatus !== "resolved" && finding.findingStatus !== "dismissed"
      ).length
    : 0
  const resolveBadgeCount = activeFindingsCount + dsarActiveCount
  const navSections = currentUser
    ? getSidebarNavSections({
        userMode: currentUser.userMode,
        workspaceMode: currentUser.workspaceMode,
        role: currentUser.role,
      })
    : []
  const mobileNavItems = currentUser
    ? getMobileNavItems({
        userMode: currentUser.userMode,
        workspaceMode: currentUser.workspaceMode,
        role: currentUser.role,
      })
    : []

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    toast.success("Deconectat")
    router.push("/login")
  }

  async function handleSwitchWorkspaceMode(mode: WorkspaceMode, destinationHref?: string) {
    if (!currentUser || switchingWorkspaceMode === mode) return

    setSwitchingWorkspaceMode(mode)
    try {
      const response = await fetch("/api/auth/select-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "portfolio"
            ? { workspaceMode: "portfolio" }
            : { workspaceMode: "org", orgId: currentUser.orgId }
        ),
      })

      const payload = (await response.json()) as { message?: string; error?: string }
      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut schimba modul de lucru.")
      }

      toast.success(
        mode === "portfolio" ? "Mod portofoliu activat" : "Context pe firma activat",
        {
          description:
            payload.message ||
            (mode === "portfolio"
              ? "Vezi din nou portofoliul fara sa pierzi firma activa."
              : "Ai revenit in contextul firmei active."),
        }
      )

      startTransition(() => {
        router.push(destinationHref ?? (mode === "portfolio" ? "/portfolio" : "/dashboard"))
        router.refresh()
      })
    } catch (error) {
      toast.error("Schimbarea modului a esuat", {
        description: error instanceof Error ? error.message : "Incearca din nou.",
      })
    } finally {
      setSwitchingWorkspaceMode(null)
    }
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
      startTransition(() => {
        if (currentUser?.workspaceMode === "portfolio") {
          router.push("/dashboard")
        }
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

  function handleNavItemSelection(item: DashboardNavItem) {
    if (!currentUser || !item.workspaceModeTarget) return false
    if (item.workspaceModeTarget === currentUser.workspaceMode) return false
    void handleSwitchWorkspaceMode(item.workspaceModeTarget, item.href)
    return true
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--eos-accent-primary-subtle),transparent_28%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] text-eos-text">
      <div className="mx-auto flex max-w-[1680px]">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 border-r border-eos-border-subtle bg-[linear-gradient(180deg,var(--eos-surface-primary),var(--eos-surface-base))] px-4 py-5 md:flex md:flex-col">
          <div className="border-b border-eos-border-subtle pb-5">
            <CompliScanLogoLockup
              variant="flat"
              size="md"
              subtitle="scanezi, rezolvi si dovedesti cu validare umana"
              titleClassName="text-eos-text"
              subtitleClassName="text-eos-text-muted"
            />
          </div>

          <div className="mt-6 flex-1 overflow-y-auto pr-1">
            {currentUser && canSwitchToPortfolio(currentUser.userMode) ? (
              <WorkspaceModeSwitcher
                currentOrgName={currentUser.orgName}
                loadingMode={switchingWorkspaceMode}
                workspaceMode={currentUser.workspaceMode}
                onSwitch={(mode) => void handleSwitchWorkspaceMode(mode)}
              />
            ) : null}

            <div className={currentUser && canSwitchToPortfolio(currentUser.userMode) ? "mt-6" : ""}>
              {navSections.map((section, sectionIndex) => (
                <div key={section.id} className={sectionIndex > 0 ? "mt-6" : ""}>
                  <p className="px-2 text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
                    {section.label}
                  </p>
                  <nav className="mt-3 space-y-2">
                    {section.items.map((item) => {
                      const active = isNavItemActive(pathname, item)
                      return (
                        <Link
                          key={`${section.id}-${item.id}-${item.href}`}
                          href={item.href}
                          onClick={(event) => {
                            if (handleNavItemSelection(item)) {
                              event.preventDefault()
                            }
                          }}
                          className={`group ring-focus flex w-full items-center gap-3 rounded-eos-lg border px-3 py-3 text-left text-sm transition ${
                            active
                              ? "border-eos-border-strong bg-eos-surface-elevated text-eos-text shadow-[var(--eos-shadow-sm)]"
                              : "border-transparent bg-transparent text-eos-text hover:border-eos-border-subtle hover:bg-eos-surface"
                          }`}
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-eos-md border transition-colors ${
                              active
                                ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
                                : "border-eos-border-subtle bg-eos-surface text-eos-text-muted group-hover:border-eos-border"
                            }`}
                          >
                            <item.icon className="size-4" strokeWidth={2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block font-medium">{item.label}</span>
                            {item.description ? (
                              <span className="mt-0.5 block truncate text-[11px] text-eos-text-muted">
                                {item.description}
                              </span>
                            ) : null}
                          </div>
                          {item.id === "resolve" && resolveBadgeCount > 0 && !active ? (
                            <span className="rounded-full bg-eos-error-soft px-2 py-0.5 text-[10px] font-bold text-eos-error">
                              {resolveBadgeCount}
                            </span>
                          ) : null}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-4 text-xs leading-6 text-eos-text-muted">
              {currentUser?.workspaceMode === "portfolio"
                ? "Portofoliul ramane cross-client. Intri pe o firma doar cand vrei drilldown sau executie."
                : "Zonele detaliate raman in tabs locale si pagini suport, ca sa nu concureze cu traseul principal."}
            </div>
          </div>

          <div className="mt-4 mb-2 flex justify-end">
            <NotificationBell />
          </div>

          <div className="mt-2">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex h-auto w-full items-center gap-3 rounded-eos-lg border-eos-border bg-eos-surface px-3 py-3 text-left hover:bg-eos-secondary-hover"
                  >
                    <Avatar size="default" className="border border-eos-border-strong bg-eos-bg-inset">
                      <AvatarFallback className="bg-transparent text-eos-text">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-eos-text">{currentUser.orgName}</p>
                      <p className="truncate text-xs text-eos-text-muted">{currentUser.email}</p>
                    </div>
                    <ChevronsUpDown className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-[248px]">
                  <DropdownMenuLabel>
                    {currentUser.workspaceMode === "portfolio" ? "Firma activa pentru drilldown" : "Workspace activ"}
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {memberships.filter((membership) => membership.status === "active").map((membership) => {
                      const active = membership.membershipId === currentUser?.membershipId
                      return (
                        <DropdownMenuItem
                          key={membership.membershipId}
                          disabled={active || switchingMembershipId === membership.membershipId}
                          onClick={() => void handleSwitchOrganization(membership.membershipId)}
                          className="items-start py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{membership.orgName}</p>
                            <p className="truncate text-xs text-eos-text-muted">Rol: {membership.role}</p>
                          </div>
                          {active ? <Check className="mt-0.5 size-4 text-eos-primary" strokeWidth={2} /> : null}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(dashboardRoutes.accountSettings)}>
                    <Settings2 className="size-4" strokeWidth={2} />
                    Setări cont
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => void handleLogout()}
                  >
                    <LogOut className="size-4" strokeWidth={2} />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="h-16 animate-pulse rounded-eos-lg border border-eos-border bg-eos-surface" />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-40 pt-5 md:px-6 md:pb-12 md:pt-8 lg:px-8">
          {process.env.NODE_ENV !== "production" && (
            <div className="mb-4 flex items-center gap-2 rounded-eos-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <span className="shrink-0 rounded-sm bg-amber-200 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-amber-800">
                {process.env.NEXT_PUBLIC_APP_ENV ?? "dev"}
              </span>
              <span>Mediu de dezvoltare — datele nu sunt reale, nu trimite documente la terți.</span>
            </div>
          )}
          {currentUser && canSwitchToPortfolio(currentUser.userMode) ? (
            <div className="mb-4 md:hidden">
              <WorkspaceModeSwitcher
                currentOrgName={currentUser.orgName}
                loadingMode={switchingWorkspaceMode}
                workspaceMode={currentUser.workspaceMode}
                onSwitch={(mode) => void handleSwitchWorkspaceMode(mode)}
              />
            </div>
          ) : null}
          <TrialBanner />
          {currentUser?.userMode === "partner" && currentUser.workspaceMode === "org" ? (
            <div className="mb-4 flex items-center gap-3 rounded-eos-lg border border-eos-primary/20 bg-eos-primary-soft px-4 py-2.5">
              <span className="text-xs font-medium text-eos-primary shrink-0">Lucrezi pentru:</span>
              <span className="truncate text-sm font-semibold text-eos-text">{currentUser.orgName}</span>
              <button
                onClick={() => void handleSwitchWorkspaceMode("portfolio")}
                disabled={switchingWorkspaceMode === "portfolio"}
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-eos-md px-2.5 py-1 text-xs font-medium text-eos-primary transition hover:bg-eos-primary/10 disabled:opacity-50"
              >
                <ArrowLeft className="size-3" strokeWidth={2} />
                Portofoliu
              </button>
            </div>
          ) : null}
          <DashboardRuntimeProvider user={currentUser}>
            {children}
            <footer className="mt-12 pb-4">
              <LegalDisclaimer variant="short" />
            </footer>
          </DashboardRuntimeProvider>
        </main>
      </div>

      <FloatingAssistant pathname={pathname} />
      <MobileBottomNav
        items={mobileNavItems}
        activeHref={pathname}
        resolveBadgeCount={resolveBadgeCount}
        onSelectItem={(item) => handleNavItemSelection(item)}
      />
    </div>
  )
}
