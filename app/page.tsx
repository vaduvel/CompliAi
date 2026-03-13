import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,var(--focus-ring-outer),transparent_28%),linear-gradient(180deg,var(--bg-subtle),var(--bg-canvas))] px-6 text-[var(--text-primary)]">
      <Card className="w-full max-w-2xl border-[var(--card-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--card-bg))] shadow-[var(--shadow-xl)]">
        <CardContent className="px-8 py-8 text-center">
          <p className="text-sm uppercase tracking-[0.16em] text-[var(--text-muted)]">
            CompliScan.ro
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight md:text-4xl">
            AI Risk Scanner pentru EU AI Act + GDPR + e-Factura
          </h1>
          <p className="mt-4 text-sm text-[var(--text-secondary)] md:text-base">
            Asistent AI care iti scaneaza documentele si iti arata riscurile. Tu si echipa
            valideaza final.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)] md:text-sm">
            Foloseste scor de risc, recomandari actionabile si verificare umana inainte de raport
            oficial.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/dashboard">Intra in Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
