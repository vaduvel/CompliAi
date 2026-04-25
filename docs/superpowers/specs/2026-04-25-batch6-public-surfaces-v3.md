# Batch 6 — V3 Public Surfaces Migration

**Date:** 2026-04-25  
**Scope:** Landing, Pricing, Auth, Onboarding, Public/External surfaces  
**Approach:** V3 DS injection + surface-minimal UX/UI improvements on existing content

---

## Goal

Apply the CompliAI V3 design system (tokens, typography, spacing, radius, components) to all surfaces outside the dashboard. Existing content and flows are preserved. Minimal UX/UI surface improvements are allowed where something is obviously broken or sub-optimal per V3 principles.

---

## V3 Design Rules (non-negotiable)

- **Typography:** Space Grotesk for display headings, Inter Tight for body, IBM Plex Mono for eyebrow/meta labels
- **Eyebrow pattern:** `font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-muted`
- **Radius:** `rounded-eos-lg` (14px) preferred for cards; `rounded-eos-md` (10px) for inner panels; `rounded-eos-xl` only if justified
- **Background:** flat dark — `bg-eos-surface-variant`, `bg-eos-bg-inset`, `bg-eos-surface`. No gradients, no `bg-white`, no `border-gray-*`
- **Borders:** `border-eos-border` or `border-eos-border-subtle`. No raw `border-gray-*`
- **CTA/primary:** cobalt (`bg-eos-primary`, `text-eos-primary`) only for primary actions and nav focus
- **Buttons:** 34px default height, `h-9` or `size="default"`. Concise labels
- **`border-2`:** only for interactive states (checkbox checked, radio selected, focus ring, upload drop zone). Never as card/panel border
- **`rounded-eos-xl`:** justified only for hero elements, large modal overlays, CTA pills on landing. Replace with `rounded-eos-lg` on content cards
- **Semantic colors:** `text-eos-error`, `text-eos-warning`, `text-eos-success` for states. Never raw red/amber/green
- **No `details`/`summary`:** all sections permanently visible

---

## Surfaces

### 1. `app/page.tsx` — Landing

**What changes:**
- `rounded-eos-xl` on feature cards → `rounded-eos-lg`
- `border-2` usage audited — keep only for interactive states
- tracking values normalized to `tracking-[0.14em]` + `font-mono` on eyebrows
- CTA buttons: cobalt primary, correct height
- Surface minimal UX: hero hierarchy (eyebrow → h1 → subline → CTA), feature cards consistent spacing

**What stays:** All copy, all sections, all CTAs present. Zero content removal.

---

### 2. `app/pricing/page.tsx` — Pricing

**What changes:**
- All 8 `<details>/<summary>` blocks (FAQ + plan details) → permanently visible V3 sections
- `tracking-[0.22em]` → `tracking-[0.14em]` + `font-mono`
- `rounded-eos-xl` on plan cards → `rounded-eos-lg`
- Plan cards: dense V3 layout, eyebrow labels, clear pricing hierarchy
- FAQ: always-visible list with V3 dividers, no collapse

**What stays:** All plan details, all FAQ entries, all CTAs visible at all times.

---

### 3. Auth surfaces

#### `app/login/page.tsx`
- `rounded-eos-xl` on auth card → `rounded-eos-lg`
- Inputs: `h-9`, `rounded-eos-md`, `border-eos-border`, focus ring cobalt
- Labels: `text-sm font-medium text-eos-text`
- Error states: `text-eos-error` semantic
- CTA button: `bg-eos-primary`, full-width, `h-9`
- tracking normalized

#### `app/claim/page.tsx`
- Same auth card pattern as login
- tracking normalized, spacing tightened

#### `app/reset-password/page.tsx`
- Same auth card pattern
- Multi-step states (request/confirm/success) with clear V3 state indicators

---

### 4. `components/compliscan/onboarding-form.tsx` — Onboarding

**What changes:**
- Step progress: V3 progress strip (colored dots/bars per current step)
- Choice cards: `rounded-eos-md`, `border-eos-border`, `hover:bg-eos-surface-active`, selected state cobalt border + `bg-eos-surface-active`
- `rounded-eos-xl` on radio/choice cards → `rounded-eos-md`
- tracking normalized
- Buttons: V3 size/style

**What stays:** All questions, all options, all routing logic. Zero flow changes.

---

### 5. Public / External surfaces

#### `app/trust/page.tsx` + `app/trust/[orgId]/page.tsx`
- Replace `border-gray-200 bg-white` with V3 dark tokens
- tracking normalized
- Cards: V3 radius + borders

#### `app/shared/[token]/page.tsx`
- Same token replacement (light → V3 dark)
- tracking normalized

#### `app/whistleblowing/[token]/page.tsx`
- `rounded-eos-xl border-gray-200 bg-white` → V3 dark surface
- tracking normalized
- Note: whistleblowing is sensitive — minimal changes, preserve all form functionality

#### `app/demo/[scenario]/page.tsx`
- V3 tokens if raw light styles exist

---

### 6. Final Audit DoD

After all changes:
```
rg "<details|</details>|<summary|</summary>" app components/compliscan
rg "tracking-\[0\.22em\]|tracking-\[0\.24em\]|tracking-\[0\.26em\]" app components/compliscan
rg "rounded-eos-xl|border-2" app components/compliscan
npm run build
```

Everything remaining must be explicitly justified.

---

## Surface-minimal UX/UI rules (what "better" means here)

1. **Visual hierarchy** — eyebrow → heading → body → CTA always readable in order
2. **Spacing** — use V3 tokens (`gap-4`, `gap-6`, `space-y-4`) not random px values
3. **States** — hover, focus, error, empty states implemented consistently
4. **Contrast** — text always legible against its background per V3 semantic palette
5. **No additions** — fix what's broken, don't add sections/features/copy

---

## Out of scope

- `app/pricing/page.tsx` `<details>` for actual FAQ content — IN scope (make visible)
- IA/UX reorganization — out of scope (Batch 7+)
- Copy/content changes — out of scope
- New features or pages — out of scope
- `app/privacy/`, `app/terms/` — static markdown pages, no custom UI → skip unless raw light styles found
