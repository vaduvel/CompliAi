import { CronStatusPanel } from "@/components/compliscan/admin/CronStatusPanel"

export default function CronStatusPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Setări · Observabilitate
        </p>
        <h1
          data-display-text="true"
          className="mt-1 font-display text-[26px] font-semibold tracking-[-0.025em] text-eos-text md:text-[30px]"
        >
          Cron-uri — last-run + status
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-[1.55] text-eos-text-muted">
          Joburi automate (Vercel Cron) ce alimentează modulul fiscal, agenții și digest-urile.
          Coloana <em>last-run</em> arată ultima execuție efectivă (din log-ul intern); dacă lipsește,
          jobul nu a fost încă executat după deploy.
        </p>
      </header>

      <CronStatusPanel />
    </div>
  )
}
