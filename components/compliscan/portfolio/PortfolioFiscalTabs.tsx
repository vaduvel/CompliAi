"use client"

// Wrapper cu tab-uri pentru pagina /portfolio/fiscal.
// Tab default: "AZI" (FC-11) — homepage cabinet cu 6 carduri pe tip de necesitate.
// Restul: drill-down detail (Calendar / Sumar / Cross-correlation / Burden).

import { useState } from "react"
import { CalendarClock, Home, ListChecks, Sparkles, Users } from "lucide-react"

import { ClientBurdenIndexCard } from "@/components/compliscan/portfolio/ClientBurdenIndexCard"
import { PortfolioCalendarPanel } from "@/components/compliscan/portfolio/PortfolioCalendarPanel"
import { PortfolioCrossCorrelationPanel } from "@/components/compliscan/portfolio/PortfolioCrossCorrelationPanel"
import { PortfolioFiscalPanel } from "@/components/compliscan/portfolio/PortfolioFiscalPanel"
import { PortfolioTodayPanel } from "@/components/compliscan/portfolio/PortfolioTodayPanel"

type Tab = "today" | "calendar" | "summary" | "crosscorr" | "burden"

export function PortfolioFiscalTabs() {
  const [tab, setTab] = useState<Tab>("today")

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 border-b border-eos-border">
        <TabButton
          active={tab === "today"}
          onClick={() => setTab("today")}
          icon={<Home className="size-3.5" strokeWidth={2} />}
          label="AZI"
        />
        <TabButton
          active={tab === "calendar"}
          onClick={() => setTab("calendar")}
          icon={<CalendarClock className="size-3.5" strokeWidth={2} />}
          label="Calendar agregat"
        />
        <TabButton
          active={tab === "summary"}
          onClick={() => setTab("summary")}
          icon={<ListChecks className="size-3.5" strokeWidth={2} />}
          label="Sumar per client"
        />
        <TabButton
          active={tab === "crosscorr"}
          onClick={() => setTab("crosscorr")}
          icon={<Sparkles className="size-3.5" strokeWidth={2} />}
          label="Diferențe declarații"
        />
        <TabButton
          active={tab === "burden"}
          onClick={() => setTab("burden")}
          icon={<Users className="size-3.5" strokeWidth={2} />}
          label="Profitabilitate client"
        />
      </nav>

      {tab === "today" ? (
        <PortfolioTodayPanel />
      ) : tab === "calendar" ? (
        <PortfolioCalendarPanel />
      ) : tab === "summary" ? (
        <PortfolioFiscalPanel />
      ) : tab === "crosscorr" ? (
        <PortfolioCrossCorrelationPanel />
      ) : (
        <ClientBurdenIndexCard />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[12.5px] font-medium transition ${
        active
          ? "border-eos-primary text-eos-text"
          : "border-transparent text-eos-text-muted hover:text-eos-text"
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
