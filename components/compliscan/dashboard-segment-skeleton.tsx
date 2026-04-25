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
        <div className="flex items-start justify-between gap-4 border-b border-eos-border pb-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
              {title}
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-eos-text">
              {description}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-eos-text-muted">
              <Loader2 className="size-4 animate-spin" />
              <span>Segmentul se pregateste pe server.</span>
            </div>
          </div>
          <div className="h-9 w-28 animate-pulse rounded-eos-md border border-eos-border bg-eos-bg-inset" />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-36 animate-pulse rounded-eos-md border border-eos-border bg-eos-surface" />
          <div className="h-10 w-32 animate-pulse rounded-eos-md border border-eos-border bg-eos-surface" />
          <div className="h-10 w-40 animate-pulse rounded-eos-md border border-eos-border bg-eos-surface" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`metric-${index}`}
            className="rounded-eos-md border border-eos-border bg-eos-surface p-5"
          >
            <div className="h-3 w-28 animate-pulse rounded-full bg-eos-bg-inset" />
            <div className="mt-4 h-8 w-16 animate-pulse rounded-full bg-eos-bg-inset" />
            <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-eos-bg-inset" />
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <div className="space-y-6">
          <div className="rounded-eos-md border border-eos-border bg-eos-surface p-6">
            <div className="h-5 w-48 animate-pulse rounded-full bg-eos-bg-inset" />
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`primary-row-${index}`}
                  className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4"
                >
                  <div className="h-4 w-40 animate-pulse rounded-full bg-eos-surface" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-eos-surface" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-eos-surface" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-eos-md border border-eos-border bg-eos-surface p-6">
            <div className="h-5 w-36 animate-pulse rounded-full bg-eos-bg-inset" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`secondary-row-${index}`}
                  className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4"
                >
                  <div className="h-4 w-28 animate-pulse rounded-full bg-eos-surface" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-eos-surface" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
