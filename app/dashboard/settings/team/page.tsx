import { CabinetTeamPanel } from "@/components/compliscan/cabinet/CabinetTeamPanel"

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Setări · Echipă
        </p>
        <h1
          data-display-text="true"
          className="mt-1 font-display text-[26px] font-semibold tracking-[-0.025em] text-eos-text md:text-[30px]"
        >
          Multi-seat cabinet — gestionează echipa
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-[1.55] text-eos-text-muted">
          Adaugă colegi din cabinet cu roluri diferite. Fiecare membru folosește contul lui CompliScan
          pentru a accesa portofoliul cabinetului.
        </p>
      </header>

      <CabinetTeamPanel />
    </div>
  )
}
