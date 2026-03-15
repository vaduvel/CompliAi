# CompliScan - Backlog de sprint extras din feedback nou + imagini concurenta

Data: 2026-03-15

## Scop

Acest fisier filtreaza doar semnalele noi din:

- `feedback.md` (partea noua, adaugata la final)
- `public/Compli Scan Img Real/compliscan-ux-cockpit-audit-and-codex-plan-2026-03-15.md`
- imaginile noi de concurenta din:
  - `public/Compli Scan Img Real/pints de la concurenta sa analizezi `

Nu este sursa de adevar pentru sprintul activ.
Ramane doar backlog filtrat, pregatit pentru planificare.

Sursele de adevar raman:

- `public/sprinturi-maturizare-compliscan.md`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`

## Ce am gasit nou

### 1. Feedback-ul nou nu cere produs nou

Partea noua din `feedback.md` spune explicit:

- nu crea produs nou
- nu inlocui `Scanare / Control / Dovada`
- nu lasa agentii sa scrie direct in starea finala
- `human review` ramane obligatoriu
- `AI Compliance Pack` ramane obiectul principal structurat

Consecinta:

- directia buna nu este rewrite mare
- directia buna este layer orchestration peste arhitectura actuala, cu state strict si review uman

### 2. Auditul nou de UX confirma aceeasi problema centrala

Documentul nou de audit UX spune foarte clar:

- produsul nu mai este haotic
- problema reala nu mai este lipsa de functionalitate
- problema reala este:
  - over-framing
  - prea multe blocuri cu aceeasi greutate
  - prea multa explicatie in runtime
  - mixed intent mutat din arhitectura in compozitia paginii

Consecinta:

- Evidence OS trebuie folosit ca `page governance`, nu doar ca stil
- urmatorul castig mare vine din decluttering, nu din feature breadth

### 3. Imaginile de concurenta arata pattern-uri mature foarte repetitive

Din setul nou de imagini reies constant aceleasi lucruri:

#### A. Home-ul este scanabil in cateva secunde

- KPI-urile sunt compacte
- exista un singur bloc dominant sau un singur grid clar
- continutul de orientare nu se explica mult

#### B. Listele operationale sunt simple si tabelare

- actiunea reala sta in liste, tabele sau work queues
- filtrele sunt utilitare, nu decorative
- explicatiile stau jos sau in drill-down, nu concureaza cu lucrul

#### C. Risk / posture / readiness sunt vizibile instant

- severitatea sau starea problematica domina
- trendurile si heatmap-urile sunt suport, nu vocea principala a paginii

#### D. Evidence si trust sunt separate de cockpitul intern

- trust center-ul public nu concureaza cu control room-ul intern
- exportul si dovada apar ca rezultat al structurii, nu ca suprafata care dubleaza executia

#### E. Tonul este calm si autoritar

- putin text
- densitate mare
- ierarhie dura intre primary / secondary / helper

### 4. Exista si un semnal practic foarte util pentru Agent Evidence OS

Partea noua din `feedback.md` si auditul nou se aliniaza pe:

- layout clar:
  - stanga = sursa/context
  - centru = propuneri
  - dreapta = review uman + commit
- doar 4 agenti:
  - Intake
  - Findings
  - Drift
  - Evidence/Audit
- strict JSON + deterministic validation

Consecinta:

- backlog-ul bun nu trebuie sa lanseze acum `Agent Evidence OS v1`
- dar trebuie sa pregateasca UX-ul de cockpit pentru el

### 5. Partea futurista din `feedback.md` este utila strategic, dar nu intra in sprintul imediat

Partea noua din `feedback.md` nu contine doar directia buna de `Agent Evidence OS v1`.

Contine si un strat mai vizionar:

- `Trust OS`
- `Autonomous Guardian`
- `Digital Twin Simulator`
- `Cross-Border Engine`
- `AI Black Box`
- `Live Trust Seal`
- `self-healing PR generation`

Semnalul bun de aici este:

- produsul are directie mare
- exista axa clara `control -> dovada -> incredere`

Dar semnalul operational este:

- multe dintre aceste idei sint bune pentru roadmap
- nu sint bune pentru sprintul imediat
- daca le tragem acum in executie, riscam sa rupem disciplina curenta de cockpit

Concluzie:

- `~70%` din update este bun strategic
- `~30%` este prea devreme pentru checkpoint-ul curent al produsului

## Ce luam in backlog acum

### 1. Reducerea explicatiei din runtime

Luam explicit in backlog:

- reducerea framing-ului redundant
- limita de `above the fold`
- contrast mai dur intre bloc dominant si blocuri secundare
- mutarea explicatiilor repetitive sub fold sau in helper text

### 2. Dominanta operationala pe paginile mari

Luam explicit in backlog:

- `Dashboard` mai orientat pe blocaje, drift si next action
- `Scanare` ca workspace dominant, nu pagina despre scanare
- `Dovada` mai clara intre executie, ledger si livrabil
- `Setari` mai austera si mai administrativ-operationala

### 3. Densitate mai buna pe liste si carduri operationale

Luam explicit in backlog:

- filtre mai utile si mai putin zgomotoase
- task cards mai usor de triat
- work queues citibile fara lectura lunga

## Ce NU luam acum

Nu mutam in sprint imediat:

- trust center public
- dashboards grele pline de grafice doar pentru ca apar la concurenta
- produs nou paralel
- agenti care scriu direct in state final
- redesign complet de shell
- schimbarea IA canonice deja stabilite
- `Digital Twin Simulator`
- `Cross-Border Engine`
- `AI Black Box`
- `Live Trust Seal`
- `self-healing PR generation`

## Ce parcam explicit pe roadmap, nu pe sprintul imediat

Aceste directii raman interesante, dar merg in backlog strategic:

### 1. `Trust OS`

Bun ca framing de roadmap sau positioning, dar nu ca schimbare de executie imediata.

### 2. `Autonomous / self-healing remediation`

Bun doar dupa ce cockpit-ul actual este suficient de clar si dupa ce human review-ul este deja impecabil in runtime.

### 3. `AI Black Box` / notar digital

Bun pentru faza de defensibilitate foarte avansata, nu pentru sprintul imediat de claritate UX.

### 4. `Live Trust Seal`

Bun pentru suprafata externa de incredere, dar nu ajuta acum la problema interna dominanta:

- runtime prea explicativ
- ierarhie insuficient de dura

### 5. `Cross-border engine`

Bun pentru extindere de produs, dar prea devreme cat timp inca fixam cockpit-ul principal si doctrina de folosire.

## Sprint propus

Titlu propus:

`Sprint - Cockpit declutter si autoritate operationala`

## Obiectiv

Sa ducem CompliScan din:

- produs clar, dar prea explicativ

in:

- cockpit executiv calm, scanabil si actionabil

fara rewrite mare si fara schimbare de business logic.

## Backlog de sprint recomandat

### P0. Incheiere `Scanare` ca workspace dominant

De ce:

- este frontul deja activ
- feedback-ul nou confirma exact problema ei: prea multa meta-informatie, prea putina dominanta operationala

Task-uri:

- tine `Adauga sursa` ca singur workspace dominant
- muta explicatiile concurente in helper text sau sub fold
- pastreaza `Rezultat curent` si `Istoric` ca views secundare

Outcome dorit:

- userul incepe analiza fara ezitare si fara scroll

### P1. `Checklists` density pass

De ce:

- este urmatorul punct logic dupa `Scanare`
- competitorii arata liste operationale mai directe, mai putin doctrinare
- `Remediere` este corecta conceptual, dar inca poate fi compactata

Task-uri:

- compacteaza zona de deasupra board-ului
- clarifica ierarhia filtrelor
- reduce densitatea din `TaskCard`
- lasa un singur cluster de actiune cu prioritate evidenta

Outcome dorit:

- operatorul poate tria, executa si atasa dovada mai repede

### P2. `Audit si export` ca snapshot + livrabil pur

De ce:

- auditul nou si documentatia curenta spun acelasi lucru:
  - executia nu trebuie sa concureze cu reporting-ul

Task-uri:

- separa mai dur `summary / detail / action`
- elimina orice ton rezidual de remediere din pagina
- lasa exportul clar, dar fara sa sufoc e snapshot-ul

Outcome dorit:

- pagina se simte `readiness + livrabil`, nu pagina hibrida

### P3. `Dashboard` executive declutter

De ce:

- feedback-ul nou spune direct ca problema principala este home-ul care cere prea multa citire
- concurenta pune mai mult accent pe blocked state, readiness si next action

Task-uri:

- lasa sus doar:
  - readiness snapshot
  - next action
  - drift / blocked state
- muta sub fold sursele recente, activitatea si framing-ul
- reduce cu 40-60% textul explicativ

Outcome dorit:

- userul stie in sub 5 secunde ce este blocat si unde merge

### P4. `Setari` austerity pass

De ce:

- setul nou de benchmark confirma ca suprafetele administrative bune sunt dense, dar foarte sobre
- `Setari` este deja mai buna, dar poate fi inca prea narativa

Task-uri:

- creste ierarhia intre status operational si explicatie
- reduce textul doctrinar repetitiv
- tine taburile ca separare reala de intentii, nu ca preambul

Outcome dorit:

- `Setari` se simte admin / operational, nu mini-dashboard paralel

## Task separat, dar parcat dupa acest sprint

### `Agent Evidence OS v1`

Merita pastrat in backlog, dar nu ca lucru imediat de sprint UX.

Conditii:

- ramane layer peste sistemul existent
- fara produs nou
- fara scriere directa in state final
- cu review uman obligatoriu
- cu commit strict in modelul existent

## Definition of Done pentru sprintul propus

- fiecare pagina atinsa are o singura intentie dominanta evidenta
- `summary / detail / action` nu mai concureaza
- above-the-fold are cel mult un bloc dominant si un bloc secundar clar
- repeated explanation este taiata sau mutata
- drift, readiness, next action si dovada slaba au prioritate peste framing
- omul intelege urmatorul pas in <= 5 secunde pe paginile mari

## Verdict final

Tot ce ai adaugat nou spune acelasi lucru, din trei unghiuri diferite:

1. feedback-ul nou spune:
   - nu rescrie produsul
   - tine review-ul uman
   - construieste orchestration strict peste ce exista
2. auditul nou spune:
   - taie over-framing-ul
   - intareste ierarhia de cockpit
3. concurenta spune:
   - home simplu
   - work queue clar
   - execution separat de trust / export / reporting

Concluzia sanatoasa pentru backlog este:

- sprint de declutter si autoritate operationala
- nu sprint de feature explosion
- si nu sprint de futurism arhitectural
