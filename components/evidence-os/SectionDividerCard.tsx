import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"

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
    <SectionBoundary
      eyebrow={eyebrow}
      title={title}
      description={description}
      className={className}
    />
  )
}
