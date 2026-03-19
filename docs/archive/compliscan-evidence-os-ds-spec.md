# CompliScan Evidence OS Design System v2.0

> Status: `deprecated`
>
> Acest document nu mai este sursa canonica de design pentru `Evidence OS`.
> Se pastreaza doar ca referinta istorica / exploratorie.
>
> Sursa oficiala curenta este:
> - `public/evidence-os-design-system-v1.md`
>
> Regulile oficiale de adoptie sunt in:
> - `public/evidence-os-oficializare-si-adoptie.md`

Acest document ramane in repo doar pentru istoric si comparatie de directie.
Nu trebuie folosit ca `source of truth` pentru implementari noi.
Directia NU este CLI-first si NU copiaza Compli-AI 1:1.
Directia este: evidence operating system, human-review-first, warm graphite surfaces, semantic status, progressive disclosure pentru drift si diff.

## 1. Design intent

### Product metaphor
CompliScan trebuie sa para:
- un control room de conformitate
- un evidence operating system
- un workflow auditabil
- un produs sobru, premium, precis

Nu trebuie sa para:
- hacker dashboard
- neon cyber UI
- startup glossy marketing app
- terminal shell imitator

### Core principles
1. Trust before drama
2. Evidence before decoration
3. Human review before full automation
4. Status and severity are separate systems
5. Drift is a first-class concept
6. Surfaces carry hierarchy, not bright colors
7. One primary action per zone
8. Progressive disclosure for technical detail

---

## 2. Token architecture

Token stack obligatoriu:

1. **Primitive tokens**
   - raw colors
   - spacing
   - radius
   - typography
   - motion
   - border width
   - shadow
   - opacity
   - z-index

2. **Semantic tokens**
   - backgrounds
   - text
   - borders
   - icons
   - actions
   - status
   - severity
   - review states
   - diff states
   - disabled/loading/focus

3. **Component tokens**
   - button.primary.bg
   - card.standard.border
   - badge.review.text
   - table.row.hover
   - diffRow.worse.bg
   - modal.surface.shadow

4. **State rules**
   - default
   - hover
   - active
   - selected
   - focus-visible
   - disabled
   - loading
   - open
   - invalid
   - dragging
   - resolved
   - escalated
   - drifted

### 2.1 Primitive tokens

#### Color - Warm Graphite
- color.graphite.950 = #111113
- color.graphite.900 = #18181B
- color.graphite.850 = #1F1F23
- color.graphite.800 = #27272B
- color.graphite.750 = #2E2E33
- color.graphite.700 = #3A3A40
- color.graphite.600 = #505057
- color.graphite.500 = #686872
- color.graphite.400 = #8C8C96
- color.graphite.300 = #B2B2BA
- color.graphite.200 = #D6D6DD
- color.graphite.100 = #F1F1F5

#### Color - Emerald brand / compliant
- color.emerald.700 = #1E8E67
- color.emerald.600 = #279977
- color.emerald.500 = #34D399
- color.emerald.400 = #5BDEAC
- color.emerald.300 = #8BE8C4

#### Color - Red fail
- color.red.700 = #7A1F24
- color.red.600 = #A12B33
- color.red.500 = #F87171
- color.red.400 = #FF9A9A

#### Color - Amber drift / warning
- color.amber.700 = #7A5A0B
- color.amber.600 = #9A730F
- color.amber.500 = #FBBF24
- color.amber.400 = #FFD867

#### Color - Violet review
- color.violet.700 = #5B3D8A
- color.violet.600 = #7149A8
- color.violet.500 = #A78BFA
- color.violet.400 = #C0AEFF

#### Color - Blue informational
- color.blue.700 = #1D4E89
- color.blue.600 = #245DA2
- color.blue.500 = #60A5FA
- color.blue.400 = #8DBEFF

#### Typography
- font.family.ui = Inter, ui-sans-serif, system-ui, sans-serif
- font.family.display = Inter, ui-sans-serif, system-ui, sans-serif
- font.family.mono = "JetBrains Mono", ui-monospace, SFMono-Regular, monospace

- font.size.10 = 10px
- font.size.12 = 12px
- font.size.13 = 13px
- font.size.14 = 14px
- font.size.16 = 16px
- font.size.18 = 18px
- font.size.20 = 20px
- font.size.24 = 24px
- font.size.32 = 32px
- font.size.48 = 48px

- font.weight.400 = 400
- font.weight.500 = 500
- font.weight.600 = 600
- font.weight.700 = 700

- line.height.14 = 14px
- line.height.16 = 16px
- line.height.18 = 18px
- line.height.20 = 20px
- line.height.24 = 24px
- line.height.28 = 28px
- line.height.32 = 32px
- line.height.40 = 40px
- line.height.56 = 56px

#### Spacing
- space.0 = 0
- space.1 = 4px
- space.2 = 8px
- space.3 = 12px
- space.4 = 16px
- space.5 = 20px
- space.6 = 24px
- space.8 = 32px
- space.10 = 40px
- space.12 = 48px
- space.16 = 64px

#### Radius
- radius.xs = 6px
- radius.sm = 8px
- radius.md = 12px
- radius.lg = 16px
- radius.xl = 20px
- radius.2xl = 24px
- radius.pill = 999px

#### Border
- border.width.1 = 1px
- border.width.2 = 2px
- border.width.3 = 3px

#### Shadow
- shadow.sm = 0 1px 2px rgba(0,0,0,0.20)
- shadow.md = 0 8px 24px rgba(0,0,0,0.24)
- shadow.lg = 0 16px 40px rgba(0,0,0,0.28)
- shadow.focus = 0 0 0 3px rgba(91,222,172,0.22)

#### Motion
- motion.fast = 120ms
- motion.base = 180ms
- motion.slow = 260ms
- easing.standard = cubic-bezier(0.2, 0, 0, 1)

### 2.2 Semantic tokens

#### Surfaces
- bg.canvas = color.graphite.950
- bg.panel = color.graphite.900
- bg.card = color.graphite.900
- bg.overlay = color.graphite.850
- bg.hover = color.graphite.800
- bg.active = color.graphite.750
- bg.disabled = color.graphite.800
- bg.inverse = color.graphite.100

#### Text
- text.primary = color.graphite.100
- text.secondary = color.graphite.300
- text.tertiary = color.graphite.400
- text.muted = color.graphite.500
- text.disabled = color.graphite.600
- text.inverse = color.graphite.950

#### Borders
- border.subtle = color.graphite.800
- border.default = color.graphite.750
- border.strong = color.graphite.700
- border.focus = rgba(91,222,172,0.42)

#### Action semantics
- action.primary.bg = color.emerald.500
- action.primary.text = text.inverse
- action.primary.hover = color.emerald.400
- action.primary.active = color.emerald.600

- action.secondary.bg = bg.card
- action.secondary.text = text.primary
- action.secondary.border = border.default
- action.secondary.hover = bg.hover

- action.ghost.bg = transparent
- action.ghost.text = text.secondary
- action.ghost.hover = bg.hover

- action.destructive.bg = rgba(248,113,113,0.12)
- action.destructive.border = rgba(248,113,113,0.42)
- action.destructive.text = color.red.500

#### Status semantics
Status inseamna operational meaning, nu gravity:
- status.compliant.*
- status.failing.*
- status.drift.*
- status.review.*
- status.info.*
- status.neutral.*

#### Severity semantics
Severity inseamna gravity:
- severity.critical.*
- severity.high.*
- severity.medium.*
- severity.low.*

#### Review flow semantics
- review.detected.*
- review.pending.*
- review.escalated.*
- review.confirmed.*
- review.dismissed.*
- review.remediation.*
- review.accepted.*
- review.resolved.*
- review.autoResolved.*

#### Diff semantics
- diff.same.*
- diff.better.*
- diff.worse.*
- diff.changed.*
- diff.missing.*

### 2.3 Naming convention

Toate token names trebuie sa foloseasca una din formele:
- primitives.color.graphite.950
- semantic.bg.canvas
- semantic.status.drift.text
- component.button.primary.bg
- component.diffRow.worse.border

Interzis:
- raw hex in component code
- nume de tip `green500` direct in JSX
- state styling hardcoded in component body

---

## 3. Global state rules

### Default
- suprafata de baza
- bordura subtile
- text primary / secondary standard

### Hover
- creste contrastul suprafetei cu o treapta
- optional border.default -> border.strong
- nu schimba status color doar pe hover

### Active / Pressed
- suprafata se inchide usor
- miscarea este scurta
- nu adauga glow

### Selected
- foloseste bg.active sau status tint soft
- selected nu trebuie sa para identic cu hover
- cand e nevoie, adauga un accent de 2-3px

### Focus-visible
- mereu vizibil pe keyboard navigation
- foloseste border.focus + shadow.focus
- nu baza focusul doar pe schimbare de culoare text

### Disabled
- reduce contrastul
- elimina hover
- mentine lizibilitatea

### Loading
- nu muta layoutul
- foloseste skeleton sau spinner discret
- primary buttons pastreaza dimensiunea

### Invalid
- foloseste semantic failing / red tint doar pe zona afectata
- eroarea trebuie sa aiba text si icon, nu doar border rosu

### Drifted
- drift inseamna schimbare fata de baseline
- foloseste amber si diff labels, nu severitate pura

---

## 4. Component inventory complet

### Layout si shell
- App Canvas
- Sidebar
- Topbar
- Page Header
- Section Header
- Content Grid
- Split Pane

### Navigation
- Nav Item
- Tabs
- Breadcrumbs
- Pagination
- Stepper

### Buttons si action controls
- Button
- Icon Button
- Button Group
- Segmented Control

### Inputs si forms
- Text Input
- Search Input
- Textarea
- Select
- Combobox / Autocomplete
- Checkbox
- Radio
- Switch
- Date Picker
- Time Picker
- File Upload / Dropzone
- Multi-file Manifest Upload
- Tag Input / Multi-select

### Status si feedback
- Badge
- Severity Pill
- Inline Notice
- Alert Banner
- Toast
- Tooltip
- Popover
- Skeleton
- Empty State
- Progress Bar
- Status Dot

### Containers si data display
- Standard Card
- Interactive Card
- Status-Tinted Card
- KPI / Stat Card
- Score Card
- Property List
- Table
- Diff Table
- Diff Row
- Accordion
- Drawer / Side Sheet
- Modal
- Dropdown Menu
- Code / Config Block
- Document Preview Panel
- Evidence Row
- Evidence Group
- Activity Feed
- Timeline

### Workflow-specific CompliScan components
- Source Type Tile
- Scan Wizard Step
- System Inventory Card
- Discovery Result Card
- Finding Card
- Review Gate
- Drift Summary Inline
- Drift Property Diff Table
- Full Config Diff
- Remediation Task Row
- Review Queue Row
- Human Review State Machine
- Evidence Checklist
- Export State Panel

### Charts si analytics
- Line Chart
- Bar Chart
- Donut Chart
- Chart Legend
- Chart Tooltip

---

## 5. Mandatory per-component contract

Pentru fiecare componenta implementata, Codex trebuie sa defineasca:
1. variants
2. sizes
3. allowed content
4. required states
5. tokens consumed
6. accessibility rules
7. when to use
8. when not to use

Format recomandat:
- component name
- purpose
- variants
- sizes
- slots
- states
- tokens
- rules
- a11y
- examples

---

## 6. Accessibility rules

### Contrast
- text primary pe bg.panel: minimum AA
- text secondary nu sub 4.5:1 cand este informatie importanta

### Focus
- toate elementele interactive au focus-visible clar

### Target size
- 40x40 minimum pentru action controls importante

### Status meaning
- culoarea nu este singurul semnal
- foloseste icon, label, wording

### Motion
- respecta reduced motion

### Diff views
- “worse”, “same”, “better” trebuie sa aiba text, nu doar culoare

---

## 7. Usage rules - ce sa nu faci

1. Nu colora tot dashboardul in emerald
2. Nu folosi status-tinted cards peste tot
3. Nu amesteca status si severity intr-o singura eticheta neclara
4. Nu folosi violet in afara review-related states
5. Nu pune mono pe titluri si nav
6. Nu pune glow puternic pe button states
7. Nu folosi rosu pentru warning banal
8. Nu ascunde drift-ul doar in tooltip sau secondary screen
9. Nu afisa full config diff din prima daca inline summary e suficient
10. Nu face carduri interactive daca nu sunt clicabile

---

## 8. Progressive disclosure pattern obligatoriu pentru drift

### Mode 1 - Inline Summary
Cand:
- row dense
- dashboard card
- activity item
- preview in table

Format:
- Expected: Encryption ON -> Found: Encryption OFF

### Mode 2 - Property Diff Table
Cand:
- review details
- source details
- finding details

Format:
- Property | Expected | Actual | Drift

### Mode 3 - Full Config Diff
Cand:
- advanced inspection
- audit export preview
- engineering handoff

Format:
- Expected Config
- Actual Config
- Drifted values highlighted

Regula:
- Mode 1 trebuie sa existe aproape mereu
- Mode 2 este standard detail view
- Mode 3 este advanced view

---

## 9. Human review state rules obligatorii

### Flow
detected -> pendingReview -> escalated -> confirmed/dismissed -> remediation -> accepted/resolved

### State meaning
- detected = system-generated observation
- pendingReview = om trebuie sa verifice
- escalated = nevoie de senior review
- confirmed = finding validat
- dismissed = false positive / not applicable
- remediation = fix in progress
- accepted = risk accepted with rationale
- resolved = issue closed with evidence
- autoResolved = system no longer present / condition cleared automatically

### Visual rules
- detected = neutral sau amber light, in functie de context
- pendingReview = violet
- escalated = violet stronger
- confirmed = amber sau red in functie de severity outcome
- dismissed = neutral
- remediation = neutral-active
- accepted = amber/blue based on policy decision
- resolved = emerald
- autoResolved = neutral + resolved tag

---

## 10. Codex output required

Codex trebuie sa genereze:
1. CSS variables pentru primitive + semantic + component tokens
2. Type-safe token object in TS
3. Component primitives
4. Composed product components
5. State utilities
6. Accessibility-safe variants
7. Example implementations pentru:
   - Dashboard hero
   - Finding card
   - Drift summary inline
   - Diff table
   - Review queue row
   - System inventory card
   - Export state panel

---

## 11. Codex prompt

Use this design system as the implementation contract for CompliScan.

Requirements:
- build a dark warm-graphite enterprise evidence OS
- use semantic and component tokens only, never raw hex in UI components
- separate status from severity
- implement progressive disclosure for drift diffs
- implement human-review-first workflow states
- use Inter for UI and JetBrains Mono only for machine values
- keep emerald restrained and premium
- keep surfaces neutral and status tints sparse
- ship a complete component library and product-specific workflow components

Primary product feeling:
audit-ready, calm, structured, trustworthy, operational, human-in-the-loop
