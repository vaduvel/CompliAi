"use client"

// OnboardingWalkthrough — 3 slide-uri carousel afișate la prima vizită
// post-onboarding pentru cabinet-fiscal (Mircea persona).
//
// Mircea aterizează pe /portfolio gol și vede acest walkthrough cu 3 slide-uri:
//   1. Importă primii clienți — 2 căi (manual CUI / Upload CSV)
//   2. Conectează ANAF SPV — pentru pull mesaje cross-client
//   3. Conectează ERP (Oblio / SmartBill / SAGA) — pentru import facturi
//
// Skip button always available. localStorage flag persistă "seen" — nu mai
// afișează a doua oară.
//
// Faza 1.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Landmark,
  PlugZap,
  Sparkles,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/evidence-os/Dialog"

// localStorage key — persist seen flag per user (browser-level).
const WALKTHROUGH_SEEN_KEY = "compliscan_walkthrough_fiscal_seen_v1"

type WalkthroughSlide = {
  id: string
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  primaryCta?: {
    label: string
    onClick?: () => void
  }
  icon: React.ElementType
  accent: "primary" | "warning" | "success"
}

const SLIDES: WalkthroughSlide[] = [
  {
    id: "import-clients",
    eyebrow: "Pas 1 — Aduce clienții în CompliScan",
    title: "Importă primii clienți",
    description:
      "Pentru a începe să-ți urmărim portofoliul fiscal, avem nevoie de lista clienților tăi cu CUI-urile lor. Două căi rapide:",
    bullets: [
      "Adaugă manual 1 client cu CUI — auto-completăm denumire, status TVA, sector CAEN din ANAF API public.",
      "Upload bulk CSV cu coloane orgName + CUI + sector + employeeCount + email — maxim 50 rânduri pe import.",
      "După adăugare, fiecare client capătă un cockpit fiscal dedicat (e-Factura, SAF-T, e-TVA).",
    ],
    icon: FileSpreadsheet,
    accent: "primary",
  },
  {
    id: "connect-anaf",
    eyebrow: "Pas 2 — Conectează ANAF SPV",
    title: "Tragem automat mesajele ANAF",
    description:
      "Cu un singur OAuth la ANAF SPV, putem să tragem mesajele tuturor clienților unde ai împuternicire activă — peste noapte, fără să te loghezi tu zilnic.",
    bullets: [
      "Facturi respinse ANAF (V001-V038, BR-XX) detectate instant cu validator local + AI explain.",
      "Notificări e-TVA D300 vs P300 cu countdown 20 zile + draft răspuns generat de AI.",
      "Cert SPV expirare — alerte 30/14/7/3/1 zile + ghid renewal pas-cu-pas.",
      "Pentru clienții fără împuternicire înregistrată la ANAF: template PDF descărcabil + ghid online.",
    ],
    icon: Landmark,
    accent: "warning",
  },
  {
    id: "connect-erp",
    eyebrow: "Pas 3 — Conectează ERP-ul tău (opțional)",
    title: "Sincronizează SmartBill / Oblio / SAGA",
    description:
      "Pentru detalii pe facturile emise (cele pe care le produce clientul tău în soft-ul de facturare), conectează ERP-ul. NU înlocuim Oblio sau SmartBill — adăugăm un strat de validare + reconciliere peste ele.",
    bullets: [
      "SmartBill — OAuth la nivel cont → import facturi emise + clienți recente.",
      "Oblio — API key per cont client → import sincron cu ANAF API public CUI lookup.",
      "SAGA — upload SAF-T XML local → parser + cross-check D300/D406.",
      "Le poți conecta ulterior, oricând. Nu sunt necesare pentru a începe.",
    ],
    icon: PlugZap,
    accent: "success",
  },
]

const ACCENT_CLASSES: Record<WalkthroughSlide["accent"], { stripe: string; icon: string; bg: string }> = {
  primary: {
    stripe: "bg-eos-primary",
    icon: "text-eos-primary",
    bg: "bg-eos-primary/[0.06] border-eos-primary/20",
  },
  warning: {
    stripe: "bg-eos-warning",
    icon: "text-eos-warning",
    bg: "bg-eos-warning/[0.06] border-eos-warning/20",
  },
  success: {
    stripe: "bg-eos-success",
    icon: "text-eos-success",
    bg: "bg-eos-success/[0.06] border-eos-success/20",
  },
}

/**
 * Check (browser-only) dacă walkthrough-ul a fost deja afișat pentru acest user.
 * Folosit ca să nu se afișeze la fiecare vizită — single-use.
 */
export function hasSeenFiscalWalkthrough(): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(WALKTHROUGH_SEEN_KEY) === "true"
  } catch {
    // Storage neavailable (private mode, cookies blocked) — tratăm ca "seen"
    // pentru a evita afișarea repetată per-tab.
    return true
  }
}

/** Marchează walkthrough-ul ca seen — apelat la skip sau la final. */
function markWalkthroughSeen() {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WALKTHROUGH_SEEN_KEY, "true")
  } catch {
    // ignore — fail safe
  }
}

type OnboardingWalkthroughProps = {
  /**
   * Controlează dacă dialog-ul e deschis. Părintele decide pe baza
   * `hasSeenFiscalWalkthrough()` și starea internă.
   */
  open: boolean
  /** Callback la închidere (skip sau finish). */
  onClose: () => void
}

export function OnboardingWalkthrough({ open, onClose }: OnboardingWalkthroughProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Reset slide când se redeschide (rar, dar safe).
  useEffect(() => {
    if (open) setCurrentSlide(0)
  }, [open])

  const slide = SLIDES[currentSlide]
  const isFirstSlide = currentSlide === 0
  const isLastSlide = currentSlide === SLIDES.length - 1
  const SlideIcon = slide.icon
  const accent = ACCENT_CLASSES[slide.accent]

  function handleSkip() {
    markWalkthroughSeen()
    onClose()
  }

  function handleFinish() {
    markWalkthroughSeen()
    onClose()
  }

  function handleNext() {
    if (isLastSlide) {
      handleFinish()
      return
    }
    setCurrentSlide((s) => s + 1)
  }

  function handlePrev() {
    if (isFirstSlide) return
    setCurrentSlide((s) => s - 1)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleSkip()}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        // Disable close-on-escape would surprise users; allow Esc = skip.
      >
        <div className="relative">
          {/* Stripe accent (visual continuity cu canon brand) */}
          <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${accent.stripe}`} aria-hidden />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              <Sparkles className="size-3.5 text-eos-primary" strokeWidth={1.5} />
              Ghid rapid — {currentSlide + 1} / {SLIDES.length}
            </div>
            <button
              type="button"
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 text-[11px] text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
              aria-label="Închide ghidul"
            >
              <X className="size-3" strokeWidth={2} />
              Sari peste
            </button>
          </div>

          {/* Slide body */}
          <div className="space-y-5 px-6 py-7">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-12 items-center justify-center rounded-eos-xl border ${accent.bg}`}
                aria-hidden
              >
                <SlideIcon className={`size-6 ${accent.icon}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  {slide.eyebrow}
                </p>
                <DialogTitle asChild>
                  <h2
                    data-display-text="true"
                    className="mt-0.5 font-display text-[19px] font-semibold tracking-[-0.015em] text-eos-text"
                  >
                    {slide.title}
                  </h2>
                </DialogTitle>
              </div>
            </div>

            <p className="text-[13.5px] leading-[1.65] text-eos-text">{slide.description}</p>

            <ul className="space-y-2.5">
              {slide.bullets.map((bullet, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <CheckCircle2
                    className={`mt-0.5 size-4 shrink-0 ${accent.icon}`}
                    strokeWidth={2}
                  />
                  <span className="text-[13px] leading-[1.55] text-eos-text-muted">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer with dots + nav */}
          <div className="flex items-center justify-between gap-4 border-t border-eos-border-subtle bg-eos-surface-variant px-5 py-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Slide indicator">
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={idx === currentSlide}
                  aria-label={`Slide ${idx + 1} din ${SLIDES.length}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentSlide
                      ? "w-6 bg-eos-primary"
                      : "w-1.5 bg-eos-border hover:bg-eos-border-strong"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={isFirstSlide}
                className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2} />
                Înapoi
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3.5 py-1.5 text-[12px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary"
              >
                {isLastSlide ? "Am înțeles, mă apuc" : "Continuă"}
                {!isLastSlide && <ArrowRight className="size-3.5" strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
