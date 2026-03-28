# Execution Log — UX Audit & Fix
**Branch:** wave0/ux-foundation-ds-v2
**Început:** 2026-03-27
**Status curent:** 🟡 În execuție

---

## Context rapid (dacă pici în limită)

User story principal:
> Landing → Login → Onboarding (CUI + ANAF + site scan) → Snapshot → Resolve fiecare risk IN-PLACE în cockpit → Dovadă → Dosar → Monitorizare

Principiu de fier: **un finding = un cockpit = un singur loc de execuție**

Audit complet în: `docs/` — raport produs în sesiunea anterioară (2026-03-27)

---

## PRIORITATE 1 — Fix flow breaks

### P1.1 — Șterge `/onboarding/finish`, redirect direct la Resolve
- **Status:** ✅ DONE
- **Fișiere:**
  - `components/compliscan/onboarding-form.tsx` — `handleOnboardingComplete()` → `router.replace("/dashboard/resolve")`
  - `app/onboarding/finish/page.tsx` — înlocuit cu redirect la `/dashboard/resolve`
- **De ce:** Ecranul dublează pasul 4 din onboarding wizard. Adaugă o oprire inutilă cu 2 CTA-uri confuze.

---

### P1.2 — NIS2 workflowLink: embed inline în cockpit
- **Status:** ⬜ TODO
- **Fișiere:**
  - `app/dashboard/resolve/[findingId]/page.tsx`
  - `lib/compliscan/finding-kernel.ts`
- **Detaliu:** NIS2 findings (eligibility, assessment, incidents, maturitate, governance) trimit userul OUT cu `recipe.workflowLink`. Soluția: mini-panel inline sau side sheet cu `findingId` pre-setat, fără full redirect.
- **Scope:** Afectează ~10 finding types NIS2

---

### P1.3 — DSAR workflowLink: embed ca drawer în cockpit
- **Status:** ⬜ TODO
- **Fișiere:**
  - `app/dashboard/resolve/[findingId]/page.tsx`
  - `app/dashboard/dsar/page.tsx` sau component nou
- **Detaliu:** DSAR access + erasure trimit userul la `/dashboard/dsar?action=new`. Embed ca sheet/drawer cu findingId.

---

## PRIORITATE 2 — Reduce zgomot

### P2.1 — FindingNarrativeCard: problem + action above fold, rest collapsible
- **Status:** ⬜ TODO
- **Fișiere:** `components/compliscan/finding-cockpit-shared.tsx`
- **Detaliu:** 7 câmpuri narative toate vizibile. Keep above fold: `problem` + `action`. Wrap în `<details>`: `impact`, `compliSupport`, `evidence`, `dossierContext`, `revalidation`.

---

### P2.2 — evidenceCardCopy: max 2 rânduri per finding type
- **Status:** ⬜ TODO
- **Fișier:** `app/dashboard/resolve/[findingId]/page.tsx` (variabila `evidenceCardCopy` ~L400–460)
- **Detaliu:** 11 finding types cu copy lung. Comprimă la 2 rânduri, rest în `<details>`.

---

### P2.3 — Generator Drawer: fix diacritice în CONFIRMATION_ITEMS
- **Status:** ✅ DONE (+ Codex a adăugat pasul Scan/Validate — P4.1 completat automat)
- **Fișier:** `components/compliscan/generator-drawer.tsx:32–43`
- **Fix:** `"si confirm ca reflecta"` → `"și confirm că reflectă"`, `"procesele si specificul"` → `"procesele și specificul"`, `"fata de"` → `"față de"`, `"Incearca"` → `"Încearcă"`

---

### P2.4 — Scan Page: un singur warning banner, collapse manifest/yaml/agent
- **Status:** ⬜ TODO
- **Fișier:** `components/compliscan/scan-page.tsx`
- **Detaliu:** 2 bannere duplicate → 1 singur. manifest + yaml + agent mode → în tab "Avansat" sau `<details>`.

---

## PRIORITATE 3 — Rebuild Dosar

### P3.1 — DosarPageSurface: nu mai aliasează ReportsPageSurface
- **Status:** ⬜ TODO
- **Fișiere:**
  - `components/compliscan/dosar-page.tsx`
  - `components/compliscan/reports-page.tsx` (referit, nu modificat)
- **Detaliu:** Dosar trebuie să fie: findings rezolvate + dovezi + documente generate + export. Nu: InspectorMode + AICompliancePack + EFacturaRisk.

---

## PRIORITATE 4 — Add validate step în Generator

### P4.1 — Generator Drawer: pas "Verifică documentul" între checklist și save
- **Status:** ⬜ TODO
- **Fișier:** `components/compliscan/generator-drawer.tsx`
- **Detaliu:** După `result` e setat și checklist bifat → rulează validare sistem înainte de PATCH findings. Arată: valid/invalid + ce lipsește.

---

## Log sesiune

| Data | Acțiune |
|---|---|
| 2026-03-27 | Audit chirurgical complet — 10 fișiere citite |
| 2026-03-27 | Raport de direcție produs |
| 2026-03-27 | Fișier de execuție creat |
| 2026-03-27 | P1.1 — onboarding/finish eliminat, redirect direct la resolve |
| 2026-03-27 | P2.3 — diacritice fixate în generator-drawer CONFIRMATION_ITEMS |
| 2026-03-27 | P2.1 — FindingNarrativeCard: above fold comprimat, collapsible section |
| 2026-03-27 | P2.2 — evidenceCardCopy: comprimat la 2 rânduri + details |
| 2026-03-27 | P2.4 — Scan Page: banner deduplicat, manifest/yaml/agent în Avansat |
| 2026-03-27 | P3.1 — DosarPageSurface rebuild: findings rezolvate + dovezi + docs + export |
