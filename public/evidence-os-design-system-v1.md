
# Evidence OS
### Design System v1.0 — CompliScan

> **Evidence OS** is the design language of CompliScan. It communicates confidence, clarity, and control — the qualities compliance teams need to trust what they see and act decisively.

---

## 1. Design Principles

### 1.1 The Five Pillars

| Principle | Description | In Practice |
|-----------|-------------|-------------|
| **Confidence First** | Every surface should feel authoritative. Users make audit-critical decisions — the UI must never feel uncertain. | Dark surfaces, bold type, high-contrast status indicators. No pastel ambiguity. |
| **Evidence Over Decoration** | Every pixel earns its place through information density, not aesthetics. | No illustrations. No hero images. Data-dense layouts with breathing room through spacing, not emptiness. |
| **Progressive Disclosure** | Compliance is complex — surface complexity in layers, not all at once. | Tab-based sub-navigation. Collapsible panels. Summary → detail drill-down. |
| **Trust Through Transparency** | Users must understand *why* the system shows what it shows. | Field confidence indicators. Source signals on every finding. Actor trails on every action. |
| **Role-Aware Surfaces** | The interface adapts to who's looking — not by hiding information, but by gating actions. | Viewers see everything, touch nothing. Owners see everything, control everything. |

### 1.2 Design Personality

| Attribute | Evidence OS | Not This |
|-----------|-------------|----------|
| **Tone** | Confident, direct | Playful, casual |
| **Density** | Information-rich | Spacious-for-its-own-sake |
| **Color** | Dark-dominant with signal colors | Light, pastel, gradient-heavy |
| **Motion** | Purposeful, fast (150-250ms) | Bouncy, decorative, slow |
| **Language** | Romanian-first UI labels | Mixed or inconsistent language |

---

## 2. Color System

### 2.1 Architecture

Evidence OS uses a **4-tier token architecture** inspired by Raycast's approach:

```
Primitive → Alias → Semantic → Component
```

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitive** | Raw HSL values. Never used directly in UI. | `gray-950: hsl(220, 14%, 8%)` |
| **Alias** | Named references to primitives. Theme-switchable. | `surface-primary: gray-950` (dark) / `white` (light) |
| **Semantic** | Intent-based tokens. What the color *means*. | `severity-critical: red-500` |
| **Component** | Scoped to a specific component. | `badge-severity-critical-bg: severity-critical/15%` |

### 2.2 Core Palette

#### Neutrals (Gray Scale — Blue-tinted)

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `surface-base` | `hsl(220, 14%, 4%)` | `hsl(0, 0%, 100%)` | App background |
| `surface-primary` | `hsl(220, 14%, 8%)` | `hsl(220, 14%, 98%)` | Cards, panels |
| `surface-secondary` | `hsl(220, 14%, 12%)` | `hsl(220, 14%, 95%)` | Nested containers, table rows |
| `surface-tertiary` | `hsl(220, 14%, 16%)` | `hsl(220, 14%, 91%)` | Hover states, active tabs |
| `surface-elevated` | `hsl(220, 14%, 18%)` | `hsl(0, 0%, 100%)` | Modals, dropdowns, tooltips |
| `border-subtle` | `hsl(220, 14%, 16%)` | `hsl(220, 14%, 90%)` | Card borders, dividers |
| `border-default` | `hsl(220, 14%, 22%)` | `hsl(220, 14%, 82%)` | Input borders, focused elements |
| `border-strong` | `hsl(220, 14%, 30%)` | `hsl(220, 14%, 70%)` | Emphasis borders |
| `text-primary` | `hsl(220, 14%, 93%)` | `hsl(220, 14%, 10%)` | Headings, primary content |
| `text-secondary` | `hsl(220, 14%, 63%)` | `hsl(220, 14%, 45%)` | Descriptions, metadata |
| `text-tertiary` | `hsl(220, 14%, 40%)` | `hsl(220, 14%, 60%)` | Placeholders, disabled |
| `text-inverse` | `hsl(220, 14%, 10%)` | `hsl(220, 14%, 93%)` | Text on accent backgrounds |

#### Brand / Accent

| Token | Value | Usage |
|-------|-------|-------|
| `accent-primary` | `hsl(230, 80%, 62%)` | Primary CTA, active nav, focus rings |
| `accent-primary-hover` | `hsl(230, 80%, 55%)` | Hover state |
| `accent-primary-subtle` | `accent-primary / 12%` | Accent badge backgrounds, highlights |
| `accent-secondary` | `hsl(230, 60%, 72%)` | Secondary accent, links |

### 2.3 Semantic Colors — Status & Severity

#### Severity Scale

| Severity | Token | Foreground | Background (12% opacity) | Usage |
|----------|-------|------------|--------------------------|-------|
| **Critical** | `severity-critical` | `hsl(0, 72%, 62%)` | `severity-critical / 12%` | Critical findings, SLA breaches, urgent drift |
| **High** | `severity-high` | `hsl(25, 90%, 58%)` | `severity-high / 12%` | High-severity findings, escalations |
| **Medium** | `severity-medium` | `hsl(45, 90%, 55%)` | `severity-medium / 12%` | Medium findings, warnings |
| **Low** | `severity-low` | `hsl(210, 70%, 62%)` | `severity-low / 12%` | Low findings, informational |

#### Status Colors (Lifecycle States)

| Intent | Token | Foreground | Background | Maps To |
|--------|-------|------------|------------|---------|
| **Success / Resolved** | `status-success` | `hsl(145, 60%, 48%)` | `status-success / 12%` | `resolved`, `confirmed`, `sufficient`, `covered`, `Confirmare puternica` |
| **Warning / In Progress** | `status-warning` | `hsl(45, 90%, 55%)` | `status-warning / 12%` | `in_progress`, `reviewed`, `partial`, `weak`, `Confirmare partiala` |
| **Danger / Open** | `status-danger` | `hsl(0, 72%, 62%)` | `status-danger / 12%` | `open`, `missing`, `blocked` |
| **Neutral / Pending** | `status-neutral` | `text-secondary` | `surface-secondary` | `acknowledged`, `detected`, `inferred`, `Confirmare operationala` |
| **Muted / Inactive** | `status-muted` | `text-tertiary` | `surface-tertiary` | `waived`, `rejected` |
| **Accent / Confirmed** | `status-accent` | `accent-primary` | `accent-primary-subtle` | `confirmed_by_user`, `confirmed` |

#### Confidence Indicators

| Confidence | Token | Visual Treatment |
|------------|-------|-----------------|
| `confirmed` | `confidence-confirmed` = `status-success` | Solid dot + "Confirmed" label |
| `inferred` | `confidence-inferred` = `status-warning` | Hollow dot + "Inferred" label |
| `missing` | `confidence-missing` = `status-danger` | Empty ring + "Missing" label |

### 2.4 Dark/Light Mode Strategy

| Aspect | Dark Mode (Primary) | Light Mode |
|--------|-------------------|------------|
| **Background** | Near-black with blue tint | Pure white |
| **Surfaces** | Lighter = more elevated | Darker = more elevated |
| **Borders** | Lighter than surface | Darker than surface |
| **Text** | Light on dark | Dark on light |
| **Severity colors** | Same hues, adjusted lightness for contrast | Same hues, darkened for readability |
| **Status badges** | 12% foreground on dark surface | 12% foreground on light surface |

**Implementation:** CSS custom properties at `:root` (light) and `[data-theme="dark"]` (dark). Tailwind CSS config maps tokens to utility classes.

---

## 3. Typography

### 3.1 Type Scale

**Font Family:**
- **Primary:** `Inter` — clean, excellent at small sizes, wide character support for Romanian diacritics
- **Monospace:** `JetBrains Mono` — code blocks, technical IDs, hash values

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `display` | 32px | 700 | 1.1 | -0.02em | Page titles (rare) |
| `heading-1` | 24px | 700 | 1.2 | -0.015em | Section headers |
| `heading-2` | 20px | 600 | 1.25 | -0.01em | Card headers, panel titles |
| `heading-3` | 16px | 600 | 1.3 | -0.005em | Sub-sections, table headers |
| `body-large` | 15px | 400 | 1.5 | 0 | Primary content, descriptions |
| `body` | 14px | 400 | 1.5 | 0 | Default body text |
| `body-small` | 13px | 400 | 1.45 | 0 | Secondary info, metadata |
| `caption` | 12px | 500 | 1.4 | 0.01em | Labels, badges, timestamps |
| `micro` | 11px | 500 | 1.35 | 0.02em | Status dots, auxiliary indicators |
| `mono` | 13px | 400 | 1.5 | 0.02em | System IDs, hashes, code |

### 3.2 Type Principles

- **Bold hierarchy:** Titles at 700, subtitles at 600, body at 400. No 300/200 weights — confidence requires visual weight.
- **Tight headings:** Negative letter-spacing on headings creates density and authority.
- **Romanian diacritics:** Always test ă, â, î, ș, ț at all sizes. Inter handles these well.
- **No ALLCAPS for body:** ALLCAPS only for `micro` labels (e.g., badge text, column headers in condensed tables).

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | — |
| `space-1` | 4px | Tight padding (badge internal) |
| `space-2` | 8px | Compact gaps, icon margins |
| `space-3` | 12px | Default padding inside components |
| `space-4` | 16px | Card padding, list gaps |
| `space-5` | 20px | Section spacing |
| `space-6` | 24px | Panel padding |
| `space-7` | 32px | Major section breaks |
| `space-8` | 40px | Page-level spacing |
| `space-9` | 48px | Section dividers |
| `space-10` | 64px | Page margins |

### 4.2 Layout Grid

| Surface | Structure | Notes |
|---------|-----------|-------|
| **App Shell** | Sidebar (240px collapsed: 64px) + Main content | Sidebar houses pillar navigation |
| **Main Content** | Max-width: 1200px, centered | Prevents ultra-wide line lengths |
| **Content Area** | 12-column grid, 16px gutter | Responsive breakpoints below |
| **Cards** | Full-width within their grid column | No card-in-card nesting beyond 1 level |

### 4.3 Breakpoints

| Token | Value | Layout |
|-------|-------|--------|
| `bp-mobile` | < 768px | Single column, sidebar collapses to bottom nav |
| `bp-tablet` | 768–1024px | Collapsed sidebar (64px icons), 8-col content |
| `bp-desktop` | 1024–1440px | Full sidebar (240px), 12-col content |
| `bp-wide` | > 1440px | Centered content, max-width 1200px |

### 4.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 4px | Badges, small elements |
| `radius-md` | 8px | Buttons, inputs, cards |
| `radius-lg` | 12px | Modals, large containers |
| `radius-xl` | 16px | Floating panels |
| `radius-full` | 9999px | Avatar, circular indicators |

### 4.5 Elevation (Shadows — Dark Mode Adapted)

Dark mode shadows are subtle — rely more on surface color differentiation than drop shadows.

| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, buttons |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | `0 4px 12px rgba(0,0,0,0.08)` | Dropdowns |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | `0 8px 24px rgba(0,0,0,0.12)` | Modals, command palettes |
| `shadow-focus` | `0 0 0 2px accent-primary / 40%` | `0 0 0 2px accent-primary / 30%` | Focus rings |

---

## 5. Iconography

### 5.1 Style

| Property | Value |
|----------|-------|
| **Library** | Lucide Icons (open source, consistent, 24x24 grid) |
| **Default size** | 20px (nav), 16px (inline), 14px (badges) |
| **Stroke width** | 1.5px (default), 2px (emphasis) |
| **Color** | Inherits from parent `text-*` token |
| **Style** | Outlined only. No filled variants — maintains clinical precision. |

### 5.2 Key Icon Mapping

| Concept | Icon | Context |
|---------|------|---------|
| Scanare (Scanning) | `scan-line` | Pillar nav |
| Control | `shield-check` | Pillar nav |
| Dovada (Evidence) | `file-check-2` | Pillar nav |
| Drift | `git-compare` | Drift records |
| Severity: Critical | `alert-octagon` | Badges, alerts |
| Severity: High | `alert-triangle` | Badges, alerts |
| Severity: Medium | `alert-circle` | Badges, alerts |
| Severity: Low | `info` | Badges, alerts |
| Confidence: Confirmed | `check-circle-2` | Field indicators |
| Confidence: Inferred | `help-circle` | Field indicators |
| Confidence: Missing | `circle-off` | Field indicators |
| Evidence | `paperclip` | Upload, attachment |
| Audit Pack | `package` | Export actions |
| Role: Owner | `crown` | Member list |
| Role: Compliance | `shield` | Member list |
| Role: Reviewer | `eye` | Member list |
| Role: Viewer | `eye-off` | Member list |

---

## 6. Components

### 6.1 Badges & Status Indicators

The most critical component family in Evidence OS. CompliScan has **8+ status enumerations** — each needs a distinct, scannable visual treatment.

#### Badge Anatomy

```
┌──────────────────────────┐
│ [●] LABEL                │
│  ↑    ↑                  │
│ dot  text (caption size)  │
└──────────────────────────┘
```

- **Container:** `radius-sm` (4px), padding `space-1` vertical / `space-2` horizontal
- **Dot:** 6px circle, filled with foreground color
- **Text:** `caption` size (12px), weight 500, ALLCAPS
- **Background:** Semantic foreground at 12% opacity

#### Badge Variants by Enumeration

**Severity Badges**

| Value | Dot | Text | Background | Icon (optional) |
|-------|-----|------|------------|-----------------|
| `critical` | `severity-critical` | `severity-critical` | `severity-critical / 12%` | `alert-octagon` 14px |
| `high` | `severity-high` | `severity-high` | `severity-high / 12%` | `alert-triangle` 14px |
| `medium` | `severity-medium` | `severity-medium` | `severity-medium / 12%` | `alert-circle` 14px |
| `low` | `severity-low` | `severity-low` | `severity-low / 12%` | `info` 14px |

**Drift Lifecycle Badges**

| Value | Dot | Text | Background |
|-------|-----|------|------------|
| `open` | `status-danger` | `status-danger` | `status-danger / 12%` |
| `acknowledged` | `status-neutral` | `text-secondary` | `surface-secondary` |
| `in_progress` | `status-warning` | `status-warning` | `status-warning / 12%` |
| `resolved` | `status-success` | `status-success` | `status-success / 12%` |
| `waived` | `status-muted` | `text-tertiary` | `surface-tertiary` |

**System State Badges**

| Value | Dot | Text | Background |
|-------|-----|------|------------|
| `detected` | `status-neutral` | `text-secondary` | `surface-secondary` |
| `reviewed` | `status-warning` | `status-warning` | `status-warning / 12%` |
| `confirmed` | `status-success` | `status-success` | `status-success / 12%` |
| `rejected` | `status-muted` | `text-tertiary` | `surface-tertiary` |

**Evidence Quality Badges**

| Value | Treatment |
|-------|-----------|
| `sufficient` | `status-success` foreground + 12% bg + `check-circle-2` icon |
| `weak` | `status-warning` foreground + 12% bg + `alert-circle` icon |

**Field Confidence Badges**

| Value | Level | Treatment |
|-------|-------|-----------|
| `confirmed` | high | Solid green dot, "Confirmed" label |
| `inferred` | low/medium/high | Hollow amber dot, "Inferred" + confidence level chip |
| `missing` | — | Empty red ring, "Missing" label, pulsing animation |

**Control Coverage Badges**

| Value | Treatment |
|-------|-----------|
| `covered` | `status-success` + filled bar (3/3) |
| `partial` | `status-warning` + partial bar (2/3) |
| `missing` | `status-danger` + empty bar (0/3) |

**Validation Outcome Badges**

| Value | Treatment |
|-------|-----------|
| `Confirmare puternica` | `status-success` + double-check icon |
| `Confirmare partiala` | `status-warning` + single-check icon |
| `Confirmare operationala` | `status-neutral` + dash-circle icon |

### 6.2 Buttons

#### Hierarchy

| Variant | Surface | Text | Border | Usage |
|---------|---------|------|--------|-------|
| **Primary** | `accent-primary` | `text-inverse` | none | Main CTA per screen (1 max) |
| **Secondary** | `surface-secondary` | `text-primary` | `border-default` | Supporting actions |
| **Ghost** | transparent | `text-secondary` | none | Tertiary actions, toolbar items |
| **Danger** | `severity-critical / 12%` | `severity-critical` | none | Destructive actions (reset state) |
| **Accent Ghost** | transparent | `accent-primary` | none | Links, inline actions |

#### Sizes

| Size | Height | Padding H | Font | Icon |
|------|--------|-----------|------|------|
| `sm` | 28px | 10px | `caption` (12px) | 14px |
| `md` | 36px | 14px | `body` (14px) | 16px |
| `lg` | 44px | 18px | `body-large` (15px) | 20px |

#### States

| State | Treatment |
|-------|-----------|
| Default | As defined per variant |
| Hover | Surface lightened 1 step (e.g., `accent-primary-hover`) |
| Active/Pressed | Surface darkened 1 step |
| Focused | `shadow-focus` ring (2px accent) |
| Disabled | 40% opacity, cursor not-allowed |
| Loading | Spinner replaces icon, text stays, disabled interaction |

#### Role-Gated Buttons

| Pattern | Behavior |
|---------|----------|
| **Hidden** | Button not rendered at all (e.g., "Export Audit Pack" for Reviewer) |
| **Disabled + Tooltip** | Button visible but disabled with "Requires Compliance role" tooltip |

**Rule:** Use *hidden* for actions outside user's conceptual scope. Use *disabled + tooltip* when users should know the action exists but can't perform it.

### 6.3 Inputs & Forms

#### Text Input

| Property | Value |
|----------|-------|
| Height | 36px (md), 28px (sm), 44px (lg) |
| Background | `surface-secondary` |
| Border | `border-default`, focus: `accent-primary` |
| Text | `body` (14px), `text-primary` |
| Placeholder | `text-tertiary` |
| Label | `caption` (12px), `text-secondary`, above input |
| Error | Border: `severity-critical`, message: `severity-critical`, `caption` size |

#### Select / Dropdown

Same dimensions as text input. Chevron icon right-aligned. Dropdown panel uses `surface-elevated` + `shadow-md`.

#### Checkbox & Radio

| Property | Value |
|----------|-------|
| Size | 16px |
| Border | `border-default`, checked: `accent-primary` fill |
| Label | `body` (14px), `text-primary` |

#### Form Layout

- **Vertical stacking** by default: label → input → help text → error
- **Spacing:** `space-4` (16px) between form groups
- **Inline forms:** 2-column max, `space-4` gap between columns
- **Action bar:** Right-aligned, primary CTA right-most, `space-2` between buttons

### 6.4 Cards & Containers

#### Base Card

| Property | Value |
|----------|-------|
| Background | `surface-primary` |
| Border | `border-subtle` |
| Radius | `radius-md` (8px) |
| Padding | `space-4` (16px) |
| Shadow | `shadow-sm` |

#### Card Variants

**Task Card** (Remediation)

```
┌─────────────────────────────────────────┐
│ [●] Task Title                    [SEV] │
│ Source: finding-id                       │
│ ─────────────────────────────────────── │
│ Evidence: 2 attached     [QUALITY ●]    │
│ Assigned: @user          Due: 5 days    │
└─────────────────────────────────────────┘
```
- Header: task title + severity badge
- Meta row: source signal, finding reference
- Footer: evidence count + quality badge, assignee, due date
- Hover: `surface-secondary` background

**Drift Card**

```
┌─────────────────────────────────────────┐
│ [●] Drift Type             [LIFECYCLE]  │
│ System: system-name                     │
│ ─────────────────────────────────────── │
│ Field: data_residency                   │
│ Baseline: EU → Current: US    [SLA ⚠]  │
│ Owner: @user                            │
└─────────────────────────────────────────┘
```
- Header: drift type label + lifecycle badge
- Body: affected field, baseline vs current value diff
- Footer: SLA badge (if breached), assigned owner

**System Card**

```
┌─────────────────────────────────────────┐
│ System Name                    [STATE]  │
│ Risk class: High-Risk                   │
│ ─────────────────────────────────────── │
│ Baseline: 2024-01-15      Controls: 12  │
│ Drift: 2 open    Coverage: 85%          │
└─────────────────────────────────────────┘
```

**Evidence Card**

```
┌─────────────────────────────────────────┐
│ [📎] evidence-file.pdf       [QUALITY]  │
│ Type: Technical Documentation           │
│ Uploaded: 2024-01-15 by @user           │
│ Linked to: Task-042                     │
└─────────────────────────────────────────┘
```

### 6.5 Tables & Matrices

#### Base Table

| Property | Value |
|----------|-------|
| Header bg | `surface-secondary` |
| Header text | `caption` (12px), 500 weight, `text-secondary`, ALLCAPS |
| Row bg | `surface-primary` (alt: `surface-secondary` for striped) |
| Row text | `body` (14px), `text-primary` |
| Row hover | `surface-tertiary` |
| Cell padding | `space-3` (12px) vertical, `space-4` (16px) horizontal |
| Border | `border-subtle` between rows |
| Selected row | Left border: 2px `accent-primary`, background: `accent-primary-subtle` |

#### Traceability Matrix (Specialized)

The traceability matrix is the most complex table in CompliScan. Special treatments:

| Feature | Treatment |
|---------|-----------|
| **Column groups** | Visual grouping: Finding → Task → Drift → Article → Control → Evidence → Coverage |
| **Coverage cells** | Use coverage badges (filled/partial/empty bars) |
| **Linked references** | Clickable IDs linking to detail views |
| **Confirmation notes** | Expandable row with manual notes per control |
| **Frozen columns** | First 2 columns (Finding, Task) frozen on horizontal scroll |
| **Density toggle** | Compact (28px rows) / Default (36px rows) / Relaxed (44px rows) |

#### Evidence Ledger

| Column | Type | Treatment |
|--------|------|-----------|
| Evidence ID | Mono text | `mono` token, clickable |
| File name | Text + icon | File type icon + truncated name |
| Quality | Badge | `sufficient` / `weak` badge |
| Linked task | Reference | Clickable task ID |
| Upload date | Date | `body-small`, `text-secondary` |
| Uploaded by | Avatar + name | 20px avatar + `body-small` |

### 6.6 Tabs

The primary sub-navigation pattern within each pillar.

| Property | Value |
|----------|-------|
| Container | `surface-base` bottom border: `border-subtle` |
| Tab text | `body` (14px), 500 weight, `text-secondary` |
| Active tab | `text-primary`, bottom border: 2px `accent-primary` |
| Hover tab | `text-primary` |
| Padding | `space-3` (12px) vertical, `space-4` (16px) horizontal |
| Gap | `space-1` (4px) between tabs |
| With count | Badge (neutral) after label: `surface-secondary` bg, `caption` text |

### 6.7 Tooltips & Popovers

| Property | Value |
|----------|-------|
| Background | `surface-elevated` |
| Text | `body-small` (13px), `text-primary` |
| Radius | `radius-md` (8px) |
| Shadow | `shadow-md` |
| Max width | 280px |
| Delay | 300ms show, 100ms hide |
| Arrow | 6px, same bg as tooltip |

### 6.8 Modals & Dialogs

| Property | Value |
|----------|-------|
| Overlay | `rgba(0,0,0,0.6)` dark, `rgba(0,0,0,0.3)` light |
| Container | `surface-elevated`, `radius-lg` (12px), `shadow-lg` |
| Width | sm: 400px, md: 560px, lg: 720px |
| Padding | `space-6` (24px) |
| Header | `heading-2` (20px), 600 weight, bottom border `border-subtle` |
| Footer | Right-aligned buttons, top border `border-subtle` |
| Close | Ghost button, top-right, `x` icon |

### 6.9 Alerts & Notifications

#### Inline Alert

| Severity | Left border | Icon | Background |
|----------|-------------|------|------------|
| Critical | 3px `severity-critical` | `alert-octagon` | `severity-critical / 8%` |
| Warning | 3px `severity-medium` | `alert-triangle` | `severity-medium / 8%` |
| Info | 3px `severity-low` | `info` | `severity-low / 8%` |
| Success | 3px `status-success` | `check-circle-2` | `status-success / 8%` |

#### Toast Notification

- Position: bottom-right
- Max visible: 3 stacked
- Auto-dismiss: 5s (info), persistent (error)
- Width: 360px
- Same color treatments as inline alerts

---

## 7. Patterns

### 7.1 Navigation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px / 64px collapsed)                           │
│  ┌──────────────────────────┐  ┌──────────────────────────┐│
│  │  CompliScan Logo         │  │  MAIN CONTENT AREA       ││
│  │  ───────────────────     │  │                          ││
│  │  PILLARS                 │  │  ┌─ Tab Bar ──────────┐  ││
│  │  ○ Scanare               │  │  │ Tab 1 │ Tab 2 │ T3 │  ││
│  │  ○ Control               │  │  └────────────────────┘  ││
│  │  ○ Dovada                │  │                          ││
│  │  ───────────────────     │  │  ┌─ Content ──────────┐  ││
│  │  SHORTCUTS               │  │  │                    │  ││
│  │  ○ Documente             │  │  │  (Tab content)     │  ││
│  │  ○ Sisteme AI            │  │  │                    │  ││
│  │  ○ Remediere             │  │  │                    │  ││
│  │  ○ Alerte                │  │  └────────────────────┘  ││
│  │  ○ Audit si export       │  │                          ││
│  │  ───────────────────     │  │                          ││
│  │  ○ Setari                │  │                          ││
│  │  ───────────────────     │  │                          ││
│  │  [Org Switcher]          │  │                          ││
│  │  [User Avatar]           │  │                          ││
│  └──────────────────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

#### Sidebar Behavior

| State | Width | Content |
|-------|-------|---------|
| **Expanded** | 240px | Icon + label + optional count badge |
| **Collapsed** | 64px | Icon only + tooltip on hover |
| **Mobile** | Full-width overlay | Same as expanded, overlay with backdrop |

#### Nav Item Anatomy

| Property | Value |
|----------|-------|
| Height | 36px |
| Padding | `space-2` (8px) horizontal |
| Icon | 20px, `text-secondary` |
| Label | `body` (14px), `text-secondary` |
| Active | `surface-tertiary` bg, `text-primary` text, `accent-primary` left border (2px) |
| Hover | `surface-secondary` bg |
| Badge | Right-aligned, `caption` size, `surface-secondary` bg |

#### Section Dividers

- `border-subtle` horizontal line, `space-2` margin top/bottom
- Section labels: `micro` (11px), `text-tertiary`, ALLCAPS, `space-4` left padding

### 7.2 Wizard / Flow Pattern (Flux Scanare)

The scan workflow uses a **horizontal stepper** with 6 steps:

```
 ① ─── ② ─── ③ ─── ④ ─── ⑤ ─── ⑥
 Source  Verdict  Remed.  Evidence  Rescan  Export
```

#### Step States

| State | Circle | Line | Label |
|-------|--------|------|-------|
| **Completed** | `accent-primary` fill + check icon | `accent-primary` solid | `text-primary` |
| **Current** | `accent-primary` ring + number | `border-default` dashed | `text-primary`, 600 weight |
| **Upcoming** | `border-default` ring + number | `border-subtle` dotted | `text-tertiary` |
| **Error** | `severity-critical` ring + `x` icon | unchanged | `severity-critical` |

#### Wizard Layout

- Stepper bar: fixed at top of content area, `surface-primary` bg, `border-subtle` bottom
- Step content: scrollable below stepper
- Navigation: "Înapoi" (ghost button, left) + "Continuă" (primary button, right) at bottom
- Progress persists — users can jump to completed steps

### 7.3 Role-Gated UI Pattern

```
┌─────────────────────────────────────────┐
│           ROLE CHECK DECISION TREE       │
│                                          │
│  Action needed?                          │
│    ├── No → Render normally (all roles)  │
│    └── Yes → Check role                  │
│         ├── Has permission → Show button │
│         └── No permission                │
│              ├── Conceptually relevant?   │
│              │    ├── Yes → Disabled +    │
│              │    │         tooltip       │
│              │    └── No → Hidden         │
│              └───────────────────────────│
└─────────────────────────────────────────┘
```

#### Role Badge in UI

| Role | Color | Treatment |
|------|-------|-----------|
| Owner | `accent-primary` | Crown icon + "Owner" badge |
| Compliance | `status-success` | Shield icon + "Compliance" badge |
| Reviewer | `status-warning` | Eye icon + "Reviewer" badge |
| Viewer | `status-neutral` | Eye-off icon + "Viewer" badge |

### 7.4 Empty States

| Type | Content |
|------|---------|
| **First-time** | Icon (48px, `text-tertiary`) + Title + Description + Primary CTA |
| **No results** | Search icon + "Niciun rezultat" + suggestion to adjust filters |
| **Error** | Alert icon + error message + "Reîncearcă" ghost button |
| **Permission** | Lock icon + "Nu ai acces" + role required message |

#### Empty State Structure

```
┌─────────────────────────────────────────┐
│                                         │
│              [Icon 48px]                │
│                                         │
│           Title (heading-2)             │
│       Description (body, secondary)     │
│                                         │
│           [Primary CTA Button]          │
│                                         │
└─────────────────────────────────────────┘
```

- Centered in available space
- Max-width: 400px for text
- Icon: `text-tertiary`, 48px
- No illustrations — stays consistent with "evidence over decoration"

### 7.5 Human Review Gate Pattern

The agent review interface uses a **tri-column layout**:

```
┌─────────────────────────────────────────────────────────┐
│  CONTEXT          │  PROPOSALS        │  REVIEW         │
│  (Source data)     │  (Agent output)   │  (Accept/Reject)│
│                    │                   │                 │
│  Original doc      │  Finding 1 [✓]    │  ☐ Accept all   │
│  Extracted fields  │  Finding 2 [✓]    │  ☐ Reject sel.  │
│  System context    │  Finding 3 [?]    │                 │
│                    │  Drift alert      │  [Commit to DB] │
│                    │  Evidence map     │  [Reject all]   │
└─────────────────────────────────────────────────────────┘
```

- Context panel: Read-only, `surface-secondary` bg
- Proposals panel: Checkable items, grouped by agent (Intake/Findings/Drift/Evidence)
- Review panel: Bulk actions + granular per-item accept/reject + notes field
- **Commit button** is Primary variant, role-gated (Reviewer+)

---

## 8. Page Templates

### 8.1 Pillar Page Template

All three pillars (Scanare, Control, Dovada) share a common structure:

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR │  PAGE HEADER                                      │
│          │  ┌──────────────────────────────────────────────┐ │
│  ○ Scan  │  │  Page Title (heading-1)      [Action Bar]   │ │
│  ● Ctrl  │  │  Description (body, secondary)              │ │
│  ○ Dov   │  └──────────────────────────────────────────────┘ │
│          │  ┌──────────────────────────────────────────────┐ │
│  ─────   │  │  Tab 1  │  Tab 2  │  Tab 3  │  Tab 4       │ │
│  Shortcuts│  └──────────────────────────────────────────────┘ │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  TOOLBAR                                     │ │
│          │  │  [Search] [Filters] [Sort]     [View toggle] │ │
│          │  └──────────────────────────────────────────────┘ │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  CONTENT                                     │ │
│          │  │  (Table / Card grid / Detail view)           │ │
│          │  │                                              │ │
│          │  │                                              │ │
│          │  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 8.2 Pillar-Specific Templates

**Scanare (Scanning)**

| Tab | Content |
|-----|---------|
| Flux scanare | Wizard stepper + step content |
| Verdicts | Table: findings with severity badges, source, confidence |
| Rezultate | Summary cards + traceability preview |

**Control**

| Tab | Content |
|-----|---------|
| Sisteme AI | System cards / table with state badges |
| Baseline | Baseline timeline + comparison view |
| Drift | Drift table with lifecycle badges, SLA indicators |
| Discovery | AIDiscoveryPanel — active detections only |

**Dovada (Evidence)**

| Tab | Content |
|-----|---------|
| Remediere | Task cards with evidence quality badges |
| Dovezi | Evidence ledger table |
| Auditor Vault | Secure read-only view with control families |
| Audit si export | Export controls + Audit Pack preview |

### 8.3 Detail Page Template

Used for individual system, drift record, or task detail:

```
┌──────────────────────────────────────────────────────────────┐
│  SIDEBAR │  BREADCRUMB: Control > Drift > DRIFT-042          │
│          │  ┌──────────────────────────────────────────────┐ │
│          │  │  Drift Title              [LIFECYCLE BADGE]  │ │
│          │  │  System: sys-name   Severity: [HIGH]         │ │
│          │  │  Owner: @user       SLA: 3 days remaining    │ │
│          │  └──────────────────────────────────────────────┘ │
│          │  ┌─────────────────────┐ ┌──────────────────────┐│
│          │  │  DETAIL PANEL       │ │  ACTIVITY FEED       ││
│          │  │  (60% width)        │ │  (40% width)         ││
│          │  │                     │ │                      ││
│          │  │  Field comparison   │ │  ○ Created by system ││
│          │  │  Baseline vs Current│ │  ○ Acknowledged by.. ││
│          │  │  Linked findings    │ │  ○ Note added        ││
│          │  │  Evidence attached  │ │  ○ Status changed    ││
│          │  │                     │ │                      ││
│          │  │  [Actions Bar]      │ │                      ││
│          │  └─────────────────────┘ └──────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Motion & Animation

### 9.1 Principles

- **Purposeful:** Every animation communicates a state change or relationship
- **Fast:** Users make compliance decisions — don't slow them down
- **Consistent:** Same type of change = same animation

### 9.2 Duration Scale

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `motion-instant` | 100ms | `ease-out` | Hover states, color changes |
| `motion-fast` | 150ms | `ease-out` | Button press, toggle, badge update |
| `motion-default` | 200ms | `ease-in-out` | Panel open/close, tab switch |
| `motion-slow` | 300ms | `ease-in-out` | Modal enter, page transition |
| `motion-deliberate` | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Wizard step transition |

### 9.3 Specific Animations

| Component | Animation | Duration |
|-----------|-----------|----------|
| **Sidebar collapse** | Width transition | `motion-default` |
| **Tab content** | Fade + slight slide | `motion-default` |
| **Modal enter** | Scale from 95% + fade | `motion-slow` |
| **Modal exit** | Fade out | `motion-fast` |
| **Toast enter** | Slide up + fade | `motion-default` |
| **Badge update** | Pulse once | `motion-fast` |
| **Confidence missing** | Gentle pulse (continuous, 2s loop) | — |
| **Wizard step** | Slide horizontal + fade | `motion-deliberate` |

---

## 10. Accessibility

### 10.1 Standards

- **Target:** WCAG 2.1 AA compliance
- **Contrast ratios:** 4.5:1 minimum for body text, 3:1 for large text and UI components
- **Focus management:** All interactive elements have visible focus rings (`shadow-focus`)
- **Keyboard navigation:** Full keyboard support, logical tab order, skip links

### 10.2 Color Independence

**Critical rule:** Color is NEVER the sole indicator of meaning. Every status uses:

| Element | Color + | Secondary Indicator |
|---------|---------|---------------------|
| Severity badge | Color | Icon shape varies per level |
| Drift lifecycle | Color | Dot fill varies (empty → filled) |
| Coverage | Color | Bar fill level (0/3, 2/3, 3/3) |
| Confidence | Color | Dot style (solid, hollow, ring) |
| Quality | Color | Icon (check vs alert) |

### 10.3 Screen Reader Support

| Component | aria-label Pattern |
|-----------|-------------------|
| Severity badge | "Severitate: critical" |
| Status badge | "Status: in_progress" |
| Role badge | "Rol: Compliance" |
| Coverage bar | "Acoperire: partial, 2 din 3 controluri" |
| Wizard step | "Pas 3 din 6: Remediere, activ" |
| Role-gated button | "Exportă Audit Pack (necesită rol Compliance)" for disabled |

### 10.4 Reduced Motion

When `prefers-reduced-motion: reduce` is set:
- All transitions → `motion-instant` (100ms)
- Continuous animations (confidence pulse) → static
- Page transitions → instant swap

---

## 11. Implementation Guide (Next.js + Tailwind)

### 11.1 Token Architecture

```
/design-tokens/
  ├── primitives.css       # Raw HSL values
  ├── aliases.css          # Theme-switched references
  ├── semantic.css         # Intent-based tokens
  └── components.css       # Component-scoped tokens
```

#### CSS Custom Properties Pattern

```css
/* primitives.css */
:root {
  --gray-950: 220 14% 4%;
  --gray-900: 220 14% 8%;
  --gray-800: 220 14% 12%;
  /* ... */
  --red-500: 0 72% 62%;
  --orange-500: 25 90% 58%;
  --amber-500: 45 90% 55%;
  --blue-500: 210 70% 62%;
  --green-500: 145 60% 48%;
  --indigo-500: 230 80% 62%;
}

/* aliases.css — dark mode (default) */
[data-theme="dark"] {
  --surface-base: var(--gray-950);
  --surface-primary: var(--gray-900);
  --surface-secondary: var(--gray-800);
  --text-primary: 220 14% 93%;
  --text-secondary: 220 14% 63%;
  --border-subtle: var(--gray-800);
}

/* aliases.css — light mode */
[data-theme="light"] {
  --surface-base: 0 0% 100%;
  --surface-primary: 220 14% 98%;
  --surface-secondary: 220 14% 95%;
  --text-primary: 220 14% 10%;
  --text-secondary: 220 14% 45%;
  --border-subtle: 220 14% 90%;
}

/* semantic.css */
:root {
  --severity-critical: var(--red-500);
  --severity-high: var(--orange-500);
  --severity-medium: var(--amber-500);
  --severity-low: var(--blue-500);
  --status-success: var(--green-500);
  --status-warning: var(--amber-500);
  --status-danger: var(--red-500);
  --accent-primary: var(--indigo-500);
}
```

### 11.2 Tailwind Configuration

```js
// tailwind.config.js (excerpt)
module.exports = {
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'hsl(var(--surface-base))',
          primary: 'hsl(var(--surface-primary))',
          secondary: 'hsl(var(--surface-secondary))',
          tertiary: 'hsl(var(--surface-tertiary))',
          elevated: 'hsl(var(--surface-elevated))',
        },
        severity: {
          critical: 'hsl(var(--severity-critical))',
          high: 'hsl(var(--severity-high))',
          medium: 'hsl(var(--severity-medium))',
          low: 'hsl(var(--severity-low))',
        },
        status: {
          success: 'hsl(var(--status-success))',
          warning: 'hsl(var(--status-warning))',
          danger: 'hsl(var(--status-danger))',
          neutral: 'hsl(var(--text-secondary))',
        },
        accent: {
          primary: 'hsl(var(--accent-primary))',
        }
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'heading-1': ['24px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.015em' }],
        'heading-2': ['20px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.01em' }],
        'heading-3': ['16px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.005em' }],
        'body-lg': ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.45', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.01em' }],
        micro: ['11px', { lineHeight: '1.35', fontWeight: '500', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      spacing: {
        'eos-1': '4px',
        'eos-2': '8px',
        'eos-3': '12px',
        'eos-4': '16px',
        'eos-5': '20px',
        'eos-6': '24px',
        'eos-7': '32px',
        'eos-8': '40px',
        'eos-9': '48px',
        'eos-10': '64px',
      },
    },
  },
}
```

### 11.3 Component File Structure

```
/components/
  ├── ui/                      # Primitives
  │   ├── Badge.tsx            # All badge variants
  │   ├── Button.tsx           # All button variants
  │   ├── Input.tsx            # Text, select, checkbox
  │   ├── Card.tsx             # Base card
  │   ├── Table.tsx            # Base table
  │   ├── Tabs.tsx             # Tab container
  │   ├── Modal.tsx            # Dialog/modal
  │   ├── Tooltip.tsx          # Tooltip/popover
  │   ├── Alert.tsx            # Inline alerts
  │   └── Toast.tsx            # Toast notifications
  │
  ├── domain/                  # CompliScan-specific
  │   ├── TaskCard.tsx         # Remediation task card
  │   ├── DriftCard.tsx        # Drift record card
  │   ├── SystemCard.tsx       # AI system card
  │   ├── EvidenceCard.tsx     # Evidence attachment card
  │   ├── SeverityBadge.tsx    # Severity-aware badge
  │   ├── LifecycleBadge.tsx   # Drift lifecycle badge
  │   ├── ConfidenceDot.tsx    # Field confidence indicator
  │   ├── CoverageBars.tsx     # Control coverage indicator
  │   ├── WizardStepper.tsx    # Scan flow stepper
  │   ├── ReviewGate.tsx       # Human review tri-panel
  │   └── RoleGate.tsx         # Permission wrapper component
  │
  ├── layout/                  # Shell & navigation
  │   ├── AppShell.tsx         # Sidebar + main content
  │   ├── Sidebar.tsx          # Collapsible sidebar
  │   ├── PageHeader.tsx       # Title + description + actions
  │   ├── Toolbar.tsx          # Search + filters + view toggle
  │   └── Breadcrumb.tsx       # Navigation breadcrumb
  │
  └── patterns/                # Composed patterns
      ├── EmptyState.tsx       # First-time, no results, error, permission
      ├── TraceabilityMatrix.tsx
      ├── EvidenceLedger.tsx
      ├── AuditPackPreview.tsx
      └── AnnexIVLite.tsx
```

### 11.4 Usage Examples

```tsx
// SeverityBadge — maps enumeration to visual
<SeverityBadge severity="critical" />
// Renders: red dot + "CRITICAL" text + alert-octagon icon

// LifecycleBadge — drift state
<LifecycleBadge state="in_progress" />
// Renders: amber dot + "IN PROGRESS" text

// RoleGate — permission-aware wrapper
<RoleGate
  requiredRole="compliance"
  fallback="disabled"  // or "hidden"
  tooltip="Necesită rol Compliance"
>
  <Button variant="primary">Exportă Audit Pack</Button>
</RoleGate>

// ConfidenceDot — field-level indicator
<ConfidenceDot status="inferred" level="medium" />
// Renders: hollow amber dot + "Inferred" + "medium" chip

// WizardStepper
<WizardStepper
  steps={['Sursă', 'Verdict', 'Remediere', 'Dovezi', 'Rescan', 'Export']}
  currentStep={2}
  completedSteps={[0, 1]}
/>
```

---

## 12. Design Tokens Quick Reference

### Complete Token Map

| Category | Token | Dark | Light |
|----------|-------|------|-------|
| **Surface** | `base` | `hsl(220,14%,4%)` | `hsl(0,0%,100%)` |
| | `primary` | `hsl(220,14%,8%)` | `hsl(220,14%,98%)` |
| | `secondary` | `hsl(220,14%,12%)` | `hsl(220,14%,95%)` |
| | `tertiary` | `hsl(220,14%,16%)` | `hsl(220,14%,91%)` |
| | `elevated` | `hsl(220,14%,18%)` | `hsl(0,0%,100%)` |
| **Border** | `subtle` | `hsl(220,14%,16%)` | `hsl(220,14%,90%)` |
| | `default` | `hsl(220,14%,22%)` | `hsl(220,14%,82%)` |
| | `strong` | `hsl(220,14%,30%)` | `hsl(220,14%,70%)` |
| **Text** | `primary` | `hsl(220,14%,93%)` | `hsl(220,14%,10%)` |
| | `secondary` | `hsl(220,14%,63%)` | `hsl(220,14%,45%)` |
| | `tertiary` | `hsl(220,14%,40%)` | `hsl(220,14%,60%)` |
| **Accent** | `primary` | `hsl(230,80%,62%)` | `hsl(230,80%,50%)` |
| **Severity** | `critical` | `hsl(0,72%,62%)` | `hsl(0,72%,50%)` |
| | `high` | `hsl(25,90%,58%)` | `hsl(25,90%,48%)` |
| | `medium` | `hsl(45,90%,55%)` | `hsl(45,90%,45%)` |
| | `low` | `hsl(210,70%,62%)` | `hsl(210,70%,50%)` |
| **Status** | `success` | `hsl(145,60%,48%)` | `hsl(145,60%,38%)` |
| | `warning` | `hsl(45,90%,55%)` | `hsl(45,90%,45%)` |
| | `danger` | `hsl(0,72%,62%)` | `hsl(0,72%,50%)` |

---

## 13. Naming Conventions

### CSS Custom Properties

```
--eos-{category}-{variant}
--eos-surface-primary
--eos-text-secondary
--eos-severity-critical
--eos-status-success
```

### Tailwind Classes

```
bg-surface-primary
text-eos-secondary
border-eos-subtle
text-severity-critical
bg-status-success/12
```

### Component Props

```
severity: 'critical' | 'high' | 'medium' | 'low'
lifecycle: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'waived'
systemState: 'detected' | 'reviewed' | 'confirmed' | 'rejected'
confidence: 'confirmed' | 'inferred' | 'missing'
quality: 'sufficient' | 'weak'
coverage: 'covered' | 'partial' | 'missing'
role: 'owner' | 'compliance' | 'reviewer' | 'viewer'
```

---

## Appendix A: Status Enumeration Visual Map

A complete mapping of every CompliScan enumeration to its visual treatment:

| Enumeration | Values | Badge Style | Dot/Icon | Color Token |
|-------------|--------|-------------|----------|-------------|
| **Severity** | critical | filled bg | `alert-octagon` | `severity-critical` |
| | high | filled bg | `alert-triangle` | `severity-high` |
| | medium | filled bg | `alert-circle` | `severity-medium` |
| | low | filled bg | `info` | `severity-low` |
| **Drift Lifecycle** | open | filled bg | solid dot | `status-danger` |
| | acknowledged | subtle bg | solid dot | `status-neutral` |
| | in_progress | filled bg | solid dot | `status-warning` |
| | resolved | filled bg | solid dot | `status-success` |
| | waived | muted bg | hollow dot | `status-muted` |
| **System State** | detected | subtle bg | solid dot | `status-neutral` |
| | reviewed | filled bg | solid dot | `status-warning` |
| | confirmed | filled bg | check icon | `status-success` |
| | rejected | muted bg | x icon | `status-muted` |
| **Evidence Quality** | sufficient | filled bg | `check-circle-2` | `status-success` |
| | weak | filled bg | `alert-circle` | `status-warning` |
| **Field Confidence** | confirmed | subtle bg | solid dot | `confidence-confirmed` |
| | inferred | subtle bg | hollow dot | `confidence-inferred` |
| | missing | subtle bg + pulse | empty ring | `confidence-missing` |
| **Control Coverage** | covered | filled bar 3/3 | — | `status-success` |
| | partial | filled bar 2/3 | — | `status-warning` |
| | missing | empty bar 0/3 | — | `status-danger` |
| **Validation** | Confirmare puternica | filled bg | double-check | `status-success` |
| | Confirmare partiala | filled bg | single-check | `status-warning` |
| | Confirmare operationala | subtle bg | dash-circle | `status-neutral` |
| **Compliance Confidence** | detected | subtle bg | radar icon | `status-neutral` |
| | inferred | subtle bg | brain icon | `confidence-inferred` |
| | confirmed_by_user | filled bg | user-check | `status-accent` |
| **Task Source Signal** | direct signal | subtle bg | `zap` | `accent-primary` |
| | inferred signal | subtle bg | `brain` | `confidence-inferred` |
| | operational state | subtle bg | `activity` | `status-neutral` |
| **Roles** | Owner | accent bg | `crown` | `accent-primary` |
| | Compliance | success bg | `shield` | `status-success` |
| | Reviewer | warning bg | `eye` | `status-warning` |
| | Viewer | neutral bg | `eye-off` | `status-neutral` |

---

*Evidence OS v1.0 — Built for CompliScan. Confidence through clarity.*
