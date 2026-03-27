# CompliAi — Client Ready Ruthless Cleanup Sprint

## Rolul documentului

Acesta este singurul fișier de sprint pentru valul `client-ready`.

El absoarbe complet, fără să ignore nimic, cele 3 documente sursă:
- [compliai_full_polish_fix_plan.md](/Users/vaduvageorge/Desktop/CompliAI/docs/Client%20Ready%20/compliai_full_polish_fix_plan.md)
- [compliai_home_ruthless_cleanup_plan.md](/Users/vaduvageorge/Desktop/CompliAI/docs/Client%20Ready%20/compliai_home_ruthless_cleanup_plan.md)
- [compliai_dosar_vault_ruthless_cleanup_plan.md](/Users/vaduvageorge/Desktop/CompliAI/docs/Client%20Ready%20/compliai_dosar_vault_ruthless_cleanup_plan.md)

Nu mai tratăm observațiile din ele ca note paralele.
Din acest moment, ele devin un singur sprint executabil.

---

## Status

`done`

---

## Obiectiv

Să ducem produsul din `bun pe coloană vertebrală` în `client-ready`, prin:
- tăiere brutală a zgomotului
- întărirea next action-ului dominant
- introducerea pasului lipsă `scan / validate evidence`
- curățarea Home-ului
- curățarea Dosarului / Vault overview
- compactarea cockpitului și a drawerului
- păstrarea logicii: `finding -> cockpit -> dovadă validată -> dosar -> monitoring`

---

## Reguli de fier

### 1. Un finding = un cockpit = un singur loc de execuție

După deschiderea finding-ului, userul trebuie să poată:
- înțelege problema
- vedea ce face acum
- genera documentul dacă finding-ul cere document
- scana / valida artefactul rezultat
- salva dovada reală
- confirma
- închide cazul
- trimite rezultatul la dosar
- lăsa cazul în monitorizare

### 2. Nu mai sărim de la draft la dovadă

Pentru finding-urile care cer document sau artefact validabil:
- draftul nu este dovadă finală
- dovada finală trebuie să treacă prin `scan / validate evidence`
- fără validare clară, cazul nu poate intra în `dovadă la dosar`

### 3. O pagină = o intenție dominantă

- `Home` = orientare + snapshot + next action
- `Resolve list` = inbox + intrare în cockpit
- `Cockpit` = execuție
- `Dosar` = stare pachet + dovezi + export + audit depth

### 4. Infrastructura nu concurează cu acțiunea

Pe suprafețele primare nu au voie să domine:
- benchmark
- tools
- feed lung
- export center
- audit depth
- legal explainers
- rail-uri grele
- metadata lungă

### 5. Nimic din cele 3 documente nu este ignorat

Tot ce nu intră în primul val P0 intră explicit într-un val ulterior din același sprint.
Nu există “poate mai târziu” nenumit.

---

## Structura sprintului

Sprintul este împărțit în 6 valuri, într-o singură direcție.

---

## Wave 1 — Home Ruthless Cleanup

### Obiectiv

Home să răspundă în 5 secunde la:
- ce se aplică
- ce am găsit
- ce fac acum
- sunt mai bine sau mai rău decât înainte

### Task-uri

- [x] Tai de pe Home toate suprafețele care nu răspund direct la cele 4 întrebări.
- [x] Păstrez doar:
  - header de stare
  - snapshot în 3 blocuri
  - metric strip cu max 4 KPI
  - feed scurt cu max 3 evenimente
- [x] Fac blocul `Ce faci acum` dominant și evident mai important decât restul.
- [x] Scot de pe Home principal:
  - benchmark
  - semnale și instrumente
  - executive summary complet
  - PDF / export direct
  - scan website input
  - NIS2 evaluator
  - agent center
  - framework cards grele
  - legal explainers
  - feed lung
- [x] Mut ce este valoros, dar necritic, într-o zonă secundară colapsabilă sau în pagini dedicate.

### Definition of done

- Home are un singur CTA dominant.
- `Ce faci acum` este blocul rege.
- Snapshot-ul are doar:
  - `Ce se aplică`
  - `Ce am găsit deja`
  - `Ce faci acum`
- KPI-urile sunt max 4.
- Feed-ul este max 3 evenimente.
- Home nu mai arată ca tool launcher.

---

## Wave 2 — Snapshot / Onboarding Cleanup

### Obiectiv

Onboarding-ul și first snapshot-ul să nu se dubleze și să nu mai pară ambalate excesiv.

### Task-uri

- [x] Scot ecranul separat `Primul snapshot este gata`.
- [x] Păstrez un singur snapshot real.
- [x] Compactez onboarding-ul:
  - mai puțin text
  - mai puține badge-uri
  - mai puține mini-scene
- [x] Fac pasul 2 să pară doar:
  - date firmă
  - verificare automată
  - întrebări rămase
- [x] Mențin `Compli verifică` și first value clar.
- [x] Fac progresul și munca rămasă mai vizibile.

### Definition of done

- Nu mai există dublare snapshot / finish.
- Onboarding-ul pare liniar și mai scurt.
- Întrebările par confirmări inteligente, nu survey.
- Snapshot-ul final rămâne clar și dominat de `Ce faci acum`.

---

## Wave 3 — Resolve List + Cockpit Above-the-Fold Cleanup

### Obiectiv

Resolve list să rămână inbox, iar cockpitul să devină mai scurt și mai autoritar sus.

### Task-uri

- [x] Păstrez în Resolve List doar:
  - titlu finding
  - severitate
  - status scurt
  - ce trebuie făcut
  - intrare în caz
- [x] Scot execuția serioasă din listă.
- [x] Scot monitorizarea și dosarul din listă ca elemente dominante.
- [x] În cockpit, sus păstrez doar:
  - problema
  - `Acum faci asta`
  - acțiunea
  - scan / validate
  - confirmă și salvează
- [x] Cobor sub fold:
  - progress map mare
  - close condition explicat lung
  - asset recomandat
  - dosar details
  - monitoring details
  - provenance și metadata lungă
  - context juridic lung
- [x] Fac hero action și CTA-ul principal dominante.

### Definition of done

- Resolve list este scanabilă și nu concurează cu cockpitul.
- Cockpitul nu mai arată infrastructura înaintea acțiunii.
- Above the fold este despre execuție, nu despre sistem.

---

## Wave 4 — Scan / Validate Evidence

### Obiectiv

Să închidem gaura critică: lipsa validării explicite a dovezii înainte de dosar.

### Task-uri

- [x] Introduc blocul `Scan / Validate evidence` în cockpit sau în generator drawer, după generare și înainte de salvarea finală.
- [x] Pentru finding-urile documentare sau cu artefact validabil, blocul trebuie să arate:
  - documentul / artefactul curent
  - status validare
  - ce a trecut
  - ce a picat
  - ce trebuie corectat
- [x] Adaug acțiuni clare:
  - `Re-scannează`
  - `Regenerează`
  - `Înlocuiește documentul`
  - `Confirm și salvez dovada`
- [x] Salvez dovada finală doar dacă validarea este bună.
- [x] Blochez traseul `draft -> dovadă finală` acolo unde finding-ul cere artefact validabil.

### Definition of done

- Pasul de validare există explicit în flow.
- Userul poate vedea `valid / invalid`.
- Userul poate corecta și rerula validarea.
- Doar după validare poate merge în dosar.
- Acesta devine pas oficial între `Pregătești draftul` și `Dovadă la dosar`.

---

## Wave 5 — Generator Drawer + Success Moment + Monitoring Demotion

### Obiectiv

Drawerul să fie mai dens, success moment-ul mai curat, iar dosar/monitoring să se simtă ca aftercare, nu ca execuție.

### Task-uri

- [x] Compactez generator drawer:
  - mai puțin framing
  - mai puțin spațiu mort
  - pas activ mai clar
- [x] Refac flow-ul drawer-ului ca:
  - completezi
  - generezi
  - verifici
  - validezi
  - confirmi și salvezi dovada
- [x] Curăț success moment-ul:
  - artifact
  - sursă
  - saved time
  - next control
  - un CTA principal
  - un CTA secundar max
- [x] Păstrez dosar / vault / next control / monitoring status / reopen logic.
- [x] Cobor detaliile complete despre dosar și monitoring ca aftercare, nu ca bloc dominant.

### Definition of done

- Drawerul e mai dens și mai clar.
- Success moment-ul transmite clar `ai închis cazul`.
- Monitoring și dosar nu mai concurează cu execuția.

---

## Wave 6 — Dosar / Vault Ruthless Cleanup

### Obiectiv

Overview-ul Dosarului să spună imediat dacă pachetul stă în picioare și ce blochează.

### Task-uri

- [x] Fac overview-ul Dosarului să conțină doar:
  - status pachet
  - 3 KPI mari
  - blockers strip
  - CTA principal `Rezolvă gap-urile`
  - CTA secundar `Deschide Audit Pack`
- [x] Scot complet de pe overview:
  - AI Pack overview mare
  - Snapshot Pack overview mare
  - registru dovezi complet
  - snapshot / baseline complet
  - drift history complet
  - registru validări complet
  - cronologie audit completă
  - matrice completă
  - confirmări pe control / familie
  - explainers lungi
  - CTA-uri multiple
- [x] Restructurez Dosarul în 4 suprafețe:
  - `Overview`
  - `Dovezi & Gap-uri`
  - `Pachete & Export`
  - `Trasabilitate & Audit`
- [x] În `Dovezi & Gap-uri` păstrez:
  - finding -> dovadă cerută -> de ce lipsește -> link spre rezolvare
- [x] În `Pachete & Export` păstrez:
  - Audit Pack
  - AI Pack
  - Snapshot Pack
  - Annex / stakeholder export
  - status clar + motiv blocare
- [x] În `Trasabilitate & Audit` mut:
  - baseline
  - drift
  - validări
  - cronologie
  - matrice
  - familii / confirmări

### Definition of done

- Pe overview userul răspunde în 5 secunde:
  - e gata pachetul?
  - ce îl blochează?
  - ce am deja?
  - ce fac acum?
- Overview-ul are doar 2 CTA-uri.
- Audit depth nu mai infectează prima față.

---

## Ce nu ignorăm din documente

### Din `full_polish_fix_plan`

- [x] un finding = un cockpit complet
- [x] scan / validate evidence
- [x] landing simplificat
- [x] pricing simplificat
- [x] onboarding compactat
- [x] first snapshot fără dublare
- [x] resolve list disciplinat
- [x] cockpit above-the-fold curățat
- [x] drawer compactat
- [x] success moment curățat
- [x] dosar / monitoring tratate ca output / aftercare

### Din `home_ruthless_cleanup_plan`

- [x] Home răspunde la cele 4 întrebări
- [x] max 4 KPI
- [x] max 3 evenimente în feed
- [x] un singur CTA dominant
- [x] framework cards grele scoase de pe Home
- [x] tools / agents / benchmark / export scoase de pe Home principal

### Din `dosar_vault_ruthless_cleanup_plan`

- [x] overview minimal
- [x] 3 KPI max
- [x] 2 CTA max
- [x] blockers clari
- [x] tabs locale pentru restul
- [x] registru dovezi și gap-uri separate
- [x] pachete și export separate
- [x] audit / trasabilitate separate

---

## Ordine de implementare

### Phase 1
- Home cleanup
- snapshot cleanup
- onboarding cleanup

### Phase 2
- resolve list cleanup
- cockpit above-the-fold cleanup

### Phase 3
- `Scan / Validate evidence`
- gating real înainte de `dovadă la dosar`

### Phase 4
- generator drawer cleanup
- success moment cleanup
- dosar / monitoring demotion în cockpit

### Phase 5
- Dosar / Vault ruthless cleanup

### Phase 6
- landing + pricing cleanup
- final copy / visual polish cross-flow

---

## Definition of done

Sprintul este `done` doar dacă:
- Home este orientare, nu tool launcher
- Snapshot-ul nu se dublează
- Resolve list este inbox, nu cockpit mic
- Cockpitul are un above-the-fold scurt și executabil
- Există pas explicit `Scan / Validate evidence`
- Nu mai putem salva dovada finală fără validare acolo unde finding-ul cere asta
- Success moment-ul este clar și liniștit
- Dosarul are overview mic și tabs locale pentru restul
- Flow-ul complet este:
  - onboarding
  - snapshot
  - finding
  - generate
  - validate
  - save evidence
  - close
  - dossier
  - monitoring

---

## Validare

### UX / pagini
- smoke pe:
  - onboarding
  - snapshot
  - resolve list
  - cockpit
  - generator drawer
  - dosar overview

### Runtime logic
- teste pe:
  - close gating
  - save evidence
  - validate evidence
  - dossier linkage
  - under_monitoring

### Build
- `npm test`
- `npm run build`

---

## Testul final brutal

Produsul este client-ready doar dacă userul poate:
- intra în onboarding
- vedea un snapshot clar
- vedea clar ce face acum
- intra în finding
- genera documentul necesar
- scana / valida documentul
- salva dovada reală
- închide cazul
- vedea că a intrat la dosar
- înțelege că rămâne sub monitorizare

Dacă lipsește pasul de validare, sprintul nu este terminat.
