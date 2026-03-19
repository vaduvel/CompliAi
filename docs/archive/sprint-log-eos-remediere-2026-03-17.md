# Sprint Log — EOS v1 Remediere
**Data:** 2026-03-17
**Branch:** codex/eos-sprint-remediere-2026-03-17 (merge în main via PR #30)
**Context:** Audit complet EOS v1 → fixuri ordonate P0→P1→P2

---

## Scor EOS v1 la intrarea în sprint: ~65%

### Ce funcționează bine (nu se atinge)
- Tokenuri CSS: culori, spații, radius — corecte
- Tipografie: scară și greutăți respectate
- Dark mode: consistent
- Icoane Lucide: prezente și corecte ca set
- Progressive disclosure: `<details>` în task-card.tsx — solid
- Romanian-first: respectat în 90% din fișiere

---

## Sprint livrat — 2026-03-17

| # | Task | Fișier | Decizie/Acțiune |
|---|------|--------|-----------------|
| ✅ P0-2 | Elimină tokens.ts legacy | `lib/compliance/tokens.ts` | Șters complet — zero importuri în proiect |
| ✅ P1-1 | Control tabs română | `app/dashboard/sisteme/page.tsx` | "Overview"→"Prezentare", "Review"→"Validare", badge "review"→"de validat" |
| ✅ P1-2 | Badge dot anatomy | `components/evidence-os/Badge.tsx` | Prop `dot` opțional; dot 6px `bg-current`; aplicat pe dashboard status badge |
| ✅ P1-3 | strokeWidth audit | — | Documentat ca varianță acceptată — Lucide default=2, consistent în tot proiectul |
| ✅ P0-1 | AI Compliance Pack fix A | `components/compliscan/ai-compliance-pack-card.tsx` | Label-uri română; summary 3 metrici; confidence model + câmpuri editabile în `<details>`; suggestedNextStep sus |
| ✅ P2-1 | Dashboard consolidare | `app/dashboard/page.tsx` | EvidenceCore + NextBestAction grupate în `div.space-y-4`; CTA buttons→ghost pentru a nu concura cu acțiunea primară |
| ✅ P0-1B | AI Compliance Pack — Opțiunea B | `app/dashboard/rapoarte/page.tsx`, `app/dashboard/sisteme/page.tsx` | `AICompliancePackSummaryCard` mutat din Control→Pack în Audit si export; Control→Pack rămâne execuție pură (câmpuri editabile); pack-ul se încarcă automat la intrarea în rapoarte |
| ✅ — | dashboard-shell.tsx max-width | `components/compliscan/dashboard-shell.tsx` | 1200px → 1680px pentru layout lat pe desktop |
| ✅ — | EvidenceCore.tsx adăugat în git | `components/evidence-os/EvidenceCore.tsx` | Fișier nou creat 2026-03-16, niciodată comis — adăugat în commit-ul sprintului |

---

## Fixuri livrate înainte de sprint (sesiunea anterioară)

| # | Fișier | Problemă | Status |
|---|--------|----------|--------|
| ✅ | `app/dashboard/setari/page.tsx` | TabsTrigger fără `flex-col` — label+descriere pe același rând | Livrat |
| ✅ | `app/dashboard/sisteme/page.tsx` — `ControlPrimaryTabs` | Badge `rounded-full` arăta circular în grid 4 coloane; descriere `text-sm` prea mare | Livrat |

---

## Status sprint: ÎNCHIS ✅

Toate task-urile P0→P1→P2 livrate. Opțiunea B implementată în aceeași sesiune.

## Gaps rămase (next sprint)

| # | Task | Fișier | Detaliu |
|---|------|--------|---------|
| — | Dashboard `summary strip` explicit | `app/dashboard/page.tsx` | Recipe cere bloc distinct: task-uri active, dovezi/surse, audit readiness — ReadinessCards nu îl înlocuiesc complet |
| — | Dashboard `snapshot / recent activity` | `app/dashboard/page.tsx` | Baseline, ultimele surse, activitate recentă — absent |
| — | Recipe Scanare | `app/dashboard/scanari/page.tsx` | Neatins în acest sprint |
| — | Recipe Setari | `app/dashboard/setari/page.tsx` | Neatins în acest sprint |
| — | Compactare Overview + Drift | `components/compliscan/route-sections.tsx` | Deschis din `ui-audit-backlog.md` 2026-03-14 |

---

## Note arhitectură

- `page-recipes-dovada-2026-03-14.md` — rețetă canonică Dovada (Remediere/Audit export/Auditor Vault)
- `public/ux-ui-flow-arhitectura.md` — Golden Path: Sursa → Verdict → Remediere → Dovada → Audit/Export
- `public/evidence-os-design-system-v1.md` — specificații badge, butoane, spacing, iconițe
- `lib/server/mvp-store.ts` — state per-org
- `components/compliscan/use-cockpit.ts` — hook principal client
