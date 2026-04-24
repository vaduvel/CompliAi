# LIVE-PUSH-READINESS-GATE.md

> **Scop**: documentul care spune clar când putem împinge în live și ce mai trebuie făcut până acolo.
>
> **Data**: 2026-04-21
> **Regulă de bază**: nu împingem nimic în live până când varianta locală / `preview/integration-*`:
> - implementează cap-coadă ce promit documentele canonice pentru suprafețele P1
> - bate vizibil live-ul actual la IA + UX + densitate + flows
> - trece validarea minimă tehnică și operațională

---

## 0. Decizia simplă

### NU împingem live dacă oricare este adevărat

- canonul IA există doar parțial în local
- shell-ul nou există doar ca nav config, nu și ca experiență coerentă
- design system-ul nou este doar documentat, nu aplicat pe paginile P1
- flow-urile principale pentru Diana nu sunt mai bune decât în live
- există contradicții între docs, preview și runtime
- nu putem spune clar: **"noua variantă bate live-ul"**

### Putem împinge live doar când toate sunt adevărate

- `portfolio-first` este complet și coerent
- suprafețele P1 sunt migrate la noul shell / noua IA
- UX-ul nou este testat local de tine și declarat superior live-ului
- riscurile critice de integritate și auth sunt închise
- există un checklist de validare trecut cap-coadă

---

## 0.1 Contract de execuție pentru agenți

Acest document trebuie tratat ca **protocol de lucru**, nu ca recomandare generală.

### Reguli obligatorii

- se lucrează **un singur sprint o dată**
- nu se combină 2 sprinturi într-un batch mare
- nu se adaugă scope “pentru că tot eram acolo”
- nu se schimbă documentele canonice ca să se potrivească după cod
- nu se împinge nimic în live
- nu se face deploy
- nu se face push pe `main`
- nu se șterg fișiere fără aprobare explicită
- nu se fac refactorizări oportuniste în afara sprintului curent
- nu se rescriu module mature doar pentru că sunt mari
- nu se atinge Stripe / billing live până nu intră explicit în scope
- nu se atinge `vercel.json`, cron-uri sau infrastructură live fără aprobare explicită

### Reguli de stop

Agentul se oprește și cere decizie dacă:

- sprintul cere mai mult de `8-12` fișiere modificate
- apare conflict între docs și runtime care schimbă scope-ul
- build-ul pică și cauza nu este locală la sprint
- testele care pică par să indice regresie, nu debt vechi
- trebuie mutate / șterse rute sau fișiere în afara listei aprobate
- descoperă că o rută promisă de docs nu are încă suport tehnic suficient

### Regula de livrare

La finalul fiecărui sprint, agentul trebuie să producă exact:

1. ce a schimbat
2. ce NU a schimbat
3. ce a validat
4. ce a rămas deschis
5. verdict clar:
   - `READY FOR USER REVIEW`
   - sau `BLOCKED`

---

## 0.2 Standard de evidence per sprint

Fără evidence, sprintul nu se consideră gata.

### Evidence minim obligatoriu

- lista fișierelor atinse
- build / test / lint rulate sau motivul concret pentru care nu s-au rulat
- rutele testate manual
- comparația cu live pentru suprafața atinsă
- capturi sau descriere exactă a diferenței observabile

### Format obligatoriu de raport

```
Sprint:
Scope:
IN:
OUT:
Fișiere modificate:
Validare:
Rezultat:
Rămâne:
Verdict:
```

---

## 1. Sursele de adevăr

Ordinea de autoritate pentru acest document:

1. [DESTINATION.md](./DESTINATION.md)
2. [IA-TARGET-DIAGRAM.md](./IA-TARGET-DIAGRAM.md)
3. [DESIGN-BRIEF.md](./DESIGN-BRIEF.md)
4. [MASTER-EXECUTION-CONTROL.md](./MASTER-EXECUTION-CONTROL.md)
5. [ROLLOUT.md](./ROLLOUT.md)
6. [DELIVERY-READINESS-PLAN.md](./DELIVERY-READINESS-PLAN.md)
7. [STATE-NOW.md](./STATE-NOW.md)

Acest document nu înlocuiește niciunul dintre ele. Le convertește în **gate-uri de push live**.

---

## 2. Baseline azi

### 2.1 Starea ramurilor

- `live` rulează practic `main` și este în urmă față de branch-ul de integrare
- `main` = baza stabilă actuală
- `preview/integration-2026-04-21` = candidatul local cu IA nouă + fixuri + Faza 5 + Faza 6.1 parțial aterizate

### 2.2 Ce este deja aterizat în candidatul local

- auth partner cu `portfolio` ca destinație implicită
- model `workspaceMode = portfolio | org`
- inbox cross-portfolio agregat
- bulk actions pentru inbox
- drill-in client din portofoliu
- quick-add client
- diagnostic PDF
- ANSPDCP pack implementat în cod
- HMAC timing-safe
- baseline gate pentru audit-pack
- nav pe moduri cu structură canonică parțială

### 2.3 Ce NU este încă suficient de aterizat pentru live

- shell vizual canonic complet
- design system adoption real pe paginile cheie
- grupuri nav `Monitorizare` / `Acțiuni` la nivel de produs finit
- applicability gating
- Solo canonic real (`/dashboard/de-rezolvat`)
- cockpit spart și disciplinat conform canonului
- settings split real
- audit de comparație cap-coadă nou vs live

---

## 3. Ce promit documentele și încă NU este suficient implementat

Acestea sunt **obligatorii înainte de push live**.

### A. IA canonică

#### A1. Shell Partner / Compliance / Solo / Viewer complet

**Promis de docs**:
- Partner: `Portofoliu` sus, `Firmă` jos
- Compliance: doar secțiunea per-firmă
- Solo: nav simplificat real
- Viewer: nav minimal read-only

**Status azi**:
- logica există parțial
- experiența finală nu este încă completă

**Mai trebuie**:
- grupuri nav coerente, nu doar structură de date
- active states corecte
- wording final în română
- parity între desktop și mobile nav

#### A2. Rute canonice complete

**Promis de docs**:
- `/dashboard/monitorizare/*`
- `/dashboard/actiuni/*`
- `/dashboard/de-rezolvat`
- redirect map legacy complet

**Status azi**:
- o parte există în preview
- o parte încă folosește fallback la rute vechi

**Mai trebuie**:
- eliminarea href-urilor mixed old/new
- verificare rute canonice fără hop-uri inutile
- redirect map complet validat local

#### A3. Portfolio-first fără scoatere accidentală în org-mode

**Promis de docs**:
- partner triage în portofoliu
- drill-in deliberat, nu aruncare implicită

**Status azi**:
- mult mai bine decât live
- nu este încă demonstrat cap-coadă pe toate intrările

**Mai trebuie**:
- validare pe inbox, overview, client drill-in, quick-add post-success
- back-navigation coerentă

---

### B. UX / UI / Design System

#### B1. DS foundation real, nu doar artefact

**Promis de docs**:
- noul strat vizual “Linear × Vanta”
- primitives canonice
- densitate și calm autoritar

**Status azi**:
- DS există în documentație și în câteva componente
- produsul folosește încă predominant `evidence-os`

**Mai trebuie**:
- token bridge clar
- primitives canonice folosite de shell și paginile P1
- stil unificat pentru badge, card, input, button, table row, empty state

#### B2. Shell nou pe suprafețele P1

**Promis de docs**:
- sidebar clar
- topbar clar
- bulk bar sticky
- ierarhie vizuală densă și disciplinată

**Status azi**:
- shell parțial

**Mai trebuie**:
- aplicarea noului shell pe:
  - `/portfolio`
  - `/portfolio/alerts`
  - `/portfolio/client/[orgId]`
  - `/dashboard/actiuni/remediere/[findingId]`
  - `/dashboard/monitorizare/conformitate`

#### B3. Progressive disclosure și CTA discipline

**Promis de docs**:
- top 3 critice + “Vezi toate”
- o pagină = o intenție dominantă
- un CTA principal

**Status azi**:
- încă inconsistent

**Mai trebuie**:
- aplicare explicită pe dashboard, inbox și cockpit
- eliminarea blocurilor concurente de acțiune

#### B4. Empty / loading / error states coerente

**Promis de docs**:
- feedback clar, calm, consistent

**Status azi**:
- neuniform

**Mai trebuie**:
- pattern unic și aplicat pe paginile P1

---

### C. Flows P1 care trebuie să bată live-ul

Acestea sunt suprafețele care trebuie să fie clar mai bune decât live-ul înainte de push.

#### C1. `/portfolio`

Trebuie să livreze:
- overview clar pe clienți
- sort / filter / selection
- quick-add integrat elegant
- diagnostic export clar
- densitate bună pentru Diana

#### C2. `/portfolio/alerts`

Trebuie să livreze:
- triage în 5-10 minute
- bulk actions clare
- severitate clară
- drill-in fără pierdere de context
- feedback clar post-acțiune

#### C3. `/portfolio/client/[orgId]`

Trebuie să livreze:
- context suficient fără switch forțat
- finding focus
- punte bună spre cockpit
- quick actions relevante

#### C4. `/dashboard/actiuni/remediere/[findingId]`

Trebuie să livreze:
- stack-ul canonic: Context → Impact → Pași → Evidence → Decide
- max 3 click-uri pentru caz evident
- handoff bun către document / evidence / close

#### C5. `/dashboard/monitorizare/conformitate`

Trebuie să livreze:
- findings per framework fără fragmentare
- tabs/filtre, nu sub-produse paralele
- citibilitate și densitate reale

#### C6. `/dashboard/setari`

Trebuie să livreze:
- split real pe zone
- separare clară cont vs firmă
- structură lizibilă

---

### D. Fixuri de integritate și risc

Acestea sunt obligatorii înainte de push live chiar dacă UI-ul arată bine.

#### D1. Auth/session integrity

- HMAC timing-safe
- fără regresii de refresh / restore / workspace persistence

#### D2. Export integrity

- audit-pack baseline gate
- AI Act role scope corect
- ANSPDCP pack funcțional și verificat cap-coadă local

#### D3. Production safety minimă

Conform [DELIVERY-READINESS-PLAN.md](./DELIVERY-READINESS-PLAN.md), înainte de push live trebuie închise minim:
- CSP / XSS exposure critică
- CSRF posture
- session rotation / expiry behavior
- PII scrubbing minim

Nu trebuie să terminăm tot enterprise-hardening-ul, dar trebuie să eliminăm blocker-ele evidente.

---

## 4. Ce poate rămâne după primul push live

Acestea **nu blochează primul push** dacă tot restul este bun:

- polish suplimentar pe motion
- rollout complet DS pe toate paginile secundare
- applicability gating perfect
- keyboard shortcuts complete peste tot
- full visual regression infrastructure
- Stripe live billing
- SSO / SAML
- audit log immutable complet enterprise

Cu alte cuvinte: primul push live nu cere perfecțiune globală. Cere superioritate clară pe suprafețele P1 + integritate + coerență.

---

## 5. Gate-ul de push live

Push live este permis doar dacă toate checklist-urile de mai jos sunt bifate.

### 5.1 Gate A — Canonul structural

- [ ] partner intră în `portfolio` by default
- [ ] `portfolio` vs `org` funcționează coerent
- [ ] rutele canonice cheie există și sunt folosite
- [ ] redirect-urile legacy principale sunt validate local
- [ ] nav pe moduri este coerent și lizibil

### 5.2 Gate B — Suprafețele P1 bat live-ul

- [ ] `/portfolio` este mai clar decât live
- [ ] `/portfolio/alerts` este mai rapid și mai dens decât live
- [ ] `/portfolio/client/[orgId]` păstrează contextul mai bine decât live
- [ ] cockpit-ul este mai coerent decât live
- [ ] conformitate și setări nu sunt regresii față de live

### 5.3 Gate C — Design și UX

- [ ] noul shell este aplicat pe paginile P1
- [ ] DS foundation este vizibil în produs, nu doar în docs
- [ ] tonul vizual este coerent
- [ ] empty/loading/error states sunt acceptabile
- [ ] nu există amestec deranjant între vechi și nou în suprafețele P1

### 5.4 Gate D — Integritate și risc

- [ ] HMAC timing-safe aterizat
- [ ] baseline gate audit-pack aterizat
- [ ] AI Act export role scope restrâns
- [ ] ANSPDCP pack testat local cap-coadă
- [ ] nu există regresii de auth/session/workspace

### 5.5 Gate E — Validare practică

- [ ] build curat
- [ ] suite minimă de teste trecută sau failures rămase sunt documentate ca pre-existente
- [ ] smoke manual local pe flow-urile P1
- [ ] comparație side-by-side cu live
- [ ] verdictul tău explicit: **"noua variantă bate live-ul"**

Fără ultimul punct, nu există push live.

---

## 6. Sprinturi obligatorii până la push live

Aceste sprinturi trebuie executate **în ordine**.

---

### Sprint 1 — Canon structural și integritate minimă

**Obiectiv**: candidatul local trebuie să aibă fundația corectă înainte de orice polish major.

**IN**
- route canon + nav consistency
- `portfolio-first` fără scoatere accidentală în org-mode
- partner default landing în `portfolio`
- fixuri critice:
  - HMAC timing-safe
  - AI Act export role scope
  - audit-pack baseline gate
- redirecturile legacy principale

**OUT**
- redesign vizual mare
- DS rollout pe pagini
- settings split
- quick-add polish
- orice lucru de marketing sau billing

**Fișiere țintă tipice**
- `middleware.ts`
- `lib/server/auth.ts`
- `lib/compliscan/nav-config.ts`
- `components/compliscan/navigation.ts`
- `components/compliscan/dashboard-shell.tsx`
- `app/api/portfolio/inbox/route.ts`
- `lib/compliscan/onboarding-destination.ts`
- `app/api/exports/audit-pack/route.ts`
- `app/api/exports/ai-act-evidence-pack/route.ts`

**DoD**
- rutele canonice cheie sunt cele folosite de nav
- partner intră în `portfolio`
- inbox-ul păstrează contextul portfolio
- fixurile de integritate sunt în cod și validate
- nu există regresii evidente de auth/session/workspace

**Evidence obligatoriu**
- build
- teste targetate pentru auth/export/nav
- listă redirecturi validate local

**Stop dacă**
- apar mutări de rute în afara canonului deja aprobat
- sunt necesare delete-uri de fișiere

---

### Sprint 2 — Shell + Design System foundation

**Obiectiv**: noul strat vizual să existe real, nu doar în documente.

**IN**
- token bridge între `evidence-os` și DS nou
- primitives canonice folosite efectiv
- sidebar / topbar / bulk bar / page intro shared
- empty / loading / error states shared
- severity / status hierarchy coerentă

**OUT**
- migrare completă a tuturor paginilor
- shortcuts avansate
- polish fin pe motion

**Fișiere țintă tipice**
- `components/ui/ds/*`
- `app/evidence-os.css`
- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/portfolio-shell.tsx`
- `components/compliscan/route-sections.tsx`
- shared components folosite de P1 surfaces

**DoD**
- shell-ul nou este vizibil pe suprafețele P1
- DS foundation e recognoscibil în runtime
- nu există mix vizual incoerent pe shell

**Evidence obligatoriu**
- capturi before/after pe shell
- listă de primitives adoptate efectiv
- build + lint

**Stop dacă**
- se încearcă repaint pagină cu pagină fără shell comun
- agentul începe să refacă simultan 4-5 suprafețe mari

---

### Sprint 3 — P1 surfaces: Portfolio triad

**Obiectiv**: cele 3 suprafețe principale ale Dianei să bată live-ul.

**IN**
- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/client/[orgId]`

**OUT**
- cockpit
- conformitate
- settings
- pagini secundare

**DoD**
- overview mai clar și mai dens decât live
- inbox mai bun decât live pentru triage
- client drill-in păstrează contextul și ajută execuția
- quick-add și diagnostic sunt integrate coerent în experiență

**Evidence obligatoriu**
- smoke manual local pe cele 3 rute
- comparație side-by-side cu live
- verdict pe fiecare:
  - `mai bun`
  - `egal`
  - `mai slab`

**Regulă**
- dacă una din cele 3 nu bate live-ul, sprintul nu este închis

---

### Sprint 4 — P1 surfaces: Org execution triad

**Obiectiv**: execuția per-firmă să fie aliniată cu canonul și peste live.

**IN**
- `/dashboard/actiuni/remediere/[findingId]`
- `/dashboard/monitorizare/conformitate`
- `/dashboard/setari`

**OUT**
- restul paginilor monitorizare
- pagini nice-to-have
- billing live

**DoD**
- cockpit respectă stack-ul canonic
- conformitate folosește tabs/filtre, nu fragmentare paralelă
- settings este split real și lizibil
- toate 3 sunt cel puțin la paritate funcțională cu live și clar peste el în UX

**Evidence obligatoriu**
- flow manual pentru un finding cap-coadă
- capturi / descrieri pentru before vs after
- build + teste targetate

**Stop dacă**
- cockpit-ul devine refactor gigantic fără checkpointuri
- settings începe să fie rescris complet fără split incremental

---

### Sprint 5 — Final validation gate

**Obiectiv**: decizia `go / no-go` pentru push live.

**IN**
- revalidare completă a Gates A-E
- comparație nou vs live
- checklist de acceptare completat

**OUT**
- features noi
- polish nou
- cleanup oportunist

**DoD**
- toate gate-urile din §5 sunt bifate
- verdictul tău explicit este pozitiv
- candidatul local bate live-ul pe suprafețele P1

**Evidence obligatoriu**
- checklist complet
- lista exactă a diferențelor față de live
- lista de riscuri rămase acceptate

**Fără acest sprint nu există push live.**

---

### Sprint 6 — Readiness hardening carry-forward

**Obiectiv**: închide blocker-ele reale rămase după Sprint 5, fără să redeschidă redesign-ul sau să mute scope-ul în altă parte.

**IN**
- CSP headers minime și sigure pentru shell + API
- CSRF posture acceptabilă pentru mutațiile browser-originated
- session rotation / expiry refresh pe activitate
- PII scrubbing minim în logger și fallback-uri sensibile
- revalidare locală pentru `ANSPDCP pack`
- update la documentul de validation după hardening

**OUT**
- redesign nou
- pagini noi
- mutări mari de rute
- Stripe / billing / cron infra
- security perfectionism dincolo de minimul necesar pentru push gate

**DoD**
- blocker-ele din `DELIVERY-READINESS-PLAN` legate de CSP / CSRF / session rotation / PII sunt închise local
- `ANSPDCP pack` are cel puțin validare targetată locală
- build + lint + teste targetate sunt verzi
- documentul de validation spune explicit ce s-a închis și ce a rămas

**Evidence obligatoriu**
- diff clar pe fișierele de hardening
- teste targetate pentru middleware / auth / export
- build complet
- verdict actualizat în `LIVE-PUSH-VALIDATION-2026-04-21.md`

**Stop dacă**
- hardening-ul cere rescriere de auth sau infrastructure refactor mare
- schimbarea rupe webhook-uri / demo boot / public submit
- build-ul cade din motive neselective și scoate sprintul din zona lui legitimă

---

## 7. Verdict azi

### Azi NU suntem ready de push live

Motivul nu este că produsul e slab.

Motivul este că:
- încă avem nevoie de verdictul tău explicit side-by-side că noua variantă bate live-ul
- fără acel verdict, push-ul ar fi încă o presupunere, nu o decizie controlată

### Azi suntem ready doar pentru următorul lucru:

**să închidem blocker-ele reale și să comparăm local candidatul cu live-ul până când verdictul este clar**

și să folosim acest document ca gate real, nu simbolic.

---

## 8. Rezumat executiv

Înainte de push live mai trebuie confirmate sau închise:

1. hardening-ul minim de readiness
2. verdictul tău side-by-side că noua versiune bate live-ul
3. checklist-ul final din validation doc fără blockere reale deschise

**Abia după asta** discutăm despre push live.

---

## 9. Regula finală pentru Opus / orice alt agent

Agentul nu are voie să “interpreteze liber” acest document.

Are voie doar:

1. să aleagă sprintul curent
2. să execute strict `IN`
3. să evite strict `OUT`
4. să raporteze evidence
5. să ceară review

Nu are voie:

- să treacă la sprintul următor fără verdictul tău
- să facă merge conceptual între sprinturi
- să schimbe singur condițiile de succes
- să spună “done” pe bază de optimism

Formula corectă este:

**un sprint mic, clar, validat, apoi următorul**
