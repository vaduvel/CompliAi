# FAZA 1 — Decision Matrix (2026-04-19)

> **Subfaza 1.1 output**: tabel complet pentru **56 pagini** (50 dashboard + 6 portfolio).
> Aplicarea protocolului din [ROLLOUT.md](./ROLLOUT.md) §1 (5 întrebări) + harta canonică din [DESTINATION.md](./DESTINATION.md) §3.
>
> **Pentru fiecare pagină**: decizie + dovadă + aprobare necesară.

---

## Legendă

| Decizie | Înțeles |
|---|---|
| ✅ **KEEP** | Pagină canonică din DESTINATION, rămâne neschimbată |
| 🔄 **REDIRECT** | Legacy ruta, mapată la canonical via 301 (pagina veche șterge după soak) |
| ✂️ **DELETE** | Orfană / fără scop — propun ștergere directă |
| ⚠️ **CONFIRM** | Necesită confirmarea ta înainte de orice acțiune |
| 🛠️ **REFACTOR** | Pagină monstru — Faza 3 |

---

## A. PAGINI CANONICE — KEEP (12)

Toate apar în DESTINATION §3 (rute canonice). Nu se ating.

| Rută | Componentă | Scop | Persona |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | Acasă (706 linii) | toate (Solo simplificat) |
| `/dashboard/scan` | `app/dashboard/scan/page.tsx` | Scanare nouă | toate |
| `/dashboard/scan/history` | `app/dashboard/scan/history/page.tsx` | Istoric scan | toate |
| `/dashboard/scan/results/[scanId]` | `app/dashboard/scan/results/[scanId]/page.tsx` | Rezultate scan | toate |
| `/dashboard/resolve` | `app/dashboard/resolve/page.tsx` | Task queue (canonical, va deveni `/actiuni/remediere` în Faza 3) | toate |
| `/dashboard/resolve/[findingId]` | `app/dashboard/resolve/[findingId]/page.tsx` | Smart Resolve Cockpit | toate |
| `/dashboard/resolve/support` | `app/dashboard/resolve/support/page.tsx` | Support context cockpit | toate |
| `/dashboard/dosar` | `app/dashboard/dosar/page.tsx` | Vault unificat | toate |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | Settings org (1985 linii — Faza 3 refactor) | toate |
| `/dashboard/settings/abonament` | `app/dashboard/settings/abonament/page.tsx` | Billing tab | toate |
| `/dashboard/settings/scheduled-reports` | `app/dashboard/settings/scheduled-reports/page.tsx` | Scheduled reports config | toate |
| `/dashboard/documente` | `app/dashboard/documente/page.tsx` | Documents hub (Solo unifică cu Politici) | toate |

**Aprobare**: ✅ automată (sunt canonical).

---

## B. PORTOFOLIU — KEEP (6)

Toate canonice pentru mod Partner. Nu se ating.

| Rută | Componentă | Scop |
|---|---|---|
| `/portfolio` | `app/portfolio/page.tsx` | Prezentare generală |
| `/portfolio/alerts` | `app/portfolio/alerts/page.tsx` | Alerte cross-firmă (Faza 2 va adăuga Inbox) |
| `/portfolio/tasks` | `app/portfolio/tasks/page.tsx` | Remediere cross-firmă |
| `/portfolio/vendors` | `app/portfolio/vendors/page.tsx` | Furnizori agregat |
| `/portfolio/reports` | `app/portfolio/reports/page.tsx` | Rapoarte batch |
| `/portfolio/client/[orgId]` | `app/portfolio/client/[orgId]/page.tsx` | Drill-in client (workspace switcher) |

**Aprobare**: ✅ automată (canonice DESTINATION §3.2).

---

## C. RO DUPLICATE — DELETE+REDIRECT (8)

**Fiecare**: pre-flight check făcut. Zero referințe valide în nav/imports/middleware. Propun:
1. Adaug redirect 301 RO → EN în `next.config.ts`
2. Soak 1 zi (tu folosești aplicația, confirm că nu lipsește nimic)
3. Șterg fișierul RO

| Rută RO (de șters) | → Redirect la | Pre-flight result |
|---|---|---|
| `/dashboard/scanari` | `/dashboard/scan` | ✅ 0 imports, 0 nav refs |
| `/dashboard/setari` | `/dashboard/settings` | ✅ 0 imports, 0 nav refs |
| `/dashboard/setari/abonament` | `/dashboard/settings/abonament` | ✅ 0 imports, 0 nav refs |
| `/dashboard/rapoarte` | `/dashboard/reports` | ✅ 0 imports, 0 nav refs |
| `/dashboard/rapoarte/auditor-vault` | `/dashboard/reports/vault` | ✅ 0 imports, 0 nav refs |
| `/dashboard/rapoarte/trust-profile` | `/dashboard/reports/trust-center` | ✅ 0 imports, 0 nav refs |
| `/dashboard/politici` | `/dashboard/reports/policies` | ✅ 0 imports, 0 nav refs |
| `/dashboard/audit-log` | `/dashboard/reports/audit-log` | ✅ 0 imports, 0 nav refs |

**Aprobare cerută**: ✋ DA pentru toate 8 ca BATCH (zero risc, paritate confirmată cu DESTINATION §3.6 redirect map).

---

## D. PAGINI ORFANE FUNCȚIONALE — REDIRECT la canonical (12)

Acestea **există în cod, NU sunt în sidebar nav**, dar **funcția lor există și în DESTINATION** (pe alt path canonic). Le redirectez, nu le șterg.

| Rută orfană | → Redirect canonical (per DESTINATION §3.6) | Funcție păstrată în |
|---|---|---|
| `/dashboard/alerte` | `/dashboard/monitorizare/alerte` (Faza 3 după ce există) | drift cards rămân |
| `/dashboard/calendar` | `/dashboard/rapoarte?tab=calendar` | calendar component reused |
| `/dashboard/conformitate` | `/dashboard/monitorizare/conformitate` | AI conformity → tab GDPR |
| `/dashboard/dsar` | `/dashboard/monitorizare/conformitate?tab=dsar` | DSAR engine în lib/server/dsar-store |
| `/dashboard/fiscal` | `/dashboard/monitorizare/conformitate?tab=efactura` | fiscal data flow rămâne |
| `/dashboard/nis2` | `/dashboard/monitorizare/nis2` | NIS2 engine intact |
| `/dashboard/nis2/maturitate` | `/dashboard/monitorizare/nis2?tab=maturitate` | maturity assessment intact |
| `/dashboard/nis2/governance` | `/dashboard/monitorizare/nis2?tab=governance` | governance intact |
| `/dashboard/nis2/eligibility` | `/dashboard/monitorizare/nis2?tab=eligibility` | eligibility intact |
| `/dashboard/nis2/inregistrare-dnsc` | `/dashboard/monitorizare/nis2?tab=dnsc` | DNSC intact |
| `/dashboard/sisteme` | `/dashboard/monitorizare/sisteme-ai` | AI inventory intact |
| `/dashboard/sisteme/eu-db-wizard` | `/dashboard/monitorizare/sisteme-ai?wizard=eu-db` | wizard intact |
| `/dashboard/vendor-review` | `/dashboard/monitorizare/furnizori` | vendor engine intact |
| `/dashboard/ropa` | `/dashboard/monitorizare/conformitate?tab=ropa` | RoPA intact |
| `/dashboard/pay-transparency` | `/dashboard/monitorizare/conformitate?tab=pay-transparency` | Pay transparency intact |
| `/dashboard/dora` | `/dashboard/monitorizare/conformitate?tab=dora` | DORA intact |
| `/dashboard/whistleblowing` | `/dashboard/setari?tab=whistleblowing` | Whistleblowing intact |
| `/dashboard/agents` | `/dashboard/setari?tab=automatizare` | agents intact |
| `/dashboard/generator` | `/dashboard/actiuni/politici` (alias `/dashboard/reports/policies`) | generator intact |
| `/dashboard/approvals` | `/dashboard/actiuni/remediere?tab=aprobari` | approvals intact |
| `/dashboard/review` | `/dashboard/setari?tab=review-cycles` | review cycles intact |
| `/dashboard/findings/[id]` | `/dashboard/resolve/[findingId]` | duplicat resolve canonical |
| `/dashboard/partner` | `/portfolio` | partner-mode → portfolio |
| `/dashboard/partner/[orgId]` | `/portfolio/client/[orgId]` | client drill-in canonical |

**Aprobare cerută**: ✋ DA pentru BATCH redirect (toate 24 redirects). **Pagina sursă rămâne în cod** până Faza 3 când se merge logica în pagini canonice noi (Monitorizare/Acțiuni). 0 risc redirect → backend funcție păstrat.

**Notă importantă**: paginile țintă `/dashboard/monitorizare/*` și `/dashboard/actiuni/*` **NU EXISTĂ ÎNCĂ**. Se construiesc în Faza 2-4. Soluția intermediară:
- **Opțiunea X**: redirect direct → 404 până construim țintele = bad
- **Opțiunea Y**: redirect cu fallback → pagina veche rămâne servabilă DACĂ ținta nu există încă = good
- **Opțiunea Z**: așteaptă cu redirects până construim țintele canonice (Faza 3-4), pentru acum doar adaugă RO redirects (categoria C) = **safest**

**Recomand Opțiunea Z**: în Faza 1, doar 8 redirects RO duplicate (categoria C). Restul de 24 vin în Faza 3-4 când țintele există.

---

## E. PAGINI INCERTE — CONFIRM WITH USER (4)

| Rută | Status în cod | Întrebarea pentru tine |
|---|---|---|
| `/dashboard/asistent` (352 linii) | Există, NU e în nav. Are componente pentru AI chat assistant. | **O folosești tu sau ai testat-o vreodată?** Dacă NU → DELETE. Dacă DA → KEEP cu plan de integrare. |
| `/dashboard/checklists` (221 linii) | Există, NU e în nav. Pare un widget pentru NIS2 incident checklists. | **E folosită undeva sau înlocuită de `/dashboard/nis2/incidents`?** |
| `/dashboard/conformitate` (444 linii) | Există, NU e în nav. AI conformity assessment standalone. | **Funcționează separat, sau e dup `/dashboard/sisteme/eu-db-wizard`?** Dacă duplicat → DELETE. |
| `/dashboard/scan/results/[scanId]` | Există în categoria A (KEEP) — confirm doar | **Rezultatele scan apar pe această rută live? Sau întotdeauna inline pe scan page?** |

**Aprobare cerută**: ✋ răspuns individual per pagină (DELETE / KEEP / DON'T KNOW).

---

## F. SAMPLE COMPONENTE — quick triage

Audit-ul complet pe 86 componente îl produc în Faza 3 când refactorizez pagini-monstri (atunci văd what's actually used). Pentru Faza 1, nu ating componente.

**Excepții pentru Faza 1**:
- `inspector-mode-panel.tsx` (1 unused per STATE-NOW) → **CONFIRM**: îl ștergem? Sau rămâne pentru debug intern?
- `legacy-workspace-bridge.tsx` → **KEEP în Faza 1**, șterg după Faza 3 (după ce migrare completă).

---

## SUMAR ACȚIUNI FAZA 1 — propunere finală

### 🟢 Acțiuni cu aprobare automată (zero risc)
- ✅ Categoria A: 12 pagini KEEP (canonice)
- ✅ Categoria B: 6 pagini portofoliu KEEP
**Total**: 18 pagini neatinse.

### ✋ Acțiuni cu aprobare batch (cer DA explicit)
- 🔄 Categoria C: **8 redirects 301 RO → EN** + 1 zi soak + delete
- 🛑 NU aplicăm redirects D acum (țintele nu există) — așteaptă Faza 3

### ⚠️ Acțiuni cu confirmare individuală
- Categoria E: 4 pagini incerte (asistent / checklists / conformitate / scan-results)

### 🛠️ Defer la Faza 3
- Categoria D: 24 redirects pentru pagini orfane funcționale (când există țintele Monitorizare/Acțiuni)
- Pagini-monstri: NIS2 (2800), Settings (1985), Fiscal (1806), Sisteme (1509)

---

## CE-TI CER ACUM

### Aprobare 1 — Batch RO duplicate (8 pagini)

```
✋ APROVE BATCH REDIRECT + DELETE pentru:
- /dashboard/scanari → /dashboard/scan
- /dashboard/setari → /dashboard/settings
- /dashboard/setari/abonament → /dashboard/settings/abonament
- /dashboard/rapoarte → /dashboard/reports
- /dashboard/rapoarte/auditor-vault → /dashboard/reports/vault
- /dashboard/rapoarte/trust-profile → /dashboard/reports/trust-center
- /dashboard/politici → /dashboard/reports/policies
- /dashboard/audit-log → /dashboard/reports/audit-log

Risc: ZERO (zero referințe valide, redirect 301 fluent, pagini RO șterse după 1 zi soak)
Tu spui DA → eu execut: redirects în next.config.ts → test → commit → 1 zi soak → delete files
```

### Răspuns individual — 4 pagini incerte

```
1. /dashboard/asistent — AI chat 352 linii. Folosit?    → KEEP / DELETE / NU ȘTIU
2. /dashboard/checklists — incident checklists 221 lin. → KEEP / DELETE / NU ȘTIU  
3. /dashboard/conformitate — AI conformity 444 lin.    → KEEP / DELETE / NU ȘTIU
4. /dashboard/scan/results/[scanId] — confirm KEEP     → DA / NU
```

### Decizie temporară — Categoria D redirect-uri

```
Vot:
- (A) Aplicăm redirect-urile D ACUM cu fallback la pagina veche dacă ținta lipsește
- (B) Așteptăm până în Faza 3 când construim țintele Monitorizare/Acțiuni (RECOMANDAT — safest)
```

---

## Pașii următori după aprobările tale

1. **Dacă DA pe RO duplicate** → execut Subfaza 1.2 (redirects) imediat
2. **Răspunsuri pe 4 incerte** → categorizez DELETE / KEEP per fiecare
3. **Decizia D** → planific Faza 3 corespunzător

**Apoi**: Subfaza 1.5 (Sidebar nav update per DESTINATION §2) → final commit Faza 1 → demo tu rulezi → trecere Faza 2.

---

> **END FAZA-1-DECISION-MATRIX.md** — generat 2026-04-19
> Aprobările tale dictează ce execut în următoarele zile.
