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
import { DashboardBreadcrumb } from "@/components/compliscan/dashboard-breadcrumb"
import { WorkspaceModeSwitcher } from "@/components/compliscan/workspace-mode-switcher"
import { Avatar, AvatarFallback } from "@/components/evidence-os/Avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/evidence-os/DropdownMenu"
import { isFindingActive } from "@/lib/compliscan/finding-cockpit"
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
    ? cockpit.data.state.findings.filter(isFindingActive).length
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
      if (!response.ok) throw new Error(payload.error || "Nu am putut schimba modul de lucru.")
      toast.success(
        mode === "portfolio" ? "Mod portofoliu activat" : "Context pe firma activat",
        { description: payload.message }
      )
      startTransition(() => {
        router.push(destinationHref ?? (mode === "portfolio" ? "/portfolio" : "/dashboard"))
        router.refresh()
      })
    } catch (error) {
      toast.error("Schimbarea modului a eșuat", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
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
      if (!response.ok) throw new Error(payload.error || "Nu am putut schimba organizația.")
      toast.success("Organizație schimbată", { description: payload.message })
      startTransition(() => {
        if (currentUser?.workspaceMode === "portfolio") router.push("/dashboard")
        router.refresh()
      })
    } catch (error) {
      toast.error("Schimbarea organizației a eșuat", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setSwitchingMembershipId(null)
    }
  }

  const initials = currentUser?.orgName
    ? currentUser.orgName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
    : "CS"

  function handleNavItemSelection(item: DashboardNavItem) {
    if (!currentUser || !item.workspaceModeTarget) return false
    if (item.workspaceModeTarget === currentUser.workspaceMode) return false
    void handleSwitchWorkspaceMode(item.workspaceModeTarget, item.href)
    return true
  }

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <div className="mx-auto flex max-w-[1680px]">

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col border-r border-eos-border bg-eos-surface md:flex">

          {/* Logo + Bell */}
          <div className="flex items-center justify-between gap-2 border-b border-eos-border px-4 py-4">
            <CompliScanLogoLockup
              variant="flat"
              size="sm"
              titleClassName="text-eos-text"
              subtitleClassName="text-eos-text-tertiary"
            />
            <NotificationBell />
          </div>

          {/* Nav scroll */}
          <div className="flex-1 overflow-y-auto px-3 py-4">

            {/* Workspace switcher (partner only) */}
            {currentUser && canSwitchToPortfolio(currentUser.userMode) && (
              <div className="mb-4">
                <WorkspaceModeSwitcher
                  currentOrgName={currentUser.orgName}
                  loadingMode={switchingWorkspaceMode}
                  workspaceMode={currentUser.workspaceMode}
                  onSwitch={(mode) => void handleSwitchWorkspaceMode(mode)}
                />
              </div>
            )}

            {/* Nav sections */}
            {navSections.map((section, sectionIdx) => (
              <div key={section.id} className={sectionIdx > 0 ? "mt-6" : ""}>
                {navSections.length > 1 || section.label !== "Flux principal" ? (
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">
                    {section.label}
                  </p>
                ) : null}
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isNavItemActive(pathname, item)
                    const badge =
                      item.id === "resolve" && resolveBadgeCount > 0 && !active ? (
                        <span className="rounded-full bg-eos-error-soft px-1.5 py-0.5 text-[10px] font-bold text-eos-error">
                          {resolveBadgeCount}
                        </span>
                      ) : null

                    return (
                      <Link
                        key={`${section.id}-${item.id}`}
                        href={item.href}
                        onClick={(e) => {
                          if (handleNavItemSelection(item)) e.preventDefault()
                        }}
                        className={[
                          "group flex w-full items-center gap-2.5 rounded-eos-lg px-3 py-2.5 text-sm transition-all duration-150",
                          active
                            ? "bg-eos-primary-soft font-semibold text-eos-text shadow-[inset_2px_0_0_rgba(59,130,246,0.7)]"
                            : "font-medium text-eos-text-tertiary hover:bg-eos-surface-elevated hover:text-eos-text",
                        ].join(" ")}
                      >
                        <item.icon
                          className={[
                            "h-4 w-4 shrink-0 transition-colors duration-150",
                            active ? "text-eos-primary" : "text-eos-text-tertiary group-hover:text-eos-text-muted",
                          ].join(" ")}
                          strokeWidth={2}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {badge}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* User card */}
          <div className="border-t border-eos-border-subtle p-3">
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2.5 rounded-eos-lg px-3 py-2.5 text-left transition-all hover:bg-eos-surface-active">
                    <Avatar size="sm" className="shrink-0 border border-eos-border-strong bg-eos-surface-elevated">
                      <AvatarFallback className="bg-transparent text-xs font-bold text-eos-text-muted">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-eos-text">{currentUser.orgName}</p>
                      <p className="truncate text-[11px] text-eos-text-tertiary">{currentUser.email}</p>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-[220px]">
                  <DropdownMenuLabel>
                    {currentUser.workspaceMode === "portfolio" ? "Firma activă pentru drilldown" : "Workspace activ"}
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    {memberships.filter((m) => m.status === "active").map((m) => {
                      const active = m.membershipId === currentUser?.membershipId
                      return (
                        <DropdownMenuItem
                          key={m.membershipId}
                          disabled={active || switchingMembershipId === m.membershipId}
                          onClick={() => void handleSwitchOrganization(m.membershipId)}
                          className="items-start py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{m.orgName}</p>
                            <p className="truncate text-xs text-eos-text-muted">Rol: {m.role}</p>
                          </div>
                          {active && <Check className="mt-0.5 h-4 w-4 text-eos-primary" strokeWidth={2} />}
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(dashboardRoutes.accountSettings)}>
                    <Settings2 className="h-4 w-4" strokeWidth={2} />
                    Setări cont
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
                    <LogOut className="h-4 w-4" strokeWidth={2} />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="h-12 animate-pulse rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant" />
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 pb-40 pt-5 md:px-6 md:pb-12 md:pt-7 lg:px-8">

          {/* Dev banner */}
          {process.env.NODE_ENV !== "production" && (
            <div className="mb-4 flex items-center gap-2 rounded-eos-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-400/80">
              <span className="shrink-0 rounded-eos-md bg-amber-500/20 px-1.5 py-0.5 font-bold uppercase tracking-wide text-amber-400">
                {process.env.NEXT_PUBLIC_APP_ENV ?? "dev"}
              </span>
              <span>Mediu de dezvoltare — datele nu sunt reale.</span>
            </div>
          )}

          {/* Workspace switcher mobile */}
          {currentUser && canSwitchToPortfolio(currentUser.userMode) && (
            <div className="mb-4 md:hidden">
              <WorkspaceModeSwitcher
                currentOrgName={currentUser.orgName}
                loadingMode={switchingWorkspaceMode}
                workspaceMode={currentUser.workspaceMode}
                onSwitch={(mode) => void handleSwitchWorkspaceMode(mode)}
              />
            </div>
          )}

          <TrialBanner />

          {/* Partner context banner */}
          {currentUser?.userMode === "partner" && currentUser.workspaceMode === "org" && (
            <div className="mb-4 flex items-center gap-3 rounded-eos-lg border border-blue-500/20 bg-blue-500/[0.05] px-4 py-2.5">
              <span className="text-xs font-medium text-blue-400/70 shrink-0">Lucrezi pentru:</span>
              <span className="truncate text-sm font-semibold text-eos-text-muted">{currentUser.orgName}</span>
              <button
                onClick={() => void handleSwitchWorkspaceMode("portfolio")}
                disabled={switchingWorkspaceMode === "portfolio"}
                className="ml-auto flex shrink-0 items-center gap-1.5 rounded-eos-md px-2.5 py-1 text-xs font-medium text-eos-primary transition hover:bg-blue-500/10 disabled:opacity-50"
              >
                <ArrowLeft className="h-3 w-3" strokeWidth={2} />
                Portofoliu
              </button>
            </div>
          )}

          <DashboardRuntimeProvider user={currentUser}>
            <DashboardBreadcrumb />
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
