# CompliScan UX Cockpit Audit + Codex Execution Plan

Data: 2026-03-15
Status tinta: document executabil pentru Codex
Limba: romana fara diacritice

---

## 0. Scopul documentului

Acest document nu este un moodboard si nu este un review vag de design.
Este un audit UX + IA + cockpit benchmarking, urmat de un plan de executie clar pentru Codex.

Scopul este simplu:
- sa aduca CompliScan de la "produs coerent, dar supraincarcat" la "control room clar, audit-ready, usor de invatat"
- sa creasca claritatea UX fara rewrite mare
- sa foloseasca Evidence OS ca sistem de guvernare a paginilor, nu doar ca sistem de stil

Acest document trebuie tratat ca source of truth pentru cleanup-ul UX din urmatoarele sprinturi.

---

## 1. Input-urile auditate

### 1.1 Documente interne auditate
- `harta-navigare-trasee-user-2026-03-14.md`
- `gpt-ux-flow-brief.md`
- `status-arhitectura.md`
- `evidence-os-design-system-v1.md`
- `compliscan-evidence-os-ds-spec (2).md`
- update-urile de maturitate si recipe-urile curente pe Control

### 1.2 Runtime / UI auditate
Audit vizual facut pe screenshot-urile curente din:
- Dashboard
- Scanare
- Control
- Dovada
- Setari

### 1.3 Benchmark extern 2026
Am comparat pattern-urile CompliScan cu produse mari de compliance / control room / GRC, folosind pagini oficiale si documentatie oficiala:
- Vanta
- Drata
- OneTrust
- Secureframe
- Hyperproof
- Optro (fost AuditBoard)

Nu folosim aceste produse ca sa le copiem 1:1.
Le folosim ca sa extragem pattern-uri mature de cockpit UX.

---

## 2. Verdict executiv

## 2.1 Verdict mare
CompliScan nu mai arata ca un MVP haotic.
Arata ca un produs real, serios, cu shell coerent si baza de control room.

Dar:

**UX-ul inca nu este la masa cu gigantii.**

Nu din cauza lipsei de functionalitate.
Nu din cauza design-ului vizual.
Nu din cauza shell-ului mare.

Ci din cauza acestor 4 lucruri:

1. **over-framing**
2. **prea multe carduri cu aceeasi greutate**
3. **prea multa explicatie despre pagina, prea putina autoritate operationala**
4. **mixed intent rezidual, mutat din arhitectura in compozitia paginii**

Pe limba simpla:

- ai iesit din "brad de Craciun structural"
- dar ai intrat in "produs care se explica prea mult"

## 2.2 Verdict de pozitionare UX
Astazi CompliScan este mai aproape de:
- "control room bun, dar prea didactic"

si inca nu este la nivelul:
- "cockpit executiv clar, instant scanabil, fara zgomot"

## 2.3 Verdict practic pentru Codex
Codex NU trebuie sa faca redesign mare.
Codex trebuie sa faca:
- decluttering strategic
- page governance
- reduction de framing redundant
- ierarhie dura intre primary / secondary / helper
- page recipes aplicate disciplinat

---

## 3. Ce arata benchmark-ul concurentei

## 3.1 Ce fac bine gigantii

### Vanta
Vanta pune accent pe:
- evidence collection continua
- monitorizare continua
- alerte automate
- living view al compliance posture

Pattern UX relevant:
- dashboard-ul este orientat pe stare si actiune, nu pe explicatie lunga
- integratiile sint motor de automatisme, nu continut decorativ
- produsul pare viu operational, nu teoretic

Ce luam:
- dashboard-ul trebuie sa raspunda repede la "ce a picat / ce fac acum"
- drift / failing state trebuie sa fie mai central decat textul despre produs

### Drata
Drata documenteaza dashboard-ul ca vedere high-level asupra posture-ului, cu:
- readiness
- alerts
- trends
- tasks
- key risk indicators

Pattern UX relevant:
- home-ul este orientare si prioritizare
- readiness si tasks sint vizibile imediat
- dashboard-ul nu incearca sa explice tot produsul

Ce luam:
- Dashboard trebuie sa fie home operational, nu pagina care se justifica pe sine
- userul trebuie sa stie in 5 secunde: ce e blocat, unde merge, ce urmeaza

### OneTrust
OneTrust comunica:
- continuous monitoring
- automated controls
- programmatic enforcement
- governance conectata intre privacy, risk, data, AI

Pattern UX relevant:
- platforma este lata, dar mesajul principal e control continuu
- AI governance este legata de runtime, policy si oversight

Ce luam:
- CompliScan trebuie sa para un sistem viu de control, nu doar un dashboard static
- Evidence Core / The Pulse poate deveni un centru bun de stare, dar fara sa preia controlul informational al paginilor

### Secureframe
Secureframe pune accent pe:
- evidence collection automata
- ongoing monitoring
- frameworks views
- exporturi si evidence folders pentru audit

Pattern UX relevant:
- control views separate pe framework / requirement / evidence
- exportul este derivat din structura, nu ecran paralel ci rezultat al structurii

Ce luam:
- Dovada trebuie sa para single source of truth
- evidence ledger si exporturile trebuie sa fie clar separate de zona de executie

### Hyperproof
Hyperproof pune accent pe:
- control mapping
- risk + controls + evidence + reporting dashboards conectate
- proof freshness si needs attention in program dashboard

Pattern UX relevant:
- dashboard-ul bun nu afiseaza tot, ci starea care cere atentie
- evidence nu sta izolat, ci conectat la task, control si reporting

Ce luam:
- freshness / weak evidence / review required trebuie sa fie semnale de prima clasa
- Vault si Audit Pack trebuie sa fie citite ca ledger + defensibility, nu doar export center

### Optro / AuditBoard
Optro comunica:
- unified risk foundation
- system of action
- dashboards + automation + insights
- remediation status vizibil

Pattern UX relevant:
- compliance nu este doar raport, ci actiune
- remediation trebuie sa fie clara si separata de reporting

Ce luam:
- Dovada trebuie sa fie foarte clar impartita intre lucru, dovada, livrabil

---

## 4. Concluzia benchmark-ului

Gigantii nu cistiga pentru ca au UI-uri spectaculoase.
Ei cistiga pentru ca:

1. **home-ul este simplu si actionabil**
2. **starea problematica este mai vizibila decat teoria**
3. **execution si reporting sint separate**
4. **o pagina nu vrea sa fie 3 pagini simultan**
5. **produsul nu se explica mult; produsul te impinge sa faci pasul urmator**

CompliScan este deja pe directia buna ca shell si model de domeniu.
Dar ca UX runtime, inca explica prea mult si prioritizeaza insuficient.

---

## 5. Unde este CompliScan acum

## 5.1 Ce este bun deja

### Shell si framing mare
- Sidebar-ul mare este acum bun: Dashboard / Scanare / Control / Dovada / Setari
- Se simte ca produsul are piloni si ordine
- Nu mai pare o colectie de shortcut-uri aruncate la intamplare

### Design language
- Evidence OS functioneaza bine ca ton, densitate, dark enterprise si badge semantics
- Cardurile si shell-ul au o coerenta buna
- Dovada si Control arata serios si premium

### Product depth
- La ~150k LOC se vede clar ca exista produs, nu experiment
- Dovada, drift, AI Compliance Pack, Vault, readiness, baseline, task-uri si export au deja substanta reala

## 5.2 Unde inca nu este la masa cu gigantii

### A. Dashboard
Problema:
- inca spune prea multe lucruri deodata
- inca pune prea multe blocuri relevante aproape la acelasi nivel
- inca cere prea multa citire

Ce simte userul:
- "e mult continut util aici"
- dar nu inca "inteleg instant ce fac acum"

### B. Scanare
Problema:
- este inca prea explicata
- ecranul contine prea multa meta-informatie despre flow
- pare uneori "pagina despre scanare", nu "pagina de scanare"

Ce simte userul:
- "sunt multe informatii bune"
- dar nu inca "incep exact aici si fac asta"

### C. Control
Aici progresul este foarte bun.
Dar mai trebuie rafinat prin reducerea framing-ului explicativ si cresterea dominatiei zonelor actionabile.

### D. Dovada
Dovada este in prezent probabil cea mai buna zona din produs.
Dar mai poate fi imbunatatita prin:
- reducerea textului doctrinar
- cresterea separarii vizuale dintre execution, ledger si export

### E. Setari
Setari este mult mai sanatoasa acum, dar inca prea framed.
Trebuie sa para administrare, nu mini-produs cu propria filozofie.

---

## 6. Problema reala de UX acum

Problema principala NU mai este mixed feature chaos.
Problema principala este:

## 6.1 Over-framing
Prea multe blocuri care spun:
- ce este pagina
- ce nu este pagina
- cum trebuie citita pagina
- unde continui dupa
- care este fluxul canonic
- care este handoff-ul

Asta este bun in documentatie interna.
Dar in runtime, dupa un punct, userul se simte invatat, nu ajutat.

## 6.2 Flat importance
Prea multe carduri arata aproape la fel de importante.

Consecinte:
- ochiul nu are punct dominant clar
- userul citeste prea mult inainte sa actioneze
- home-ul pare dens chiar daca nu e haotic

## 6.3 Didactic tone in runtime
Produsul vorbeste prea mult despre sine.
Gigantii nu fac asta.
Ei:
- arata postura
- arata problema
- arata actiunea
- apoi lasa detaliul in drill-down

## 6.4 Page theory replacing page flow
Ai rezolvat o parte din mixed intent arhitectural prin tabs.
Dar ai inlocuit uneori problema cu alta:
- in loc sa amesteci features, amesteci cadre explicative

Rezultatul:
- produsul e mai curat
- dar nu inca suficient de calm si autoritar

---

## 7. Obiectivul UX urmator

Nu este redesign mare.
Nu este nou design system.
Nu este mai mult motion.
Nu este mai multa culoare.

Obiectivul este:

**sa aduci CompliScan la nivel de cockpit executiv calm, scanabil si actionabil, cu autoritate operationala reala.**

Tradus in practici:
- mai putina explicatie, mai multa directie
- mai putine blocuri primare
- mai putina teorie de pagina
- mai mult contrast intre important / secundar / helper
- mai multe pagini care pot fi citite in 5 secunde

---

## 8. IA canonica finala

## Sidebar final
- Dashboard
- Scanare
- Control
- Dovada
- Setari

## Utility globala
- Asistent flotant / drawer global
- pagina separata doar pentru istoric lung sau lucru conversational extins

## Dashboard
Pagina de orientare.
Raspunde doar la:
- ce s-a schimbat
- ce este blocat
- ce fac acum

## Scanare
Tabs:
- Adauga sursa
- Rezultat curent
- Istoric

## Control
Tabs:
- Overview
- Sisteme
- Drift
- Review

### Sisteme sub-tabs
- Inventar
- Discovery
- Compliance Pack
- Baseline

## Dovada
Tabs:
- Remediere
- Dovezi
- Audit Pack
- Vault

## Setari
Tabs:
- Workspace
- Integrari
- Acces
- Operational
- Avansat

---

## 9. Principii noi obligatorii pentru Evidence OS

Aceste reguli trebuie adaugate explicit in DS si tratate ca lege.

### 9.1 One page = one dominant intent
Fiecare pagina trebuie sa raspunda la o singura intrebare principala.

### 9.2 Dashboard is orientation, not workbench
Dashboard nu face execution.
Dashboard nu este pagina de export.
Dashboard nu este pagina de discovery.

### 9.3 Execution, evidence, export must not compete
Executia, ledger-ul si livrabilul sint 3 moduri separate.

### 9.4 Tabs are intent split, not decoration
Tabs exista doar ca sa separe intentii vecine ale aceluiasi pilon.

### 9.5 Utility is not workflow
Asistentul nu este pilon.
Este utilitar.

### 9.6 Above-the-fold limit
Pe orice pagina mare, above the fold poate contine doar:
- page header
- tab bar
- un singur bloc dominant de continut
- cel mult un bloc secundar clar

### 9.7 Repeated explanation is a smell
Daca aceeasi idee este explicata de doua ori pe aceeasi pagina, una dintre explicatii trebuie taiata sau mutata.

### 9.8 Urgent beats interesting
Drift, blocked readiness, weak evidence si next action au prioritate peste framing explanatory.

---

## 10. Audit pagina-cu-pagina + ce trebuie sa faca Codex

# 10.1 Dashboard

## Ce este bun acum
- shell bun
- next action exista
- drift exista
- snapshot exista
- surse recente si activitate exista

## Ce este inca prost
- prea multe blocuri aproape egale
- prea mult framing textual
- drift-ul nu domina suficient
- home-ul cere prea multa citire

## Ce trebuie sa faca Codex

### Must
1. Reduca cu 40-60% blocurile explicative de pe Dashboard.
2. Pastreze un singur hero bloc major.
3. Faca drift feed-ul vizual prioritar fata de blocurile de context.
4. Lase sus doar:
   - readiness snapshot
   - next best action
   - drift now / critical state
5. Coboare sub fold:
   - activitate recenta
   - surse recente
   - explicatii de process framing
6. Pastreze maximum 2 blocuri secundare pe primul ecran.

### Should
- transforme "snapshot" intr-un strip de KPI calm, scurt si scanabil
- reduca cardurile colorate la strictul necesar
- faca diferenta mai dura intre primary CTA si navigatie secundara

### Remove / move
- texte doctrinare despre fluxul canonic
- blocuri care spun explicit "unde continui" daca CTA-ul si structura deja o arata

## Outcome dorit
Userul sa inteleaga in sub 5 secunde:
- ai / nu ai drift
- ai / nu ai blocaj de audit
- care este urmatorul pas

---

# 10.2 Scanare

## Ce este bun acum
- se simte separarea pe surse
- exista sens de workspace
- shell-ul este mai bun decat inainte

## Ce este inca prost
- inca prea multe explicatii despre scanare
- prea multe blocuri de framing
- prea mult context despre pagina
- userul nou vede "teorie despre scanare", nu doar scanare

## Ce trebuie sa faca Codex

### Must
1. Faca `Adauga sursa` singurul workspace dominant.
2. Lase deasupra doar:
   - titlu de pagina
   - source mode selector
   - progress / stage indicator daca este necesar
3. Mute in taburi sau sub fold:
   - rezumatul ultimului rezultat
   - istoric
   - agent mode explanations
4. Elimine blocurile redundante de tip:
   - context curent
   - cum citesti pagina
   - predare
   - flux canonic
5. Pastreze un singur mesaj de orientare scurt.
6. Reduca pagina astfel incat userul sa poata incepe analiza fara scroll.

### Should
- transforme explicatiile de proces in tooltip-uri, helper text scurt sau step labels
- trateze `Rezultat curent` ca tab separata, nu ca competitor vizual cu workspace-ul activ

### Remove / move
- orice text care spune acelasi lucru pe 2 blocuri diferite
- orice card care nu schimba decizia userului in primii 10 secunde

## Outcome dorit
Userul nou sa poata spune instant:
- aleg sursa
- incarc / lipesc continut
- rulez analiza
- apoi vad rezultatul separat

---

# 10.3 Control

## Ce este bun acum
- progres foarte mare
- intentia paginii se simte mai clar
- Discovery / Inventar / Baseline / Drift incep sa fie separate sanatos
- pagina arata serios si enterprise

## Ce este inca prost
- inca exista prea mult framing declarativ
- unele blocuri inca incearca sa explice doctrina Control, nu doar sa o aplice

## Ce trebuie sa faca Codex

### Must
1. Pastreze structura canonica:
   - Overview
   - Sisteme
   - Drift
   - Review
2. In `Sisteme`, pastreze clar sub-tabs:
   - Inventar
   - Discovery
   - Compliance Pack
   - Baseline
3. Elimine framing-ul redundant despre ce este / nu este Control daca structura deja il demonstreaza.
4. Faca Overview-ul mai scanabil si mai putin narativ.
5. Pastreze Integrari exclusiv in Setari.

### Should
- faca mai clar raportul dintre candidate -> confirmed -> baseline -> drift
- reduca badge noise daca nu schimba prioritizarea reala

## Outcome dorit
Userul sa inteleaga repede:
- ce confirm aici
- ce este oficial
- ce este doar candidate
- ce este drift real

---

# 10.4 Dovada

## Ce este bun acum
- una dintre cele mai reusite zone
- separa destul de bine executia de audit
- se simte concret si serios

## Ce este inca prost
- inca prea mult framing doctrinar
- unele blocuri explica excesiv relatia dintre Remediere, Vault si Audit Pack

## Ce trebuie sa faca Codex

### Must
1. Pastreze structura:
   - Remediere
   - Dovezi
   - Audit Pack
   - Vault
2. Faca `Remediere` clar pagina de executie, cu CTA-uri si stari de lucru dominante.
3. Faca `Dovezi` clar ledger si quality page.
4. Faca `Audit Pack` clar preview + generator.
5. Faca `Vault` clar read-only, traceability si timeline.
6. Taie framing-ul redundant de tip "aici nu exporti, aici lucrezi" daca structura deja o spune.

### Should
- puna pe fiecare sub-pagina o singura metrica principala
- creasca diferenta intre execution UI si read-only audit UI

## Outcome dorit
Userul sa nu mai aiba nevoie sa citeasca mult ca sa inteleaga diferenta dintre:
- unde inchide taskul
- unde verifica dovada
- unde genereaza livrabilul

---

# 10.5 Setari

## Ce este bun acum
- mult mai sanatos decat inainte
- se simte mai clar ca zona administrativa

## Ce este inca prost
- inca putin prea framed
- inca prea mult limbaj doctrinar pentru o pagina administrativa

## Ce trebuie sa faca Codex

### Must
1. Pastreze tabs:
   - Workspace
   - Integrari
   - Acces
   - Operational
   - Avansat
2. Faca pagina sa para administrativa, nu filosofica.
3. Elimine cardurile explicative care nu schimba decizia imediata.
4. Reduca hero framing la minim.

### Should
- foloseasca mai mult tabel / list / state strip si mai putin card theatre
- trateze release readiness si health ca operational diagnostics, nu ca storytelling

## Outcome dorit
Owner-ul sa poata verifica rapid:
- context
- acces
- integrari
- operational health
fara sa simta ca e intr-un mini-dashboard paralel.

---

## 11. Reguli vizuale de ierarhie pe care Codex trebuie sa le aplice

### 11.1 Un singur bloc primar per pagina
Daca doua blocuri par la fel de importante, unul trebuie degradat vizual.

### 11.2 Helper text limit
Pe orice ecran mare:
- maxim 1 descriere scurta sub titlul paginii
- maxim 1 helper text relevant in blocul principal
- restul merge in tooltip, dialog, empty state sau docs interne

### 11.3 Card austerity
Nu mai face carduri mari doar ca sa explice idei.
Cardurile mari trebuie sa:
- afiseze stare
- sustina o actiune
- sau grupeze date relevante

### 11.4 CTA hierarchy
Fiecare pagina are:
- 1 CTA primar clar
- 1-2 CTA secundare maxime above the fold

### 11.5 Color restraint
Keep:
- emerald pentru succes / primary calm
- amber pentru atentie
- violet pentru review
- red doar pentru blocaj real

Nu folosi culoare ca substitute pentru ierarhie.

### 11.6 Text austerity
Scrie mai putin.
Arata mai mult.
Lasa structura sa explice ideea inainte sa o verbalizezi.

---

## 12. Codex priority backlog

## Phase 1 - Dashboard + Scanare declutter
Scop: reducere imediata a supraincarcarii perceptuale

### Tasks
1. Dashboard:
   - reduce hero + framing blocks
   - aduce drift mai sus
   - reduce number of first-screen cards
2. Scanare:
   - turn `Adauga sursa` into only dominant workspace
   - move current-result/history/agent explanation out of first focus area
   - remove duplicate explanatory sections

## Definition of done
- userul nou intelege urmatorul pas in 5 secunde
- deasupra fold-ului exista 1 bloc principal + max 1 secundar
- nu mai exista doua blocuri care explica acelasi lucru

## Phase 2 - Dovada tightening
Scop: separare si mai clara intre execution, evidence si export

### Tasks
1. Reduce doctrinal framing in Remediere
2. Clarify read-only nature of Vault
3. Clarify Audit Pack as livrabil page
4. Simplify copy and CTA hierarchy in Dovada

## Definition of done
- userul diferentiaza instant unde executa, unde verifica, unde exporta

## Phase 3 - Setari austerity pass
Scop: pagina administrativa clara, fara competitie cu pilonii de executie

### Tasks
1. Reduce page-framing blocks
2. Prefer state strips, rows and operational lists over explanatory cards
3. Keep only admin-meaningful content above fold

## Definition of done
- Setari nu mai pare mini-dashboard paralel

## Phase 4 - Global consistency pass
Scop: alignment final

### Tasks
1. Apply same page grammar everywhere
2. Normalize helper text lengths
3. Normalize CTA placement
4. Normalize section spacing and density
5. Normalize empty states

---

## 13. Non-goals

Codex NU trebuie sa:
- schimbe design systemul de baza
- faca light redesign glossy
- adauge hero illustrations
- inventeze noi piloni top-level
- adauge mai multe carduri ca sa "umple"
- bage explicatii lungi in runtime ca substitute pentru claritate
- reintroduca shortcut-uri persistente in sidebar
- amestece din nou execution, detail si export in acelasi canvas

---

## 14. Metrice de succes

Daca cleanup-ul e bun, trebuie sa vedem:

1. **Time to first meaningful action** scade
   - Dashboard: userul stie ce face in <= 5 secunde
   - Scanare: userul incepe analiza fara ezitare

2. **Page readability** creste
   - mai putin scroll pana la actiunea principala
   - mai putine blocuri de text interpretativ

3. **Intent clarity** creste
   - userul nou intelege unde este execution vs review vs export

4. **Visual dominance** devine mai clara
   - 1 primary area / pagina
   - 1 CTA primar / pagina

5. **Perceptia de enterprise** creste
   - produsul pare calm si sigur
   - nu pare nici gol, nici supra-explicat

---

## 15. Rezumat final pentru Codex

CompliScan nu mai are problema de shell haotic.
Acum are problema de over-framing si ierarhie insuficient de dura.

Ce trebuie facut:
- taie explicatiile redundante
- limiteaza numarul de blocuri primare
- da drift-ului si next action-ului prioritate reala
- transforma Scanare intr-un workspace dominant, nu intr-o pagina despre scanare
- lasa Dovada sa fie operationala, nu doctrinara
- fa Setari administrativa, nu narativa

Target final:

**un cockpit calm, scanabil, executiv, audit-ready, care nu se explica prea mult si nu pune 5 lucruri egale in fata userului in acelasi timp**

---

## 16. Surse externe folosite pentru benchmark

### Vanta
- Vanta product / compliance automation pages
- Vanta help on integrations and continuous evidence / monitoring

### Drata
- Drata dashboard overview (new experience)
- Drata operational compliance dashboard

### OneTrust
- OneTrust AI governance and tech risk & compliance pages

### Secureframe
- Secureframe product pages
- Secureframe framework views and continuous monitoring pages

### Hyperproof
- Hyperproof platform pages
- Hyperproof docs on proof freshness and program dashboard attention states

### Optro
- Optro / AuditBoard compliance management platform pages

Aceste surse au fost folosite pentru pattern-uri de produs, nu pentru a copia UI 1:1.

