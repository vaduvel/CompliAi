import { cn } from "@/lib/utils"

interface SectionDividerCardProps {
  eyebrow: string
  title: string
  description: string
  className?: string
}

export function SectionDividerCard({
  eyebrow,
  title,
  description,
  className,
}: SectionDividerCardProps) {
  return (
    <section
      className={cn(
        "rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset px-5 py-4",
        className
      )}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-tertiary">{eyebrow}</p>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-lg font-semibold text-eos-text">{title}</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-eos-text-muted">{description}</p>
        </div>
      </div>
    </section>
  )
}
