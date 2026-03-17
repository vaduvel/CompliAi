# Sprint Log — EOS v1 Remediere
**Data:** 2026-03-17
**Branch:** codex/scanare-verdicts-polish
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

---

## Fixuri livrate înainte de sprint (sesiunea anterioară)

| # | Fișier | Problemă | Status |
|---|--------|----------|--------|
| ✅ | `app/dashboard/setari/page.tsx` | TabsTrigger fără `flex-col` — label+descriere pe același rând | Livrat |
| ✅ | `app/dashboard/sisteme/page.tsx` — `ControlPrimaryTabs` | Badge `rounded-full` arăta circular în grid 4 coloane; descriere `text-sm` prea mare | Livrat |

---

## Sprint curent — ordine sănătoasă P0→P1→P2

### P0 — Blochează conformitatea EOS (fac acum, nu cer decizie)

| # | Task | Fișier | Detaliu |
|---|------|--------|---------|
| P0-1 | ~~Decizie AI Compliance Pack~~ | `ai-compliance-pack-card.tsx` | **Blocat — user alege A sau B (vezi mai jos)** |
| P0-2 | Elimină `tokens.ts` legacy | `lib/compliance/tokens.ts` | Duplicat față de CSS vars; referințe trebuie mutate la variabile CSS |

### P1 — Calitate vizuală (pot face fără decizie)

| # | Task | Fișier | Detaliu |
|---|------|--------|---------|
| P1-1 | Label-uri Control tabs în română | `app/dashboard/sisteme/page.tsx` | "Overview"→"Prezentare", "Review"→"Validare", "Systems"→"Sisteme", "Drift"→"Deviere" |
| P1-2 | Badge dot anatomy | `components/evidence-os/Badge.tsx` | EOS spec: `[●] LABEL` cu dot 6px; nu există în implementare |
| P1-3 | Audit `strokeWidth` iconițe | toate paginile | EOS spec: 1.5 default, 2 emphasis; tot proiectul folosește 2 universal |

### P2 — Arhitectură dashboard (cel mai mare, ultimul)

| # | Task | Fișier | Detaliu |
|---|------|--------|---------|
| P2-1 | Dashboard consolidare intent | `app/dashboard/page.tsx` | 3 blocuri suprapuse: EvidenceCore + NextBestAction + ReadinessCards; evaluare + propunere |

---

## Decizie pending — AI Compliance Pack (P0-1)

**Problema:** `ai-compliance-pack-card.tsx` are 4 fluxuri de confirmare simultane pe un card:
1. Confirmă familia
2. Confirmă grupul
3. Confirmă per articol
4. Confirmă pentru audit

User nou nu știe unde să apese. Violează principiul EOS: o intenție dominantă per secțiune.

**Opțiunea A — Simplificare imediată**
Cardul rămâne în Control → Review dar cu o singură acțiune vizibilă per family card. Restul intră în `<details>`.

**Opțiunea B — Separare pe pagini** *(conform rețetei canonice)*
"Confirmă pentru audit" iese din card și merge pe pagina Audit si export (`app/dashboard/rapoarte/page.tsx`). Control → Review rămâne cu acțiuni de execuție locală.

**De ales înainte de implementare.**

---

## Label-uri engleze de remediat în ai-compliance-pack-card.tsx

| Label actual | Label EOS (română) |
|---|---|
| `confirmed_by_user` | `confirmat` |
| `inferred` | `dedus` |
| `audit_ready` | `gata_audit` |
| `review_required` | `necesita_review` |
| `bundle_ready` | `pachet_gata` |

---

## Ordine de execuție recomandată

```
1. P0-2  tokens.ts eliminare           (independent, nu cere decizie)
2. P1-1  Control tabs română           (2 minute, text simplu)
3. P1-2  Badge dot anatomy             (componentă, izolat)
4. P1-3  strokeWidth audit             (grep + replace sistematic)
5. P0-1  AI Compliance Pack fix        (după decizie A/B)
6. P2-1  Dashboard consolidare         (cel mai complex, ultimul)
```

---

## Note arhitectură

- `page-recipes-dovada-2026-03-14.md` — rețetă canonică Dovada (Remediere/Audit export/Auditor Vault)
- `public/ux-ui-flow-arhitectura.md` — Golden Path: Sursa → Verdict → Remediere → Dovada → Audit/Export
- `public/evidence-os-design-system-v1.md` — specificații badge, butoane, spacing, iconițe
- `lib/server/mvp-store.ts` — state per-org
- `components/compliscan/use-cockpit.ts` — hook principal client
