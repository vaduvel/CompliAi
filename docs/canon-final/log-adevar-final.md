# log-adevar-final

Data: `2026-03-25`
Status: `EXECUTION LOG`
Rol: `log de executie pentru implementarea care urmeaza`
Document autoritate:
- [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md)

## 1. Rolul acestui document

Acest document NU descrie ce am implementat deja.
Descrie exact implementarea care urmeaza sa fie facuta.

Este logul de continuitate pentru cazurile in care:
- se pierde contextul in chat
- cade sesiunea
- modelul se opreste inainte sa updateze logurile
- Claude 2 sau alt agent trebuie sa continue de unde s-a oprit executia

Regula de aur:
- canonul spune adevarul de produs
- acest log spune ordinea exacta de executie
- daca apare conflict, canonul castiga

## 1.1 Finding-uri parcate din audit runtime

### 2026-03-26 — Cockpit gap pe finding-uri operationale intake-driven

Status: `PARKED FOR FOLLOW-UP`

Simptom observat in runtime:
- unele finding-uri operationale venite din intake, exemplu `REGES / evidenta contracte angajati`, intra in cockpit fara traseu clar de inchidere
- userul vede mult context si stepper, dar nu vede imediat:
  - unde genereaza daca finding-ul cere document
  - unde adauga dovada daca finding-ul cere dovada operationala
  - unde rescaneaza / reverifica
  - care este butonul unic de inchidere care trimite cazul la dosar si il muta in monitoring

Diagnostic curent:
- finding-ul cade pe mapping generic (`GDPR-GENERIC`) si mosteneste un flow prea vag pentru tipul lui real
- rezultatul este un cockpit care explica, dar nu conduce destul de agresiv la actiunea unica

Decizie:
- nu se taie acum din Sprint 3 / deploy
- se trateaza explicit ca follow-up de UX + typing in sprinturile urmatoare
- regula de rezolvare ramane:
  - fiecare finding trebuie sa intre fie pe `generator flow`, fie pe `dovada operationala`, fie pe `revalidare`
  - niciun finding nu trebuie sa ramana intr-un `completeaza acum / marcheaza rezolvat` vag

## 2. Decizia executiva

Nu mai facem patch-uri separate pe pagini rupte.
Nu mai tratam `Dashboard`, `Resolve`, `Generator`, `Scan`, `Dosar` si `Monitoring` ca produse diferite.

Implementarea care urmeaza are un singur scop:

`sa mutam CompliScan din produs fragmentat in produs orchestrat in jurul finding-ului`

Formula executiei:

`finding -> smart resolve cockpit -> dovada -> dosar -> monitoring`

### 2.1 Gard de executie: wow-ul care nu are voie sa fie pierdut

Refactorul NU are voie sa taie exact stratul care face produsul sa para inteligent, util si viu.

Pilonii care trebuie protejati pe tot parcursul executiei sunt:
1. `Smart onboarding`
   - scanare
   - prefill
   - sugestii
   - demonstrarea inteligentei in primele minute
2. `Dovada`
   - orice rezolvare trebuie sa lase ceva real in dosar
3. `Scut`
   - produsul vegheaza si cand userul nu este in aplicatie
4. `Incredere`
   - userul trebuie sa poata arata ce a facut, ce are si cand a verificat
5. `Detectiv`
   - produsul trebuie sa gaseasca, sa coreleze si sa explice semnalele
6. `Te tinem la curent`
   - schimbari in workspace
   - drift
   - reminder-e
   - reverificari si reactivari

Regula de executie:
- `Resolve` devine centrul de executie
- dar onboarding-ul inteligent, dovada, scutul, increderea, rolul de detectiv si monitoring-ul raman puterea generala a produsului
- orice val care simplifica flow-ul, dar slabeste acesti piloni, este considerat regres

## 3. Ce nu trebuie facut

Nu facem:
- redesign cosmetic fara mutare de flow
- inca o pagina noua doar ca sa incapa un sub-pas
- refactor mare de rute fara valoare imediata
- generator separat de finding cand finding-ul este sursa reala a muncii
- dashboard incarcat cu inca un strat de widget-uri
- implementari izolate care nu intra in lantul `finding -> dosar -> monitoring`
- simplificari care distrug `smart onboarding`, `proof`, `shield`, `trust`, `detective` sau `keep-you-current`

## 4. Nodurile reale din runtime pe care se bazeaza executia

Acestea sunt punctele reale din cod de unde trebuie pornit refactorul:

### Shell, navigatie, runtime
- [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- [navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts)
- [nav-config.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.ts)
- [dashboard-routes.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/dashboard-routes.ts)
- [dashboard-runtime.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-runtime.tsx)

### Dashboard si snapshot
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx)
- [use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/core/route.ts)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/route.ts)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/urgency/route.ts)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/accumulation/route.ts)

### Resolve si finding execution
- [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts)

### Generator si dovada
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
- [document-generator.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/document-generator.ts)

### Scanare si intake
- [scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx)
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/scan/page.tsx)
- [route-sections.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/route-sections.tsx)

## 5. Diagnosticul actual care justifica refactorul

### 5.1 Ce este deja bun si trebuie refolosit

- `useCockpitData` si payload-ul de dashboard exista deja ca centru de stare
- `app/api/findings/[id]` are deja guardrail-uri reale pentru confirmare si resolve
- `generator` are deja flow pentru `findingId` si `documentType`
- `dashboard` are deja fundatii bune pentru `next best action` si `accumulation`
- `scan` are deja separarea dintre `flow`, `rezultat curent`, `istoric`

### 5.2 Ce este inca fragmentat

- `Resolve` este inca impartit intre list page, detail page, remediation board si generator page
- `Generator` este deja legat de findings, dar inca traieste ca destinatie separata
- `Dashboard` inca amesteca snapshot, benchmark, readiness, cards si multiple directii
- `Scan` trimite spre rezolvare, dar nu inchide clar ideea ca este doar intake
- `Dosarul` este puternic ca idee, dar nu este inca suprafata care inchide clar fiecare finding

### 5.3 Concluzia de chirurgie

Nu trebuie demolat runtime-ul.
Trebuie mutate legaturile si ierarhia.

Executia corecta este:
- pastram fundatiile utile
- mutam centrul de greutate in `Resolve`
- transformam `Generator` in componenta contextuala a cockpit-ului
- facem `Dashboard` o suprafata de snapshot si orientare
- facem `Scan` clar o suprafata de intake

## 6. Implementarea care urmeaza

Toate capitolele de mai jos sunt `NOT STARTED` pana cand intra codul si se valideaza.

### Wave A - Spine pentru Smart Resolve Cockpit

Status: `IN PROGRESS`

Obiectiv:
- sa construim centrul unic de executie pentru findings

Ce trebuie facut:
1. extragem o structura comuna de cockpit din:
   - [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
   - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
   - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
2. definim o singura ordine de blocuri:
   - identitate finding
   - stepper orientativ adaptiv
   - problema si impact
   - `Acum faci asta`
   - workspace activ
   - outcome si dovada
   - rail de dosar si monitoring
3. eliminam sau retrogradam elementele moarte:
   - pasi decorativi
   - CTA-uri care spun doar `mergi in generator`
   - blocuri duplicate intre detail page si generator
4. mentinem route-urile actuale functionale, dar cu centru de executie comun
5. ne asiguram ca noul cockpit nu rupe lantul mai mare de valoare:
   - smart onboarding
   - descoperire si sugestie
   - rezolvare
   - dovada la dosar
   - monitoring si reactivare

Fisiere tinta probabile:
- [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
- [use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)
- componente noi sub `components/compliscan/` pentru cockpit shared

Definition of done:
- finding-ul poate fi luat din lista si dus intr-un cockpit real
- generatorul nu mai pare detur cand vine din finding
- userul vede clar `problema -> actiune -> dovada -> rezolvat -> monitorizat`
- stepper-ul il orienteaza, dar executia ramane in acelasi loc
- cockpit-ul nu slabeste perceptia ca produsul este `detectiv + scut + dovada + sistem care te tine la curent`

Update executie `2026-03-25`:
- a fost introdus un strat shared de semantica pentru findings in:
  - [finding-cockpit.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/finding-cockpit.ts)
- a fost introdusa o suprafata shared pentru cockpit in:
  - [finding-cockpit-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/finding-cockpit-shared.tsx)
- `finding detail` nu mai foloseste stepper-ul decorativ ca centru al paginii si a fost mutat pe un cockpit compact shared:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
- `generator` in finding-flow foloseste acelasi cockpit shared, nu banner separat cu logica paralela:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
- `Resolve list` foloseste acum aceeasi semantica shared pentru actiune si narrative fallback:
  - [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
- a fost introdus `adaptive stepper` in cockpitul shared, cu stari orientative:
  - `Detectat`
  - `Generezi draftul` sau `Pregatesti dovada`
  - `Confirmi si atasezi`
  - `Re-scan / verificare`
  - `Monitorizat`
- a fost introdus rail-ul de `dossier + monitoring` in cockpitul shared:
  - ce intra in dosar
  - status draft / aprobare
  - cine a aprobat
  - cand a fost salvat
  - review due / monitoring signals / trigger de redeschidere
- a fost introdus `success moment` explicit pentru inchiderea documentara:
  - [finding-cockpit-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/finding-cockpit-shared.tsx) expune acum un card dedicat `Dovada salvata la dosar`
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx) afiseaza momentul de succes cu artifact, data, CTA spre `Vault` si `Audit log`
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx) nu mai inchide doar cu toast; redirecteaza in finding cu semnal explicit de `dossier success`
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts) foloseste acum limbaj de dosar in feedback-ul final
- `under_monitoring` a intrat in modelul real:
  - [types.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/types.ts) accepta acum statusul `under_monitoring`
  - [finding-cockpit.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/finding-cockpit.ts) trateaza `under_monitoring` ca stare inchisa si finala in progress map
  - [task-resolution.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/task-resolution.ts) considera `resolved` si `under_monitoring` ca resolved-like pentru scoruri, alerte si exporturi
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts) transforma `resolved` in status stocat `under_monitoring`
  - filtrele active din `Resolve`, shell si portfolio exclud acum findings-urile monitorizate
- dashboard-ul are acum o suprafata compacta de `activity + monitoring`:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx) afiseaza blocul `Compli lucreaza pentru tine`
  - feed-ul combina evenimente salvate, documente aprobate in dosar, drift activ si reverificari apropiate
  - wording-ul este orientat pe `Am detectat`, `Ti-am salvat`, `Urmeaza reverificare`
  - suprafata face monitoring-ul vizibil in home, nu doar in notificari sau audit log
- intrarea din `Resolve` este acum reancorata in cockpit, nu doar in board:
  - [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx) afiseaza `Cazul activ acum` ca ancora principala a paginii
  - cazul prioritar foloseste acelasi `FindingNarrativeCard + FindingExecutionCard` ca detail si generator
  - finding-urile expandate din lista nu mai afiseaza doar `ce faci acum`, ci folosesc aceeasi suprafata shared de execution card
  - `RemediationBoard` este retrogradat semantic la rol de `task-uri de suport`, nu intrare principala in caz
- `RemediationBoard` este acum si legat explicit de cazurile sursa:
  - [remediation-board.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/remediation-board.tsx) afiseaza pentru fiecare task un `Caz asociat`
  - anchor-ul duce direct in cockpitul finding-ului
  - task-urile nu mai par unitati izolate; sunt prezentate ca sub-lucru in aceeasi urma de dovada, aprobare si monitorizare
- aceste doua straturi sunt deja propagate in:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)

Update executie `2026-03-25` (cont. — sesiune Claude):
- **Hero CTA surgery complet**:
  - extras `FindingHeroAction` ca bloc dominant separat in [finding-cockpit-shared.tsx](components/compliscan/finding-cockpit-shared.tsx)
  - `FindingExecutionCard` stripped la rol secundar: stepper + dossier/monitoring rail, fara `Acum faci asta` si fara CTA principal
  - finding detail page ([page.tsx](app/dashboard/resolve/[findingId]/page.tsx)) foloseste acum hero action block above the fold:
    - status `open`: Confirma / Respinge
    - status `confirmed`: Genereaza acum / Am deja dovada / Marcheaza rezolvat
  - toate call-site-urile din [resolve-page.tsx](components/compliscan/resolve-page.tsx) si [generator/page.tsx](app/dashboard/generator/page.tsx) actualizate (props vechi eliminate)
- **Generator as drawer — complet integrat**:
  - creat [generator-drawer.tsx](components/compliscan/generator-drawer.tsx) — Sheet-based form contextual
  - integrat in finding detail page: butonul `Genereaza acum` deschide drawer-ul in-context, nu mai navigheaza la `/dashboard/generator`
  - flow: orgName + context → POST `/api/documents/generate` → preview + checklist confirmare → PATCH `/api/findings/[id]` → onComplete re-fetch finding
  - userul ramane pe aceeasi pagina tot timpul; nu exista ruptura de context
  - TypeScript 0 erori; buildul trece, dar warning-urile ESLint vechi din repo raman

Update executie `2026-03-25` (cont. — sesiune Claude, final Wave A):
- **Onboarding Step 2 — "Compli verifică" visual sequence**:
  - adaugat step `checking` in wizard sequence (intre `cui` si `sector`)
  - [applicability-wizard.tsx](components/compliscan/applicability-wizard.tsx) are acum un ecran dedicat cu 5 mesaje animate progresiv:
    - "Verificăm datele firmei", "Analizăm website-ul", "Căutăm semnale relevante", "Identificăm ce ți se aplică", "Pregătim snapshot-ul"
  - prefill API ruleaza in paralel cu animatia; ecranul avanseaza automat cand ambele sunt gata
  - butonul Inapoi sare peste checking (nu e un step real de navigare)
  - progress bar nu numara checking ca step separat
  - [onboarding-form.tsx](components/compliscan/onboarding-form.tsx) actualizat pentru overview mapping
- **RemediationBoard cleanup structural**:
  - [remediation-board.tsx](components/compliscan/remediation-board.tsx) retitrat la "Task-uri de suport"
  - header compact: subtitlu explicit "Sub-pași din findings. Rezolvarea merge prin cockpitul fiecărui caz."
  - filtre colapsate implicit in detalii compacte, nu mai concureaza vizual cu finding-urile
  - board-ul semnaleaza clar rolul secundar: task-urile sunt sub findings, nu langa ele

Wave A — **COMPLETE**. Toate obiectivele indeplinite:
- cockpit shared semantic + componente (finding-cockpit.ts + finding-cockpit-shared.tsx)
- hero CTA surgery (FindingHeroAction above the fold)
- generator as drawer (in-context, no page navigation)
- onboarding "Compli verifica" visual sequence
- RemediationBoard structural cleanup
- success moment explicit + dossier rail + monitoring rail
- under_monitoring in model real
- activity feed pe home

Ce mai ramane minor (nu blocheaza trecerea la Wave B):
- lista `Resolve` foloseste execution card shared in expansion, dar nu are inca un mod inline de lucru complet fara intrare in detail
- `activity feed` exista acum pe home, dar inca nu include toate output-urile cron/agentice ca poveste unificata

Update executie `2026-03-26`:
- a fost gasita si inchisa ruptura reala dintre drawer si backend:
  - [generator-drawer.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/generator-drawer.tsx) trimite acum checklist-ul complet:
    - `content-reviewed`
    - `facts-confirmed`
    - `approved-for-evidence`
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts) normalizeaza si aliasul legacy `reviewed-content`, ca sa nu lase un colț rupt dupa iteratia anterioara
  - [route.test.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.test.ts) acopera explicit aliasul legacy si rezolvarea completa
- smoke-ul local pe buildul curent a confirmat flow-ul cap-coada:
  - `register -> scan -> confirm -> generate -> resolve`
  - documentul generat pentru `privacy-policy` are data corecta `26 martie 2026`
  - `PATCH /api/findings/[id]` intoarce acum `status: under_monitoring`
  - `documentFlowState` devine `attached_as_evidence`
  - `linkedGeneratedDocument.approvalStatus` devine `approved_as_evidence`
  - feedback-ul final foloseste limbajul canonic de dosar: `Dovada a intrat la dosar`
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/core/route.ts) si payloadul runtime arata finding-ul in `under_monitoring`, documentul in `generatedDocuments` si snapshot-ul actualizat dupa inchidere
- adevarul onest dupa validare:
  - `Wave A` este inchis functional pe traseul critic documentar
  - buildul trece
  - warning-urile ESLint ramase sunt vechi si in afara acestei taieri

### Wave B - Dashboard devine snapshot, nu concurent pentru execution

Status: `COMPLETE`

Update executie `2026-03-25`:
- dashboard restructurat ca snapshot: above the fold ramane doar PageIntro + NextBestAction + AccumulationCard + ActivityMonitorCard + SummaryStrip
- toate cardurile secundare (benchmark, executive summary, calendar, pay transparency, e-factura, DSAR, site scan, NIS2, agents) mutate sub `<details>` colapsabil "Semnale, benchmark și instrumente"
- PageIntro actualizat: eyebrow "Snapshot", titlu "Starea firmei tale acum", descriere orientata spre actiune
- framework readiness cards ramane in propriul `<details>` separat
- TypeScript 0 erori; buildul trece, warning-urile ESLint vechi raman

Obiectiv:
- sa transformam `Dashboard` in suprafata de orientare si acumulare

Ce trebuie facut:
1. pastram doar blocurile care raspund la:
   - ce ti se aplica
   - ce am gasit
   - ce faci acum
   - ce ai acumulat
2. retrogradam sau mutam below the fold:
   - benchmark-uri care nu conduc actiune
   - carduri egale ca greutate
   - semnale care concureaza cu `next best action`
3. facem legatura mai directa dintre `NextBestAction` si cockpit-ul real
4. pastram `AccumulationCard` ca dovada de valoare construita, nu ca widget separat fara context

Fisiere tinta probabile:
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx)
- [use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/core/route.ts)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dashboard/urgency/route.ts)
- [accumulation-card.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard/accumulation-card.tsx)
- [next-best-action.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/next-best-action.tsx)

Definition of done:
- dashboard-ul nu mai concureaza cu resolve-ul
- dashboard-ul orienteaza si impinge spre cockpit
- userul intelege imediat ce i se aplica, ce am gasit si ce face acum

### Wave C - Scan devine intake clar, nu pseudo-workspace paralel

Status: `COMPLETE`

Update executie `2026-03-25`:
- PageIntro actualizat: eyebrow "Intake", titlu "Alimentezi Compli cu surse noi"
- descriere orientata explicit pe flow: "Compli extrage, analizează și generează findings. Rezolvarea continuă în De rezolvat."
- banner findings restilizat cu hero-like border + gradient + CTA "Mergi la De rezolvat"
- mesajul de sub banner explicit: "Rezolvarea se face prin cockpitul fiecărui finding"
- scan results page deja avea HandoffCard bun, nu necesita modificare
- TypeScript 0 erori

Obiectiv:
- sa pastram `Scan` puternic, dar cu rol corect

Ce trebuie facut:
1. clarificam in UI ca `Scan` este:
   - intake
   - extractie
   - analiza
   - aparitie de findings noi
2. dupa scan, CTA-ul dominant trebuie sa duca spre:
   - finding-urile noi
   - cockpit-ul relevant
3. evitam ca `Scan` sa para inca un loc in care rezolvi partial si ramai blocat
4. pastram istoric si rezultat curent, dar le tinem secundare fata de fluxul activ

Fisiere tinta probabile:
- [scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx)
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/scan/page.tsx)
- [route-sections.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/route-sections.tsx)

Definition of done:
- `Scan` nu mai pare loc de rezolvare fragmentata
- dupa aparitia findings-urilor noi, traseul natural este `Resolve`
- userul intelege ca scanarea alimenteaza cockpit-ul

### Wave D - Generator contextual si success moment puternic

Status: `COMPLETE`

Update executie `2026-03-25`:
- generatorul contextual realizat prin `GeneratorDrawer` (Sheet-based, in-context pe finding detail page)
- flow-ul finding-driven nu mai navigheaza la pagina separata `/dashboard/generator`
- success moment cu `FindingDossierSuccessCard` deja implementat de Codex in Wave A
- generatorul standalone ramane functional pentru generare libera
- confirmarea este explicit legata de dovada (checklist + PATCH finding cu status resolved)
- toate DoD-urile indeplinite prin combinatia Wave A + drawer integration

Obiectiv:
- sa inchidem flow-ul `draft -> confirmare -> dovada -> dosar`

Ce trebuie facut:
1. pastram `Generator` standalone doar pentru generare libera
2. pentru flow-urile pornite din finding:
   - ascundem alegerea generica de template
   - pastram contextul finding-ului sus si clar
   - facem confirmarea explicit legata de dovada
3. success state-ul trebuie sa spuna clar:
   - ce s-a salvat
   - unde este in dosar
   - ce s-a actualizat in snapshot

Fisiere tinta probabile:
- [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
- [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts)
- [document-generator.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/document-generator.ts)
- suprafete din `reports/vault` si `audit log`, daca e nevoie de ancorare directa

Definition of done:
- generatorul contextual nu mai rupe flow-ul
- userul intelege limpede ca dovada a intrat la dosar
- `resolved` nu mai pare simplu status text, ci rezultat verificabil

### Wave E - Monitoring, feed si notificari devin continuitate reala

Status: `COMPLETE`

Update executie `2026-03-25`:
- notificarile din `agent-orchestrator.ts` nu mai folosesc `[agentType]` jargon; acum au prefix uman:
  - "Compli a verificat facturile", "Am detectat o schimbare", "Ți-am pregătit un document", "Am verificat furnizorii", "Schimbare legislativă detectată"
- notificarea din `legislation-monitor` schimbata de la `[Radar Legislativ]` la `Schimbare legislativă: {sursa}`
- activity feed pe home deja folosea limbaj uman bun: "Ți-am salvat", "Am detectat", "Urmează reverificare"
- notification bell deja functional cu polling 60s, mark-read, ANAF signal strip
- vendor sync cron deja avea limbaj uman bun
- TypeScript 0 erori

Obiectiv:
- sa aratam ca produsul ramane activ dupa rezolvare

Ce trebuie facut:
1. legam mai clar feed-ul si notificarile de:
   - schimbari in workspace
   - drift
   - reverificari
   - schimbari din campul de compliance relevant userului
2. evitam complet limbajul intern:
   - fara `cron completed`
   - fara `job finished`
   - fara termeni tehnici fara impact
3. facem redeschiderea sau reactivarea coerenta a finding-urilor monitorizate

Fisiere tinta probabile:
- [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- [notification-bell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/notification-bell.tsx)
- [use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)
- route-urile de dashboard core si feed/notificari deja existente in runtime

Definition of done:
- dupa rezolvare, produsul pare viu
- monitorizarea este perceputa ca valoare, nu ca zgomot
- notificarile si feed-ul nu dubleaza inutil acelasi mesaj

### Wave F - IA si shell final aliniate cu noul centru

Status: `COMPLETE`

Update executie `2026-03-25`:
- [navigation.ts](components/compliscan/navigation.ts) actualizat cu descrieri aliniate la noul model:
  - Acasă: "snapshot: ce ai, ce am găsit, ce faci acum"
  - Scanează: "intake: surse noi, analiză, findings"
  - De rezolvat: "execuție: cockpit, dovadă, dosar"
  - Calendar: "deadlines și reverificări"
  - Rapoarte: "dosar: dovezi, politici, export"
  - Setări: "workspace și acces"
- solo nav items actualizate cu aceleași descrieri orientate pe rol
- rutele actuale mentinute (nicio ruta schimbata)
- ierarhia si labels-urile nu mai induc fragmentare
- TypeScript 0 erori production; buildul trece, warning-urile ESLint vechi raman

Obiectiv:
- sa aliniem shell-ul cu adevarul nou al produsului

Ce trebuie facut:
1. verificam daca nav si shell-ul actual sprijina sau saboteaza modelul:
   - `Dashboard` = snapshot
   - `Scan` = intake
   - `Resolve` = execution
   - `Reports / Dosar` = memory and export
   - `Settings` = workspace
2. pastram rutele actuale cat timp nu blocheaza flow-ul
3. schimbam doar ierarhia, labels si descrierile care induc fragmentare

Fisiere tinta probabile:
- [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- [navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts)
- [nav-config.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.ts)
- [dashboard-routes.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/dashboard-routes.ts)

Definition of done:
- shell-ul spune aceeasi poveste ca produsul
- userul nu mai simte ca intra in 7 aplicatii mici
- nav-ul nu mai concureaza cu flow-ul de rezolvare

## 7. Ordinea reala de lucru

Ordinea corecta nu este cea mai usoara, ci cea care muta sistemul cu risc minim:

1. `Wave A - Smart Resolve Cockpit spine`
2. `Wave D - Generator contextual + success + dosar`
3. `Wave B - Dashboard snapshot`
4. `Wave C - Scan intake`
5. `Wave E - Monitoring + feed + notificari`
6. `Wave F - Shell + IA final`

Motiv:
- daca nu fixam mai intai nucleul `Resolve + Generator + Dovada`, restul ramane cosmetica

## 8. Prima taietura chirurgicala

Daca sesiunea se pierde si trebuie reluata imediat, se incepe de aici:

### Pasul 1
- citeste:
  - [COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-SMART-RESOLVE-COCKPIT-CANON.md)
  - [log-adevar-final.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/log-adevar-final.md)

### Pasul 2
- deschide in ordine:
  - [resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx)
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts)
  - [use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)

### Pasul 3
- decide structura shared a cockpit-ului
- nu incepe cu nav
- nu incepe cu landing
- nu incepe cu polish vizual

### Pasul 4
- implementeaza intai `Wave A`
- dupa ce cockpit-ul este functional, continua cu `Wave D`

## 9. Checklist de verificare dupa fiecare val

La finalul fiecarui val trebuie verificat:

1. userul intelege unde este
2. exista un singur CTA principal
3. sistemul arata ce a facut deja pentru user
4. flow-ul nu trimite userul inutil in alta pagina
5. exista rezultat verificabil, nu doar status schimbat
6. legatura cu dosarul este vizibila
7. monitoring-ul este prezent sau pregatit clar pentru pasul urmator

## 10. Ce inseamna succes pentru toata implementarea

Implementarea este considerata aliniata cu adevarul final numai daca:

1. `Resolve` este suprafata principala de executie
2. `Generator` nu mai fractureaza finding-driven work
3. `Dashboard` este snapshot, nu panou concurent
4. `Scan` este intake, nu pseudo-resolve
5. `Dosarul` este rezultatul firesc al muncii
6. `Monitoring` continua povestea dupa rezolvare
7. produsul poate fi explicat simplu ca:

`CompliScan gaseste, explica, ajuta sa rezolvi, pastreaza dovada si ramane de paza.`

## 11. Stare curenta a acestui log

Acest log este scris inainte de implementare.

Statusurile corecte acum sunt:
- `Wave A` - `COMPLETE`
- `Wave B` - `COMPLETE`
- `Wave C` - `COMPLETE`
- `Wave D` - `COMPLETE`
- `Wave E` - `COMPLETE`
- `Wave F` - `COMPLETE`

**TOATE WAVE-URILE COMPLETATE — `2026-03-25`**

Update executie `2026-03-26` (polish si inchidere gap-uri live):
- **Wave E curatat pe runtime, nu doar in cod local**:
  - [notifications-store.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/notifications-store.ts) normalizeaza acum notificarile legacy la citire si la creare:
    - scoate prefixe de tip `[compliance_monitor]`
    - traduce titlurile in limbaj uman
    - repara rutele stale de tip `/dashboard/scanari`
    - impinge alertele fara dovada direct spre `De rezolvat`
  - [notifications-store.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/notifications-store.test.ts) protejeaza explicit aceste cazuri
- **Wave C intarit ca intake clar**:
  - [scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx) afiseaza acum handoff explicit spre `De rezolvat` atunci cand exista findings active in workspace
  - CTA-ul catre cockpit nu mai sta ascuns doar in cazurile cu ultima scanare relevanta
- **Wave A / D polish de ierarhie si limbaj**:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx) foloseste copy mai clar (`Caz`, `Rezolvare in acelasi loc`)
  - [finding-cockpit-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/finding-cockpit-shared.tsx) redenumeste cardul secundar la `Progres, dosar si monitorizare`
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts) genereaza notificari umane la confirmarea cazului si le leaga direct de finding detail
- **Wave B polish de snapshot**:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx) foloseste titlu si descriere unificate in jurul limbajului de snapshot orientat pe user
- **Urme vechi inchise in IA**:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/checklists/page.tsx) nu mai trimite spre ruta legacy `/dashboard/scanari`

Validare:
- `npm test -- lib/server/notifications-store.test.ts 'app/api/findings/[id]/route.test.ts'` trece
- `npm test -- app/api/smoke-flow.test.ts tests/canonical-runtime-audit.test.ts` trece
- `npm run build` trece; warning-urile ESLint ramase sunt vechi si in afara acestei taieri

Cand incepe implementarea reala:
- acest log trebuie actualizat inainte sa se piarda contextul
- nu trebuie mutat in arhiva
- nu trebuie inlocuit cu mesaje din chat

Update executie `2026-03-26` (polish peste canon + smoke browser real):
- **Ierarhia cockpit-ului este mai compacta si mai clara**:
  - [finding-cockpit-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/finding-cockpit-shared.tsx)
    - cardul narativ nu mai dubleaza `ce faci acum`; accentul ramane pe `Problema`, `Impact`, `Dovada acceptata`
    - `Cum arata inchiderea` a devenit strip separat, mai usor de scanat
    - contextul secundar (`Ce pregateste Compli`, `Confirmarea ta`, `Revalidare`) a fost mutat in expand controlat
    - stepper-ul din execution card a devenit `compact progress map`, nu lista verticala grea
- **Success moment-ul functioneaza si in drawer, nu doar in pagina separata de generator**:
  - [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx)
    - dupa atasarea dovezii din drawer, cockpit-ul afiseaza local `FindingDossierSuccessCard`
    - contextul juridic / provenance / reasoning a fost compactat intr-un bloc `details`, ca sa nu aglomereze primul ecran
  - [generator-drawer.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/generator-drawer.tsx)
    - transmite acum explicit inapoi `dossierSaved`
    - are `data-testid` stabile pentru smoke pe preview, checklist si attach
- **Smoke client-side real, nu doar API smoke**:
  - [smoke-smart-resolve-browser.mjs](/Users/vaduvageorge/Desktop/CompliAI/scripts/smoke-smart-resolve-browser.mjs)
    - parcurge `register -> set user mode -> complete onboarding -> scan fixture -> open finding -> confirm -> open drawer -> generate -> attach -> success card`
    - foloseste Chrome local si un finding documentar real rezultat din fixture
  - [package.json](/Users/vaduvageorge/Desktop/CompliAI/package.json)
    - script nou: `npm run smoke:smart-resolve-browser`
- **Build blockers aduse la lumina in timpul polish-ului au fost inchise**:
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/dora/tprm/route.ts) si [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/policies/acknowledge/route.ts) nu mai crapa la body JSON gol in build/prerender
  - [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/nis2/eligibility/route.ts) a fost corectat pe `createdAtISO` si pe tipul `risk`

Validare:
- `npm test -- 'app/api/findings/[id]/route.test.ts' tests/flow-test-kit-user-nou.test.ts app/api/smoke-flow.test.ts` trece
- `npm run build` trece
- `npm run smoke:smart-resolve-browser` trece cu rezultat:
  - finding documentar real deschis
  - drawer generator deschis in-context
  - draft generat
  - checklist bifat
  - dovada atasata
  - success card `Dovada salvata la dosar` vizibil

Parcare pentru faza 2 (nu mai este gap de canon, ci extensie controlata):
- `Home by maturity`: dashboard care se schimba clar intre firma noua, operator activ si workspace matur
- `Feed de activitate mai dens`: sumarizarea tuturor agentilor / cron-urilor intr-un singur flux uman, actionabil
- `Cockpit inline mai puternic in lista din Resolve`: mai putin detur in detail page pentru cazurile simple
