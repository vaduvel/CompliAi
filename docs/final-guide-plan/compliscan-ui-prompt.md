# CompliScan — UI Implementation Prompt
# Design System v2.0 aplicat pe noua arhitectură UX/IA
# Pentru Claude Code / Codex / Cursor / Windsurf
# Citește TOT documentul înainte să scrii orice linie de cod.

---

## CE EȘTI TU

Ești un inginer senior UI care implementează interfața vizuală a CompliScan.
Ai deja backend-ul, logica, și API-urile. Construiești doar stratul vizual.

**Trei surse de adevăr — respectă-le pe toate simultan:**

1. **Design System (acest document)** — cum arată orice element


**Reguli absolute:**
- NICIODATĂ raw hex în componentele UI — doar CSS variables
- NICIODATĂ `green500` sau culori hardcodate în JSX
- NICIODATĂ două butoane primare pe aceeași pagină
- NICIODATĂ emerald ca culoare decorativă — doar pentru acțiuni primare și stări resolved
- NICIODATĂ violet în afara stărilor de review uman

---

## SETUP — CSS VARIABLES

### Fișier: `styles/tokens.css`

```css
:root {
  /* ── PRIMITIVE: Warm Graphite ─────────────────────────────── */
  --color-graphite-950: #111113;
  --color-graphite-900: #18181B;
  --color-graphite-850: #1F1F23;
  --color-graphite-800: #27272B;
  --color-graphite-750: #2E2E33;
  --color-graphite-700: #3A3A40;
  --color-graphite-600: #505057;
  --color-graphite-500: #686872;
  --color-graphite-400: #8C8C96;
  --color-graphite-300: #B2B2BA;
  --color-graphite-200: #D6D6DD;
  --color-graphite-100: #F1F1F5;

  /* ── PRIMITIVE: Brand Colors ──────────────────────────────── */
  --color-emerald-700: #1E8E67;
  --color-emerald-600: #279977;
  --color-emerald-500: #34D399;
  --color-emerald-400: #5BDEAC;
  --color-emerald-300: #8BE8C4;

  --color-red-700:    #7A1F24;
  --color-red-600:    #A12B33;
  --color-red-500:    #F87171;
  --color-red-400:    #FF9A9A;

  --color-amber-700:  #7A5A0B;
  --color-amber-600:  #9A730F;
  --color-amber-500:  #FBBF24;
  --color-amber-400:  #FFD867;

  --color-violet-700: #5B3D8A;
  --color-violet-600: #7149A8;
  --color-violet-500: #A78BFA;
  --color-violet-400: #C0AEFF;

  --color-blue-700:   #1D4E89;
  --color-blue-600:   #245DA2;
  --color-blue-500:   #60A5FA;
  --color-blue-400:   #8DBEFF;

  /* ── SEMANTIC: Surfaces ───────────────────────────────────── */
  --bg-canvas:   var(--color-graphite-950);
  --bg-panel:    var(--color-graphite-900);
  --bg-card:     var(--color-graphite-900);
  --bg-overlay:  var(--color-graphite-850);
  --bg-hover:    var(--color-graphite-800);
  --bg-active:   var(--color-graphite-750);
  --bg-disabled: var(--color-graphite-800);
  --bg-inverse:  var(--color-graphite-100);

  /* ── SEMANTIC: Text ───────────────────────────────────────── */
  --text-primary:   var(--color-graphite-100);
  --text-secondary: var(--color-graphite-300);
  --text-tertiary:  var(--color-graphite-400);
  --text-muted:     var(--color-graphite-500);
  --text-disabled:  var(--color-graphite-600);
  --text-inverse:   var(--color-graphite-950);

  /* ── SEMANTIC: Borders ────────────────────────────────────── */
  --border-subtle:  var(--color-graphite-800);
  --border-default: var(--color-graphite-750);
  --border-strong:  var(--color-graphite-700);
  --border-focus:   rgba(91, 222, 172, 0.42);

  /* ── SEMANTIC: Actions ────────────────────────────────────── */
  --action-primary-bg:       var(--color-emerald-500);
  --action-primary-text:     var(--text-inverse);
  --action-primary-hover:    var(--color-emerald-400);
  --action-primary-active:   var(--color-emerald-600);

  --action-secondary-bg:     var(--bg-card);
  --action-secondary-text:   var(--text-primary);
  --action-secondary-border: var(--border-default);
  --action-secondary-hover:  var(--bg-hover);

  --action-ghost-bg:         transparent;
  --action-ghost-text:       var(--text-secondary);
  --action-ghost-hover:      var(--bg-hover);

  --action-destructive-bg:     rgba(248, 113, 113, 0.12);
  --action-destructive-border: rgba(248, 113, 113, 0.42);
  --action-destructive-text:   var(--color-red-500);

  /* ── SEMANTIC: Status (operational meaning) ───────────────── */
  --status-compliant-text: var(--color-emerald-500);
  --status-compliant-bg:   rgba(52, 211, 153, 0.08);
  --status-compliant-border: rgba(52, 211, 153, 0.20);

  --status-failing-text:   var(--color-red-500);
  --status-failing-bg:     rgba(248, 113, 113, 0.10);
  --status-failing-border: rgba(248, 113, 113, 0.25);

  --status-drift-text:     var(--color-amber-500);
  --status-drift-bg:       rgba(251, 191, 36, 0.10);
  --status-drift-border:   rgba(251, 191, 36, 0.25);

  --status-review-text:    var(--color-violet-500);
  --status-review-bg:      rgba(167, 139, 250, 0.10);
  --status-review-border:  rgba(167, 139, 250, 0.25);

  --status-info-text:      var(--color-blue-500);
  --status-info-bg:        rgba(96, 165, 250, 0.10);
  --status-info-border:    rgba(96, 165, 250, 0.25);

  --status-neutral-text:   var(--text-tertiary);
  --status-neutral-bg:     var(--bg-overlay);
  --status-neutral-border: var(--border-subtle);

  /* ── SEMANTIC: Severity (gravity) ────────────────────────── */
  --severity-critical-text: var(--color-red-500);
  --severity-critical-bg:   rgba(248, 113, 113, 0.10);
  --severity-high-text:     var(--color-amber-500);
  --severity-high-bg:       rgba(251, 191, 36, 0.10);
  --severity-medium-text:   var(--text-tertiary);
  --severity-medium-bg:     var(--bg-overlay);
  --severity-low-text:      var(--text-muted);
  --severity-low-bg:        var(--bg-overlay);

  /* ── SEMANTIC: Review States ──────────────────────────────── */
  --review-detected-text:    var(--color-amber-500);
  --review-detected-bg:      rgba(251, 191, 36, 0.08);
  --review-pending-text:     var(--color-violet-500);
  --review-pending-bg:       rgba(167, 139, 250, 0.10);
  --review-escalated-text:   var(--color-violet-400);
  --review-escalated-bg:     rgba(167, 139, 250, 0.20);
  --review-confirmed-text:   var(--color-amber-500);
  --review-confirmed-bg:     rgba(251, 191, 36, 0.10);
  --review-dismissed-text:   var(--text-muted);
  --review-dismissed-bg:     var(--bg-overlay);
  --review-remediation-text: var(--text-secondary);
  --review-remediation-bg:   var(--bg-active);
  --review-resolved-text:    var(--color-emerald-500);
  --review-resolved-bg:      rgba(52, 211, 153, 0.08);

  /* ── TYPOGRAPHY ───────────────────────────────────────────── */
  --font-ui:   'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;

  /* ── SPACING ──────────────────────────────────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── RADIUS ───────────────────────────────────────────────── */
  --radius-xs:   6px;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   20px;
  --radius-2xl:  24px;
  --radius-pill: 9999px;

  /* ── SHADOW ───────────────────────────────────────────────── */
  --shadow-sm:    0 1px 2px rgba(0,0,0,0.20);
  --shadow-md:    0 8px 24px rgba(0,0,0,0.24);
  --shadow-lg:    0 16px 40px rgba(0,0,0,0.28);
  --shadow-focus: 0 0 0 3px rgba(91,222,172,0.22);

  /* ── MOTION ───────────────────────────────────────────────── */
  --motion-fast: 120ms;
  --motion-base: 180ms;
  --motion-slow: 260ms;
  --easing:      cubic-bezier(0.2, 0, 0, 1);
}
```

---

## COMPONENTE DE BAZĂ

### 1. Button — `components/ui/Button.tsx`

```
VARIANTE:
  primary     → bg: --action-primary-bg, text: --action-primary-text
  secondary   → bg: --action-secondary-bg, border: --action-secondary-border
  ghost       → bg: transparent, text: --action-ghost-text
  destructive → bg: --action-destructive-bg, border: --action-destructive-border

DIMENSIUNI:
  sm  → height 32px, padding 0 12px, font-size 12px
  md  → height 36px, padding 0 16px, font-size 13px (default)
  lg  → height 40px, padding 0 20px, font-size 14px

STĂRI:
  hover:        primary → --action-primary-hover, secondary → --action-secondary-hover
  focus-visible: outline 2px --border-focus, shadow: --shadow-focus
  disabled:     opacity 0.4, cursor: not-allowed, no hover
  loading:      spinner inline, dimensiunea rămâne, text ascuns

REGULI:
  - O singură variantă primary per pagină / zonă
  - Nu adăuga glow sau gradient pe hover
  - Transition: var(--motion-fast) var(--easing)
```

### 2. Badge — `components/ui/Badge.tsx`

```
SCOP: status labels, severity, framework names, review states

VARIANTE (derivate din semantic tokens):
  compliant  → --status-compliant-text / --status-compliant-bg
  failing    → --status-failing-text / --status-failing-bg
  drift      → --status-drift-text / --status-drift-bg
  review     → --status-review-text / --status-review-bg
  info       → --status-info-text / --status-info-bg
  neutral    → --status-neutral-text / --status-neutral-bg
  critical   → --severity-critical-text / --severity-critical-bg
  high       → --severity-high-text / --severity-high-bg
  medium     → --severity-medium-text / --severity-medium-bg
  low        → --severity-low-text / --severity-low-bg

REVIEW STATES (pentru finding-uri):
  detected   → --review-detected-text / --review-detected-bg
  pending    → --review-pending-text / --review-pending-bg
  escalated  → --review-escalated-text / --review-escalated-bg
  resolved   → --review-resolved-text / --review-resolved-bg

DIMENSIUNI:
  sm → font-size 11px, padding 2px 8px
  md → font-size 12px, padding 4px 10px

REGULI:
  - border-radius: --radius-pill mereu
  - Nu folosești ca element interactiv (nu onClick)
  - Culoarea NU e singurul semnal — adaugi și icon sau label clar
  - Status ≠ Severity — nu amesteca în același badge
```

### 3. Card — `components/ui/Card.tsx`

```
VARIANTE:
  default     → bg: --bg-card, border: 1px --border-subtle
  flush       → fără padding intern (pentru tabele / liste)
  tinted      → bg: --bg-card + status overlay pe border și bg tint

STĂRI:
  default:    shadow: --shadow-sm
  hover (dacă e interactiv): bg: --bg-hover, border: --border-default
  selected:   border: --border-strong, accent bar 2px stânga

REGULI:
  - border-radius: --radius-md
  - Nu face carduri cu hover dacă nu sunt clicabile
  - Status-tinted cards: folosești sparingly, nu pe tot dashboardul
  - Padding default: --space-5 (20px)
```

### 4. StatusDot — `components/ui/StatusDot.tsx`

```
DIMENSIUNI:
  sm → 6px
  md → 8px

CULORI: mapate la semantic status tokens
  ok      → --status-compliant-text
  warning → --status-drift-text
  fail    → --status-failing-text
  review  → --status-review-text
  neutral → --text-muted

REGULI:
  - Mereu însoțit de text — nu singur ca indicator
```

### 5. SeverityPill — `components/ui/SeverityPill.tsx`

```
SCOP: afișare severity în finding rows și cards

VARIANTE: CRITIC / RIDICAT / MEDIU / SCĂZUT
  Fiecare folosește --severity-{level}-text și --severity-{level}-bg

REGULI:
  - font-weight: 600, uppercase, letter-spacing: 0.04em
  - Nu confunda cu Badge de status — SeverityPill e doar pentru gravity
```

---

## LAYOUT SHELL

### `app/dashboard/layout.tsx`

```
STRUCTURA:
  <html>
    <body style="background: var(--bg-canvas); font-family: var(--font-ui)">
      <div style="display: flex; height: 100vh">
        <Sidebar />                    /* 220px, sticky */
        <main style="flex:1; overflow-y:auto">
          {children}
        </main>
      </div>
    </body>
  </html>

GLOBAL CSS pe body:
  - color: var(--text-primary)
  - font-family: var(--font-ui)
  - font-size: 14px
  - line-height: 20px
  - -webkit-font-smoothing: antialiased

FONT MONO — folosit DOAR pe:
  - scoruri numerice de conformitate (67/100, 98%)
  - timestamps exacte
  - CUI / CIF
  - hash-uri și ID-uri tehnice
  - valori din configurații (ON/OFF, versiuni)
  - NU pe titluri, navigare, sau text normal
```

### `components/layout/Sidebar.tsx`

```
DIMENSIUNI: width 220px, sticky, height 100vh

STRUCTURA:
  ┌─────────────────────────────┐
  │ LOGO BLOCK                  │  padding: 20px 16px, border-bottom: 1px --border-subtle
  │  icon 32px + CompliScan     │
  │  "evidence operating system"│  font-size 10px, --text-muted
  ├─────────────────────────────┤
  │ NAV GROUP LABEL             │  "FLUX PRINCIPAL" — 10px uppercase, --text-muted,
  │                             │  letter-spacing 0.08em, padding 12px 16px 6px
  │ Nav Item × 4                │
  │ ─────────────────────────── │  divider: 1px --border-subtle, margin 4px 8px
  │ Setări                      │
  ├─────────────────────────────┤
  │ USER CARD                   │  padding 12px, border-top: 1px --border-subtle
  └─────────────────────────────┘

NAV ITEM — stări:
  default:  bg transparent, text --text-secondary, icon --text-muted
  hover:    bg --bg-hover (transition --motion-fast)
  active:   bg --bg-active, border-left 2px --color-emerald-500,
            text --text-primary, icon --color-emerald-500
            border: 1px --border-default (pe tot cardul)

NAV ITEM — structură internă:
  [icon 16px] [label 13px 600] [sub-label 10px --text-tertiary]
  Badge "De rezolvat": pill --severity-critical-text / --severity-critical-bg
  Badge "ACUM": pill --status-info-text / --status-info-bg (pe item-ul activ)

LOGO:
  Icon: 32px, border-radius --radius-sm, bg --color-emerald-700
  Text: 14px 700 --text-primary
```

---

## PAGINA 1 — ACASĂ (`/dashboard`)

```
LAYOUT: max-width 860px, margin 0 auto, padding --space-8 --space-10

─── PAGE HEADER ────────────────────────────────────────────────

  Eyebrow: "DASHBOARD"
    font-size 11px, font-weight 600, --text-tertiary,
    letter-spacing 0.08em, text-transform uppercase, margin-bottom 6px

  H1: "Starea conformității tale"
    font-size 24px, font-weight 700, --text-primary

  Subtitle: org name + frameworks active
    font-size 14px, --text-secondary, margin-top 6px

  Right side (flex-end, gap 8px):
    Badge status global (compliant / drift)
    Button secondary sm "Raport 1 pagină"

─── PRIMARY ACTION CARD ─────────────────────────────────────────
  REGULA: primul element, full-width, unmissable

  Când există findings critice/ridicate:
    background: --status-drift-bg
    border: 1px --status-drift-border
    border-radius: --radius-md
    padding: --space-4 --space-6 (18px 24px)

    Layout: flex, gap 16px, align-items center
    Left:  icon circle 40px → --status-drift-bg, icon warning --color-amber-500
    Center:
      Eyebrow: "ACȚIUNEA TA ACUM" — 11px 600 --color-amber-500 uppercase letter-spacing 0.06em
      Title:   "N finding-uri de rezolvat — X critice" — 15px 600 --text-primary
      Sub:     "Rezolvarea crește scorul cu ~N puncte" — 13px --text-secondary
    Right: Button primary md "Rezolvă acum →"

  Când nu sunt findings critice:
    background: --status-compliant-bg
    border: 1px --status-compliant-border
    Eyebrow: verde --color-emerald-500
    Buttons: "Rulează o nouă scanare" (primary) + "Descarcă raport" (secondary)

─── SCORE + HEALTH CHECK ────────────────────────────────────────
  Grid: 180px | 1fr, gap --space-4, margin-top --space-4

  LEFT — Score Card:
    Card default, padding --space-6, text-align center
    Label: "SCOR GLOBAL" — 11px --text-tertiary uppercase, margin-bottom 12px

    Circular Progress Ring SVG 80px:
      Track: stroke --border-subtle, stroke-width 6
      Fill:  stroke calculat din scor:
             ≥75 → --color-emerald-500
             50-74 → --color-amber-500
             <50 → --color-red-500
      transform: rotate(-90deg)
      strokeLinecap: round

    Number în centru:
      font-family: var(--font-mono)   ← MONO pentru scor numeric
      font-size 28px, font-weight 700, --text-primary

    Badge sub ring: risk label (compliant / atenție / critic)

  RIGHT — Health Check Card (flush variant):
    Header: padding 14px 18px
      "Health Check" — 13px 600 --text-primary
      Badge status global (Atenție / OK / Critic)
    Divider: 1px --border-subtle
    5 rows:
      padding: 10px 18px
      border-bottom: 1px --border-subtle (ultimul fără)
      Layout: [StatusDot] [label 13px --text-secondary flex:1] [detail 12px --text-tertiary]

─── FRAMEWORK READINESS ─────────────────────────────────────────
  Card flush, full-width, margin-top --space-4
  Header: padding 14px 18px → "Readiness pe framework" 13px 600
  Divider
  Grid 4 coloane egale, border-right între ele:
    Fiecare coloană padding 16px 20px:
      Label: framework name — 11px --text-tertiary, margin-bottom 8px
      Score: font-family var(--font-mono) — 22px 700, colorat din scor
      Progress bar: height 4px, bg --bg-hover, fill colorat, radius 99px
```

---

## PAGINA 2 — SCANEAZĂ (`/dashboard/scan`)

```
LAYOUT: max-width 700px, margin 0 auto, padding --space-8 --space-10

─── PAGE HEADER ─────────────────────────────────────────────────
  (Același pattern: eyebrow + H1 + subtitle)
  Eyebrow: "SCANARE"
  H1: "Scanează un document"

─── SOURCE TYPE SELECTOR ────────────────────────────────────────
  Label: "CE VREI SĂ ANALIZEZI?" — 12px 600 --text-tertiary, letter-spacing 0.04em
  Grid 2×2, gap --space-3

  Source Type Tile:
    Card interactiv, padding 14px 16px, border-radius --radius-sm
    Layout: flex, gap 12px, align-items center
    [icon 20px emoji] [label 13px 600] + [sub-label 11px --text-tertiary]

    Default:  bg --bg-card, border 1px --border-subtle
    Hover:    border --border-default
    Selected: bg --status-compliant-bg, border 1px rgba(52,211,153,0.3)
              label: --color-emerald-500
    Transition: --motion-fast --easing

─── UPLOAD ZONE ─────────────────────────────────────────────────
  Apare după selecție sursă — slide-down animat (--motion-base)
  Card default:
    Interior: border 2px dashed --border-strong, border-radius --radius-sm
    padding: 48px 24px, text-align center, cursor pointer
    Hover: border-color --color-emerald-500 (transition --motion-fast)
    Icon: 32px, margin-bottom 12px
    Title: 14px 600 --text-primary
    Sub:   12px --text-tertiary
    Button primary mt-4

─── PROGRESS STATE ──────────────────────────────────────────────
  Înlocuiește upload zone în timpul analizei
  Card default, padding --space-12, text-align center
  Icon animat, title 15px 600, sub 13px --text-secondary
  Progress bar: height 4px, bg --bg-hover, fill --color-emerald-500
                animated fill, border-radius 99px

─── TABS: Activ | Istoric ────────────────────────────────────────
  Tab bar: border-bottom 1px --border-subtle, gap 0
  Tab item:
    padding 10px 16px, font-size 13px 600
    Active:  --text-primary, border-bottom 2px --color-emerald-500
    Default: --text-tertiary, border-bottom 2px transparent
    Hover:   --text-secondary
```

---

## PAGINA 3 — SCAN RESULTS (`/dashboard/scan/results/[scanId]`)

```
LAYOUT: max-width 760px, margin 0 auto, padding --space-8 --space-10

─── SUCCESS BANNER ──────────────────────────────────────────────
  bg: --status-compliant-bg, border: 1px --status-compliant-border
  border-radius: --radius-sm, padding: 14px 18px
  Layout: flex, gap 12px, align-items center
  [✓ icon --color-emerald-500 18px]
  [title 13px 600 --text-primary] + [detail 12px --text-secondary]

─── FINDING GROUPS ──────────────────────────────────────────────
  Grupate: Critice → Ridicate → Medii → Informative
  Default: Critice deschis, restul colapsate

  Group Header (accordion trigger):
    padding: 10px 0, cursor pointer
    Layout: flex, align-items center, gap 8px
    [icon emoji] [label "Critice (N)"] [chevron right/down]
    font-size 13px 600 --text-secondary
    Hover: --text-primary

  Finding Row:
    Card default, padding 12px 16px, margin-bottom --space-2
    Layout: flex, align-items center, gap 12px

    [SeverityPill]
    [title 13px 500 --text-primary flex:1]
    [Badge framework: "GDPR" / "NIS2" etc — neutral variant]
    [age 11px --text-tertiary]
    [Button secondary sm "Rezolvă →"] — doar pe critical/high

─── CTA BAR ─────────────────────────────────────────────────────
  margin-top --space-5, display flex, gap --space-3
  Button primary: "Adaugă toate în queue →"
  Button secondary: "Descarcă raport scan"
  Button ghost: "Scanează alt document"
```

---

## PAGINA 4 — DE REZOLVAT (`/dashboard/resolve`)

```
LAYOUT: max-width 900px, margin 0 auto, padding --space-8 --space-10

─── PAGE HEADER ─────────────────────────────────────────────────
  H1: "De rezolvat"
  Sub: "Toate finding-urile, task-urile și drift-urile — un singur loc."
  Right: badges severity summary (2 critice / 2 ridicate / 1 medie)

─── FILTER TABS ─────────────────────────────────────────────────
  Tabs pill style, gap --space-1, margin-bottom --space-5
  Active:   bg --bg-active, border 1px --border-default, --text-primary
  Default:  bg transparent, --text-tertiary
  border-radius: --radius-sm, padding: 6px 14px, font-size 12px 600

─── FINDING ROW (default / colapsat) ────────────────────────────
  Card default, margin-bottom --space-2
  border-radius: --radius-md
  Transition pe border: --motion-fast

  padding: 14px 18px
  Layout: flex, align-items center, gap 12px, cursor pointer
  Hover: bg --bg-hover pe interior (nu pe card întreg)

  [SeverityPill]
  [title 13px 500 --text-primary flex:1]
  [Badge framework — neutral]
  [age 11px --text-tertiary min-width 80px text-right]
  [Badge review state — colorat din --review-{state}-*]
  [chevron ▼ --text-tertiary 12px]

  Când expandat: border --border-default (față de --border-subtle default)

─── RESOLUTION LAYER (expandat inline) ──────────────────────────
  border-top: 1px --border-subtle
  padding: 20px

  Header:
    "RESOLUTION LAYER · Art. X" — 11px 600 --text-tertiary
    letter-spacing 0.06em, uppercase, margin-bottom 16px

  Stepper vertical (7 pași):
    Layout per pas: flex, gap 14px, padding-bottom 16px (ultimul 0)

    Indicator stânga (width 24px):
      ┌─ Rezolvat ─┐  circle 24px, bg --status-compliant-bg
      │     ✓      │  border 1px rgba(52,211,153,0.4), icon --color-emerald-500
      └────────────┘
      ┌─ Activ ────┐  circle 24px, bg --bg-active
      │     3      │  border 1px --border-strong, text --text-primary
      └────────────┘  glow: 0 0 0 3px rgba(52,211,153,0.15)
      ┌─ Pending ──┐  circle 24px, bg --bg-overlay
      │     4      │  border 1px --border-subtle, text --text-muted
      └────────────┘

      Connector line între indicatori:
        width 1px, bg --border-subtle, flex:1, margin-top 4px

    Conținut dreapta:
      padding-top 2px
      Label pas: 11px 600
        Rezolvat → --color-emerald-500
        Activ    → --text-tertiary
        Pending  → --text-muted
      Text:  13px
        Rezolvat → --text-tertiary
        Activ    → --text-primary
        Pending  → --text-muted
      CTA (doar pe pasul activ dacă e cazul):
        Button primary sm, margin-top 10px

─── REVIEW STATE BADGE MAPPING ──────────────────────────────────
  detected      → --review-detected-text / bg      "Detectat"
  pendingReview → --review-pending-text / bg        "De revizuit"
  escalated     → --review-escalated-text / bg      "Escaladat"
  confirmed     → --review-confirmed-text / bg      "Confirmat"
  dismissed     → --review-dismissed-text / bg      "Respins"
  remediation   → --review-remediation-text / bg    "În remediere"
  resolved      → --review-resolved-text / bg       "Rezolvat"
  autoResolved  → --review-resolved-text / bg + dot "Auto-rezolvat"
```

---

## PAGINA 5 — RAPOARTE (`/dashboard/reports`)

```
LAYOUT: max-width 800px, margin 0 auto, padding --space-8 --space-10

─── PAGE HEADER ─────────────────────────────────────────────────
  H1: "Dovezi & Export"
  Right: Badge "Stare audit: Pregătit" — --status-compliant-*

─── ACTION CARDS GRID ───────────────────────────────────────────
  Grid 2×2, gap --space-3

  Action Card:
    Card default, padding --space-5
    Layout: flex, align-items center, gap 14px
    [icon emoji 28px]
    [title 14px 600 --text-primary] + [sub 12px --text-tertiary flex:1]
    [Button secondary sm CTA]

─── SUB-TABS ────────────────────────────────────────────────────
  (Același pattern de tab ca Scanează)
  Rapoarte | Politici | Log | Trust Center
```

---

## COMPONENTE WORKFLOW-SPECIFICE

### Finding Card (standalone, pentru alte contexte)

```
Card tinted → severity determină border color tint
Header: [SeverityPill] [framework badge] [review state badge]
Title: 16px 600 --text-primary, margin: --space-2 0
Sub: article legal — font-family var(--font-mono) 12px --text-tertiary
Body: description 13px --text-secondary
Footer: [confidence score mono] [age] [Button "Rezolvă →"]
```

### Drift Summary Inline (Mode 1 — Progressive Disclosure)

```
Format: label → valoare
  Expected: [valoare] → Found: [valoare]

Colors:
  worse:   --color-red-500 pe "Found" value
  better:  --color-emerald-500 pe "Found" value
  changed: --color-amber-500 pe ambele valori
  same:    --text-muted

Font: var(--font-mono) pentru valorile tehnice
Prefix "Expected:" / "Found:" — --text-tertiary 11px
```

### Evidence Row

```
Layout: flex, align-items center, gap --space-3
padding: 10px --space-4
[icon tip fișier 16px] [nume document 13px --text-primary flex:1]
[date upload 11px --text-tertiary font-mono] [Badge status dovadă]
[Button ghost sm "Descarcă"]
border-bottom: 1px --border-subtle (ultimul fără)
```

### Compliance Streak Widget

```
Afișat discret sub scorul global, doar dacă streak > 0
Layout: flex, gap --space-2, align-items center
[🔥 icon] ["N zile consecutive peste 70" 12px --text-tertiary]
["Record: N zile" 11px --text-muted]

Dacă streak = 0: nu afișezi componenta
Fără animații sau gamification agresivă
```

### Sector Benchmark

```
Afișat sub Framework Readiness, doar dacă percentil > 50
Font: 12px --text-tertiary
"Scorul tău e mai bun decât [N]% din firmele [sector] · bazat pe [N] firme"
Niciodată date individuale — doar agregat anonim
```

---

## PROGRESSIVE DISCLOSURE PENTRU DRIFT

```
MODE 1 — Inline (în rows, cards, previews):
  Compact, pe o linie
  Expected: [val mono] → Found: [val mono colorat]

MODE 2 — Property Diff Table (în details):
  Tabel: Property | Expected | Actual | Drift
  Drift column: Badge worse/better/changed/same
  Row highlight: --status-drift-bg pe rows cu drift

MODE 3 — Full Config Diff (advanced, la cerere):
  Split view: Expected Config | Actual Config
  Linii drifted: highlight --status-drift-bg
  Mereu ascuns default — "Vezi diff complet ↓" link

REGULA: Mode 1 aproape mereu.
        Mode 3 la click explicit — nu din prima.
```

---

## EMPTY STATES

```
Pattern consistent pentru toate paginile fără date:
  Container: flex column, align-items center, padding --space-12
  Icon: 32px, --text-muted, margin-bottom --space-4
  Title: 15px 600 --text-secondary (opțional)
  Message: 13px --text-muted, text-align center, max-width 320px
  Button(s): margin-top --space-4

Exemple:
  Scan fără documente: "Nicio scanare încă — încarcă primul document"
  Findings zero:       "Nu au fost găsite probleme · scor complet"
  Vendori zero:        "Nu ai furnizori înregistrați"
  Incidente zero:      "Niciun incident raportat"
```

---

## SKELETON LOADING

```
Folosești skeleton pentru loading states — NU spinner pe tot ecranul
Skeleton element:
  bg: var(--bg-hover)
  border-radius: var(--radius-xs)
  animation: pulse 1.5s ease-in-out infinite
  Dimensiunile reflectă exact conținutul real

@keyframes pulse {
  0%, 100% { opacity: 1 }
  50%       { opacity: 0.4 }
}
```

---

## ACCESIBILITATE — OBLIGATORIU

```
Contrast:
  --text-primary pe --bg-panel: minimum AA (4.5:1)
  --text-secondary pe informații importante: minimum 4.5:1

Focus visible:
  Toate elementele interactive:
    outline: 2px solid var(--border-focus)
    box-shadow: var(--shadow-focus)
  Nu bazezi focus DOAR pe schimbare culoare text

Target size:
  Minimum 40×40px pentru toate action controls

Status meaning:
  Culoarea NU e singurul semnal
  Adaugi MEREU: icon + label text + wording clar

Motion:
  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }

Diff views:
  worse / better / same → text explicit, nu doar culoare
```

---

## REGULI FINALE — CE NU FACI NICIODATĂ

```
1. Raw hex în componentele UI — INTERZIS
2. Emerald ca culoare decorativă — INTERZIS
3. Roșu pentru warning banal — INTERZIS (roșu = critical/fail only)
4. Violet în afara review states — INTERZIS
5. font-mono pe titluri și navigare — INTERZIS
6. Glow puternic pe button states — INTERZIS
7. Două butoane primare pe aceeași pagină — INTERZIS
8. Status-tinted cards pe tot dashboardul — INTERZIS
9. Status și severity amestecate în același badge — INTERZIS
10. Full config diff afișat din prima — INTERZIS
11. Carduri cu hover dacă nu sunt clicabile — INTERZIS
12. Drift ascuns doar în tooltip — INTERZIS
```

---

## FEELING FINAL AL PRODUSULUI

```
audit-ready    → totul e documentat, trasat, verificabil
calm           → spațiu alb generos, fără zgomot vizual
structured     → ierarhie clară, un lucru pe rând
trustworthy    → datele sunt reale, sursele sunt vizibile
operational    → arată că lucrezi, nu că te joci
human-in-loop  → sistemul propune, omul decide
```
