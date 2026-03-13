import { ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export function ReviewPolicyCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-eos-lg bg-eos-warning/10 p-3 text-xs text-eos-warning border border-eos-warning/20 flex gap-3", className)}>
      <ShieldAlert className="size-4 shrink-0 mt-0.5 opacity-80" />
      <div>
        <p className="font-semibold mb-1">Human Review Obligatoriu</p>
        <p className="opacity-90">Sistemul este configurat să nu aplice automat decizii critice. Confirmarea ta este necesară pentru audit trail.</p>
      </div>
    </div>
  )
}