# Audit Complet CompliAI — Findings 2026-04-02

Audit consolidat din două surse:
- audit Claude: API routes, Supabase persistence, UX/UI, agenți & automatizare
- audit Codex: runtime truth, build/tests, session/workspace persistence, ANAF, market readiness

Scopul documentului:
- să spună clar ce este real azi
- ce este parțial sau încă hibrid
- ce scade încrederea produsului
- în ce ordine trebuie atacate fixurile pentru a duce aplicația spre market readiness

---

## 1. Verdict executiv

### Verdict general
- **CompliAI nu este încă market-ready** dacă standardul este:
  - client plătitor
  - încredere operațională
  - persistență clară
  - regresii controlate
- **CompliAI este însă un produs real și matur ca volum de cod**, nu un mockup mare cu câteva demo-uri.
- **Majoritatea problemelor rămase sunt de truth model, persistență, hardening și UX flow**, nu de lipsă brută de funcționalitate.

### Rezumat pe scurt

| Zonă | Verdict | Observație |
|------|---------|------------|
| Build | ✅ Bun | `npm run build` trece |
| Test suite | ✅ Verde | `1071` teste trecute, `1` skipped |
| API routes | ✅ Majoritar reale | zero rute confirmate ca full-mock |
| Supabase | ✅ Real | dar încă nu este peste tot adevăr unic |
| Agenți | ✅ Reali | dispatcher-ul semi-auto este încă parțial |
| UX/UI | ⚠️ Bun vizual, inconsistent operațional | prea multă plimbare și prea multe suprafețe laterale |
| Auth / workspace restore | ⚠️ Mult întărit | reloginul, workspace restore și onboarding gate au fost harden-uite, dar mai cer verificare runtime continuă |
| ANAF / e-Factura | ⚠️ Parțial | conectare sandbox reală, upload încă neînchis cap-coadă |
| Partner machine | ⚠️ Parțial | batch și white-label încă au zone fragile |

---

## 2. Build, testare și adevăr de livrare

### Build
- `npm run build` trece.
- Concluzie: produsul este **deployable**.

### Test suite
- `npm test` este verde.
- Rezultat observat la audit:
  - `187` fișiere de test verzi
  - `1071` teste trecute
  - `1` test skipped

### Zone care au fost închise în follow-up
- `app/api/org/profile/route.test.ts`
- `app/api/findings/[id]/route.test.ts`
- `app/api/integrations/efactura/status/route.test.ts`
- nav/config tests
- mock-urile NIS2
- fișierul manual/Playwright prins greșit de Vitest

### Concluzie
- buildul și plasa de regresie de bază sunt acum curate
- ce rămâne deschis nu mai este „test suite red”, ci:
  - runtime truth pe câteva integrări
  - ANAF cap-coadă
  - flow simplification / UX fragmentation

---

## 3. Ce este real și solid azi

### 3.1 API routes

#### Confirmate ca reale
- auth:
  - login
  - register
  - switch-org
  - memberships
  - reset-password
- findings workflow `/api/findings/[id]`
- approval queue + decide flow
- dashboard, calendar, urgency, accumulation
- NIS2:
  - assessment
  - incidents
  - vendors
  - maturity
  - governance
- fiscal:
  - SPV
  - e-Factura validation
  - eTVA discrepancies
  - filing records
- DSAR
- whistleblowing
- DORA
- pay transparency
- exports:
  - audit pack
  - AI Act evidence
  - vendor trust pack
- partner:
  - portfolio
  - CSV import
  - client drill-down
- agents:
  - commit
  - discover
  - AI systems CRUD

#### Ce nu s-a găsit
- zero rute confirmate cu `throw new Error("not implemented")`
- zero array-uri hardcodate returnate ca date reale
- `Math.random()` nu este folosit pentru scoruri, ci doar pentru ID-uri/utilitare

### 3.2 Agenți și inteligență

#### Confirmate ca reale
- Agent Runner
- Compliance Monitor
- Fiscal Sensor
- Vendor Risk
- Regulatory Radar
- Agent Orchestrator
- Risk Trajectory Calculator
- integrare Gemini API reală
- EUR-Lex SPARQL real
- scraping DNSC.ro real

#### Ce este bun structural
- confidence scoring există
- reasoning există
- finding truth materialization există
- agent feedback store există

### 3.3 Supabase schema de bază

Confirmat în schema repo:
- `organizations`
- `profiles`
- `memberships`
- `org_state`
- `evidence_objects`
- `anaf_tokens`
- `pending_actions`
- `review_cycles`
- `user_autonomy_settings`
- `scheduled_reports`

Fișiere cheie:
- `supabase/compliscan-full-schema.sql`
- `supabase/approval-review-queue-schema.sql`
- `supabase/runtime-ops-state.sql`

---

## 4. Ce este real, dar încă parțial

### 4.1 ANAF / e-Factura

#### Confirmat
- conectarea ANAF în sandbox/test funcționează
- tokenul se salvează în backend
- UI vede conexiunea
- approval flow pentru submit există
- XML persistence este mai bună decât înainte

#### Neînchis încă
- `Token activ` în UI nu înseamnă neapărat `token valid pentru upload`
- uploadul sandbox poate încă da `401 Unauthorized`
- grantul/tokenul operațional nu este încă dovedit cap-coadă pentru upload + status + dovadă finală

#### Verdict
- **nu mai este mock**
- **nu este încă 100% cap-coadă**

### 4.2 Batch executor / partner machine

#### Batch executor
- reale:
  - `run_baseline_scan`
  - `generate_ropa`
  - `send_compliance_summary`
- parțial:
  - `export_audit_pack` creează notificare, nu export matur cap-coadă

#### Semi-auto dispatcher
- `resolve_finding` este real
- restul de acțiuni importante sunt încă stub sau "queued shell":
  - `generate_document`
  - `repair_efactura`
  - `vendor_merge`
  - `auto_remediation`
  - `classify_ai_system`
  - `publish_trust_center`
  - `batch_action`

#### Verdict
- motorul există
- orchestrarea completă și side-effects reale încă nu sunt închise

### 4.3 Scheduled reports
- CRUD-ul există
- UI-ul există
- cron-ul există
- dar execuția este încă mai apropiată de:
  - event/log summary
  - approval queue
  decât de un motor complet de livrare auditat

### 4.4 White-label
- există serviciu și API
- există persistență
- dar fallback-ul este fragil
- schema repo nu confirmă încă suficient de curat maturitatea completă a acestei zone

---

## 5. Ce este încă hibrid sau riscant ca truth model

Zone importante unde adevărul poate oscila între Supabase și fallback local:
- `lib/server/mvp-store.ts`
- `lib/server/storage-adapter.ts`
- `lib/server/approval-queue.ts`
- `lib/server/review-cycle-store.ts`
- `lib/server/scheduled-reports.ts`
- `lib/server/white-label.ts`

Patternul comun:
- Supabase dacă există și e configurat
- fallback local / memorie / disk dacă nu există

### De ce este o problemă
- scade încrederea în "ce este adevărul"
- îngreunează debuggingul
- face mai greu de garantat consistența după restart / serverless recycle
- produce diferență între:
  - repo truth
  - runtime truth
  - user-perceived truth

### Concluzie
- produsul nu este fals
- dar încă nu are peste tot `single source of truth` suficient de strict pentru un SaaS cu standard înalt

---

## 6. Supabase persistence — zone bune și zone fragile

### Stores cu acoperire bună
Observate ca folosind `createAdaptiveStorage()` sau model apropiat:
- `mvp-store`
- `nis2-store`
- `vendor-review-store`
- `policy-store`
- `notifications-store`
- `agent-feedback-store`
- `agent-run-store`
- `dsar-store`
- `alert-preferences-store`
- `whistleblowing-store`
- `dora-store`
- `pay-transparency-store`

### Stores care mai cer hardening

#### `review-cycle-store`
- încă nu inspiră suficientă încredere ca persistență unitară
- fallbackul în memorie este un risc dacă Supabase nu răspunde
- trebuie întărit pe modelul store-urilor adaptive reale

#### `white-label.ts`
- fallback `Map` local
- risc real ca brandingul partenerului să dispară între instanțe
- cere clar:
  - storage adaptiv
  - tabel Supabase confirmat/versionat

---

## 7. Auth, onboarding și restore de workspace

Aceasta este una dintre cele mai importante probleme reale rămase.

### Finding
- logout/login nu garantează restaurarea workspace-ului exact cum a fost lăsat
- există bază reală în cod pentru reclamația userului că poate ajunge iar în onboarding sau într-un context greșit

### Fișiere cheie
- `app/api/auth/login/route.ts`
- `app/api/auth/select-workspace/route.ts`
- `app/api/auth/logout/route.ts`
- `app/dashboard/layout.tsx`
- `app/onboarding/page.tsx`
- `lib/server/auth.ts`
- `lib/server/org-context.ts`
- `lib/server/onboarding-gate.ts`

### Problemă tehnică
- sesiunea setează `workspaceMode`, dar nu există o strategie suficient de clară pentru:
  - `last_org_id`
  - `last_route`
  - restore complet al contextului
- onboarding gate și state refresh depind în unele locuri de `getOrgContext()` / context implicit, nu exclusiv de sesiunea userului

### Impact
- userul simte că produsul „nu își amintește”
- apar reîntoarceri false în onboarding
- scade încrederea foarte mult

### Verdict
- acest fix NU trebuie considerat închis
- este P0 de produs

---

## 8. UX / UI — unde este fragmentat produsul

### 8.1 Features orphaned
Există suprafețe accesibile doar prin URL direct:
- `/dashboard/alerte`
- `/dashboard/sisteme`
- `/dashboard/conformitate`
- `/dashboard/calendar`
- `/dashboard/vendor-review`

### 8.2 Workflow links care scot userul din cockpit
- NIS2 și DSAR pot scoate userul din contextul findingului curent
- asta rupe regula bună:
  - `un finding = un cockpit = un singur loc de execuție`

### 8.3 Approval / Fiscal / cockpit încă plimbă userul
Fluxul perceput este încă:
- creezi draft
- mergi la aprobare
- revii în fiscal
- verifici statusul în alt context

Chiar dacă s-au făcut pași spre inline approval, experiența rămâne fragmentată.

### 8.4 Setări prea dependente de `mode`
- taburile sunt filtrate diferit pe:
  - `solo`
  - `compliance`
  - `partner`
- asta a produs deja buguri reale, inclusiv lipsa tabului `Integrări` pentru `solo`

### 8.5 Statusuri UX care nu spun adevărul operațional
- `Activ` poate însemna doar `token prezent`
- `Aprobat` nu conduce suficient vizual spre următorul pas
- userul este forțat să deducă

### 8.6 Label ambiguu în navigare
- `Remediere` în sidebar partner se confundă cu `De rezolvat` din org
- propunerea bună rămâne:
  - `Remediere clienți`

### 8.7 Scan page
- au existat bannere duplicate
- această zonă cere în continuare disciplină de simplificare, chiar dacă s-au făcut consolidări

### 8.8 Onboarding exit nu duce suficient de direct la prima acțiune utilă
- după onboarding, userul încă poate ajunge într-un traseu prea lung până la primul finding relevant
- direcția mai bună este:
  - final onboarding
  - primul finding relevant
  - primul cockpit util

### 8.9 Inconsistență vizuală de runtime
- loading states sunt încă prea variate între pagini
- toast-urile nu sunt suficient de standardizate
- error handling și fallback UI diferă prea mult între suprafețe

### 8.10 Landing și suprafața publică cer trust/conversion polish
- landingul încă folosește `ProductMock` ca suprafață demo vizuală
- pentru market polish, asta cere:
  - trust signals mai clare
  - CTA-uri mai explicite
  - mai puțină impresie de mock și mai multă impresie de produs operațional

---

## 9. Cron jobs și automatizare

### Confirmate clar ca reale
- `agent-orchestrator`
- `legislation-monitor`
- `daily-digest`
- `agent-regulatory-radar`

### Neconfirmate complet la audit
- restul cron-urilor există ca rute/suprafețe
- dar nu toate au fost validate cap-coadă în același nivel de profunzime

### Concluzie
- automatizarea există
- nu este încă suficient de auditată complet pentru a spune că tot peisajul cron este „gata”

---

## 10. Mockups, demo mode și comportamente care trebuie marcate mai bine

Nu s-au găsit rute clar fake sau full-mock, dar există comportamente care trebuie făcute mai transparente:

### Exemple
- `import-efactura` pentru vendors poate cădea pe `EFACTURA_MOCK_VENDORS`
- unele flows de dispatch aprobă sau „queue-uiesc” fără efect operațional complet
- unele batch outcomes sunt încă doar notificări
- landing page încă include `ProductMock`, deci are și o componentă demo/promo care nu trebuie confundată cu produsul operațional

### Problema
- produsul poate părea mai “real” decât este în anumite colțuri
- lipsesc bannere/mesaje explicite în zonele care rulează în demo/fallback mode

---

## 11. Console logs și zgomot de production

Zone remarcate:
- `app/api/partner/import/baseline-scan/route.ts`
- `app/api/cron/agent-orchestrator/route.ts`
- `app/api/partner/import-csv/route.ts`
- alte cron-uri cu 1-2 `console.log`

### Concluzie
- nu este blocker major
- dar este un semn că produsul are încă nevoie de polish și hardening operațional

---

## 12. Încredere, inteligență și explicabilitate

### Ce este bun azi
- confidence scoring există
- reasoning există
- agent feedback există
- finding truth materialization există
- agent orchestration există

### Ce lipsește
- un trust layer unic pentru:
  - confidence
  - requires human review
  - approval feedback
  - reopen / revalidate logic
- explicabilitate mai uniformă între module
- mai puține reguli locale și mai multă guvernanță comună

### Trust features utile, dar încă lipsă
- version history clar pentru documente generate
- digital signature placeholder pentru audit pack / exporturi sensibile
- trust signals mai bune în landing și în suprafețele publice

### Concluzie
- produsul are o bază bună de „inteligență”
- dar încă nu e suficient de uniform și predictibil pentru a inspira încredere maximă

---

## 13. Ce este 100%, ce este parțial, ce este încă de maturizat

### 13.1 Ce putem numi 100% sau foarte aproape
- buildul
- schema Supabase de bază
- existența cozii de aprobări
- existența review cycles
- existența scheduled reports
- existența agenților principali
- existența conectării ANAF sandbox

### 13.2 Ce este real, dar încă nu 100%
- ANAF upload cap-coadă
- batch executor full outcomes
- semi-auto dispatcher
- white-label persistence robustă
- partner machine auditabilă
- restore complet de workspace după relogin
- navigație și settings predictibile pe toate modurile

### 13.3 Ce NU este problema principală
- lipsa de cod
- lipsa de feature-uri de bază

### 13.4 Ce ESTE problema principală
- coerența
- adevărul operațional
- reducerea fallback-urilor
- reducerea plimbării userului
- hardening
- test suite

---

## 14. Sprintul consolidat — ordine recomandată

### P0 — Trust și truth model
1. Fix complet pentru `logout/login -> restore workspace + route + org`
2. Onboarding gate strict session-bound, nu implicit context-bound
3. Statusuri operaționale adevărate pentru ANAF și integrări:
   - `present`
   - `valid`
   - `operational`
4. Eliminarea ambiguității dintre Supabase și fallback local în flow-urile critice

### P1 — Regression safety
5. Adu `npm test` la verde
6. Separă clar fișierele manual/Playwright de Vitest
7. Repară testele de routes și nav config picate

### P2 — Runtime side-effects și partner maturity
8. `generate_document` din dispatcher să facă side-effect real
9. `repair_efactura` din dispatcher să facă side-effect real
10. `export_audit_pack` din batch executor să facă export real
11. restul acțiunilor semi-auto să primească efecte reale, nu doar queue shell

### P3 — UX simplification
12. NIS2 și DSAR să rămână în cockpit, nu să arunce userul lateral
13. Features orphaned să fie descoperibile în navigation
14. Aprobare inline mai agresivă pentru fiscal și alte flow-uri
15. sticky return-to-origin după acțiuni laterale
16. labeluri și taburi mai clare în partner / settings
17. final onboarding -> primul finding relevant direct
18. standardizare loading states / toasts / error boundaries

### P4 — Persistence și polish operațional
19. `review-cycle-store` întărit pe model adaptiv robust
20. `white-label.ts` 100% Supabase-backed și versionat
21. run-log mai adevărat pentru scheduled reports
22. curățare `console.log` de production
23. marcaje UI clare pentru demo/fallback mode
24. DNSC scraper mai robust
25. version history pentru documente generate
26. digital signature placeholder pentru audit pack
27. landing trust/conversion polish

---

## 15. Fișiere cheie pentru sprintul următor

- `lib/server/semi-auto-dispatcher.ts`
- `lib/server/batch-executor.ts`
- `lib/server/white-label.ts`
- `lib/server/review-cycle-store.ts`
- `lib/server/mvp-store.ts`
- `lib/server/storage-adapter.ts`
- `lib/server/org-context.ts`
- `lib/server/onboarding-gate.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/select-workspace/route.ts`
- `app/dashboard/layout.tsx`
- `app/onboarding/page.tsx`
- `components/compliscan/navigation.ts`
- `components/compliscan/settings-page.tsx`
- `lib/compliscan/finding-kernel.ts`
- `app/api/integrations/efactura/status/route.ts`
- `app/dashboard/fiscal/page.tsx`
- `lib/server/efactura-anaf-client.ts`
- `lib/server/anaf-submit-flow.ts`
- `app/api/portfolio/batch/route.ts`
- `lib/server/dnsc-monitor.ts`

---

## 16. Verdict final consolidat

### Ce este bun
- baza produsului este serioasă
- majoritatea feature-urilor mari există
- Supabase este real
- agenții sunt reali
- buildul trece
- produsul nu este un mockup mascat

### Ce blochează încă market readiness
- auth/workspace persistence
- truth model hibrid
- test suite încă roșie
- statusuri operaționale incomplete sau înșelătoare în UI
- batch/dispatcher side-effects incomplete
- câteva flow-uri critice încă prea fragmentate

### Concluzie onestă
- **CompliAI este aproape de un produs real matur**
- **dar nu este încă suficient de coerent și dur pentru a fi numit market-ready fără rezerve**

Formula cea mai corectă azi:
- **capabil tehnic:** da
- **deployable:** da
- **de încredere pentru clienți plătitori fără rezerve:** nu încă
