import { Loader2 } from "lucide-react"

type DashboardSegmentSkeletonProps = {
  title: string
  description: string
}

export function DashboardSegmentSkeleton({
  title,
  description,
}: DashboardSegmentSkeletonProps) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
              {title}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-on-surface)]">
              {description}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Loader2 className="size-4 animate-spin" />
              <span>Segmentul se pregateste pe server.</span>
            </div>
          </div>
          <div className="h-11 w-28 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)]" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-36 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-10 w-32 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
          <div className="h-10 w-40 animate-pulse rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`metric-${index}`}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--bg-inset)]" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-[var(--bg-inset)]" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-[var(--bg-inset)]" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="h-5 w-48 animate-pulse rounded-full bg-[var(--bg-inset)]" />
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`primary-row-${index}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
                >
                  <div className="h-4 w-40 animate-pulse rounded-full bg-[var(--color-surface)]" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[var(--color-surface)]" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-[var(--color-surface)]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="h-5 w-36 animate-pulse rounded-full bg-[var(--bg-inset)]" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`secondary-row-${index}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4"
                >
                  <div className="h-4 w-28 animate-pulse rounded-full bg-[var(--color-surface)]" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[var(--color-surface)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
