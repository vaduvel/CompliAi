import * as React from "react"

export function DashboardFooterDisclaimer() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800/70 bg-zinc-950/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/65">
      <div className="w-full px-4 py-3 md:px-6">
        <p className="text-xs leading-relaxed text-zinc-400">
          Acesta este un asistent AI. Scorurile și recomandările sunt sugestii.
          Nu înlocuiește sfatul unui avocat sau contabil. Verifică uman înainte
          de orice raport oficial.
        </p>
      </div>
    </div>
  )
}

