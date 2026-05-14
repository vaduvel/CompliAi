// S3.4 — Right-pane content per ICP segment pentru login/register page.
// Detectează `?icp=...` query param și schimbă hero + KPIs + testimonial
// pentru a se potrivi cu landing page-ul de proveniență.
//
// Default (fără ICP): mesaj neutru CompliScan + KPIs cross-framework.

import type { IcpSegment } from "@/lib/server/white-label"

export type LoginPaneKpi = {
  framework: string
  value: string
  tone: "ok" | "warning"
  label: string
}

export type LoginPaneContent = {
  /** Eyebrow uppercase deasupra heroului. */
  eyebrow: string
  /** H2 hero title (1-2 propoziții). */
  title: string
  /** 4 framework KPI cards grid 2×2. */
  kpis: LoginPaneKpi[]
  /** Testimonial quote + autor + rol. */
  testimonial: {
    quote: string
    author: string
    role: string
  }
  /** Accent color for blob (primary/violet/amber/emerald/indigo/rose/pink). */
  accent: "primary" | "violet" | "amber" | "emerald" | "indigo" | "rose" | "pink"
}

const DEFAULT_CONTENT: LoginPaneContent = {
  eyebrow: "— Sincronizare live · acum 2 ore",
  title: "Conformitate operată continuu, nu doar verificată anual.",
  kpis: [
    { framework: "GDPR", value: "47/47", tone: "ok", label: "firme conforme" },
    { framework: "AI Act", value: "12/47", tone: "warning", label: "high-risk identificate" },
    { framework: "NIS2", value: "8/47", tone: "warning", label: "în maturitate" },
    { framework: "e-Factura", value: "47/47", tone: "ok", label: "sincronizate ANAF" },
  ],
  testimonial: {
    quote: "Îmi recuperez o zi pe săptămână. CompliScan face scanarea, eu fac deciziile.",
    author: "Ramona Ilie",
    role: "expert contabil · 22 clienți",
  },
  accent: "primary",
}

const ICP_CONTENT_MAP: Record<IcpSegment, LoginPaneContent> = {
  solo: {
    eyebrow: "— Pentru proprietar / manager",
    title: "Ai timp pentru afacere. Conformitatea o ții ordonat în CompliScan.",
    kpis: [
      { framework: "GDPR", value: "12/12", tone: "ok", label: "controale aplicabile" },
      { framework: "e-Factura", value: "live", tone: "ok", label: "ANAF sincronizat" },
      { framework: "AI Act", value: "0/0", tone: "ok", label: "nu folosești AI încă" },
      { framework: "NIS2", value: "n/a", tone: "ok", label: "nu te aplică" },
    ],
    testimonial: {
      quote: "Am 18 angajați și nu mai am timp pentru consultanți care vin trimestrial. CompliScan îmi spune zilnic ce să fac.",
      author: "Alexandru R.",
      role: "fondator IMM · 18 angajați",
    },
    accent: "primary",
  },
  "cabinet-dpo": {
    eyebrow: "— Cabinete DPO România",
    title: "Înlocuim Excel + Word + Drive cu un cockpit finding-first pentru cabinetul tău.",
    kpis: [
      { framework: "GDPR", value: "23/25", tone: "ok", label: "clienți cu Privacy Policy" },
      { framework: "AI Act", value: "8/12", tone: "warning", label: "ROPA actualizate" },
      { framework: "Magic Link", value: "47/52", tone: "ok", label: "documente semnate" },
      { framework: "Audit Pack", value: "18", tone: "ok", label: "exporturi luna asta" },
    ],
    testimonial: {
      quote: "În 30 minute am setat brand-ul cabinetului, am adăugat 3 clienți și am generat primul Audit Pack ZIP. Patronul a aprobat în aceeași zi prin magic link.",
      author: "Diana Popescu",
      role: "DPO Complet · pilot kickoff 7 mai",
    },
    accent: "violet",
  },
  "cabinet-fiscal": {
    eyebrow: "— Sincronizare ANAF SPV live",
    title: "Cockpit cross-client. Vezi ce arde la TOATE firmele tale într-un singur ecran.",
    kpis: [
      { framework: "ANAF SPV", value: "47/47", tone: "ok", label: "clienți sincronizați" },
      { framework: "Cross-corr", value: "12", tone: "warning", label: "discrepanțe R1-R7" },
      { framework: "Pre-ANAF", value: "3", tone: "warning", label: "risc iminent detectat" },
      { framework: "Bank ↔ SPV", value: "2", tone: "warning", label: "plăți fără factură" },
    ],
    testimonial: {
      quote: "Îmi recuperez o zi pe săptămână. CompliScan face triage-ul, eu fac deciziile.",
      author: "Ramona Ilie",
      role: "expert contabil · 22 clienți",
    },
    accent: "amber",
  },
  "imm-internal": {
    eyebrow: "— IMM 50-250 angajați",
    title: "Control tower compliance într-un singur tool. Fără 4-8 consultanți fragmentați.",
    kpis: [
      { framework: "GDPR", value: "8/10", tone: "ok", label: "controale validate" },
      { framework: "NIS2", value: "5/8", tone: "warning", label: "în implementare" },
      { framework: "AI Act", value: "2/3", tone: "ok", label: "sisteme inventariate" },
      { framework: "DORA", value: "0/12", tone: "warning", label: "neînceput" },
    ],
    testimonial: {
      quote: "Suntem 120 de oameni. Înainte plăteam 4 consultanți, acum am un control tower cu toate frameworks-urile la un loc. ROI 4× în primul an.",
      author: "Mihai T.",
      role: "Compliance Officer · firmă fintech",
    },
    accent: "emerald",
  },
  enterprise: {
    eyebrow: "— CISO / Multi-framework Enterprise",
    title: "Governance layer NIS2 + DORA + ISO 27001 readiness peste stack-ul tău tehnic.",
    kpis: [
      { framework: "NIS2", value: "essential", tone: "ok", label: "entitate clasificată" },
      { framework: "Vendor Risk", value: "47", tone: "warning", label: "în registru" },
      { framework: "ISO 27001", value: "92/114", tone: "warning", label: "controale Annex A" },
      { framework: "DNSC", value: "submitted", tone: "ok", label: "înregistrare validă" },
    ],
    testimonial: {
      quote: "CompliScan nu înlocuiește SOC-ul, dar adaugă layer-ul de governance care lipsea între tooling tehnic și board. Rapoartele vin gata pentru audit.",
      author: "Cristina A.",
      role: "CISO · companie reglementată",
    },
    accent: "indigo",
  },
  "imm-hr": {
    eyebrow: "— HR Director / CHRO firme 100-500 ang",
    title: "Pay Transparency 2026 în 30 minute, nu 8 ore. Deadline 7 iunie 2026.",
    kpis: [
      { framework: "Gap salarial", value: "4.2%", tone: "ok", label: "sub prag 5%" },
      { framework: "Cereri angajați", value: "3", tone: "warning", label: "în 30 zile" },
      { framework: "Anunțuri job", value: "12/12", tone: "ok", label: "cu salary range" },
      { framework: "Raport ITM", value: "draft", tone: "ok", label: "gata de approve" },
    ],
    testimonial: {
      quote: "Aveam 247 de angajați și calculam gap-ul salarial cu 8 ore în Excel. CompliScan îl face în 30 secunde și generează raportul ITM cu un click.",
      author: "Andreea V.",
      role: "HR Director · firmă mid-market",
    },
    accent: "rose",
  },
  "cabinet-hr": {
    eyebrow: "— Cabinete HR consultanți",
    title: "Multi-client Pay Transparency cu logo cabinetul tău. 5-25 firme.",
    kpis: [
      { framework: "Firme client", value: "12/25", tone: "ok", label: "în portofoliu" },
      { framework: "Rapoarte ITM", value: "8", tone: "ok", label: "livrate luna asta" },
      { framework: "Cereri pending", value: "5", tone: "warning", label: "cross-client" },
      { framework: "MRR", value: "+34K lei", tone: "ok", label: "rebill clienți" },
    ],
    testimonial: {
      quote: "Cabinetul meu servea 8 firme cu Excel. Cu CompliScan am ajuns la 22 fără să angajez pe nimeni — rapoartele lunare se generează batch cu logo cabinet.",
      author: "Alexandra D.",
      role: "Cabinet HR · 22 clienți",
    },
    accent: "pink",
  },
}

const VALID_ICP: readonly IcpSegment[] = [
  "solo",
  "cabinet-dpo",
  "cabinet-fiscal",
  "cabinet-hr",
  "imm-internal",
  "imm-hr",
  "enterprise",
] as const

export function parseLoginIcp(value: string | null | undefined): IcpSegment | null {
  if (!value) return null
  return (VALID_ICP as readonly string[]).includes(value) ? (value as IcpSegment) : null
}

export function getLoginPaneContent(icp: IcpSegment | null): LoginPaneContent {
  // [FC-12 2026-05-14] Pentru deploy fiscal-only forțăm pane cabinet-fiscal
  // chiar dacă URL-ul nu are ?icp=cabinet-fiscal. Default DEFAULT_CONTENT
  // are referințe GDPR/NIS2/AI Act nepotrivite pentru CompliScan Fiscal.
  if (process.env.NEXT_PUBLIC_PRODUCT_MODE === "fiscal") {
    return ICP_CONTENT_MAP["cabinet-fiscal"]
  }
  if (!icp) return DEFAULT_CONTENT
  return ICP_CONTENT_MAP[icp]
}

const ACCENT_BLOB_CLASSES: Record<LoginPaneContent["accent"], { primary: string; secondary: string }> = {
  primary: {
    primary: "bg-eos-primary/15",
    secondary: "bg-violet-500/10",
  },
  violet: {
    primary: "bg-violet-500/20",
    secondary: "bg-eos-primary/10",
  },
  amber: {
    primary: "bg-amber-500/15",
    secondary: "bg-eos-primary/10",
  },
  emerald: {
    primary: "bg-emerald-500/15",
    secondary: "bg-eos-primary/10",
  },
  indigo: {
    primary: "bg-indigo-500/15",
    secondary: "bg-violet-500/10",
  },
  rose: {
    primary: "bg-rose-500/15",
    secondary: "bg-pink-500/10",
  },
  pink: {
    primary: "bg-pink-500/20",
    secondary: "bg-rose-500/10",
  },
}

export function getAccentBlobClasses(accent: LoginPaneContent["accent"]) {
  return ACCENT_BLOB_CLASSES[accent]
}

const ACCENT_TEXT_CLASSES: Record<LoginPaneContent["accent"], string> = {
  primary: "text-eos-primary",
  violet: "text-violet-400",
  amber: "text-amber-400",
  emerald: "text-emerald-400",
  indigo: "text-indigo-400",
  rose: "text-rose-400",
  pink: "text-pink-400",
}

export function getAccentTextClass(accent: LoginPaneContent["accent"]): string {
  return ACCENT_TEXT_CLASSES[accent]
}

const ACCENT_BORDER_CLASSES: Record<LoginPaneContent["accent"], string> = {
  primary: "border-eos-primary",
  violet: "border-violet-500",
  amber: "border-amber-500",
  emerald: "border-emerald-500",
  indigo: "border-indigo-500",
  rose: "border-rose-500",
  pink: "border-pink-500",
}

export function getAccentBorderClass(accent: LoginPaneContent["accent"]): string {
  return ACCENT_BORDER_CLASSES[accent]
}
