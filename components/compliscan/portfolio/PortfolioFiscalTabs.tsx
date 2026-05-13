"use client"

// Wrapper cu tab-uri pentru pagina /portfolio/fiscal — combinare între
// summary cross-client (existent) și calendar cross-client (nou).

import { useState } from "react"
import { CalendarClock, ListChecks, Sparkles } from "lucide-react"

import { PortfolioCalendarPanel } from "@/components/compliscan/portfolio/PortfolioCalendarPanel"
import { PortfolioCrossCorrelationPanel } from "@/components/compliscan/portfolio/PortfolioCrossCorrelationPanel"
import { PortfolioFiscalPanel } from "@/components/compliscan/portfolio/PortfolioFiscalPanel"

type Tab = "calendar" | "summary" | "crosscorr"

export function PortfolioFiscalTabs() {
  const [tab, setTab] = useState<Tab>("calendar")

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1 border-b border-eos-border">
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
          label="Cross-correlation"
        />
      </nav>

      {tab === "calendar" ? (
        <PortfolioCalendarPanel />
      ) : tab === "summary" ? (
        <PortfolioFiscalPanel />
      ) : (
        <PortfolioCrossCorrelationPanel />
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
