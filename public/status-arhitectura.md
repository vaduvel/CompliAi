# CompliScan - Status Arhitectura

Data actualizarii: 2026-03-12

## Verdict scurt

CompliScan nu mai este intr-o arhitectura de demo simplu. Are deja o fundatie buna pentru un MVP serios.

Nivel estimat de maturitate:

- fundatie de produs: `89-90%`
- arhitectura unificata: `88-90%`
- MVP vandabil: `~85%`

Problema actuala nu este lipsa de features. Problema actuala este riscul de fragmentare:

- prea multe concepte similare
- naming mixt intre UI, state si roadmap
- unele flow-uri sunt mature, altele sunt inca partiale

Concluzie:

**da, trebuie armonizata arhitectura acum**

Dar:

**nu prin rewrite mare**

Ci prin:

- unificarea modelului de domeniu
- unificarea navigatiei vizibile
- unificarea severitatii, principiilor si flow-ului principal

## Checkpoint curent de implementare

Ultimul punct inchis in implementare:

- upload real de dovezi in task-uri
- proof types pe task-uri
- salvare fisiere dovezi in `public/evidence-uploads`
- `Mark as fixed & rescan` peste dovada reala
- `Auditor Vault` afiseaza dovada, tipul si validarea
- severitate unica in findings / alerts / drift / task-uri
- taxonomie unica de principii in model si UI
- drift-ul genereaza acum task-uri de remediere dedicate
- navigatie primara grupata pe `Scanare / Control / Dovada`
- drift-ul este urcat in dashboard ca semnal operational principal
- `AI Compliance Pack` comun peste documente, manifests si `compliscan.yaml`
- `AI Compliance Pack v2` cu:
  - prefill completeness score
  - field status (`confirmed / inferred / missing`)
  - source signals
  - draft `Annex IV lite`
- `AI Compliance Pack v3` cu:
  - `confidenceModel` separat de încrederea tehnică
  - `detected / inferred / confirmed_by_user`
  - rezumat unificat în UI și în audit
- `AI Compliance Pack v4` cu:
  - confidence model la nivel de câmp
  - evidence bundle summary pe fiecare sistem
  - trace summary pe fiecare sistem
  - coverage agregat pentru field confidence și bundle readiness
- `AI Compliance Pack` împins mai aproape de `Annex IV lite`, cu:
  - system scope
  - intended users and affected persons
  - risk and rights impact
  - technical dependencies
  - evidence and validation summary
  - coverage pe control și pe articol în evidence bundle
- `Annex IV lite` client-facing, separat de cardul operational:
  - export HTML printabil din browser
  - utilizabil in review operational si pregatire audit
  - inclus si in `Audit Pack` ZIP / dossier bundle
  - review checklist la inceput
  - readiness si missing fields mai clare pe fiecare sistem
  - anchors si table of contents pe fiecare sistem si sectiune
- `AI Compliance Pack` are acum editare și confirmare pe câmpuri:
  - override-uri persistate în starea de compliance
  - confirmare `confirmed_by_user` la nivel de câmp
  - regenerare unificată pentru pack, audit și export
- UX dedicat pentru câmpurile compuse din `AI Compliance Pack`:
  - editori specializați pentru `human_oversight`, `data_residency`, `retention_days`, `legal_mapping`
  - serializare mai sigură pentru mapările legale pe linii
  - confirmare mai clară pentru câmpurile care intră direct în audit și drift
- drift policy unificat pentru:
  - severitate
  - motivul severității
  - impact
  - acțiune recomandată
  - dovada cerută
  - referința de control / lege
- drift UX armonizat în:
  - Dashboard
  - Alerte
  - Scanări
  - Rapoarte
  - Auditor Vault
- `drift escalation matrix` este acum operațional:
  - lifecycle clar: `open / acknowledged / in_progress / resolved / waived`
  - owner și SLA vizibile în UI
  - badge pentru SLA depășit
  - evenimente dedicate în audit trail
  - închiderea prin task actualizează și lifecycle-ul drift-ului asociat
- `traceability matrix` comun:
  - finding
  - remediation task
  - drift
  - articol / control
  - snapshot / baseline
- `traceability matrix` rafinat și cu:
  - evidence required
  - coverage pe control (`covered / partial / missing`)
  - fișiere legate direct de control
- confirmare explicită pe control / articol în `traceability matrix`:
  - confirmare manuală pentru audit
  - notă opțională de justificare
  - reflectată și în exporturile client-facing
  - confirmare in grup pentru acelasi articol legal
- familii de controale reutilizabile:
  - agregare pe aceeași natură operațională
  - confirmare la nivel de familie
  - reuse de dovadă validată în aceeași familie, cu rescan ulterior
  - policy mai fină de reuse:
    - compatibilitate pe tip de dovadă
    - grup legal compatibil
    - validare tehnică compatibilă pentru familiile stricte
- `Auditor Vault` afișează traseul de control ca obiect separat
- `Audit Pack` client-facing include acum și:
  - traceability matrix
  - controale confirmate explicit pentru audit
  - note de review pe control
  - linkuri directe catre sectiunile relevante din `Annex IV lite`
  - reuse summary pe familie de controale în bundle evidence
  - lifecycle și SLA breach pentru drift-urile active
  - secțiuni explicite pentru stakeholder non-tehnic:
    - ce este deja defensibil
    - ce cere atenție înainte de audit
    - ce s-a schimbat față de baseline
    - owner action register
    - decision gates: ce poate fi semnat / distribuit / înghețat acum
    - checklist rapid pentru stakeholder
- `Audit Pack v2` exportabil din `Auditor Vault`, cu:
  - executive summary
  - system register
  - controls matrix
  - evidence ledger
  - drift register
  - validation log
  - timeline
- `Audit Pack` client-facing, printabil din browser pentru PDF, construit peste structura v2
- `Audit Pack` ZIP / dossier bundle peste structura v2
- `Audit Pack` agregă acum coverage pe articol / control, nu doar pe sistem
- `Audit Pack` client-facing are acum framing executiv mai bun:
  - cover summary
  - livrabile complementare
  - trimiteri directe catre `Annex IV lite`
- `AI Compliance Pack` precompleteaza mai agresiv sectiunile avansate din `Annex IV lite`:
  - deployment context
  - affected persons summary
  - monitoring summary
  - escalation path
- `AI Compliance Pack` are acum și controale sugerate mai fine:
  - controale derivate din task-urile reale
  - controale inferate pentru transparență, oversight, retenție, transfer, baseline review
  - prioritizare `P1 / P2 / P3`
  - dovadă și referință legală pentru fiecare control sugerat
  - context executiv per control:
    - `ownerRoute`
    - `businessImpact`
    - `bundleHint`
- `AI Compliance Pack` grupează acum controalele sugerate și pe grupuri de sisteme:
  - suport clienți
  - HR / recrutare
  - operațiuni financiare
  - marketing / analytics
  - operațiuni generale
- pagina `Sisteme` are acum și `Control package highlights`:
  - pachete dominante pe grupuri de sisteme
  - owner route
  - bundle minim de dovadă
  - impact de business
- `Auditor Vault` explică mai bine familiile de controale:
  - de ce contează
  - ce dovedește familia
  - ce surse intră în scope
  - presiunea curentă din findings și drift
- severitate drift configurabilă la nivel de workspace
- plan de remediere separat intre:
  - remedieri rapide
  - remedieri structurale
- `AIDiscoveryPanel` arată acum doar detectiile active:
  - `detected`
  - `reviewed`
  - sistemele confirmate rămân doar în inventarul oficial
  - drift-ul nu mai este duplicat integral în fiecare card de detecție
- `Audit Pack` client-facing are acum și strat executiv clar:
  - decizii executive recomandate
  - carduri de blocaje / review / gap-uri de familie
  - trimiteri mai clare către `Annex IV lite`
  - memo executiv de deschidere
  - register cu owneri, acțiuni și deadline-uri
- polish final pentru stakeholder non-tehnic în dosarele externe:
  - ghid clar `ce trimiți mai departe și când`
  - legendă de citire rapidă pentru statusuri
  - pachete de control recomandate pe sistem în `Audit Pack` client-facing
  - rezumat managerial per sistem în `Annex IV lite`
  - bundle / README cu ordine recomandată de citire
- sprint de QA + UX cleanup pe fluxurile cu cea mai mare densitate:
  - `Scanari` separa mai clar `flux activ` de `ultimul rezultat`
  - `AIDiscoveryPanel` comprima mesajele de drift si pastreaza pagina ca work queue
  - `Auditor Vault` porneste mai clar printr-un rezumat rapid si reduce numarul de trasee individuale afisate initial
- micro-copy + empty states cleanup:
  - `Scanari` foloseste copy mai clar pe wizard si pe starea curenta
  - `Sisteme` spune mai bine ce lipseste si ce se intampla cand nu exista inventory sau drift
  - `Auditor Vault` explica mai clar ce lipseste cand nu exista snapshot, dovada, trasee sau jurnal
- naming consistency pass pe suprafata vizibila:
  - subtitle de brand aliniat la produsul actual
  - `Flux scanare` in loc de `Wizard scanare`
  - `Remediere` in loc de `Plan de remediere` pe suprafetele principale
  - `Audit si export` in loc de `Rapoarte` pe suprafetele operationale
- cleanup minim si pe componente legacy ramase, ca sa nu mai pastram naming-ul vechi in codul secundar
- `lint` si `build` trec

## Ce avem deja bine

### 1. Source layer

Surse suportate:

- document
- text manual
- manifest / repo
- `compliscan.yaml`
- repo sync GitHub / GitLab / generic

### 2. Analysis layer

Exista deja:

- rule library
- legal mapping
- findings
- alerts
- AI autodiscovery
- baseline
- drift detection
- validation logic pe task-uri

### 3. Control layer

Exista deja:

- AI inventory
- detected / reviewed / confirmed / rejected
- snapshot history
- validated baseline
- drift records

### 4. Evidence layer

Exista deja:

- remediation task cards
- evidence upload
- proof types
- event log
- `Auditor Vault`
- export `compliscan.json`
- export `compliscan.yaml`
- export PDF / checklist demo
- export `Audit Pack v2` JSON structurat pentru audit
- export `Audit Pack` client-facing pentru stakeholderi non-tehnici
- export `Audit Pack` ZIP / dossier bundle
- export `Annex IV lite` client-facing cu ancore pe sectiuni

## Ce nu este inca armonizat

### 1. Modelul de produs in UI

In cod, produsul tinde catre 3 piloni:

- Scanare
- Control
- Dovada

Navigatia principala a fost deja grupata sub cei 3 piloni, dar inca exista shortcut-uri si pagini secundare care expun conceptele vechi:

- Documente
- Sisteme AI
- Checklists
- Alerte
- Rapoarte
- Setari

Asta este mult mai bine pentru user, dar mai trebuie armonizate:

- titlurile unor pagini
- copy-ul dintre piloni si shortcut-uri
- relatia dintre `Checklists`, `Rapoarte` si `Auditor Vault`

### 2. Severitate si principii

Acest punct este acum in mare parte rezolvat:

- findings folosesc `critical / high / medium / low`
- alerts folosesc `critical / high / medium / low`
- drift foloseste `critical / high / medium / low`
- task-urile mostenesc aceeasi severitate

La fel si principiile:

- taxonomia unica este acum aplicata in modelul intern
- UI-ul afiseaza principii si severitate pe task-uri
- exportul snapshot consuma modelul unificat

Ce mai ramane:

- curatare de copy si etichete in cateva pagini
- impunerea aceluiasi vocabular si in navigatia finala

### 3. Drift si remediation nu sunt inca complet unite

Punctul acesta este acum avansat, dar nu complet inchis:

- drift-ul genereaza task-uri dedicate
- task-urile de drift au owner, dovada ceruta, text gata de copiat si pas clar de remediere
- inchiderea/redeschiderea task-ului poate inchide/redeschide si drift-ul asociat
- drift-ul are acum politică unificată pentru impact și acțiune
- aceeasi poveste de drift apare si in Dashboard, si in Alerte, si in Audit

Ce mai ramane:

- task-uri si mai explicite pentru drift in functie de articolul afectat si dovada exacta
- polish final al reuse bundle la nivel de familie, nu doar pe control
- pachet client-facing și mai aproape de un dosar executiv extern
- sugestii și mai fine pe controale compuse / familii de controale
- UX de escaladare mai clar pentru `critical` vs `high`
- confirmare mai fină la nivel de familie mare de controale, nu doar pe articol si pe fiecare traseu din matrix

### 4. Pre-filling nu este complet

Avem:

- detectie
- review
- confirm
- `AI Compliance Pack v2` care unifica sursele, guvernanta, controalele si dovada
- `AI Compliance Pack v3` care separa:
  - încrederea tehnică (`low / medium / high`)
  - încrederea operațională (`detected / inferred / confirmed_by_user`)
- `AI Compliance Pack v4` care adaugă:
  - confidence model la nivel de câmp
  - evidence bundle pe sistem
  - trace summary pe sistem
- prefill score si field status pe fiecare sistem
- draft scurt de documentatie pentru audit (`Annex IV lite draft`)

Dar inca nu avem complet:

- confirmare si editare si mai fine pentru grupuri de câmpuri avansate
- controale sugerate si mai fine pe fiecare sistem
- UX dedicat și pentru câmpuri compuse mai avansate, nu doar pentru override-urile principale din pack
- legătura directă dintre fiecare articol / control și secțiunea exactă din dosarul client-facing extern

### 5. Audit Pack este coerent, dar nu inca final

Avem acum:

- `Audit Pack v2` cu sectiuni explicite
- legatura clara intre:
  - systems
  - controls
  - evidence
  - drift
  - validation
  - timeline
- varianta client-facing, printabila, pentru PDF din browser
- traceability matrix in JSON și în varianta client-facing
- pozitionare mai clara in `Rapoarte` si `Auditor Vault`

Ce mai ramane:

- prezentare si mai buna a dosarului pentru auditor non-tehnic
- ambalare mai bună a dosarului ca pachet client-facing pentru stakeholderi non-tehnici
- legarea fiecărui articol/control de secțiuni explicite din dosarul client-facing final, nu doar in uneltele de audit
- UX și reguli mai fine pentru confirmare/editare la nivel de câmp în `AI Compliance Pack`

## Ce lasam intentionat in urma

Aceste puncte nu sunt uitate. Sunt parcate intentionat dupa checkpoint-ul actual:

- confirmare si prefill mai fine la nivel de câmp si familie de controale
- legături și mai bune între drift și task-urile derivate
- agregare și mai fină a dovezii la nivel de control bundle și reuse policy
- PDF / ZIP mai bine ambalat pentru stakeholder non-tehnic

Ordinea recomandata cand revenim:

1. legatura mai puternica intre evidence bundle si fiecare articol / control
2. PDF / ZIP mai bine ambalat pentru stakeholder non-tehnic
3. controale sugerate si confirmari si mai fine la nivel de grup

## Arhitectura unica recomandata

Nu recomand doua arhitecturi paralele.

Recomand o singura arhitectura de domeniu, cu 5 grupuri clare:

### 1. Sources

- `Source`
- `Scan`
- `Extraction`

Tot ce intra in produs porneste de aici.

### 2. Findings

- `Finding`
- `Alert`
- `Task`

Tot ce detectam trebuie sa poata deveni actiune.

### 3. Systems

- `AISystem`
- `DetectedSystem`
- `Snapshot`
- `Baseline`
- `Drift`

Aici sta controlul operational al sistemelor AI.

### 4. Evidence

- `EvidenceAttachment`
- `Validation`
- `AuditEvent`
- `AuditPack`

Aici sta dovada reala.

### 5. Platform

- `Workspace`
- `User`
- `RepoSync`
- `Export`

Aici sta infrastructura de produs, nu logica principala.

## Fluxul unic care trebuie pastrat

Toata aplicatia trebuie sa ramana subordonata aceluiasi flux:

1. adaugi sursa
2. primesti verdict
3. primesti remediere
4. ataszi dovada
5. rulezi rescan / validare
6. exporti pentru audit

Inventar, baseline, drift si audit nu trebuie sa concureze cu fluxul asta. Trebuie sa-l sustina.

## Cel mai bun pas urmator

Cel mai bun pas urmator nu este un modul nou.

Cel mai bun pas urmator este:

## Sprint de finisare a modelului unic

### Obiectiv

Sa inchidem modelul comun dintre source, control, evidence si audit, fara sa deschidem din nou fire paralele.

### Task-uri recomandate

1. facem `drift escalation` complet operațional

- escalation matrix pe tip de drift
- owner, SLA și severitate finală
- condiții în care drift-ul blochează baseline-ul sau auditul
- dovada obligatorie pentru închidere

2. rafinăm drift-ul și mai defensibil

- diferențiere `critical` vs `high` și în UI
- UX de impact / acțiune / dovadă este deja unificat și trebuie doar rafinat
- escaladarea trebuie să intre în task-uri și în exporturile de audit

Acest bloc este acum închis.

## Urmatorul pas clar

1. intarim `family-level evidence bundle`

- reuse clar pe familie, nu doar pe control
- policy explicită per fișier și per control

Acest bloc este acum închis.

## Urmatorul pas clar

1. finalizam `AI Compliance Pack` ca model de incredere

- finding
- remediation
- drift escalation
- articol de lege
- snapshot / baseline
- `detected`
- `inferred`
- `confirmed_by_user`
- controale sugerate mai fine

2. ducem `Audit Pack` spre dosar executiv extern

- HTML / PDF client-facing și ZIP-ul sunt deja gata
- urmatorul pas este un dosar mai bun pentru stakeholder non-tehnic

## Ce NU recomand acum

- rewrite mare de state
- mutare masiva de foldere doar pentru “curatenie”
- auth / multi-tenant mare chiar acum
- ANAF real inainte de consolidare
- benchmark engine
- SDK runtime

Acestea ar creste complexitatea inainte sa fixam modelul unic.

## Rezumat executiv

Da, trebuie sa armonizam arhitectura.

Dar armonizarea corecta acum inseamna:

- un model de domeniu unic
- un flow principal unic
- severitate unica
- principii unice
- drift -> task -> evidence -> audit

Nu inseamna:

- sa aruncam ce avem
- sa rescriem tot
- sa adaugam alte 5 module

Arhitectura buna pentru CompliScan acum este:

**o singura arhitectura operationala, centrata pe sursa -> verdict -> remediere -> dovada -> audit**
