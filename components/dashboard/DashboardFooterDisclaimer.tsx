import * as React from "react"

export function DashboardFooterDisclaimer() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-eos-border-subtle bg-eos-surface/85 backdrop-blur supports-[backdrop-filter]:bg-eos-surface/65">
      <div className="w-full px-4 py-3 md:px-6">
        <p className="text-xs leading-relaxed text-eos-text-muted">
          CompliAI pregătește cazul, documentele și dovezile. Specialistul intervine
          doar pentru validare finală sau situații sensibile. Scorurile și recomandările
          sunt orientative — omul validează întotdeauna.
        </p>
      </div>
    </div>
  )
}
