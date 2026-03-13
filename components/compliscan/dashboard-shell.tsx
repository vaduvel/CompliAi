"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { FloatingAssistant } from "@/components/compliscan/floating-assistant"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { MobileBottomNav } from "@/components/compliscan/mobile-bottom-nav"
import {
  dashboardPrimaryNavItems,
  dashboardSecondaryNavSections,
  isNavItemActive,
  mobileNavItems,
} from "@/components/compliscan/navigation"

type CurrentUser = {
  email: string
  orgName: string
  orgId: string
} | null

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data: { user: CurrentUser }) => {
        if (data.user) setCurrentUser(data.user)
      })
      .catch(() => null)
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    toast.success("Deconectat")
    router.push("/login")
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
              subtitle="control operational pentru documente si sisteme AI"
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
                          {item.id === "scanare"
                            ? "Adaugi surse si rulezi analiza"
                            : item.id === "control"
                              ? "Vezi risc, baseline si drift"
                              : "Inchizi task-uri si exporti audit"}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="mt-6 space-y-5">
              {dashboardSecondaryNavSections.map((section) => (
                <div key={section.id}>
                  <p className="px-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    {section.label}
                  </p>
                  <nav className="mt-2 space-y-1">
                    {section.items.map((item) => {
                      const active = isNavItemActive(pathname, item)
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`group ring-focus flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                            active
                              ? "bg-[var(--color-surface-hover)] text-[var(--text-primary)]"
                              : "text-[var(--color-on-surface-muted)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <item.icon
                            className={`size-4 transition-colors ${
                              active
                                ? "text-[var(--text-primary)]"
                                : "text-[var(--icon-secondary)] group-hover:text-[var(--text-secondary)]"
                            }`}
                            strokeWidth={2.15}
                          />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              ))}
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
