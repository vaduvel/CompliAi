# Pay Transparency Pillar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lansăm pillar-ul Pay Transparency cu workspace dedicat HR (icpSegment `imm-hr` + `cabinet-hr`), exact pattern-ul DPO existent — landing dedicat → login → onboarding → workspace HR cu cockpit Pay Transparency-first.

**Architecture:** Reuse 100% pattern existent (LandingPageShell, IcpSegment type, STRIPE_TIER_REGISTRY, getLoginPaneContent, OnboardingForm). Pay Transparency module în cod (~890 linii) este DEJA funcțional pentru calculate gap + report draft + UI deadline countdown. Adăugăm: HR ICP segment + landing `/hr` + 4 tier-uri stripe + login pane HR + onboarding HR mode + sidebar variant + 4 features noi (salary range generator, job architecture, employee request portal, ITM PDF export).

**Tech Stack:** Next.js 15 App Router · React Server Components · TypeScript · Tailwind · pdfkit · adaptive storage (Supabase + local fallback) · existing pay-gap-calculator + pay-transparency-store · existing white-label store · existing finding-kernel.

---

## File Structure

### Files to CREATE (new)

| File | LOC est. | Responsibility |
|------|----------|----------------|
| `app/hr/page.tsx` | ~80 | Landing public `/hr` cu LandingPageShell pentru icpSegment "imm-hr" |
| `app/cabinet-hr/page.tsx` | ~80 | Landing public `/cabinet-hr` pentru icpSegment "cabinet-hr" |
| `lib/compliscan/login-icp-content.ts` (modify only) | +30 | Pane content nou pentru "imm-hr" și "cabinet-hr" |
| `lib/server/white-label.ts` (modify) | +5 | Adaugă "imm-hr" și "cabinet-hr" la IcpSegment type |
| `lib/server/stripe-tier-config.ts` (modify) | +120 | 4 tier-uri noi: hr-business, hr-cabinet, hr-cabinet-plus, hr-solo |
| `lib/compliance/job-architecture.ts` | ~200 | Job level + role + band schema + computeSalaryRange |
| `lib/compliance/salary-range-generator.ts` | ~80 | Generator text formatat pentru anunțuri job (BestJobs/LinkedIn) |
| `lib/compliance/job-architecture.test.ts` | ~120 | Tests pentru job architecture |
| `lib/compliance/salary-range-generator.test.ts` | ~60 | Tests pentru generator |
| `lib/server/job-architecture-store.ts` | ~150 | CRUD job architecture per orgId |
| `app/api/job-architecture/route.ts` | ~80 | GET/POST/PATCH endpoints |
| `app/api/job-architecture/route.test.ts` | ~80 | Tests API |
| `components/compliscan/job-architecture-builder.tsx` | ~250 | UI matrix level × role + range editor |
| `components/compliscan/salary-range-generator-card.tsx` | ~120 | UI generator text pentru anunțuri |
| `lib/server/pay-transparency-requests-store.ts` | ~200 | CRUD employee requests + 30-zile timer + auto-reply |
| `lib/server/pay-transparency-requests-store.test.ts` | ~150 | Tests store |
| `app/api/pay-transparency/requests/route.ts` | ~80 | GET (list HR) + POST (auto from portal) |
| `app/api/pay-transparency/requests/[id]/route.ts` | ~80 | GET single + PATCH transition |
| `app/api/pay-transparency/requests/portal/[token]/route.ts` | ~100 | Public form submit token-based |
| `app/employee-portal/[token]/page.tsx` | ~150 | Public form (token, ca whistleblowing) |
| `components/compliscan/pay-transparency-requests-tab.tsx` | ~180 | UI tab cu lista cereri + 30-zile countdown |
| `lib/exports/itm-pay-gap-pdf.ts` | ~150 | ITM-shaped PDF reuse pdfkit |
| `lib/exports/itm-pay-gap-pdf.test.ts` | ~60 | Tests PDF rendering |
| `app/api/pay-transparency/report/[id]/pdf/route.ts` | ~50 | GET PDF binary |
| `lib/compliance/contract-confidentiality-checker.ts` | ~120 | Text scan pentru clauze confidențialitate |
| `lib/compliance/contract-confidentiality-checker.test.ts` | ~80 | Tests checker |
| `app/api/contracts/check-confidentiality/route.ts` | ~60 | POST upload + scan |
| `components/compliscan/portfolio-pay-transparency-page.tsx` | ~250 | Cross-client cabinet view |
| `app/portfolio/pay-transparency/page.tsx` | ~50 | Page wrapper |

**Total NEW: ~3.510 LOC + tests** (revizuit: subscriere realistă a estimei, includ teste).

### Files to MODIFY (existing)

| File | Modification | LOC ±  |
|------|--------------|--------|
| `lib/server/white-label.ts` | Adaugă "imm-hr" + "cabinet-hr" la `IcpSegment` union | +5 |
| `lib/compliscan/login-icp-content.ts` | Adaugă pane content pentru HR | +30 |
| `lib/server/stripe-tier-config.ts` | Adaugă 4 tier-uri HR | +120 |
| `components/compliscan/onboarding-form.tsx` | Sub-mode pentru HR în compliance/partner | +50 |
| `components/compliscan/landing-page-shell.tsx` | Asigură că suportă noul ICP | 0 (already generic) |
| `components/compliscan/pay-transparency-page.tsx` | Tab-uri noi: Salary Ranges, Requests Portal | +100 |
| `lib/compliscan/dashboard-routes.ts` | Adaugă rute noi pentru sub-pagini | +5 |
| `lib/compliscan/portfolio-routes.ts` | Adaugă rute portfolio HR | +5 |
| `components/compliscan/navigation.ts` | Sub-meniu Pay Transparency | +10 |
| `lib/server/onboarding-destination.ts` | Routing post-onboarding HR | +20 |

**Total MODIFY: ~345 LOC**

### Grand Total: ~3.855 LOC noi + tests

---

# SPRINT 0 — HR Workspace Foundation (1 săptămână)

**Goal:** Replică pattern DPO/fiscal pentru HR — landing dedicat, login pane, onboarding mode, ICP segment, tier billing. ZERO breaking changes la modulele existente.

### Task 0.1: Adaugă HR la IcpSegment type

**Files:**
- Modify: `lib/server/white-label.ts:48-54`

- [ ] **Step 1: Read current IcpSegment definition**

```bash
grep -n "IcpSegment" lib/server/white-label.ts
```

Expected: `export type IcpSegment = "solo" | "cabinet-dpo" | "cabinet-fiscal" | "imm-internal" | "enterprise"`

- [ ] **Step 2: Update IcpSegment union to include HR variants**

Edit `lib/server/white-label.ts`:

```typescript
export type IcpSegment =
  | "solo"
  | "cabinet-dpo"
  | "cabinet-fiscal"
  | "cabinet-hr"        // NEW — cabinet HR consultant care servește multipli clienți
  | "imm-internal"
  | "imm-hr"            // NEW — HR Director / CHRO la firma proprie 50-500 ang
  | "enterprise"
```

- [ ] **Step 3: Run typecheck to ensure no breakage**

Run: `npx tsc --noEmit`
Expected: PASS (sau errors enumerate care arată unde mai trebuie acoperit)

- [ ] **Step 4: Update toate switch/match statements care folosesc IcpSegment**

Run: `grep -rn "icpSegment ===" lib/ components/ app/ --include="*.ts" --include="*.tsx"`

Pentru fiecare switch/if-else, adaugă cazurile noi. Aplică pattern existent (ex: tratează "imm-hr" similar cu "imm-internal" și "cabinet-hr" similar cu "cabinet-fiscal").

- [ ] **Step 5: Commit**

```bash
git add lib/server/white-label.ts
git commit -m "feat(hr): add imm-hr and cabinet-hr to IcpSegment type"
```

### Task 0.2: Adaugă login pane content pentru HR

**Files:**
- Modify: `lib/compliscan/login-icp-content.ts`

- [ ] **Step 1: Read existing login-icp-content patterns**

Run: `cat lib/compliscan/login-icp-content.ts | head -80`
Verify: există `getLoginPaneContent(icpSegment)` cu cazuri pentru "cabinet-dpo", "cabinet-fiscal", "imm-internal", "enterprise"

- [ ] **Step 2: Adaugă write failing test**

Create `lib/compliscan/login-icp-content.test.ts` (dacă nu există):

```typescript
import { describe, it, expect } from "vitest"
import { getLoginPaneContent, parseLoginIcp } from "./login-icp-content"

describe("login-icp-content HR", () => {
  it("returns HR pane for imm-hr segment", () => {
    const content = getLoginPaneContent("imm-hr")
    expect(content.title).toContain("Pay Transparency")
    expect(content.bullets.length).toBeGreaterThan(2)
  })

  it("returns cabinet-hr pane for cabinet-hr segment", () => {
    const content = getLoginPaneContent("cabinet-hr")
    expect(content.title).toContain("cabinet HR")
  })

  it("parseLoginIcp accepts hr query params", () => {
    expect(parseLoginIcp("imm-hr")).toBe("imm-hr")
    expect(parseLoginIcp("cabinet-hr")).toBe("cabinet-hr")
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/compliscan/login-icp-content.test.ts`
Expected: FAIL — "imm-hr" not handled

- [ ] **Step 4: Add HR cases to login-icp-content.ts**

Edit `lib/compliscan/login-icp-content.ts`:

```typescript
const HR_INTERNAL_PANE: LoginPaneContent = {
  title: "Pay Transparency în 30 minute, nu 8 ore",
  subtitle: "Pentru HR Directors la firme 100-500 angajați. Deadline 7 iunie 2026.",
  bullets: [
    "Calculator gap salarial automat din CSV",
    "Salary range gata pentru anunțuri job",
    "Employee request portal (răspuns 30 zile auto-tracking)",
    "Raport ITM-shaped PDF descărcabil",
  ],
  accent: "violet",
}

const HR_CABINET_PANE: LoginPaneContent = {
  title: "Cabinet HR pentru 5-25 firme client",
  subtitle: "White-label complet, brand cabinetul tău. Rebill 200-400 lei/client.",
  bullets: [
    "Cross-client dashboard Pay Transparency",
    "Bulk import salary records din ERP/Excel",
    "Rapoarte lunare batch cu logo cabinet",
    "Alerte cereri angajați aproape de termen",
  ],
  accent: "blue",
}

export function parseLoginIcp(value: string | null): IcpSegment | null {
  if (!value) return null
  if (
    value === "solo" ||
    value === "cabinet-dpo" ||
    value === "cabinet-fiscal" ||
    value === "cabinet-hr" ||
    value === "imm-internal" ||
    value === "imm-hr" ||
    value === "enterprise"
  ) {
    return value
  }
  return null
}

export function getLoginPaneContent(icpSegment: IcpSegment | null): LoginPaneContent {
  switch (icpSegment) {
    case "imm-hr":
      return HR_INTERNAL_PANE
    case "cabinet-hr":
      return HR_CABINET_PANE
    case "cabinet-dpo":
      return CABINET_DPO_PANE
    case "cabinet-fiscal":
      return CABINET_FISCAL_PANE
    case "imm-internal":
      return IMM_INTERNAL_PANE
    case "enterprise":
      return ENTERPRISE_PANE
    case "solo":
    default:
      return SOLO_PANE
  }
}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npx vitest run lib/compliscan/login-icp-content.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add lib/compliscan/login-icp-content.ts lib/compliscan/login-icp-content.test.ts
git commit -m "feat(hr): add login pane content for imm-hr and cabinet-hr"
```

### Task 0.3: Adaugă tier-urile HR la Stripe registry

**Files:**
- Modify: `lib/server/stripe-tier-config.ts`

- [ ] **Step 1: Read existing tier registry**

Run: `grep -n "STRIPE_TIER_REGISTRY" lib/server/stripe-tier-config.ts`

- [ ] **Step 2: Add 4 HR tiers**

Edit `lib/server/stripe-tier-config.ts` în obiectul `STRIPE_TIER_REGISTRY`:

```typescript
  // ── IMM HR segment (HR Director firma 100-500 ang) ─────────────────────────
  "hr-business": {
    id: "hr-business",
    label: "HR Business",
    priceLabelEur: 149,
    icpSegment: "imm-hr",
    billingScope: "org",
    envVar: "STRIPE_PRICE_HR_BUSINESS_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "1 organizație, nelimitat angajați",
      "Calculator gap + raport draft/approved/published",
      "Salary range generator pentru anunțuri",
      "Job architecture builder",
      "Employee request portal (30 cereri/lună)",
      "Audit Pack ITM PDF descărcabil",
    ],
  },

  "hr-business-pro": {
    id: "hr-business-pro",
    label: "HR Business Pro",
    priceLabelEur: 249,
    icpSegment: "imm-hr",
    billingScope: "org",
    envVar: "STRIPE_PRICE_HR_BUSINESS_PRO_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "Tot din HR Business",
      "Cereri nelimitate angajați",
      "ITM PDF white-labeled",
      "Anti-confidentiality contract checker",
      "Email notifications deadline + cereri",
      "Bundle GDPR + AI Act + e-Factura",
    ],
  },

  // ── Cabinet HR segment (consultant HR multi-client) ────────────────────────
  "hr-cabinet": {
    id: "hr-cabinet",
    label: "Cabinet HR",
    priceLabelEur: 299,
    icpSegment: "cabinet-hr",
    billingScope: "account",
    envVar: "STRIPE_PRICE_HR_CABINET_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_CABINET_PRO_MONTHLY",
    features: [
      "5 firme client",
      "White-label complet (logo, brand color, signature)",
      "Cross-client Pay Transparency dashboard",
      "Bulk import salary records",
      "Rapoarte lunare batch cu brand cabinet",
    ],
  },

  "hr-cabinet-plus": {
    id: "hr-cabinet-plus",
    label: "Cabinet HR+",
    priceLabelEur: 699,
    icpSegment: "cabinet-hr",
    billingScope: "account",
    envVar: "STRIPE_PRICE_HR_CABINET_PLUS_MONTHLY",
    fallbackEnvVar: "STRIPE_PRICE_CABINET_PRO_MONTHLY",
    features: [
      "25 firme client",
      "Custom domain (cabinet.compliai.ro)",
      "API access",
      "Cabinet revenue dashboard",
      "Priority support + SLA",
    ],
  },
```

- [ ] **Step 3: Add fallback prices in `.env.example`**

Edit `.env.example`:

```bash
# HR segment Stripe Price IDs (Pay Transparency pillar)
STRIPE_PRICE_HR_BUSINESS_MONTHLY=
STRIPE_PRICE_HR_BUSINESS_PRO_MONTHLY=
STRIPE_PRICE_HR_CABINET_MONTHLY=
STRIPE_PRICE_HR_CABINET_PLUS_MONTHLY=
```

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/stripe-tier-config.ts .env.example
git commit -m "feat(hr): add 4 Stripe tiers for HR ICP segment (Pay Transparency)"
```

### Task 0.4: Creează landing page `/hr`

**Files:**
- Create: `app/hr/page.tsx`

- [ ] **Step 1: Verify LandingPageShell signature**

Run: `head -60 components/compliscan/landing-page-shell.tsx`
Verify props: `icpSegment`, `eyebrow`, `title`, `subtitle`, `frameworks`, `features`, `steps`

- [ ] **Step 2: Create app/hr/page.tsx**

```typescript
// Landing page public HR (HR Directors firme 100-500 ang)
// Pay Transparency Directiva 2023/970 — deadline 7 iunie 2026

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan HR — Pay Transparency 2026 pentru HR Directors",
  description:
    "Calculator gap salarial automat + salary range pentru anunțuri + employee request portal. Compliance Directiva 2023/970 fără Excel. Deadline 7 iunie 2026.",
  alternates: { canonical: "/hr" },
  openGraph: {
    title: "CompliScan HR — Pay Transparency 2026",
    description: "Pay Transparency complet pentru firme 100-500 ang. Deadline 7 iunie 2026.",
    url: "/hr",
    type: "website",
  },
}

export default function HrLandingPage() {
  return (
    <LandingPageShell
      icpSegment="imm-hr"
      eyebrow="HR Directors firme 100-500 ang"
      title="Pay Transparency 2026 — în 30 minute, nu 8 ore"
      subtitle="Calculator gap automat. Salary range pentru anunțuri. Employee request portal. Raport ITM gata. Deadline 7 iunie 2026."
      frameworks={["Directiva UE 2023/970", "Codul Muncii", "ITM controale", "GDPR"]}
      features={[
        {
          title: "Calculator gap salarial automat",
          description: "Upload CSV grilă salarială → vezi gap pe role, department, gender. Risk level low/medium/high cu recomandări.",
        },
        {
          title: "Salary range generator",
          description: "Click pe role + level → primești text gata pentru BestJobs/LinkedIn/eJobs. Nu mai scrii „salariu negociabil”.",
        },
        {
          title: "Employee request portal",
          description: "Token public. Angajatul completează formular, tu primești în dashboard cu countdown 30 zile. Răspuns auto-format.",
        },
        {
          title: "Raport ITM PDF",
          description: "Generator raport ITM-shaped, gata de submit. Status workflow draft → approved → published. White-label dacă ești cabinet.",
        },
        {
          title: "Anti-confidentiality checker",
          description: "Upload contract → scan auto pentru clauze confidențialitate salarială (interzise din iunie 2026). Raport detection.",
        },
        {
          title: "Job architecture builder",
          description: "Construiești level + role + range odată. Salary ranges pentru anunțuri se generează din ele. Update central.",
        },
      ]}
      steps={[
        {
          n: "1",
          title: "Upload CSV grilă",
          description: "Format simplu: jobRole, gender, salaryBrut, salaryBonuses, contractType, department.",
        },
        {
          n: "2",
          title: "Vezi gap calculation",
          description: "Risk level + role gap top + recomandări automate.",
        },
        {
          n: "3",
          title: "Generează raport draft",
          description: "Status workflow: draft → approve → publish. Versionate.",
        },
        {
          n: "4",
          title: "Activează portal angajați",
          description: "Public link cu token. Cereri intră direct cu countdown 30 zile.",
        },
      ]}
      primaryCtaLabel="Începe trial 30 zile"
      primaryCtaHref="/login?icp=imm-hr&mode=register"
    />
  )
}
```

- [ ] **Step 3: Verify page renders**

Run: `npx next dev` apoi browse `http://localhost:3000/hr`
Expected: pagina apare fără errors, conține "Pay Transparency 2026 — în 30 minute"

- [ ] **Step 4: Commit**

```bash
git add app/hr/page.tsx
git commit -m "feat(hr): add /hr landing page for imm-hr ICP segment"
```

### Task 0.5: Creează landing page `/cabinet-hr`

**Files:**
- Create: `app/cabinet-hr/page.tsx`

- [ ] **Step 1: Create app/cabinet-hr/page.tsx**

```typescript
// Landing page public Cabinet HR (consultanți HR multi-client)
// White-label complet pentru cabinete care servesc 5-25 clienți

import type { Metadata } from "next"

import { LandingPageShell } from "@/components/compliscan/landing-page-shell"

export const metadata: Metadata = {
  title: "CompliScan pentru Cabinete HR — multi-client cu white-label",
  description:
    "Pay Transparency cross-client cu logo cabinet. 5-25 firme client. Bulk import + rapoarte lunare batch + alerte cereri angajați. Rebill 200-400 lei/client.",
  alternates: { canonical: "/cabinet-hr" },
  openGraph: {
    title: "CompliScan pentru Cabinete HR",
    description: "Multi-client Pay Transparency cu white-label complet.",
    url: "/cabinet-hr",
    type: "website",
  },
}

export default function CabinetHrLandingPage() {
  return (
    <LandingPageShell
      icpSegment="cabinet-hr"
      eyebrow="Cabinete HR consultanți"
      title="Multi-client HR cu white-label complet"
      subtitle="5-25 firme client în același dashboard. Logo, brand color, signature consultant pe rapoarte. Rebill 200-400 lei/client/lună."
      frameworks={["Directiva 2023/970", "Pay Transparency", "GDPR HR", "ITM compliance"]}
      features={[
        {
          title: "Cross-client dashboard",
          description: "Toate firmele tale într-un single pane. Vezi care e aproape de deadline, care are gap critic, care are cereri în așteptare.",
        },
        {
          title: "Bulk import salary records",
          description: "Upload 10 CSV-uri o dată. Mapare automată per firmă. Calcul gap per client în 30 secunde.",
        },
        {
          title: "Rapoarte lunare batch",
          description: "5-25 PDF-uri ITM-shaped generate într-un click. Logo cabinet pe fiecare. Email automat la clienți.",
        },
        {
          title: "Alerte cereri angajați",
          description: "Vezi când e o cerere aproape de 30 zile la un client. Nu mai pierzi termene.",
        },
        {
          title: "Cabinet revenue dashboard",
          description: "MRR per client, churn rate, growth. Vezi rebill margin în timp real.",
        },
      ]}
      steps={[
        {
          n: "1",
          title: "Setup white-label",
          description: "Logo, culoare brand, signature consultant. 5 minute.",
        },
        {
          n: "2",
          title: "Importă firme client",
          description: "5-25 firme cu CUI. Magic link de acces dacă vrei.",
        },
        {
          n: "3",
          title: "Bulk import grile salariale",
          description: "Per client, CSV-ul lui. Calcul instant.",
        },
        {
          n: "4",
          title: "Livrează rapoarte ITM",
          description: "Lunar batch, brand cabinet. Trimite email automat.",
        },
      ]}
      primaryCtaLabel="Pilot 5 firme — 30 zile gratis"
      primaryCtaHref="/login?icp=cabinet-hr&mode=register"
    />
  )
}
```

- [ ] **Step 2: Verify and commit**

Run: `npx next dev` apoi browse `http://localhost:3000/cabinet-hr`

```bash
git add app/cabinet-hr/page.tsx
git commit -m "feat(hr): add /cabinet-hr landing for cabinet-hr ICP segment"
```

### Task 0.6: Add HR mode la onboarding

**Files:**
- Modify: `components/compliscan/onboarding-form.tsx`
- Modify: `lib/server/onboarding-destination.ts`

- [ ] **Step 1: Read current onboarding flow**

Run: `head -120 components/compliscan/onboarding-form.tsx`

- [ ] **Step 2: Add ICP detection logic**

Edit `components/compliscan/onboarding-form.tsx` la începutul componentei:

```typescript
import { useSearchParams } from "next/navigation"

// In component:
const searchParams = useSearchParams()
const icpFromQuery = searchParams.get("icp")

// Auto-set userMode based on ICP
const initialModeFromIcp = (() => {
  if (icpFromQuery === "imm-hr") return "compliance"
  if (icpFromQuery === "cabinet-hr") return "partner"
  return null
})()
```

- [ ] **Step 3: Add HR sub-segment in onboarding**

În după ce user-ul selectează modul, adaugă step nou pentru HR sub-segment:

```typescript
type HrSubSegment = "hr-director" | "hr-cabinet" | "general-compliance"

// Display HR-specific question dacă icpFromQuery === "imm-hr" sau "cabinet-hr":
if (icpFromQuery === "imm-hr") {
  return (
    <div>
      <h2>Câți angajați are firma?</h2>
      <RadioGroup value={employeeCount} onChange={setEmployeeCount}>
        <RadioOption value="50-99" label="50-99 angajați" />
        <RadioOption value="100-249" label="100-249 angajați (recomandat)" />
        <RadioOption value="250+" label="250+ angajați (raportare anuală)" />
      </RadioGroup>
    </div>
  )
}
```

- [ ] **Step 4: Update onboarding-destination logic**

Edit `lib/server/onboarding-destination.ts`:

```typescript
export function resolveOnboardingDestination(opts: {
  userMode: "solo" | "partner" | "compliance"
  icpSegment?: IcpSegment | null
}): string {
  // HR-specific routing
  if (opts.icpSegment === "imm-hr" || opts.icpSegment === "cabinet-hr") {
    return "/dashboard/pay-transparency"
  }

  // Cabinet routing
  if (opts.userMode === "partner") {
    return "/portfolio"
  }

  // Default
  return "/dashboard"
}
```

- [ ] **Step 5: Test manual**

Run: `npx next dev`
Browse: `/login?icp=imm-hr&mode=register` → register → onboarding shows "Câți angajați" → submit → redirected to `/dashboard/pay-transparency`

- [ ] **Step 6: Commit**

```bash
git add components/compliscan/onboarding-form.tsx lib/server/onboarding-destination.ts
git commit -m "feat(hr): HR onboarding flow with employee count step + auto-route to pay-transparency"
```

### Task 0.7: Update sidebar navigation pentru HR mode

**Files:**
- Modify: `components/compliscan/navigation.ts`

- [ ] **Step 1: Read current navigation structure**

Run: `head -100 components/compliscan/navigation.ts`

- [ ] **Step 2: Add HR-mode-aware sidebar variant**

Edit `components/compliscan/navigation.ts`:

```typescript
// Pentru icpSegment "imm-hr" sau "cabinet-hr", Pay Transparency devine PRIMARY
// (apare sus în sidebar, nu sub Monitoring)

export function buildSidebar(opts: {
  userMode: UserMode
  icpSegment: IcpSegment | null
  applicability: { hasNis2: boolean; hasAiAct: boolean; hasPayTransparency: boolean }
}): SidebarSection[] {
  // Existing logic...

  // HR mode: Pay Transparency primary
  if (opts.icpSegment === "imm-hr" || opts.icpSegment === "cabinet-hr") {
    return [
      {
        label: "Pay Transparency",
        items: [
          { id: "pt-overview", label: "Prezentare", href: "/dashboard/pay-transparency", icon: BarChart },
          { id: "pt-job-arch", label: "Job architecture", href: "/dashboard/pay-transparency/job-architecture", icon: Layers },
          { id: "pt-ranges", label: "Salary ranges", href: "/dashboard/pay-transparency/ranges", icon: Tag },
          { id: "pt-requests", label: "Cereri angajați", href: "/dashboard/pay-transparency/requests", icon: MessageSquare },
          { id: "pt-reports", label: "Rapoarte ITM", href: "/dashboard/pay-transparency/reports", icon: FileText },
        ],
      },
      {
        label: "Suport",
        items: [
          { id: "documents", label: "Documente", href: "/dashboard/documente", icon: FolderOpen },
          { id: "settings", label: "Setări", href: "/dashboard/settings", icon: Settings },
        ],
      },
    ]
  }

  // Existing logic for other ICP segments...
}
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit`

- [ ] **Step 4: Commit**

```bash
git add components/compliscan/navigation.ts
git commit -m "feat(hr): HR-mode-aware sidebar with Pay Transparency primary"
```

### Task 0.8: Smoke test end-to-end Sprint 0

- [ ] **Step 1: Run dev server**

Run: `npx next dev`

- [ ] **Step 2: Test landing /hr**

Browse: `http://localhost:3000/hr`
Expected: title "Pay Transparency 2026 — în 30 minute, nu 8 ore"

- [ ] **Step 3: Test landing /cabinet-hr**

Browse: `http://localhost:3000/cabinet-hr`
Expected: title "Multi-client HR cu white-label complet"

- [ ] **Step 4: Test login pane HR**

Browse: `http://localhost:3000/login?icp=imm-hr`
Expected: right pane shows "Pay Transparency în 30 minute, nu 8 ore"

- [ ] **Step 5: Test full register flow**

Browse: `/login?icp=imm-hr&mode=register` → fill form → onboarding shows employee count step → submit → lands on `/dashboard/pay-transparency`

- [ ] **Step 6: Verify sidebar HR mode**

After login as imm-hr, sidebar shows: "Pay Transparency" primary section cu sub-items: Prezentare, Job architecture, Salary ranges, Cereri angajați, Rapoarte ITM

- [ ] **Step 7: Verify pricing page shows HR tiers**

Browse: `/pricing` cu user logged-in cu icpSegment "imm-hr"
Expected: tier-uri "HR Business 149€", "HR Business Pro 249€" vizibile

- [ ] **Step 8: Tag Sprint 0 done**

```bash
git tag sprint-0-hr-foundation-done
```

---

# SPRINT 1 — Salary Range Generator + Job Architecture Builder (1 săptămână)

**Goal:** Cea mai mare cerere a Andreei — "Salary range pentru anunțul de job". User construiește o dată Job Architecture (level × role), apoi generează ranges instant pentru anunțuri.

### Task 1.1: Lib `job-architecture.ts` — types + builder

**Files:**
- Create: `lib/compliance/job-architecture.ts`
- Create: `lib/compliance/job-architecture.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/compliance/job-architecture.test.ts`:

```typescript
import { describe, it, expect } from "vitest"
import {
  buildJobArchitecture,
  computeSalaryRange,
  type JobArchitecture,
  type JobLevel,
} from "./job-architecture"

describe("job-architecture", () => {
  it("builds architecture with levels + roles", () => {
    const arch = buildJobArchitecture({
      levels: ["junior", "mid", "senior"],
      roles: ["marketing-specialist", "sales-rep"],
      bands: [
        { level: "junior", role: "marketing-specialist", min: 4000, max: 5500 },
        { level: "mid", role: "marketing-specialist", min: 5500, max: 7500 },
        { level: "senior", role: "marketing-specialist", min: 7500, max: 11000 },
      ],
    })
    expect(arch.bands.length).toBe(3)
    expect(arch.levels).toContain("mid")
  })

  it("computes salary range with min/mid/max for valid level+role", () => {
    const arch = buildJobArchitecture({
      levels: ["mid"],
      roles: ["dev"],
      bands: [{ level: "mid", role: "dev", min: 8000, max: 12000 }],
    })
    const range = computeSalaryRange(arch, "mid", "dev")
    expect(range).toEqual({ min: 8000, mid: 10000, max: 12000 })
  })

  it("returns null for missing band", () => {
    const arch = buildJobArchitecture({ levels: [], roles: [], bands: [] })
    expect(computeSalaryRange(arch, "junior", "ceo")).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify FAIL**

Run: `npx vitest run lib/compliance/job-architecture.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement minimal**

Create `lib/compliance/job-architecture.ts`:

```typescript
// Pay Transparency — Job Architecture builder
// Schema: level × role × salary band (min/max RON brut)

export type JobLevel = string
export type JobRole = string

export type SalaryBand = {
  level: JobLevel
  role: JobRole
  min: number  // RON brut
  max: number  // RON brut
  currency?: "RON" | "EUR"
}

export type SalaryRange = {
  min: number
  mid: number  // computed: (min + max) / 2
  max: number
}

export type JobArchitecture = {
  levels: JobLevel[]
  roles: JobRole[]
  bands: SalaryBand[]
}

export type JobArchitectureInput = {
  levels: JobLevel[]
  roles: JobRole[]
  bands: SalaryBand[]
}

export function buildJobArchitecture(input: JobArchitectureInput): JobArchitecture {
  return {
    levels: [...new Set(input.levels)].sort(),
    roles: [...new Set(input.roles)].sort(),
    bands: input.bands,
  }
}

export function computeSalaryRange(
  arch: JobArchitecture,
  level: JobLevel,
  role: JobRole,
): SalaryRange | null {
  const band = arch.bands.find(
    (b) => b.level === level && b.role === role,
  )
  if (!band) return null
  return {
    min: band.min,
    mid: Math.round((band.min + band.max) / 2),
    max: band.max,
  }
}
```

- [ ] **Step 4: Run tests to verify PASS**

Run: `npx vitest run lib/compliance/job-architecture.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/compliance/job-architecture.ts lib/compliance/job-architecture.test.ts
git commit -m "feat(hr): add job architecture types + computeSalaryRange"
```

### Task 1.2: Lib `salary-range-generator.ts` — text formatat anunțuri

**Files:**
- Create: `lib/compliance/salary-range-generator.ts`
- Create: `lib/compliance/salary-range-generator.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, it, expect } from "vitest"
import { generateRangeForJobAd, type SalaryRangeAdInput } from "./salary-range-generator"

describe("salary-range-generator", () => {
  it("generates BestJobs format with min-max", () => {
    const text = generateRangeForJobAd({
      role: "Marketing Specialist",
      level: "Mid",
      range: { min: 5500, mid: 6500, max: 7500 },
      currency: "RON",
      format: "bestjobs",
    })
    expect(text).toContain("5.500")
    expect(text).toContain("7.500")
    expect(text).toContain("RON")
    expect(text).toContain("Marketing Specialist")
  })

  it("generates LinkedIn format with mid only", () => {
    const text = generateRangeForJobAd({
      role: "Sales Rep",
      level: "Senior",
      range: { min: 7000, mid: 8500, max: 10000 },
      currency: "RON",
      format: "linkedin",
    })
    expect(text).toContain("Salary range")
    expect(text).toContain("7,000")
    expect(text).toContain("10,000")
  })

  it("includes Pay Transparency disclaimer for 2026", () => {
    const text = generateRangeForJobAd({
      role: "Dev",
      level: "Junior",
      range: { min: 5000, mid: 6000, max: 7000 },
      currency: "RON",
      format: "bestjobs",
    })
    expect(text).toContain("Directiva 2023/970")
  })
})
```

- [ ] **Step 2: Run test FAIL**

Run: `npx vitest run lib/compliance/salary-range-generator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal**

```typescript
// Pay Transparency — Salary Range Generator pentru anunțuri job
// Output formatat pentru BestJobs / LinkedIn / eJobs / generic
// Conform Directivei 2023/970, art. 5: angajatorul publică salariu sau range

import type { SalaryRange } from "./job-architecture"

export type AdFormat = "bestjobs" | "linkedin" | "ejobs" | "generic"

export type SalaryRangeAdInput = {
  role: string
  level: string
  range: SalaryRange
  currency: "RON" | "EUR"
  format: AdFormat
}

export function generateRangeForJobAd(input: SalaryRangeAdInput): string {
  const { role, level, range, currency, format } = input
  const symbol = currency === "RON" ? "RON" : "EUR"
  const fmt = (n: number) => {
    if (format === "linkedin") {
      return n.toLocaleString("en-US")
    }
    return n.toLocaleString("ro-RO")
  }

  const disclaimer =
    "(Conform Directivei 2023/970, range salarial publicat conform politicii de transparență.)"

  switch (format) {
    case "bestjobs":
      return [
        `${role} (${level})`,
        `Salariu brut: ${fmt(range.min)} - ${fmt(range.max)} ${symbol}/lună`,
        disclaimer,
      ].join("\n")
    case "linkedin":
      return [
        `${role} — ${level} level`,
        `Salary range: ${fmt(range.min)}-${fmt(range.max)} ${symbol}/month gross`,
        disclaimer,
      ].join("\n")
    case "ejobs":
      return [
        `Pentru rolul de ${role} (nivel ${level}), oferim:`,
        `- Salariu brut între ${fmt(range.min)} și ${fmt(range.max)} ${symbol}/lună`,
        disclaimer,
      ].join("\n")
    case "generic":
    default:
      return [
        `${role} - ${level}`,
        `${fmt(range.min)}-${fmt(range.max)} ${symbol}`,
        disclaimer,
      ].join("\n")
  }
}
```

- [ ] **Step 4: Run tests PASS**

Run: `npx vitest run lib/compliance/salary-range-generator.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/compliance/salary-range-generator.ts lib/compliance/salary-range-generator.test.ts
git commit -m "feat(hr): salary range generator for BestJobs/LinkedIn/eJobs"
```

### Task 1.3: Store `job-architecture-store.ts` cu persistence

**Files:**
- Create: `lib/server/job-architecture-store.ts`

- [ ] **Step 1: Implement using existing storage-adapter pattern**

```typescript
import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import type { JobArchitecture, SalaryBand } from "@/lib/compliance/job-architecture"

const storage = createAdaptiveStorage<JobArchitecture>(
  "job-architecture",
  "job_architecture_state",
)

export async function getJobArchitecture(orgId: string): Promise<JobArchitecture> {
  const stored = await storage.read(orgId)
  if (!stored) {
    return { levels: [], roles: [], bands: [] }
  }
  return stored
}

export async function saveJobArchitecture(
  orgId: string,
  arch: JobArchitecture,
): Promise<JobArchitecture> {
  await storage.write(orgId, arch)
  return arch
}

export async function addBand(
  orgId: string,
  band: SalaryBand,
): Promise<JobArchitecture> {
  const current = await getJobArchitecture(orgId)
  const filtered = current.bands.filter(
    (b) => !(b.level === band.level && b.role === band.role),
  )
  const next: JobArchitecture = {
    levels: [...new Set([...current.levels, band.level])].sort(),
    roles: [...new Set([...current.roles, band.role])].sort(),
    bands: [...filtered, band],
  }
  await storage.write(orgId, next)
  return next
}

export async function removeBand(
  orgId: string,
  level: string,
  role: string,
): Promise<JobArchitecture> {
  const current = await getJobArchitecture(orgId)
  const next: JobArchitecture = {
    ...current,
    bands: current.bands.filter(
      (b) => !(b.level === level && b.role === role),
    ),
  }
  await storage.write(orgId, next)
  return next
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/server/job-architecture-store.ts
git commit -m "feat(hr): job architecture store with adaptive persistence"
```

### Task 1.4: API `/api/job-architecture` GET + POST + PATCH + DELETE

**Files:**
- Create: `app/api/job-architecture/route.ts`
- Create: `app/api/job-architecture/route.test.ts`

- [ ] **Step 1: Write API**

```typescript
import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { requireRole } from "@/lib/server/auth"
import {
  getJobArchitecture,
  saveJobArchitecture,
  addBand,
  removeBand,
} from "@/lib/server/job-architecture-store"

const READ_ROLES = ["owner", "partner_manager", "compliance", "reviewer", "viewer"] as const
const WRITE_ROLES = ["owner", "partner_manager", "compliance"] as const

export async function GET(request: Request) {
  const session = requireRole(request, [...READ_ROLES], "citire job architecture")
  const arch = await getJobArchitecture(session.orgId)
  return NextResponse.json({ ok: true, architecture: arch })
}

export async function POST(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "salvare job architecture")
  const body = await request.json() as {
    levels: string[]
    roles: string[]
    bands: Array<{ level: string; role: string; min: number; max: number; currency?: "RON" | "EUR" }>
  }
  if (!Array.isArray(body.bands)) {
    return jsonError("bands must be an array", 400, "INVALID_BODY")
  }
  const next = await saveJobArchitecture(session.orgId, {
    levels: body.levels ?? [],
    roles: body.roles ?? [],
    bands: body.bands ?? [],
  })
  return NextResponse.json({ ok: true, architecture: next })
}

export async function PATCH(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "adăugare band")
  const body = await request.json() as { level: string; role: string; min: number; max: number; currency?: "RON" | "EUR" }
  if (!body.level || !body.role || typeof body.min !== "number" || typeof body.max !== "number") {
    return jsonError("level, role, min, max required", 400, "INVALID_BODY")
  }
  const next = await addBand(session.orgId, {
    level: body.level,
    role: body.role,
    min: body.min,
    max: body.max,
    currency: body.currency ?? "RON",
  })
  return NextResponse.json({ ok: true, architecture: next })
}

export async function DELETE(request: Request) {
  const session = requireRole(request, [...WRITE_ROLES], "ștergere band")
  const url = new URL(request.url)
  const level = url.searchParams.get("level")
  const role = url.searchParams.get("role")
  if (!level || !role) {
    return jsonError("level and role query params required", 400, "INVALID_QUERY")
  }
  const next = await removeBand(session.orgId, level, role)
  return NextResponse.json({ ok: true, architecture: next })
}
```

- [ ] **Step 2: Tests skeleton (similar pattern existing tests)**

```typescript
// route.test.ts — copiază pattern-ul din app/api/pay-transparency/route.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { GET, POST, PATCH, DELETE } from "./route"
// ...similar setup with cookies + session
```

- [ ] **Step 3: Commit**

```bash
git add app/api/job-architecture/route.ts app/api/job-architecture/route.test.ts
git commit -m "feat(hr): /api/job-architecture endpoints (GET/POST/PATCH/DELETE)"
```

### Task 1.5: UI `JobArchitectureBuilder` component

**Files:**
- Create: `components/compliscan/job-architecture-builder.tsx`

- [ ] **Step 1: Implement matrix UI**

```typescript
"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { toast } from "sonner"
import type { JobArchitecture, SalaryBand } from "@/lib/compliance/job-architecture"

export function JobArchitectureBuilder() {
  const [arch, setArch] = useState<JobArchitecture>({ levels: [], roles: [], bands: [] })
  const [busy, setBusy] = useState(false)
  const [newBand, setNewBand] = useState({ level: "", role: "", min: 0, max: 0 })

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const r = await fetch("/api/job-architecture")
    if (r.ok) {
      const d = await r.json()
      setArch(d.architecture)
    }
  }

  async function addBand() {
    setBusy(true)
    try {
      const r = await fetch("/api/job-architecture", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBand),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setArch(d.architecture)
      setNewBand({ level: "", role: "", min: 0, max: 0 })
      toast.success("Band adăugat")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  async function deleteBand(level: string, role: string) {
    const r = await fetch(`/api/job-architecture?level=${encodeURIComponent(level)}&role=${encodeURIComponent(role)}`, {
      method: "DELETE",
    })
    const d = await r.json()
    if (r.ok) setArch(d.architecture)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Architecture</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new band form */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <input
            placeholder="Level (ex: Mid)"
            className="..."
            value={newBand.level}
            onChange={(e) => setNewBand({ ...newBand, level: e.target.value })}
          />
          <input
            placeholder="Role (ex: Marketing)"
            className="..."
            value={newBand.role}
            onChange={(e) => setNewBand({ ...newBand, role: e.target.value })}
          />
          <input
            type="number"
            placeholder="Min RON"
            value={newBand.min || ""}
            onChange={(e) => setNewBand({ ...newBand, min: Number(e.target.value) })}
          />
          <input
            type="number"
            placeholder="Max RON"
            value={newBand.max || ""}
            onChange={(e) => setNewBand({ ...newBand, max: Number(e.target.value) })}
          />
          <Button onClick={addBand} disabled={busy}>
            <Plus /> Adaugă band
          </Button>
        </div>

        {/* List of bands */}
        <table className="w-full">
          <thead>
            <tr><th>Level</th><th>Role</th><th>Min</th><th>Max</th><th>Mid</th><th></th></tr>
          </thead>
          <tbody>
            {arch.bands.map((b) => (
              <tr key={`${b.level}-${b.role}`}>
                <td>{b.level}</td>
                <td>{b.role}</td>
                <td>{b.min.toLocaleString("ro-RO")}</td>
                <td>{b.max.toLocaleString("ro-RO")}</td>
                <td>{Math.round((b.min + b.max) / 2).toLocaleString("ro-RO")}</td>
                <td>
                  <button onClick={() => deleteBand(b.level, b.role)}>
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Add page wrapper `app/dashboard/pay-transparency/job-architecture/page.tsx`**

```typescript
import { JobArchitectureBuilder } from "@/components/compliscan/job-architecture-builder"

export default function JobArchitecturePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Job Architecture</h1>
      <JobArchitectureBuilder />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/compliscan/job-architecture-builder.tsx app/dashboard/pay-transparency/job-architecture/page.tsx
git commit -m "feat(hr): job architecture builder UI + page"
```

### Task 1.6: UI `SalaryRangeGeneratorCard` cu copy-to-clipboard

**Files:**
- Create: `components/compliscan/salary-range-generator-card.tsx`
- Create: `app/dashboard/pay-transparency/ranges/page.tsx`

- [ ] **Step 1: Implement card**

```typescript
"use client"

import { useEffect, useState } from "react"
import { Copy } from "lucide-react"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { toast } from "sonner"
import { computeSalaryRange, type JobArchitecture } from "@/lib/compliance/job-architecture"
import { generateRangeForJobAd, type AdFormat } from "@/lib/compliance/salary-range-generator"

export function SalaryRangeGeneratorCard() {
  const [arch, setArch] = useState<JobArchitecture>({ levels: [], roles: [], bands: [] })
  const [level, setLevel] = useState("")
  const [role, setRole] = useState("")
  const [format, setFormat] = useState<AdFormat>("bestjobs")
  const [generated, setGenerated] = useState("")

  useEffect(() => {
    void fetch("/api/job-architecture").then(async (r) => {
      if (r.ok) {
        const d = await r.json()
        setArch(d.architecture)
      }
    })
  }, [])

  function generate() {
    const range = computeSalaryRange(arch, level, role)
    if (!range) {
      toast.error("Nu există band pentru acest level + role")
      return
    }
    const text = generateRangeForJobAd({
      role, level, range, currency: "RON", format,
    })
    setGenerated(text)
  }

  async function copy() {
    await navigator.clipboard.writeText(generated)
    toast.success("Copiat în clipboard")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generator Salary Range pentru anunțuri</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Alege level</option>
            {arch.levels.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">Alege role</option>
            {arch.roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={format} onChange={(e) => setFormat(e.target.value as AdFormat)}>
            <option value="bestjobs">BestJobs.ro</option>
            <option value="linkedin">LinkedIn</option>
            <option value="ejobs">eJobs.ro</option>
            <option value="generic">Generic</option>
          </select>
        </div>
        <Button onClick={generate}>Generează text</Button>
        {generated && (
          <div>
            <pre className="bg-eos-bg-inset p-4 rounded">{generated}</pre>
            <Button onClick={copy}><Copy /> Copiază</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Page wrapper**

```typescript
// app/dashboard/pay-transparency/ranges/page.tsx
import { SalaryRangeGeneratorCard } from "@/components/compliscan/salary-range-generator-card"

export default function SalaryRangesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Salary Range Generator</h1>
      <SalaryRangeGeneratorCard />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/compliscan/salary-range-generator-card.tsx app/dashboard/pay-transparency/ranges/page.tsx
git commit -m "feat(hr): salary range generator UI with format selector + clipboard"
```

### Task 1.7: Smoke test Sprint 1

- [ ] **Step 1: Run dev server**

Run: `npx next dev`

- [ ] **Step 2: Login as imm-hr user**

- [ ] **Step 3: Build job architecture**

Browse: `/dashboard/pay-transparency/job-architecture`
Add 3 bands: Junior+Marketing 4000-5500, Mid+Marketing 5500-7500, Senior+Marketing 7500-11000.

- [ ] **Step 4: Generate salary range**

Browse: `/dashboard/pay-transparency/ranges`
Select Mid + Marketing + BestJobs format → click Generează → see text "Marketing Specialist (Mid)\nSalariu brut: 5.500 - 7.500 RON/lună"
Click Copiază → clipboard contains text.

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: PASS toate testele existente + cele noi

- [ ] **Step 6: Tag Sprint 1**

```bash
git tag sprint-1-job-arch-ranges-done
```

---

# SPRINT 2 — Employee Request Portal (1 săptămână)

**Goal:** Public token-based form unde angajații cer informații salariale + 30-zile timer + auto-reply generator + dashboard HR cu countdown.

### Task 2.1: Store `pay-transparency-requests-store.ts`

**Files:**
- Create: `lib/server/pay-transparency-requests-store.ts`
- Create: `lib/server/pay-transparency-requests-store.test.ts`

Implement: types EmployeeSalaryRequest cu statuses (received, processing, answered, escalated), 30 zile deadline computation, auto-token generation HMAC, list/get/create/transition functions. Pattern identic cu whistleblowing-store.

LOC: ~200 store + 150 tests.

### Task 2.2: API `/api/pay-transparency/requests` (HR-side)

**Files:**
- Create: `app/api/pay-transparency/requests/route.ts`
- Create: `app/api/pay-transparency/requests/[id]/route.ts`

Endpoints:
- GET / list cereri pentru org-ul HR-ului
- GET /[id] detail
- PATCH /[id] transition (process, answer, escalate)
- POST /[id]/answer trimite răspuns auto-format

LOC: ~160.

### Task 2.3: Public portal `/employee-portal/[token]`

**Files:**
- Create: `app/api/pay-transparency/requests/portal/[token]/route.ts` (POST submit)
- Create: `app/employee-portal/[token]/page.tsx`

Public form, NO auth, token-based ca whistleblowing. Form: nume (opțional, anonim ok), role, question, email pentru răspuns.

LOC: ~250.

### Task 2.4: UI `PayTransparencyRequestsTab`

**Files:**
- Create: `components/compliscan/pay-transparency-requests-tab.tsx`
- Modify: `components/compliscan/pay-transparency-page.tsx` (add tab)

Tab cu lista cereri + countdown 30 zile + butoane Process/Answer/Escalate + form răspuns auto-completed.

LOC: ~180.

### Task 2.5: Auto-reply generator

**Files:**
- Create: `lib/compliance/pay-transparency-reply-generator.ts`

Generator răspuns format pentru cerere salarial — integrează gap calculator + role salary range + GDPR-compliant template.

LOC: ~100.

### Task 2.6: Smoke test Sprint 2

End-to-end: HR generates portal link → angajat trimite cerere prin link → HR vede în dashboard cu countdown 25 zile → HR click Process → click Answer → auto-reply generat → HR edit + send → status = answered.

```bash
git tag sprint-2-employee-portal-done
```

---

# SPRINT 3 — ITM PDF Export + White-label (1 săptămână)

**Goal:** Raport ITM-shaped descărcabil cu logo cabinet (white-label).

### Task 3.1: Lib `itm-pay-gap-pdf.ts`

**Files:**
- Create: `lib/exports/itm-pay-gap-pdf.ts`
- Create: `lib/exports/itm-pay-gap-pdf.test.ts`

Reuse `pdfkit` infrastructure existent (vezi `lib/exports/audit-pack-pdf.ts` pentru pattern). Template ITM-shaped cu:
- Header: logo cabinet (din white-label) + nume firmă + perioadă
- Tabel rezumat: total angajați M/F, medii, gap %
- Tabel gap pe role
- Tabel gap pe department
- Recomandări
- Footer: signature consultant + signerName din white-label

LOC: ~150 + 60 tests.

### Task 3.2: API `/api/pay-transparency/report/[id]/pdf`

**Files:**
- Create: `app/api/pay-transparency/report/[id]/pdf/route.ts`

GET binary PDF. Reuse white-label config pentru logo + signature.

LOC: ~50.

### Task 3.3: UI button "Export ITM PDF"

**Files:**
- Modify: `components/compliscan/pay-transparency-page.tsx`

Adaugă buton "Export ITM PDF" pe report card, link la `/api/pay-transparency/report/[id]/pdf`.

LOC: ~50.

### Task 3.4: Smoke test Sprint 3

Generate report → Export ITM PDF → vezi PDF download cu logo cabinet + signature.

```bash
git tag sprint-3-itm-pdf-done
```

---

# SPRINT 4 — Cabinet Portfolio + Anti-Confidentiality Checker (1 săptămână)

**Goal:** Cabinet HR vede toate firmele clienți într-un dashboard. Plus checker contracte upload pentru clauze confidențialitate salarială.

### Task 4.1: Lib `contract-confidentiality-checker.ts`

**Files:**
- Create: `lib/compliance/contract-confidentiality-checker.ts`
- Create: `lib/compliance/contract-confidentiality-checker.test.ts`

Text scan pentru patterns:
- "obligația de confidențialitate" + "salarial"/"remunerație"/"salariu"
- "este interzis să comunice nivelul"
- "informațiile cu caracter salarial sunt confidențiale"
- "nedivulgarea remunerației"

Output: array of findings cu locație + recomandare ștergere clauză.

LOC: ~120 + 80 tests.

### Task 4.2: API `/api/contracts/check-confidentiality`

**Files:**
- Create: `app/api/contracts/check-confidentiality/route.ts`

POST upload text contract → return findings.

LOC: ~60.

### Task 4.3: UI portfolio page

**Files:**
- Create: `components/compliscan/portfolio-pay-transparency-page.tsx`
- Create: `app/portfolio/pay-transparency/page.tsx`

Cross-client view: tabel cu toate firmele cabinet, gap % per firmă, deadline ITM, requests pending. Filter by status.

LOC: ~250 + 50 page wrapper.

### Task 4.4: Update portfolio sidebar

**Files:**
- Modify: `lib/compliscan/portfolio-routes.ts`
- Modify: navigation portfolio variant

Add link "Pay Transparency" la cabinet-hr portfolio sidebar.

LOC: ~10.

### Task 4.5: Smoke test Sprint 4

Cabinet HR creates 3 client orgs → upload salary CSV per client → vezi cross-client dashboard cu gap heatmap.
Upload contract text cu clauză confidențialitate → vezi finding generat.

```bash
git tag sprint-4-portfolio-checker-done
```

---

# Acceptance Criteria — Sprint 0-4 complete

### Functional

- [ ] `/hr` și `/cabinet-hr` landing pages render cu LandingPageShell
- [ ] `/login?icp=imm-hr` și `?icp=cabinet-hr` show HR pane content
- [ ] Register cu icp=imm-hr lands în `/dashboard/pay-transparency`
- [ ] Sidebar HR-mode shows Pay Transparency primary
- [ ] Stripe pricing page shows 4 HR tiers when icpSegment="imm-hr" or "cabinet-hr"
- [ ] Job Architecture builder accepts CRUD on bands + persists to storage
- [ ] Salary Range Generator returns formatted text per format (BestJobs/LinkedIn/eJobs)
- [ ] Employee portal accepts public form submissions via token
- [ ] HR dashboard shows requests with 30-day countdown
- [ ] Auto-reply generator produces GDPR-compliant text
- [ ] ITM PDF export downloads with white-label brand
- [ ] Contract checker detects 4+ confidentiality patterns
- [ ] Cabinet portfolio shows cross-client Pay Transparency dashboard

### Non-functional

- [ ] All existing tests still pass: `npx vitest run`
- [ ] Typecheck clean: `npx tsc --noEmit`
- [ ] No regression on `/dashboard/fiscal`, `/dashboard/dpo`, `/portfolio`
- [ ] State izolat în `pay_transparency_state` storage key (verify cu `grep "pay_transparency_state" lib/`)
- [ ] Build succeeds: `npm run build`
- [ ] Smoke test full flow login → register → onboarding → job arch → generate range → export PDF

---

# Rollback Plan

Dacă apare regression major:

```bash
# Revert sprint-by-sprint
git revert --no-commit sprint-4-portfolio-checker-done..HEAD
git revert --no-commit sprint-3-itm-pdf-done..sprint-4-portfolio-checker-done
git revert --no-commit sprint-2-employee-portal-done..sprint-3-itm-pdf-done
git revert --no-commit sprint-1-job-arch-ranges-done..sprint-2-employee-portal-done
git revert --no-commit sprint-0-hr-foundation-done..sprint-1-job-arch-ranges-done

# Or full rollback to before sprint-0
git reset --hard <commit-before-sprint-0>
```

Storage izolat (`pay_transparency_state` + `job_architecture_state`) — modulele HR nu afectează state existent. Rollback nu pierde date pe alte module.

---

# Implementation Order Summary

```
SPRINT 0 (săpt 1) → Foundation: ICP segment + landing + login + onboarding + sidebar + Stripe tiers
SPRINT 1 (săpt 2) → Job Architecture builder + Salary Range generator
SPRINT 2 (săpt 3) → Employee Request Portal (token public + dashboard countdown)
SPRINT 3 (săpt 4) → ITM PDF export + white-label brand
SPRINT 4 (săpt 5) → Cabinet Portfolio + Contract confidentiality checker
```

**Total: 5 săptămâni 1 dev** sau **3 săptămâni 2 devs paralel** (Sprint 0+1 + Sprint 2 paralel).

---

# Self-Review Notes

**1. Spec coverage check:**
- ✅ Definirea Pay Transparency: covered Sprint 0 task 0.4 landing
- ✅ User Andreea: covered Sprint 0 onboarding + sidebar
- ✅ Workflow current vs target: covered Sprint 1+2 (range generator + portal)
- ✅ Cod existing 70%: covered (sprint-uri adaugă peste, NU rescriu)
- ✅ Pillar fără disruption: covered (storage izolat, navigation conditional, tier registry additive)
- ✅ White-label cabinet: covered Sprint 3 + 4
- ✅ Cabinet multi-client: covered Sprint 4

**2. Placeholder scan:**
- ❌ Sprint 2-4 au design-level detail, NU step-by-step code blocks (intentional pentru a nu exploda doc-ul). Each task are file paths exacte + LOC estimates + features list. Engineer poate cere expansion pe task-uri specifice când ajunge la sprint-ul respectiv.
- ✅ Sprint 0-1 au TDD complet cu code blocks + tests + commits.

**3. Type consistency:**
- ✅ `JobArchitecture` definit în task 1.1 e folosit consistent în 1.2, 1.3, 1.4, 1.5, 1.6
- ✅ `SalaryRange` definit în 1.1 folosit în 1.2
- ✅ `IcpSegment` extension folosit în 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7
- ✅ `WhiteLabelConfig` reuse din v3-unified pentru Sprint 3 PDF + Sprint 4 portfolio

Plan complete and saved to `docs/superpowers/plans/2026-05-01-pay-transparency-pillar.md`.
