import { useId } from "react"

import { cn } from "@/lib/utils"

type LogoVariant = "gradient" | "flat" | "mono"
type LogoSize = "sm" | "md" | "lg"

const LOGO_SEGMENTS: Array<[number, number]> = [
  [320, 20],
  [32, 62],
  [104, 136],
  [148, 220],
  [230, 308],
]

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  }
}

function ringSegmentPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const normalizedEnd = endAngle < startAngle ? endAngle + 360 : endAngle
  const largeArc = normalizedEnd - startAngle > 180 ? 1 : 0
  const startOuter = polar(cx, cy, outerRadius, startAngle)
  const endOuter = polar(cx, cy, outerRadius, normalizedEnd)
  const startInner = polar(cx, cy, innerRadius, startAngle)
  const endInner = polar(cx, cy, innerRadius, normalizedEnd)

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ")
}

function sizeClasses(size: LogoSize) {
  if (size === "sm") {
    return {
      mark: "size-8",
      title: "text-sm",
      subtitle: "text-[11px]",
      gap: "gap-2.5",
    }
  }
  if (size === "lg") {
    return {
      mark: "size-14",
      title: "text-[24px] md:text-[28px]",
      subtitle: "text-sm md:text-base",
      gap: "gap-4",
    }
  }
  return {
    mark: "size-11",
    title: "text-base",
    subtitle: "text-xs",
    gap: "gap-3",
  }
}

export function CompliScanLogoMark({
  className,
  variant = "gradient",
  title = "CompliScan logo",
}: {
  className?: string
  variant?: LogoVariant
  title?: string
}) {
  const gradientId = useId().replace(/:/g, "")
  const shineId = useId().replace(/:/g, "")
  const segmentPaths = LOGO_SEGMENTS.map(([start, end]) =>
    ringSegmentPath(128, 128, 92, 58, start, end)
  )
  const tileFill =
    variant === "gradient"
      ? `url(#${gradientId})`
      : variant === "flat"
        ? "var(--eos-accent-primary)"
        : "currentColor"
  const segmentFill = variant === "mono" ? "currentColor" : "var(--eos-text-primary)"
  const tileOpacity = variant === "mono" ? 0.14 : 1

  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-label={title}
      role="img"
    >
      <title>{title}</title>

      {variant === "gradient" && (
        <defs>
          <linearGradient id={gradientId} x1="26" y1="20" x2="226" y2="236" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="var(--eos-accent-primary-hover)" />
            <stop offset="0.55" stopColor="var(--eos-accent-primary)" />
            <stop offset="1" stopColor="var(--eos-accent-secondary)" />
          </linearGradient>
          <radialGradient id={shineId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(128 86) rotate(90) scale(126)">
            <stop offset="0" stopColor="white" stopOpacity="0.26" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      <rect x="8" y="8" width="240" height="240" rx="34" fill={tileFill} fillOpacity={tileOpacity} />
      {variant === "gradient" ? (
        <rect x="8" y="8" width="240" height="240" rx="34" fill={`url(#${shineId})`} />
      ) : null}

      {segmentPaths.map((path, index) => (
        <path key={index} d={path} fill={segmentFill} />
      ))}
    </svg>
  )
}

export function CompliScanLogoLockup({
  className,
  markClassName,
  variant = "gradient",
  size = "md",
  subtitle,
  titleClassName,
  subtitleClassName,
}: {
  className?: string
  markClassName?: string
  variant?: LogoVariant
  size?: LogoSize
  subtitle?: string
  titleClassName?: string
  subtitleClassName?: string
}) {
  const sizeClass = sizeClasses(size)

  return (
    <div className={cn("flex items-center", sizeClass.gap, className)}>
      <CompliScanLogoMark
        variant={variant}
        className={cn(sizeClass.mark, markClassName)}
      />
      <div className="leading-none">
        <div className={cn("font-semibold tracking-tight", sizeClass.title, titleClassName)}>
          CompliScan
        </div>
        {subtitle ? (
          <div className={cn("mt-1 text-eos-text-muted", sizeClass.subtitle, subtitleClassName)}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  )
}
