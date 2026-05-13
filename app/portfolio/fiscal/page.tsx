import { PortfolioFiscalTabs } from "@/components/compliscan/portfolio/PortfolioFiscalTabs"

export default function PortfolioFiscalPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Portofoliu cabinet
        </p>
        <h1
          data-display-text="true"
          className="mt-1 font-display text-[26px] font-semibold tracking-[-0.025em] text-eos-text md:text-[30px]"
        >
          Fiscal — vedere cross-client
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-[1.55] text-eos-text-muted">
          Calendar agregat cu termene urgente pe toți clienții + sumar cu scoruri SAF-T,
          disciplină depuneri, probleme e-Factura. Sortat după urgență — restantele apar primul.
        </p>
      </header>

      <PortfolioFiscalTabs />
    </div>
  )
}
