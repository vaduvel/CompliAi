# MASTER-EXECUTION-CONTROL.md

> Documentul acesta este **sistemul de control al execuției** pentru CompliAI.
> Nu este un vision doc. Nu este un audit. Nu este un sprint doc.
> Rolul lui este să ne țină pe direcție când produsul a devenit suficient de mare încât:
> - există mult cod matur care poate fi stricat ușor
> - IA-ul și navigația trebuie reașezate
> - live-ul trebuie protejat
> - branch-urile și worktree-urile pot crea confuzie
>
> **Regulă simplă**:
> - [DESTINATION.md](./DESTINATION.md) spune **unde mergem**
> - [STATE-NOW.md](./STATE-NOW.md) spune **ce există**
> - [DELIVERY-READINESS-PLAN.md](./DELIVERY-READINESS-PLAN.md) spune **ce ne blochează să livrăm**
> - [ROLLOUT.md](./ROLLOUT.md) spune **cum migrăm**
> - **acest document** spune **cum executăm fără să pierdem maturitatea deja câștigată**

---

## 0. VERDICTUL DE BAZĂ

CompliAI **nu mai este MVP**.

Asta înseamnă:
- nu avem voie să înlocuim module mature cu variante demo doar pentru că sunt mai simple
- nu avem voie să “curățăm” agresiv dacă nu păstrăm aceeași capabilitate operațională
- nu avem voie să tratăm “cod mult” ca problemă în sine

Problema reală a produsului acum este:
- **maturitate bună, dar așezare slabă**
- codul există și în multe zone este solid
- produsul suferă în principal de:
  - fragmentare
  - IA nealiniată
  - multe rute și view-uri istorice
  - statusuri care nu spun adevărul operațional
  - flow-uri în care userul este plimbat

Deci strategia corectă nu este:
- `simplifică produsul`

Ci:
- `reașază produsul`
- `păstrează motoarele mature`
- `mută, consolidează, clarifică, hardenează`

---

## 1. IERARHIA DOCUMENTELOR

### 1.1 Documente canonice active

Ordinea de autoritate este:

1. [DESTINATION.md](./DESTINATION.md)
2. [USERS.md](./USERS.md)
3. [STATE-NOW.md](./STATE-NOW.md)
4. [DELIVERY-READINESS-PLAN.md](./DELIVERY-READINESS-PLAN.md)
5. [ROLLOUT.md](./ROLLOUT.md)
6. [IA-TARGET-DIAGRAM.md](./IA-TARGET-DIAGRAM.md)
7. [QA-FINDINGS-AUDIT.md](./QA-FINDINGS-AUDIT.md)

### 1.2 Cum se folosesc

- `DESTINATION` este mandatul de produs și IA
- `USERS` este adevărul despre persona și JTBD
- `STATE-NOW` este inventarul rece al realității din cod
- `DELIVERY-READINESS-PLAN` este backlog-ul de hardening pentru client-ready
- `ROLLOUT` este protocolul de migrare
- `IA-TARGET-DIAGRAM` este hartă tactică de rute și sidebar
- `QA-FINDINGS-AUDIT` este evidence, nu driver principal de produs

### 1.3 Ce NU este canon activ

Nu tratăm ca source of truth:
- worktree docs din `./.claude/worktrees/**`
- docs istorice din `docs/archive/**`
- snapshot-uri vechi din `docs/polish-market-sprints/**`, dacă intră în conflict cu pachetul nou
- note brute sau feedback-uri care nu au fost absorbite în documentele canonice

---

## 2. CE NU AVEM VOIE SĂ STRICĂM

Aceste zone sunt considerate **mature enough to preserve**:

- auth + multi-tenancy
- Supabase-backed org/profile/membership/state
- compliance engines din `lib/compliance/**`
- cron infrastructure
- drift engine
- evidence storage
- document generator
- approvals / review cycles / scheduled reports
- fiscal / ANAF sandbox flow până la limita grantului curent
- portfolio dashboard și motoarele cross-client deja implementate

### 2.1 Regula de aur

Când migrăm o pagină sau un flow:
- schimbăm **shell-ul**
- schimbăm **traseul**
- schimbăm **copy-ul**
- schimbăm **agregarea**

Dar nu aruncăm motorul matur decât dacă:
- este dovedit mort
- este duplicat confirmat
- sau este înlocuit 1:1 cu ceva mai robust

---

## 3. CE ÎNSEAMNĂ “PROGRES BUN”

Progres bun nu este:
- mai puține fișiere
- mai puține linii
- UI mai simplu la prima vedere

Progres bun este:
- același motor matur rulat printr-un flow mai clar
- mai puține clickuri până la acțiune
- un singur loc de execuție per job important
- statusuri care spun adevărul
- mai puțin context implicit
- mai puține rute paralele
- mai multă încredere după relogin, refresh și handoff între zone

### 3.1 Formula de validare

O schimbare este bună doar dacă:

1. păstrează sau crește capabilitatea reală
2. reduce fragmentarea
3. nu introduce regresii de auth / org / session / persistence
4. trece validarea cerută de impactul ei

---

## 4. MODELUL DE EXECUȚIE CORECT

### 4.1 Live-ul este protejat

Reguli:
- nu împingem live până nu vedem local noul IA + noul shell + noile rute cap-coadă
- live-ul actual este produsul stabil, nu laboratorul
- worktree-ul local actual este mediul de integrare

### 4.2 Branch model

Modelul corect:

- `main`
  - rămâne trunchiul stabil
- `preview/integration-*`
  - branch pentru integrare mare, evaluat local și eventual preview deploy
- branchuri scurte pentru patchuri mici sau workstream-uri izolate

### 4.3 Nu facem asta

Nu facem:
- zeci de branchuri paralele lungi care devin fiecare “adevăr”
- push pe live ca să “vedem ce iese”
- merge-uri mari fără checkpointuri validate

---

## 5. LUCRĂM PE UNITĂȚI DE MIGRARE, NU PE HAOS

Fiecare schimbare intră într-una din clasele astea:

### Clasa A — Docs canon

Conține:
- documente de adevăr
- mandate
- route maps
- readiness plans

Validare:
- coerență între ele
- zero contradicții

### Clasa B — IA / route / nav migration

Conține:
- mutare rute
- redirects
- sidebar
- breadcrumbs
- route groups
- renumiri structurale

Validare:
- build
- smoke de navigație
- fără 404 noi
- fără pierdere de access path la capabilități reale

### Clasa C — Runtime truth / state truth

Conține:
- session truth
- workspace restore
- org context
- onboarding gating
- operational status semantics

Validare:
- teste
- build
- verificare relogin / re-entry / route fallback

### Clasa D — Product surfaces noi

Conține:
- quick-add
- diagnostic PDF
- cockpit-uri noi
- entry points noi

Validare:
- flow complet
- UX sanity
- proof că nu e doar UI mock

### Clasa E — Design system / visual system

Conține:
- tokens
- components
- shell styling
- spacing / density / color semantics

Validare:
- screenshot review
- consistență
- fără ruperea flow-urilor existente

---

## 6. LEGILE DE MIGRARE

### Legea 1 — Replace shell, not engine

Dacă motorul e matur:
- îl păstrăm
- îi schimbăm doar containerul, traseul și UX-ul

### Legea 2 — Un finding = un cockpit = un loc principal de execuție

Nu permitem flow-uri în care același caz:
- începe într-o pagină
- continuă în alta
- se aprobă în alta
- se închide în alta
fără context clar și link de întoarcere.

### Legea 3 — Nu simplificăm la demo

Dacă o variantă nouă:
- are mai puține date
- ascunde capabilități reale
- pierde detalii utile pentru utilizatorul plătitor

atunci este regresie, nu polish.

### Legea 4 — Orice ștergere cere dovadă

Un fișier/pagină/rută se șterge doar dacă:
- este mort confirmat
- este duplicat confirmat
- sau există redirect + replacement clar

### Legea 5 — Statusul din UI trebuie să spună adevărul operațional

Nu mai acceptăm etichete precum:
- `Activ`
- `OK`
- `Conectat`

dacă în realitate știm doar:
- că există token
- că există config
- sau că există draft

---

## 7. SISTEMUL DE CHECKPOINTURI

Orice val mare se împarte în checkpointuri mici și verificabile.

### 7.1 Tipuri de checkpoint

#### C1 — Structural
- rute
- nav
- layout
- redirects

#### C2 — Functional
- flow nou sau migrat
- quick-add
- diagnostic
- cockpit

#### C3 — Truth/Hardening
- auth
- org/session
- ANAF semantics
- approval state

#### C4 — Polish
- labels
- empty states
- hierarchy
- CTA prominence

### 7.2 Ce conține fiecare checkpoint

Fiecare checkpoint trebuie să aibă:
- scop clar
- fișiere în scope
- ce nu atingem
- validare
- verdict

### 7.3 Interzis

Interzis:
- checkpoint cu 5 intenții diferite
- “am schimbat și asta, și asta, și asta”
- commituri unde nu se mai vede ce e structural vs funcțional vs docs

---

## 8. REGULA DE VALIDARE

### 8.1 Nivel 1 — Docs only
- verificare coerență

### 8.2 Nivel 2 — UI/route/IA
- `npm run build`
- smoke de navigație local

### 8.3 Nivel 3 — Runtime/API/session
- teste relevante
- `npm run build`

### 8.4 Nivel 4 — Critical flow
- build
- teste
- walkthrough manual cap-coadă
- eventual preview deploy, dar nu live

---

## 9. CUM PĂSTRĂM CLARITATE ÎN PROGRES

### 9.1 Un singur board textual

Nu mai urmărim progresul din 10 locuri.

Avem nevoie de un singur board cu stări:
- `CANON`
- `INTEGRATION`
- `READY FOR REVIEW`
- `FROZEN`
- `LIVE`

### 9.2 Formatul corect pentru orice workstream

Pentru fiecare workstream, claritatea vine din 5 câmpuri:

- `ce mutăm`
- `ce păstrăm`
- `ce tăiem`
- `cum validăm`
- `ce dovedește done`

### 9.3 Ce vrem să evităm

Nu mai vrem progres de tip:
- “au fost multe schimbări”
- “pare mai simplu”
- “a ieșit mai curat”

Vrem progres de tip:
- “ruta X a devenit canonică”
- “capabilitatea Y s-a păstrat”
- “flow-ul Z are cu 4 clickuri mai puțin”
- “modulul W nu mai minte despre starea operațională”

---

## 10. CE FACEM CU AGENȚII

### 10.1 Opus / modele agresive

Modelele agresive pe arhitectură sunt utile doar pentru:
- audit
- simplificare conceptuală
- tăiere de duplicări evidente

Nu le lăsăm singure pe:
- refactor de maturitate
- delete de pagini
- înlocuire de module mature

### 10.2 Claude / UX / polish

Claude este bun pentru:
- IA
- polish
- reorganizare de suprafețe
- docs de produs

Dar trebuie ținut în:
- mandate clare
- guardrails
- batches mici

### 10.3 Codex / hardening / integrare

Codex trebuie să țină:
- runtime truth
- auth/session/org correctness
- separarea checkpointurilor
- validarea înainte de push/deploy

### 10.4 Regula de colaborare

Niciun agent nu primește:
- libertate totală pe refactor structural
- libertate totală pe delete
- libertate totală pe rescriere de pagini mature

Toți lucrează în cadrul acestui document.

---

## 11. CE TREBUIE FĂCUT ACUM, CONCRET

### Pas 1 — Înghețăm laboratorul

Lucrul local actual trebuie tratat ca:
- preview/integration branch
- nu live candidate

### Pas 2 — Separăm loturile

Separare minimă obligatorie:
- lot 1: docs canon
- lot 2: IA / route / nav
- lot 3: quick-add + diagnostic
- lot 4: runtime/API alignment
- lot 5: design system / visual layer

### Pas 3 — Verificăm Faza 5 înainte să o declarăm gata

Nu declarăm “done” doar pentru că există fișiere.

Trebuie dovedit:
- quick-add creează client real
- clientul apare în portofoliu
- diagnosticul PDF se generează
- flow-ul are sens pentru Diana

### Pas 4 — Nu împingem live

Până nu vedem noul IA local cap-coadă:
- nu deploy live
- nu main ca branch final de marketing-ready

### Pas 5 — Înghețăm checkpointurile, nu haosul

Doar după:
- validare
- review
- separare curată

ajunge ceva în `main`.

---

## 12. DEFINIȚIA DE DONE PENTRU COMPLIAI ACUM

Un val este “done” doar dacă:

1. este aliniat cu [DESTINATION.md](./DESTINATION.md)
2. nu pierde capabilități mature din [STATE-NOW.md](./STATE-NOW.md)
3. reduce fragmentarea
4. spune adevărul operațional mai bine decât înainte
5. trece validarea potrivită impactului
6. poate fi explicat în 5 propoziții clare

Dacă nu îndeplinește toate 6, nu este done.

---

## 13. REZUMAT FINAL

Strategia corectă pentru CompliAI nu este:
- `simplifică produsul până arată curat`

Strategia corectă este:
- `păstrează ce e matur`
- `reașază IA-ul`
- `consolidează rutele`
- `curăță flow-urile`
- `fă statusurile oneste`
- `împarte execuția în checkpointuri mici`
- `protejează live-ul`

Acest document există ca să nu mai repetăm:
- refactor agresiv fără dovadă
- delete fără inventar
- simplificare la demo
- push prematur în live

De aici înainte, orice agent sau om care atinge produsul execută în cadrul lui.
