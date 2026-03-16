# CompliScan - Backlog extras din feedback

Data actualizarii: 2026-03-15

## Scop

Acest fisier extrage doar ce este util din `feedback.md` si il transforma in backlog ordonat.

Nu este sursa de adevar pentru statusul implementarii. Pentru statusul real folosim:

- `public/sprinturi-maturizare-compliscan.md`
- `public/log-sprinturi-maturizare.md`
- `public/status-arhitectura.md`
- `public/task-breakdown-tehnic.md`

`feedback.md` ramane o sursa de idei, analiza de piata si directie strategica.

Pentru trierea separata a observatiilor venite din rapoartele Gemini folosim si:

- `public/triere-rapoarte-gemini.md`

## Concluzie rapida

Din `feedback.md` rezulta clar 3 lucruri valoroase:

1. CompliScan are sens ca platforma de `continuous governance`, nu ca tool punctual de scanare.
2. Diferentierea reala vine din:
   - `compliscan.yaml` + repo sync
   - drift -> task -> evidence -> audit
   - family-level evidence reuse
   - Audit Pack client-facing
3. Romania 2026 are un gap interesant:
   - `e-Factura ANAF` nu este legata operational cu `AI Act / GDPR evidence`

Totusi:

- `feedback.md` este repetitiv
- unele statusuri sunt depasite
- unele claim-uri sunt prea tari pentru a deveni direct roadmap
- ultima runda de analiza a confirmat ca valoarea lui este strategica, nu operationala

## Stare curenta a proiectului

La momentul acestei extrageri:

- Sprint 1 este inchis
- Sprint 2 este inchis
- Sprint 3 este aproape inchis, cu progres mare pe explicabilitate si validare
- Sprint 4 este activ si este prioritatea imediata

Consecinta:

- `Relevant acum` inseamna in primul rand finalizarea Sprintului 4
- apoi Sprint 5
- apoi Sprint 6
- doar dupa aceea re-deschidem ideile mari din `feedback.md`

## Ultima runda de feedback incorporata

In ultima lectura a `feedback.md`, filtrarea utila a fost aceasta:

### Ce luam explicit din el

- CompliScan trebuie sa ramana produs de `continuous governance`, nu tool de scanare one-shot
- diferentierea reala ramane:
  - `compliscan.yaml`
  - repo sync
  - drift -> task -> evidence -> audit
  - reuse de evidence la nivel de familie
  - Audit Pack / Auditor Vault
- `e-Factura` ramane un wedge local bun, dar nu centrul produsului
- `Policy Engine` si `Event-Driven Core` raman tinta de arhitectura, nu sprint activ
- framing-ul pe layere este util:
  - Source & Discovery
  - Analysis & Prediction
  - Control & Runtime
  - Action & Self-Healing
  - Evidence & Trust
- `Golden Path` ramane formularea corecta:
  - sursa -> verdict -> remediere -> dovada -> audit
- metoda de testare pe fixture-uri canonice si scenarii cap-coada este utila operational acum

### Ce ne-a scapat si bagam acum in backlog real

- calitatea dovezilor, nu doar existenta lor
- linkage mai strict intre evidence, control, drift si articol
- actori reali in audit trail si workflow
- fundatie mai serioasa pe auth, membership, storage si persistence
- QA pe flow-ul real al produsului, nu doar pe pagini sau componente

### Ce am livrat deja (accelerat)

- `Agentic loop light` (v1): implementat ca Agent Evidence OS (Intake, Findings, Drift, Evidence) în `Scanări`.

### Ce nu luam ca adevar operational

- cifre optimiste de maturitate
- claim-uri mari de tip „suntem la nivel OneTrust”
- promisiuni procentuale fara dovada
- idei care suna bine, dar sar peste fundatia de produs

## Relevant acum

Ordinea de mai jos este cea sanatoasa pentru proiect.

### 1. Sprint 4 - Auth, roles, org model

De ce este relevant acum:

- produsul incepe sa aiba actiuni sensibile reale
- avem deja control minim de roluri in API, dar nu avem inca membership si org model matur
- fara asta nu putem spune serios ca platforma este multi-user si defensibila

Ce luam din feedback:

- nevoia de `continuous governance`
- ideea ca drift, evidence si export trebuie legate de actori reali

Ce facem concret:

- actor identity real in event log
- membership user-org real
- baza pentru administrare roluri

### 2. Sprint 5 - Persistence si storage maturity

De ce este relevant acum:

- multe idei din feedback cer event-driven, exports, signed URLs, evidence bundles, realtime
- toate astea au nevoie de fundatie reala pe date

Ce luam din feedback:

- `Supabase` ca single source of truth
- `signed URLs` pentru evidence
- o poveste mai serioasa de storage

Ce facem concret:

- clarificam store principal
- mutam dovezile spre storage controlat
- pregatim schema si migratiile

### 3. Sprint 6 - Audit defensibility

De ce este relevant acum:

- feedback-ul insista corect pe evidenta, dovada, executive pack si audit-readiness
- aici avem deja mult, dar nu inca suficient de strict pentru productie serioasa
- ultima runda de analiza a confirmat ca aici este unul dintre gap-urile cele mai reale: `evidence quality`, nu doar `evidence presence`

Ce luam din feedback:

- evidence quality checks
- family bundles si mai defensive
- legare mai stricta intre control, drift, evidence si articol

Ce facem concret:

- validare mai buna a dovezilor
- gap-uri explicite in Audit Pack
- reguli mai stricte pentru reuse
- linkage mai strict intre control, drift, evidence si articol

### 4. Design pregatit pentru Sprint 8, fara implementare prematura

De ce este relevant acum:

- `Policy Engine`
- `Event-Driven Core`
- `Continuous Governance`

sunt directii bune, dar nu trebuie implementate inainte de Sprint 4-6.

Ce luam din feedback:

- definim tinta de arhitectura
- nu incepem inca rewrite operational

Ce facem concret:

- pastram aceste idei ca target architecture
- le tratam ca blueprint pentru dupa fundatia de auth + persistence + audit
- nu deschidem rewrite de motor sau event bus pana nu inchidem Sprint 4-6

### 5. Golden Path si layer framing ca regula de produs

De ce este relevant acum:

- noul feedback confirma exact modelul nostru bun de operare
- ajuta sa nu mai amestecam feature-uri sau pagini fara fir comun

Ce luam din feedback:

- layer framing
- `Golden Path`
- accentul pe `Evidence & Trust Layer`

Ce facem concret:

- pastram aceste concepte in documentatia de arhitectura si in QA
- nu le transformam in module noi

### 6. QA disciplinat pe fixture-uri canonice si scenarii cap-coada

De ce este relevant acum:

- noul feedback a adus cea mai utila contributie practica exact aici
- aplicatia trebuie testata prin fluxul real:
  - sursa
  - verdict
  - remediere
  - dovada
  - rescan
  - audit

Ce luam din feedback:

- set de fixture-uri canonice
- testare pe cei 3 piloni:
  - Scanare
  - Control
  - Dovada
- scenarii complete, nu doar feature tests

Ce facem concret:

- transformam aceasta logica intr-un runbook de QA manual
- o folosim dupa sprinturile de maturizare si la fiecare checkpoint mare

### 5. Wedge strategic de piata: e-Factura ANAF

De ce este relevant acum:

- este un unghi bun pentru Romania
- poate deveni o sursa si o dovada utila
- diferentiaza produsul fara sa ne schimbe complet identitatea

Ce luam din feedback:

- `e-Factura` ca sursa + evidence layer

Ce facem concret:

- nu pivotam produsul pe fiscal
- parcam ca initiativa dupa Sprint 6 sau in Sprint 8 extins
- il tratam ca sursa noua de evidence si diferentiere locala, nu ca modul care domina roadmap-ul

## Mai tarziu

Aceste idei sunt bune, dar nu trebuie trase acum in sprintul activ.

### 1. Policy Engine separat

Util:

- muta regulile din cod in runtime
- ajuta la scalare si update legislativ

Dar:

- vine dupa auth/persistence/audit hardening

### 2. Event bus / realtime notifications

Util:

- pentru `scan.completed`
- `drift.detected`
- `evidence.uploaded`
- `task.resolved`

Dar:

- fara fundatie de date mai buna devine doar complexitate

### 3. Agentic loop light
*Status: Livrat v1 (Manual trigger)*

- Implementat în `AgentWorkspace`.
- Rămâne de conectat la `event bus` pentru declanșare automată (v2).
- Arhitectura respectă regula "rule-based și controlat" (Human Review Gate).

### 4. e-Factura parser + bundle ANAF

Util:

- wedge de piata
- sursa noua de evidence

Dar:

- il tratam dupa ce platforma de baza este mai matura

### 5. Multi-reg mapping extins

Util:

- AI Act + GDPR + eventual NIST / ISO

Dar:

- nu trebuie sa rupa claritatea produsului pentru SMB

### 6. AI resilience / continuous governance ca framing de produs

Util:

- este o directie strategica buna
- explica de ce drift, evidence si audit trebuie sa fie continue

Dar:

- il tratam ca framing intern si ulterior de pozitionare
- nu il transformam acum in ramura noua de implementare

### 7. AI Bill of Materials light

Util:

- poate intari discovery-ul si explainability-ul surselor AI
- ajuta ulterior la audit si la supply insight

Dar:

- vine dupa AI Compliance Pack mai matur si dupa sprinturile de fundatie

### 8. Supply Chain / vendor insight light

Util:

- poate aduce vizibilitate pe furnizori AI / SaaS conectati

Dar:

- nu il tratam acum ca modul separat
- vine doar dupa ce storage, auth si audit sunt mult mai solide

### 9. Self-healing limitat la `compliscan.yaml`

Util:

- este o extensie buna a modelului drift -> task -> remediere

Dar:

- doar dupa ce drift-ul, ownership-ul si audit trail-ul sunt complet mature
- nu extindem asta inca la cod arbitrar sau runtime

### 10. Live Trust Seal extern

Util:

- bun mai tarziu pentru outward trust si comercial

Dar:

- il deschidem doar dupa ce trust-ul intern si pachetul de audit sunt foarte curate

## Ignoram intentionat acum

Aceste idei nu sunt prioritare sau risca sa ne scoata din curs.

### 1. Predictive drift cu ML

De ce ignoram acum:

- arata spectaculos
- nu acopera inca un gap mai mare decat auth / persistence / audit defensibility

### 2. Compliance twin / digital twin

De ce ignoram acum:

- prea devreme
- risc mare de overbuilding

### 3. Queueing / Redis high-volume

De ce ignoram acum:

- nu avem inca problema reala de throughput care sa justifice asta

### 4. Full agent autonomy fara review uman

De ce ignoram acum:

- produsul nostru trebuie sa ramana defensibil
- feedback-ul insusi spune corect ca `human oversight` conteaza

### 5. Claims de tip \"suntem la nivel OneTrust\"

De ce ignoram acum:

- utile ca ambitie interna
- nu utile ca status onest

### 6. Productii mari de marketing din idei inainte de maturizarea fundatiei

De ce ignoram acum:

- ambalajul nu rezolva lipsa de auth, storage sau audit defensibility
- orice promisiune externa trebuie sa vina dupa sprinturile de maturizare

### 7. Active Guardrails / middleware runtime

De ce ignoram acum:

- ne muta din `compliance ops / evidence OS` in produs de gateway / infra runtime
- ar rupe focusul inainte sa inchidem fundatia de baza

### 8. AI Black Box / notar digital

De ce ignoram acum:

- este infrastructura grea cu ROI mai slab acum decat audit defensibility clasica

### 9. ESG energy monitor

De ce ignoram acum:

- este prea departe de core-ul operational actual al produsului

## Revalidam inainte sa promitem

Acestea pot fi utile in positioning, dar nu trebuie tratate ca adevar garantat fara surse si review.

### 1. Cifrele de piata si marimea TAM

- bune pentru directie
- trebuie revalidate daca intra in pitch extern

### 2. Afirmațiile absolute de tip „nimeni nu face asta”

- pot fi directionally true
- trebuie reformulate mai prudent extern

### 3. Estimarile de maturitate foarte optimiste

- folosim doar scorurile noastre din `raport-maturitate-compliscan.md`

### 4. Reduceri procentuale de munca pentru avocat / DPO

- nu folosim extern fara dovezi reale

### 5. Promisiuni de autonomie completa sau "sistemul munceste singur"

- reformulam prudent:
  - AI propune
  - omul valideaza
  - produsul pastreaza dovada

## Ordinea recomandata de executie

Ordinea corecta derivata din feedback, dar adaptata la starea reala a proiectului, este:

1. Inchidem Sprint 4 - Auth, roles, org model
2. Trecem la Sprint 5 - Persistence si storage maturity
3. Trecem la Sprint 6 - Audit defensibility
4. Re-evaluam maturitatea dupa Sprint 6
5. Abia apoi deschidem:
   - Policy Engine
   - Event-driven core
   - Notifications
   - e-Factura layer
   - Agentic loop light

Ordinea imediata in interiorul acestei faze este:

1. terminam Sprint 4
2. intram in Sprint 5
3. intram in Sprint 6
4. transformam testarea pe fixture-uri si scenarii cap-coada intr-un runbook de QA
5. refacem `raport-maturitate-compliscan.md`
6. sincronizam roadmap-ul public cu noul prag de maturitate
7. abia dupa aceea evaluam:
   - AI BOM light
   - supply insight light
   - self-healing limitat la `compliscan.yaml`
   - trust seal extern

## Decizie de produs

Ce pastram din feedback ca directie:

- CompliScan evolueaza spre `continuous governance`
- diferentierea vine din `evidence-first + remediation + audit pack + drift`
- `e-Factura` poate deveni wedge local puternic

Ce nu facem:

- nu sarim peste fundatia de platforma
- nu deschidem inca o ramura mare doar pentru ca suna bine strategic

## Rezumat executiv

`feedback.md` este valoros ca directie, dar trebuie filtrat.

Backlog-ul corect extras din el este:

- `Acum`:
  - Sprint 4
  - Sprint 5
  - Sprint 6
- `Mai tarziu`:
  - Policy Engine
  - Event bus
  - e-Factura layer
  - agentic loop light
- `Ignoram intentionat acum`:
  - predictive ML
  - compliance twin
  - full autonomy
  - claim-uri prea mari

## Addendum 2026-03-15 - lectura riguroasa a feedback-ului nou

Aceasta sectiune incorporeaza explicit lectura riguroasa a blocului nou din `feedback.md`, incepand cu:

- `#feedback nou directie si sprint de release`

Scopul nu este sa desconsideram ideile noi, ci sa le punem intr-o forma care poate fi folosita de produs si roadmap fara sa creeze deriva.

### Ce contine noul bloc de feedback

Blocul nou aduce 6 fire mari:

1. o lectura buna a maturitatii actuale CompliScan
2. un plan GTM agresiv pe 8 saptamani
3. o lista de capabilitati „globale” considerate necesare
4. o estimare dura de sansa comerciala
5. o ramura mare de fine-tuning / LoRA / QLoRA / poisoning / GPAI compute
6. o directie monetizabila bazata pe `CI/CD gate`, apoi `vendor risk`, `questionnaires`, `ServiceNow`

### Concluzie de lucru

Noul feedback are valoare, dar este foarte eterogen:

- o parte este bine aliniata cu starea reala a produsului
- o parte este directie buna pentru mai tarziu
- o parte este ipoteza comerciala care trebuie revalidata
- o parte este prea devreme si ar risca sa rupa focusul produsului

### 1. Ce este valid si aliniat cu realitatea proiectului

Aceste idei sunt utile si compatibile cu sursele noastre canonice:

- CompliScan are deja o fundatie reala si nu trebuie tratat ca demo fragil
- directia sanatoasa ramane:
  - model unic de domeniu
  - UX declutter
  - stare + next action > framing excesiv
  - fara rewrite major
- valoarea reala a produsului ramane in lantul:
  - `scanare -> control -> remediere -> dovada -> audit / export`
- diferentierea sanatoasa ramane:
  - `compliscan.yaml`
  - repo sync
  - drift lifecycle
  - evidence quality
  - audit pack defensibil
- insight-ul corect de business este ca produsul valoreaza mai mult ca `operational compliance cockpit` decat ca simplu scanner

Aceste idei trebuie pastrate ca semnal de directie:

- produsul trebuie sa devina mai clar operational, nu mai „impresionant” declarativ
- partea comerciala buna va veni din:
  - executie controlata
  - dovezi
  - auditabilitate
  - integrare in workflow

### 2. Ce este util, dar pentru mai tarziu

Aceste idei nu trebuie pierdute, dar nici trase acum in sprinturile de baza:

- `Trust Center`
- `multi-framework mapping`
- `API-first posture`
- `CI/CD gate` limitat ca wedge ulterior
- `Slack / Jira / Teams` integrations
- colaborare mai serioasa pe task-uri si approvals
- `white-label export pack`
- outward trust surface pentru prospecti sau clienti

Cum le tratam:

- le pastram ca backlog strategic
- nu le lasam sa devina blocante pentru maturizarea cockpit-ului actual
- le evaluam doar dupa ce runtime-ul principal este mult mai clar si coerent

### 3. Ce este ipoteza comerciala de revalidat, nu adevar operational

Noul feedback contine si multe afirmatii care pot fi utile ca energie sau directie, dar nu trebuie tratate ca realitate validata:

- `€100k ARR pana in August 2026`
- `15 customers in 8 weeks`
- `28% sansa acum / 65-75% cu executie perfecta`
- `Vanta = 0% AI Act`
- `CompliScan > Vanta` ca adevar absolut
- `Trust Center live in 48h sau muriti`
- formule pseudo-exacte de succes comercial

Cum le tratam:

- nu le aruncam complet
- le mutam in cosul `ipoteze comerciale`
- orice folosim extern trebuie revalidat pe:
  - clienti reali
  - conversii
  - piloți
  - demo-uri
  - win/loss notes

### 4. Ce este prea devreme sau periculos ca directie imediata

Aceste fire ar deschide prea multa complexitate prea devreme:

- `EU Database integration` tratata ca must-have imediat
- `CE marking auto-generation`
- `fine-tune Llama 3.1`
- `LoRA / QLoRA` ca sprint urgent
- detectie de `poisoning`
- pipeline GPAI FLOPs ca ramura majora
- `vendor risk` ca produs separat acum
- `questionnaire auto-fill` ca nou front enterprise
- `LangChain + ServiceNow`
- arhitectura `microservices` ca directie curenta

Problema aici nu este ca ideile sunt „rele”.

Problema este ordinea:

- ele presupun ca produsul de baza este deja foarte stabil comercial si operational
- ele ar consuma focusul exact cand produsul are nevoie de:
  - claritate UX
  - consistenta intre scanare, task-uri, drift si report
  - guvernanta baseline / drift
  - reducere false positives
  - export si audit pack mult mai coerente

### 5. Ce luam explicit din fiecare fir nou

#### 5.1. Din lectura de maturitate

Pastram:

- confirmarea ca produsul are fundatie reala
- focus pe `unified model`
- focus pe `UX declutter`
- focus pe `audit defensibility`
- evitarea rewrite-urilor mari

#### 5.2. Din planul GTM pe 8 saptamani

Pastram:

- nevoia de pozitionare clara
- nevoia de demo mai convingator
- nevoia de primii piloti plătitori
- nevoia de o suprafata de trust / proof mai tarziu

Nu luam ca adevar:

- cifrele ARR
- termenele foarte scurte
- framing-ul de tip `market killer`

#### 5.3. Din lista „ce iti trebuie global”

Pastram:

- `multi-framework mapping`
- `API-first`
- un `Trust Center` ulterior
- colaborare / integrations ca nivel 2

Parcam:

- `EU database integration`
- `CE marking`
- pricing global complet
- trust badges externe

#### 5.4. Din „analistul cu sange rece”

Pastram:

- mesajul central:
  - produsul tehnic e promitator
  - business readiness si pilots sunt slabe
- nevoia de validare externa reala
- nevoia de primii clienti si de social proof

Nu luam ca adevar:

- procentele exacte
- formulele de succes
- predictiile dure fara date reale de pipeline

#### 5.5. Din ramura `fine-tune / LoRA / QLoRA / poisoning`

Pastram foarte limitat:

- ideea de evaluare disciplinata a detectorului
- ideea de benchmark-uri curate pe fixture-uri si seturi reale
- ideea de a pastra output structurat si auditabil

Nu tractam acum:

- training model propriu
- QLoRA pipeline
- poisoning defense stack
- GPAI compute documentation ca proiect separat
- vLLM serving ca nou front de produs

#### 5.6. Din directia `CI/CD gate -> vendor risk -> questionnaires`

Pastram:

- insight-ul strategic ca `enforcement` poate monetiza mai bine decat scanning pasiv
- ideea ca integrarea in workflow-ul clientului poate creste stickiness

Parcam:

- `GitHub Action` ca wedge ulterior
- `vendor risk` light
- `questionnaire auto-fill`
- `ServiceNow`

Motiv:

- produsul actual trebuie sa devina mai intai foarte coerent pe flow-ul existent

### 6. Maparea operationala a feedback-ului nou

Transformam tot ce e util din noul bloc in 4 cosuri clare.

#### Acum

Acestea sunt direct relevante pentru sprinturile active si urmatoarele valuri scurte:

- UX declutter sever pe:
  - `Dashboard`
  - `Scanare`
  - `Control`
  - `Checklists`
  - `Audit si export`
- consistenta intre:
  - findings
  - remediation plan
  - report
  - audit pack
- reducere false positives si clasificare mai buna pe:
  - `Text manual`
  - `compliscan.yaml`
- baseline / drift governance mai stricta
- evidence quality mai defensibila
- pachet exportabil mai clar pentru client si audit
- QA real pe flow-uri canonice si fixture-uri
- primii piloti reali sau testari asistate cu utilizatori

#### Curand, dupa stabilizare

- `Trust Center` foarte limitat
- `multi-framework mapping`
- `API-first posture`
- un `CI/CD gate` minimal, numai daca flow-ul curent devine foarte coerent

#### Mai tarziu

- colaborare avansata
- Jira / Slack / Teams
- vendor risk
- questionnaire auto-fill
- white-label packs

#### Nu acum

- fine-tuning Llama
- LoRA / QLoRA ca directie de sprint
- poisoning / spectral guards
- GPAI FLOPs project
- ServiceNow
- microservices rewrite
- claims absolute despre competitie

### 7. Directia recomandata dupa aceasta lectura

Directia corecta nu este „mai multa tehnologie noua”.

Directia corecta este:

1. sa facem cockpit-ul actual clar, sever si defensibil
2. sa inchidem inconsistentele dintre `scan -> control -> remediere -> audit`
3. sa demonstram valoare reala pe piloti si flow-uri complete
4. abia apoi sa deschidem:
   - trust surface
   - API posture
   - workflow enforcement

### 8. Decizie pentru backlog

Noul feedback nu trebuie ignorat.

El trebuie insa citit in felul urmator:

- `păstrăm` miezul bun de directie
- `parcăm` optiunile bune, dar premature
- `revalidăm` ipotezele comerciale
- `blocăm` pentru moment firele care ar rupe focusul produsului

### 9. Rezumat executiv al addendum-ului

Noul bloc din `feedback.md` confirma ceva important:

- CompliScan are produs real si directie buna
- valoarea lui sta in cockpit operational + evidence + audit
- urmatorul salt mare nu vine din model training sau enterprise sprawl
- urmatorul salt mare vine din:
  - claritate
  - coerenta
  - pilot validation
  - trust castigat prin flow-uri reale
