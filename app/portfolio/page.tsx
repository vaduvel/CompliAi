export default function PortfolioPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-6 py-6 shadow-[var(--eos-shadow-sm)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-muted">
          Portofoliu
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-eos-text">
          Vedere agregata pentru toate firmele tale
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-eos-text-muted">
          In Wave 1 activam shell-ul portfolio, navigatia adaptiva si schimbarea
          de context intre firma activa si portofoliu. Tabelele cross-client si
          agregarile reale intra in Wave 2.
        </p>
      </div>

      <div className="rounded-eos-lg border border-dashed border-eos-border bg-eos-surface px-6 py-6">
        <p className="text-sm font-medium text-eos-text">Urmeaza in Wave 2</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-eos-text-muted">
          <li>• Prezentare generala cross-client</li>
          <li>• Alerte si remediere agregate</li>
          <li>• Furnizori comuni si rapoarte de portofoliu</li>
        </ul>
      </div>
    </div>
  )
}
