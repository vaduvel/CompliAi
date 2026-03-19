# CompliScan – Next Steps: Performanță & Risk UX (2026‑03‑14)

> Fișier de lucru pentru agenții Cursor/Codex. Nu schimbă codul singur; clarifică ce urmează, în ce ordine, ca să nu pierdem firul produsului.

## 1. Starea actuală (rezumat)

- Produsul nu mai este MVP: auth, multi‑org, RLS, release readiness, traceability și engine‑ul de compliance sunt **mature** și auditate.
- `Evidence OS` este DS oficial (Val 1–3 închise), cockpitul Compliscan (`components/compliscan/*`) este sursa principală de adevăr vizual.
- Punctele grele:
  - `components/compliscan/use-cockpit.ts` ~1635 linii, 24 fetch‑uri, consumat de ~10 pagini mari.
  - aproape toate paginile din `/dashboard/*` sunt `"use client"` și fac **full‑page loading** cu același payload mare.
  - `payload /api/dashboard` este bogat (state + summary + remediationPlan + workspace + compliancePack + traceabilityMatrix) chiar când pagina folosește doar o parte.

## 2. North Star de produs (din `roadmap-compliscan.md`)

- Fluxul principal rămâne:
  1. **Adaugi sursa**
  2. **Primesti verdict**
  3. **Primesti pașii de remediere**
  4. **Exportezi dovada**
- Toate conceptele (inventar AI, baseline, drift, checklists, export avansat) sunt subordonate acestui fir.
- Limbajul corect este:
  - „**scor de risc**”, „control”, „recomandare AI”, „verificare umană”, „dovadă”.
  - Fără „100% compliant” sau promisiuni de conformitate absolută.

## 3. Pasul următor prioritar (din audituri)

### 3.1. Performance cleanup incremental (următorul sprint)

**Sursa:** `public/backlog-recheck-post-sprint7-2026-03-14.md`, `public/audit-performanta-nextjs-2026-03-14.md`, `public/review-arhitectura-implementare-2026-03-14.md`.

Ordine propusă:

1. **Split controlat pentru `useCockpit`**
   - scoatem hook‑uri tematice:
     - `useDashboardSummary`
     - `useEvidenceActions`
     - `useDriftState`
     - `useEfacturaState`
   - fiecare pagină `/dashboard/*` importă doar ce îi trebuie.

2. **Micșorare payload `/api/dashboard` acolo unde e prea mare**
   - păstrăm `buildDashboardPayload` ca sursă canonică,
   - dar creăm payload‑uri specializate (sau derivăm parțial pe server) pentru paginile care nu au nevoie de tot (ex. `Auditor Vault` vs `Scanari`).

3. **Bootstrap „server‑first” pentru datele comune**
   - workspace + user + memberships vin din `app/dashboard/layout.tsx` (RSC) folosind direct `getOrgContext`/`getCurrentUser`,
   - `dashboard-shell` devine mai subțire (nu mai face `fetch("/api/auth/...")` în `useEffect`).

4. **Înlocuirea full‑page `LoadingScreen` cu loading pe secțiuni**
   - shell + nav + header rămân vizibile,
   - doar zonele grele (taburi, coloane) afișează skeleton sau loader local.

### 3.2. Decompoziție pagini mari (fără rewrite)

Ținte clare (din `review-arhitectura-implementare-2026-03-14.md`):

- `app/dashboard/setari/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- `app/dashboard/scanari/page.tsx`

Pentru fiecare:

- împărțim în **secțiuni autonome** (ex. `Release readiness`, `Audit & export`, `Scanare surse`, `Drift`, etc.),
- fiecare secțiune primește un props payload îngust, nu tot obiectul din cockpit,
- logica UI devine mai ușor de testat și evoluat fără a rupe restul paginii.

## 4. Simplificare și clarificare Risk UX

1. **Unificare header de risc**
   - păstrăm `components/compliscan/risk-header.tsx` ca singur header de risc oficial.
   - marcăm `components/dashboard/RiskScoreCircle.tsx` + restul `components/dashboard/*` ca *legacy/demo* (mutate într‑un folder `legacy` sau excluse din build).

2. **Explicare internă a câmpurilor de risc**
   - document dedidcat (în `public/`) care explică:
     - `highRisk` = număr de findings nerezolvate `critical|high`,
     - `lowRisk` = număr de findings nerezolvate `medium|low`,
     - cum se calculează `gdprProgress` din `redAlerts`/`yellowAlerts`,
     - cum se leagă `efacturaSignalsCount` de scorul general.

3. **Verificare extinsă a textelor de risc**
   - rulat `rg "risk"`, `rg "risc"`, `rg "compliant"` pentru a confirma că:
     - peste tot vorbim de scor și recomandări,
     - nu promitem conformitate absolută,
     - menționăm explicit „verificare umană” în locurile critice (dashboard, rapoarte, exports).

## 5. După performance cleanup (următoarele fronturi)

Conform `backlog-recheck-post-sprint7-2026-03-14.md`, după ce performance cleanup este într‑o stare bună:

1. **Invitații și administrare membri**
   - finisează flow‑ul de invitare a contabilului / avocatului / auditorului,
   - UI clar pentru roluri și drepturi.

2. **Normalizare relațională mai puternică**
   - clarifică relațiile:
     - `finding ↔ task ↔ evidence ↔ drift ↔ control`.
   - țintă: explainers mai bune pentru „de ce scorul ăsta de risc?” și „ce dovadă susține verdictul?”.

3. **Parser XML robust pentru e‑Factura**
   - finalizează wedge‑ul local pentru e‑Factura, dar fără a devia north‑star‑ul produsului.

## 6. Notă finală

- Nu este recomandată:
  - schimbarea framework‑ului (`Next.js` rămâne alegerea bună),
  - rescrierea completă a store‑ului sau a engine‑ului de compliance,
  - re-platformare UI (Evidence OS trebuie finalizat, nu înlocuit).
- Prioritatea sănătoasă este:
  - **închidem coerent UX + performanță** pe cockpit,
  - păstrăm firul „sursă → verdict → remediere → dovadă” clar și ușor de explicat,
  - evităm rewrites mari care ar rupe validarea de azi.

