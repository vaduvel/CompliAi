# CompliAI — Market Polish Sprint Plan (2026-04-02)

## Rolul documentului

Acesta este documentul de execuție rezultat din:
- [audit-findings-2026-04-02.md](/Users/vaduvageorge/Desktop/CompliAI/docs/polish-market-sprints/audit-findings-2026-04-02.md)

Auditul rămâne documentul-sursă pentru adevăr.
Acest fișier este planul executabil:
- ce facem acum
- în ce ordine
- ce intră la Codex
- ce intră la Claude
- cum știm că sprintul e închis

---

## Status

`active`

Checkpoint curent:
- Workstream A — `largely implemented`
- Workstream B — `in progress`
- Workstream C — `largely implemented`
- Workstream D — `implemented and validated`
- validare curentă:
  - `npm test` ✅ `1071 passed | 1 skipped`
  - `npm run build` ✅

---

## Obiectiv

Să ducem produsul din:
- `matur și bogat în capabilități`

în:
- `mult mai coerent`
- `mai de încredere`
- `mai puțin fragmentat`
- `mai puțin dependent de context implicit`
- `mai pregătit pentru market launch`

Fără a deschide module noi.
Sprintul atacă strict:
- trust și persistence
- runtime truth
- regression safety
- UX/UI polish
- flow simplification
- defragmentare

---

## Principii

### 1. Un finding = un cockpit = un singur loc de execuție
- evităm redirecturile laterale când putem rămâne în context
- userul nu trebuie plimbat între 3-4 ecrane ca să termine un caz

### 2. UI-ul trebuie să spună adevărul operațional
- `prezent` nu este același lucru cu `valid`
- `activ` nu este același lucru cu `merge`
- `aprobat` trebuie să conducă clar spre pasul următor

### 3. O sesiune reală trebuie să-și amintească unde a rămas userul
- org
- mod workspace
- rută
- onboarding completion reală

### 4. Supabase trebuie să fie adevărul dominant în runtime-ul de producție
- fallback-urile locale rămân doar ca safety net
- nu ca truth model implicit

### 5. Polish-ul nu este cosmetică
- loading
- errors
- toasts
- labels
- CTA hierarchy
- onboarding exit
toate intră în încrederea produsului

---

## Structura sprintului

Sprintul este împărțit în 4 workstreams.

### Workstream A — Trust & Persistence
Owner: `Codex`

### Workstream B — UX/UI Polish & Defragmentare
Owner: `Claude`

### Workstream C — Runtime Truth & Integrations
Owner: `Codex`

### Workstream D — Regression Safety
Owner: `Codex`

---

## Workstream A — Trust & Persistence

### Obiectiv

Să eliminăm cele mai periculoase rupturi de încredere:
- reloginul nu restaurează corect workspace-ul
- onboarding gate folosește context implicit
- truth-ul poate oscila între Supabase și fallback local

### Task-uri

- [x] Fix `logout/login -> restore workspace + route + org`
- [x] Păstrează explicit:
  - `last_org_id`
  - `workspace_mode`
  - `last_route`
- [x] Leagă onboarding gate strict de sesiunea reală, nu de context implicit
- [x] Revizuiește flow-ul:
  - login
  - relogin
  - switch org
  - switch workspace mode
- [x] Redu ambiguitatea dintre Supabase și fallback local în flow-urile critice

### Definition of done

- userul revine în workspace-ul corect după relogin
- onboardingul nu reapare fals pentru org-uri deja configurate
- layout-ul și onboarding gate-ul folosesc org-ul real din sesiune
- comportamentul este verificabil cu pași de repro simpli

---

## Workstream B — UX/UI Polish & Defragmentare

### Obiectiv

Să reducem fragmentarea produsului și să-l facem mai coerent, mai clar și mai puțin obositor.

### Scope

Acest workstream este pentru:
- UX simplification
- defragmentare
- loading / toast / error consistency
- navigation clarity
- cockpit continuity
- onboarding exit polish
- trust/conversion polish pe landing

Nu intră aici:
- auth/session backend
- ANAF token semantics
- test suite backend
- storage architecture

### Task-uri

- [ ] Păstrează NIS2 și DSAR cât mai aproape de cockpit; evită redirect lateral când există variantă inline
- [ ] Fă features orphaned descoperibile în navigation sau în huburi locale
- [ ] Redu plimbarea userului în flow-urile:
  - fiscal
  - approvals
  - cockpit -> dosar
- [x] Fă `Aprobat` și alte stări intermediare mai clare vizual și semantic
- [ ] Standardizează:
  - loading states
  - skeletons
  - toast-uri
  - empty states
  - error surfaces
- [x] Curăță Settings ca să nu pară arbitrar între `solo`, `compliance`, `partner`
- [x] Final onboarding -> primul finding relevant direct
- [x] Polish landing:
  - trust signals
  - CTA clarity
  - reducerea impresiei de demo/mock
- [x] Corectează labeluri confuze, ex:
  - `Remediere` vs `Remediere clienți`

### Definition of done

- userul ajunge mai direct la prima acțiune utilă
- userul nu mai trebuie să ghicească unde merge după `Aprobat`
- stările importante sunt lizibile imediat
- navigația nu mai ascunde arbitrar zone importante
- landingul pare mai puțin demo și mai mult produs real

---

## Workstream C — Runtime Truth & Integrations

### Obiectiv

Să facem UI-ul și integrațiile să spună adevărul operațional, nu doar starea locală.

### Task-uri

- [x] Introdu statusuri operaționale adevărate pentru integrări:
  - `present`
  - `valid`
  - `operational`
- [x] Separă în UI:
  - token prezent
  - token valid
  - upload confirmat
- [ ] Continuă hardening ANAF sandbox până la:
  - upload
  - status
  - dovadă
- [x] Marchează clar zonele demo/fallback în UI acolo unde este cazul

### Definition of done

- userul vede diferența între configurat și valid operațional
- ANAF nu mai arată `Activ` când de fapt nu poate executa upload
- fallback/demo mode este explicit, nu implicit

---

## Workstream D — Regression Safety

### Obiectiv

Să ridicăm încrederea tehnică printr-o bază de teste real utilă.

### Task-uri

- [x] Adu `npm test` la verde
- [x] Separă fișierele manual / Playwright de Vitest
- [x] Repară:
  - `app/api/org/profile/route.test.ts`
  - `app/api/findings/[id]/route.test.ts`
  - `app/api/integrations/efactura/status/route.test.ts`
  - nav config tests
  - NIS2 mocks

### Definition of done

- `npm run build` trece
- `npm test` trece
- nu mai există test artifacts manuale prinse de runnerul principal

---

## Ordinea de execuție

### Faza 1
- Workstream A — Trust & Persistence
- Workstream C — Runtime Truth & Integrations

### Faza 2
- Workstream D — Regression Safety

### Faza 3
- Workstream B — UX/UI Polish & Defragmentare

Motiv:
- mai întâi reparăm adevărul
- apoi plasa de regresie
- apoi finisăm și simplificăm experiența

---

## Ce poate lua Claude acum

Claude poate prelua integral `Workstream B — UX/UI Polish & Defragmentare`.

Nu trebuie să modifice:
- auth/session truth
- storage architecture
- ANAF backend semantics
- test infrastructure de bază

Claude trebuie să lucreze doar în zona:
- UX/UI
- page flow
- labels
- navigation
- inline actions
- hierarchy
- polish

---

## Stare actuală pe scurt

### Închis sau aproape închis
- Workstream A — auth/session truth, workspace restore, onboarding gate truth
- Workstream C — runtime truth pentru ANAF/statusuri și majoritatea rutelor critice mutate pe org explicit
- Workstream D — suita principală și build-ul sunt verzi

### Încă deschis
- Workstream B — mai ales reducerea plimbării în fiscal/approvals/cockpit și consistency pe loading/error surfaces
- ANAF sandbox cap-coadă:
  - conectarea și token persistence sunt reale
  - uploadul final rămâne dependent de grant valid și reautentificare când grantul vechi a fost emis greșit

---

## Validare

### Validare minimă de sprint
- `npm run build`
- `npm test`

### Validare UX
- smoke manual pe:
  - onboarding
  - dashboard
  - de rezolvat
  - cockpit
  - fiscal
  - settings
  - reports

### Validare runtime
- login / relogin / restore
- org switching
- workspace mode switching
- approval flow
- ANAF status semantics

---

## Testul final brutal

Sprintul este reușit doar dacă:
- userul revine după relogin exact unde trebuie
- userul nu mai e plimbat inutil între approval / fiscal / cockpit
- stările din UI spun adevărul operațional
- Supabase este dominant în flow-urile critice
- loading / errors / toasts sunt mai coerente
- navigația nu mai ascunde nejustificat suprafețe importante
- buildul și testele nu mai contrazic produsul
