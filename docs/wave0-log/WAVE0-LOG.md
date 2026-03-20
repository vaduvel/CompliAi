# Wave 0 — UX Foundation DS v2.0 — Log de implementare

**Branch:** `wave0/ux-foundation-ds-v2`
**Data start:** 2026-03-20
**Design System:** `docs/final-guide-plan/compliscan-ui-prompt.md`
**Arhitectura UX:** `docs/final-guide-plan/02-ux-ia-blueprint.md`

---

## Obiectiv Wave 0

Restructurare completă a shell-ului vizual pe DS v2.0 (Warm Graphite, fără prefix `--eos-*`).
Rezultat final: 5 pagini noi + sidebar nou + token layer nou.

---

## Pași planificați

| # | Pas | Status | Fișiere atinse |
|---|-----|--------|----------------|
| 1 | `styles/tokens.css` — token layer DS v2.0 | ⏳ | `styles/tokens.css`, `app/globals.css` |
| 2 | `components/ui/` — Button, Badge, Card, StatusDot, SeverityPill | ⏳ | 5 fișiere noi/rescrise |
| 3 | `components/layout/Sidebar.tsx` — sidebar 220px, 4 nav items | ⏳ | `components/layout/Sidebar.tsx` (nou) |
| 4 | `app/dashboard/layout.tsx` — shell nou | ⏳ | `app/dashboard/layout.tsx` |
| 5 | `app/dashboard/page.tsx` — Acasă (Action Card + Score + Health + Framework) | ⏳ | `app/dashboard/page.tsx` |
| 6 | `app/dashboard/scan/` — Scanează + Results [scanId] | ⏳ | 3 fișiere noi |
| 7 | `app/dashboard/resolve/` — De rezolvat + Resolution Layer | ⏳ | 2 fișiere noi |
| 8 | `app/dashboard/reports/` — Rapoarte (4 cards + tabs) | ⏳ | `app/dashboard/reports/page.tsx` |

---

## Reguli DS v2.0 active în această implementare

- NICIODATĂ raw hex — doar CSS variables din `styles/tokens.css`
- NICIODATĂ emerald decorativ — doar CTA primar și stări resolved
- NICIODATĂ două butoane primare pe aceeași pagină
- font-mono DOAR pe scoruri numerice, timestamps, CUI, hash-uri
- Violet DOAR pe review states
- Roșu DOAR pe critical/fail

---

## Log intrări

### 2026-03-20 — Inițializare

- Creat branch `wave0/ux-foundation-ds-v2` din `codex/clean-start-final-guide`
- Creat acest fișier de log
- Analizat gap: token prefix `--eos-*` → fără prefix DS v2.0, sidebar 240px → 220px, nav 5+ items → 4 items, lipsesc `/dashboard/scan/results/[scanId]`, `/dashboard/resolve`

---

<!-- intrări noi se adaugă jos, cronologic -->
