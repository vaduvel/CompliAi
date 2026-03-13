import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { cn } from "@/lib/utils"

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md"
}) {
  return (
    <CompliScanLogoLockup
      className={className}
      variant="flat"
      size={size}
      subtitle={size === "md" ? "AI Risk Scanner" : undefined}
      titleClassName={cn(size === "sm" ? "text-zinc-100" : "text-zinc-50")}
      subtitleClassName="text-zinc-400"
    />
  )
}
