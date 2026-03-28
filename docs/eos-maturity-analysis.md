# EOS Design System — Analiză de Maturitate 1:1
**vs. Material Design 3 · MUI · IBM Carbon · Atlassian · Linear · Sparkbox Framework**

> **Data:** 2026-03-28 · **Versiune EOS:** v1.0 · **Baza:** Audit complet EOS + cercetare web industrie

---

## TL;DR

EOS este un design system **specializat, principiat, cu fundamente solide** dar cu **lacune critice în componente fundamentale** (forms, dialog, skeleton, tabele). Față de sistemele mature din industrie, EOS se situează la **Sparkbox Stage 2 / Early Release** cu trăsături puternice de Stage 3 în token system și documentație, dar blocat de acoperire incompletă de componente.

**Scor consolidat: 58 / 100**

---

## 1. Modelele de Maturitate din Industrie

### 1.1 Sparkbox 4-Stage Model (cel mai operațional)

| Stage | Nume | Caracteristici cheie | EOS? |
|-------|------|---------------------|------|
| **1** | Building v1 | Scoped components, tehnologie aleasă, nicio adoptare formală | ✅ Depășit |
| **2** | Release & Early Adoption | Primul release oficial; adoptare ușoară; fără versionare formală | ← **EOS acum** |
| **3** | Growth / Teenage Years | Mulți abonați; governance necesar; model de contribuție emergent | Parțial |
| **4** | Mature Product | Sistem ca produs intern; roadmap propriu; OKR-uri; versionare; changelog; deprecation policies | Target |

**Diagnostic rapid pentru EOS:**
- Stage 2 → există pachet instalabil / fișier token importabil? ❌ (nu există `index.ts`, nu există tokens.json)
- Stage 3 → există proces documentat de contribuție? ❌ Changelog versionat? ❌
- Stage 4 → sistemul are roadmap independent de features de produs? ❌

**Concluzie Sparkbox: Stage 2 cu elemente de Stage 3**

---

### 1.2 USWDS 3-Level Maturity Model

| Nivel | Criteriu | EOS |
|-------|---------|-----|
| **1** | Integrate Design Principles — echipa aplică principiile sistemului la toate deciziile | ✅ (5 piloni documentați) |
| **2** | Follow UX Guidance — ghiduri UX per componentă respectate înainte de cod | 🟡 Parțial (badges/cards da, forms nu) |
| **3** | Use System Code — token-uri, componente și utilitare implementate în producție | ✅ (token-uri + 57 comp.) |

**Scor per principiu (0-4):**

| Principiu | Scor | Motivare |
|-----------|------|---------|
| Token system (primitiv → semantic → component) | 3/4 | Operaționalizat; lipsesc tokens.json și breakpoints |
| Acoperire componente | 2/4 | Proactiv — identifică gap-urile, nu le-a rezolvat |
| Documentație | 3/4 | Operaționalizat; lipsesc spec per componentă pentru forms/table/dialog |
| Accesibilitate | 2/4 | Proactiv — tokens WCAG-aware, fără audit sistematic |
| Tooling (Storybook, CI, a11y automation) | 1/4 | Reactiv — nu există |

---

### 1.3 Nathan Curtis / EightShapes — Component Doneness Matrix

O componentă este "done" când trece **toate cele 27 de criterii**:

```
Visual Design (7): default, hover, focus, active, disabled, error, loading/skeleton
Variante (5): dimensiuni, semantice (primary/danger/ghost), layout, edge cases, dark mode
Documentație (6): anatomie, when to use, anti-patterns, do/don't vizual, props/API, live demo
Accesibilitate (5): ARIA role, keyboard navigation, screen reader, contrast verificat, reduced motion
Cod (4): framework corect, doar system tokens, unit tested, exportat din index
```

**Scor doneness EOS per categorie:**

| Componentă | Doneness | Blocant |
|-----------|---------|---------|
| Button | 18/27 | Lipsesc: skeleton, Storybook, a11y doc, unit tests |
| Badge | 20/27 | Lipsesc: Storybook, a11y doc, unit tests |
| Card | 16/27 | Lipsesc: multiple state docs, Storybook, a11y |
| Toast/Toaster | 15/27 | Lipsesc: mai multe stări, docs |
| Input/Form | 0/27 | **Neimplementat** |
| Dialog/Modal | 0/27 | **Neimplementat** |
| Table | 0/27 | **Neimplementat** |
| Skeleton | 0/27 | **Neimplementat** |

**Media doneness EOS: ~12/27 per componentă implementată (Alpha/Beta, nu Stable)**

---

## 2. Scorecard 1:1 pe Dimensiuni (100 pct)

### Secțiunea A: Token Architecture (25 pct)

| Criteriu | Max | **EOS** | Note |
|---------|-----|---------|------|
| Primitive tokens pentru toate categoriile (color, type, space, radius, shadow, motion) | 5 | **4** | Lipsesc: breakpoints, z-index, typography în CSS (doar în docs) |
| Semantic tokens cu naming role-based (nu value-based) | 5 | **5** | `--eos-surface-base`, `--eos-text-primary` — corect |
| Component tokens referențiază semantic (fără skip la primitive) | 5 | **4** | Parțial — unele comp. omit tier-ul semantic |
| Dark mode token swap implementat (Level 3+) | 5 | **5** | 31 overrides în `[data-theme="light"]`, dark-first — corect |
| Contrast WCAG verificat la definirea token-ului | 5 | **2** | Nu există audit sistematic de contrast pe perechi |
| **Total A** | **25** | **20** | |

---

### Secțiunea B: Acoperire Componente (25 pct)

Referință: Material Design 3 definește 6 categorii ca minim pentru un sistem complet.

| Categoria M3 | M3 Comps | **EOS** | Status |
|-------------|---------|---------|--------|
| **Actions** (Button, FAB, Icon Button, Segmented) | 5 | Button ✅ | 🟡 1/5 |
| **Communication** (Badge, Progress, Snackbar) | 3 | Badge ✅, Progress ✅, Toast ✅ | ✅ 3/3 |
| **Containment** (Card, Dialog, List, Sheet, Divider) | 6 | Card ✅, Sheet ✅, Separator ✅, Dialog ❌, List parțial | 🟡 3/6 |
| **Navigation** (Nav Bar, Drawer, Rail, Tabs) | 4 | Tabs ✅ | 🔴 1/4 |
| **Selection / Forms** (Checkbox, Radio, Switch, Slider, TextField, Select) | 8 | 0 | 🔴 0/8 |
| **Text Input** (Input, Search, Dropdown) | 3 | 0 | 🔴 0/3 |

**Criterii de scoring:**

| Criteriu | Max | **EOS** | Note |
|---------|-----|---------|------|
| Toate cele 6 categorii M3 acoperite | 5 | **1** | Doar Communication complet |
| Toate componentele au: default + hover + focus + disabled + error | 5 | **2** | Parțial pe badge/button; fără forms |
| Toate componentele folosesc doar system tokens (zero valori hardcoded) | 5 | **4** | 95% — câteva excepții minore |
| Componente ating Carbon doneness criteria (≥20/27) | 5 | **1** | Nicio componentă ≥20 |
| Dark mode verificat pe toate componentele | 5 | **3** | Token swap funcționează; nu toate componentele testate |
| **Total B** | **25** | **11** | |

---

### Secțiunea C: Dashboard UX (25 pct)

**Referință:** Nielsen Norman Group, GoodData, MetricStream, Sprinto

| Criteriu | Max | **EOS** | Note |
|---------|-----|---------|------|
| Zona primară prezintă info critică above fold în 5 secunde | 5 | **5** | Score + riscuri deschise imediat vizibile în RiskHeader |
| Status system cu 4 niveluri + icon + culoare + label | 5 | **4** | Badge-uri cu culoare + text; parțial cu icoane |
| Navigare cu sidebar IA și toate elementele necesare | 5 | **3** | Sidebar existent dar în `dashboard-shell.tsx`, nu EOS component |
| Tipografie cu tabular numerics și scale corectă | 5 | **3** | Scale definită în docs, parțial în CSS; lipsesc tabular-nums pe date |
| Toate cele 6 module compliance prezente (score, findings, deadlines, coverage, activity, scan) | 5 | **4** | Toate prezente; Calendar/activity feed parțial |
| **Total C** | **25** | **19** | |

---

### Secțiunea D: Accesibilitate (15 pct)

| Criteriu | Max | **EOS** | Note |
|---------|-----|---------|------|
| Contrast WCAG AA pe toate perechile color (light + dark) | 5 | **2** | Token-uri WCAG-aware dar fără audit sistematic |
| Keyboard navigation completă pe toate componentele interactive | 5 | **2** | Button, Tabs ok; Sheet, DropdownMenu parțial |
| axe-core / a11y testing automatizat în CI | 5 | **0** | Nu există |
| **Total D** | **15** | **4** | |

---

### Secțiunea E: Documentație & Process (10 pct)

| Criteriu | Max | **EOS** | Note |
|---------|-----|---------|------|
| Per componentă: anatomie + usage + do/don't + props + a11y | 5 | **2** | Principii excelente; spec per componentă incomplet |
| Changelog versionat + proces de contribuție documentat | 5 | **1** | Worklog există dar nu e changelog formal; contribuție nedocumentată |
| **Total E** | **10** | **3** | |

---

### Scor Final Consolidat

| Secțiune | Max | **EOS** | % |
|---------|-----|---------|---|
| A: Token Architecture | 25 | 20 | 80% |
| B: Acoperire Componente | 25 | 11 | 44% |
| C: Dashboard UX | 25 | 19 | 76% |
| D: Accesibilitate | 15 | 4 | 27% |
| E: Documentație & Process | 10 | 3 | 30% |
| **TOTAL** | **100** | **57** | **57%** |

**Rating Sparkbox:**
```
90-100 → Mature Product (Stage 4)
75-89  → Growth (Stage 3)
50-74  → Released (Stage 2)  ← EOS: 57 / Stage 2
25-49  → Building (Stage 1)
```

---

## 3. Comparație cu Sisteme de Industrie

### Scor estimat sisteme mature (pe același rubric):

| Sistem | A: Tokens | B: Comps | C: UX | D: A11y | E: Docs | Total |
|--------|----------|---------|-------|---------|---------|-------|
| IBM Carbon | 25 | 23 | 22 | 14 | 9 | **93** |
| Atlassian ADS | 24 | 22 | 21 | 14 | 9 | **90** |
| Material Design 3 | 24 | 24 | 20 | 15 | 8 | **91** |
| MUI v6 | 23 | 24 | 19 | 13 | 9 | **88** |
| Linear (internal) | 22 | 20 | 24 | 12 | 7 | **85** |
| **EOS v1.0** | **20** | **11** | **19** | **4** | **3** | **57** |

**Grafic de poziționare:**

```
Stage 4  Carbon ████████████████████████████████████████████ 93
         ADS    ██████████████████████████████████████████   90
         M3     ███████████████████████████████████████████  91
         MUI    ████████████████████████████████████████     88
         Linear ██████████████████████████████████████       85
Stage 3  ─────────────────────────────────────────────────  75


Stage 2  ──────────────────────────── (EOS: 57) ───────────  57
         EOS    ████████████████████████████                 57
```

---

## 4. Ce Funcționează Excepțional în EOS

### 4.1 Token Architecture — Comparabil cu Stage 3-4

EOS depășește multe sisteme "mature" la arhitectura de token-uri:
- **3 tier-uri clare** cu naming semantic (nu value-based)
- **Dark mode first** — corect pentru B2B compliance
- **Motion tokens cu semantică** (instant/fast/default/slow/deliberate) — Carbon abia le-a adăugat recent
- **Layout tokens** (page max-width, rail width, section gaps) — pattern Stage 4

### 4.2 Badge System — Contribuție Originală la Nivel Stage 4

12 variante specializate pe compliance. Nici M3, nici Carbon nu au echivalent. Pattern Nathan Curtis "Tier 3 — System-governed":
- `EvidenceReadinessBadge` → EU AI Act audit readiness
- `HumanOversightBadge` → AI governance Art. 9
- `ControlCoverageBadge` → GDPR Art. 32 coverage
- `ProposalConfidenceBadge` → AI confidence scoring

### 4.3 Page Layout Recipes — Pattern Stage 3-4

`PageIntro` + `SummaryStrip` + `SectionBoundary` + `HandoffCard` = **sistem de layout pages**, nu primitive. Atlassian a adăugat recipes similare la Stage 3. Shopify Polaris le are din Stage 4. EOS le are din v1.0.

### 4.4 Philosophical Coherence — Unic în Industrie

EOS are un manifest clar: **"AI propune, omul validează"**. Fiecare componentă servește această decizie de produs. M3, Carbon, MUI sunt generice prin definiție — câștigă la volum, pierd la **domain specificity**.

---

## 5. Gap Analysis — De la Stage 2 la Stage 3

### Blocante critice (fără acestea rămânem la Stage 2)

| Gap | Impact | Efort | Sprint |
|-----|--------|-------|--------|
| **Form components** (Input, Select, Checkbox, Radio, Switch, Textarea) | Blochează orice formular nativ EOS; aplicația folosește forme fără token-uri | M (1-2 săpt.) | Sprint 1 |
| **Dialog/Modal component** | Confirmări critice, GDPR consent flows | S (2-3 zile) | Sprint 1 |
| **Skeleton/Loading states** | Percepție performanță slabă; toate listele async | S (2-3 zile) | Sprint 1 |
| **Table component** | Date compliance necesită tabelar cu sort/filter | M (1 săpt.) | Sprint 2 |
| **`index.ts` barrel export** | Developer experience degradat, import-uri manuale | XS (2 ore) | Sprint 1 |

### Importante (Stage 2 → Stage 3 premium)

| Gap | Impact | Efort |
|-----|--------|-------|
| **Tokens JSON export** (W3C DTCG format) | Nu poți sincroniza cu Figma/Style Dictionary | S |
| **Tooltip + Popover** | Pattern-uri hover standard lipsesc din orice UI | S |
| **Pagination** | Liste lungi (findings, tasks, reports) | S |
| **Breadcrumb component** | Navigare ierarhică; NNG heuristic #6 | S |
| **tabular-nums pe date** | `font-variant-numeric: tabular-nums` pe coloane numerice | XS |
| **Contrast audit sistematic** | WCAG AA pe toate perechile light + dark | M |

### Strategice (Stage 3 → Stage 4)

| Gap | Impact | Efort |
|-----|--------|-------|
| **Storybook** | Live playground; testare izolată; demo per componentă | L |
| **Figma component kit** | Design-code parity; sync cu tokens.json | L |
| **a11y testing în CI** (axe-core) | WCAG AA garantat la fiecare PR | M |
| **Versioned changelog** | Adoptare profesională; deprecation policies | S |
| **Contribution process** | Scalare dincolo de un autor | M |

---

## 6. Roadmap Recomandat

```
Sprint imediat (săptămâna 1-2):
  ✓ Input, Select, Checkbox, Radio, Switch, Textarea — form library
  ✓ Dialog/Modal component
  ✓ Skeleton + Spinner loading states
  ✓ index.ts barrel export
  → Impact: +18 pct pe scorecard → 75/100 (Stage 3)

Sprint 2 (săptămâna 3-4):
  ✓ Table component (sort, filter, pagination, empty state)
  ✓ Tooltip + Popover
  ✓ Breadcrumb
  ✓ Contrast audit + tabular-nums
  → Impact: +8 pct → 83/100 (Stage 3 solidă)

Sprint strategic (luna 2-3):
  ✓ Storybook setup cu stories per componentă
  ✓ tokens.json export (Style Dictionary)
  ✓ axe-core în CI
  ✓ Figma component kit
  → Impact: +10 pct → 93/100 (Stage 4)
```

---

## 7. Concluzie

### Situația reală

EOS este un design system **serios, profesional, cu fundație corectă**. Comparativ cu alte sisteme specializate la vârsta lor (Linear, Stripe, Vercel la 2-3 ani de la lansare), EOS e **comparabil sau superior** pe token system și coerență filozofică.

Problema nu e calitatea — e **acoperirea de componente** care blochează productivitatea și ține scorul la Stage 2.

### Mesajul cheie

> **EOS are ADN-ul unui sistem Stage 3-4, blocat de componente Stage 1.** Token system, documentație strategică, page layout recipes, și badge system specializat sunt la nivelul sistemelor mature. Form components, dialog, skeleton și table sunt absente — ceea ce face ca orice suprafață cu date sau formulare să fie construită în afara sistemului. Rezolvarea celor 4 gap-uri critice în Sprint 1 mută EOS la **75/100 (Stage 3) în 1-2 săptămâni**.

---

## Referințe Principale

- [Nathan Curtis — Design System Tiers (EightShapes)](https://medium.com/eightshapes-llc/design-system-tiers-2c827b67eae1)
- [Nathan Curtis — Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676)
- [USWDS Maturity Model](https://designsystem.digital.gov/maturity-model/)
- [Sparkbox Design System Maturity Model](https://sparkbox.com/foundry/design_system_maturity_model)
- [IBM Carbon — Component Checklist (27 criteria)](https://carbondesignsystem.com/contributing/component-checklist/)
- [Atlassian Design System — Tokens](https://atlassian.design/components/tokens/)
- [Nielsen Norman Group — 8 Guidelines Complex Applications](https://www.nngroup.com/articles/complex-application-design/)
- [GoodData — Six Principles Dashboard IA](https://www.gooddata.com/blog/six-principles-of-dashboard-information-architecture/)
- [MetricStream — Compliance Dashboard 2025](https://www.metricstream.com/learn/compliance-dashboard.html)

---

*Analiză bazată pe: inventar complet EOS v1.0 (57 componente, 92 CSS custom properties, 6 documente) + cercetare web industrie (Sparkbox, USWDS, EightShapes, NNG, Carbon, Atlassian, M3).*
