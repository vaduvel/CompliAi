# CompliAI — IA / UX / UI Skeleton pe Secțiuni

Data: `2026-03-27`  
Status: `schelet structural înainte de refactor motor`  
Surse:  
- [compliai_smart_resolve_cockpit_bible.md](/Users/vaduvageorge/Downloads/compliai_smart_resolve_cockpit_bible.md)  
- [compliai-user-flow-1to1-runtime-audit.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-user-flow-1to1-runtime-audit.md)  
- [compliai-master-blueprint.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-master-blueprint.md)  

---

## 0. Decizia

Da, putem fixa acum scheletul de IA / UX / UI înainte de refactorul de motor.

Motiv:
- bible-ul este suficient de precis pentru `cockpit`, `mini-stepper`, `validate evidence`, `handoff controlat` și `onboarding observabil`
- auditul 1:1 spune clar unde runtime-ul curent rupe acel model
- împreună sunt suficiente ca să blocăm ordinea pe ecran și rolul fiecărei secțiuni

Ce NU oferă bible-ul singur:
- nu definește tot produsul cap-coadă
- nu definește complet `Home`, `Dosar`, `Portfolio`, `Settings`

Ce oferă auditul peste bible:
- exact unde runtime-ul actual deviază
- ce suprafețe sunt prea grele
- ce zone sunt produse paralele

Deci ordinea bună este:
1. fixăm scheletul de produs
2. refactorizăm runtime-ul ca să respecte scheletul
3. abia după aceea atingem din nou motorul unde este necesar

---

## 1. Principiul structural unic

Produsul are un singur traseu principal:

`Landing -> Login/Register/Demo -> Onboarding -> Snapshot -> De rezolvat -> Cockpit -> Dosar -> Monitorizare`

Tot ce este în afara lui este:
- secundar
- suport
- specialist
- sau portofoliu

Nu există două centre egale de execuție.

---

## 2. Reguli globale de IA / UX / UI

## 2.1 O pagină = o intenție dominantă

Fiecare suprafață trebuie să răspundă la o singură întrebare principală:
- `Landing`: de ce să încep?
- `Login/Register`: cum intru repede?
- `Onboarding`: ce trebuie să completez acum?
- `Home`: ce fac acum?
- `Resolve`: care e următorul caz?
- `Cockpit`: cum închid cazul ăsta?
- `Dosar`: ce am închis și ce dovadă am?
- `Monitoring`: ce trebuie reverificat?

## 2.2 Maximum 1 CTA dominant per stare

Secundarele pot exista, dar nu concurează.

## 2.3 Acțiunea bate contextul

Ordinea canonică este:

`Summary -> Action -> Validation -> Result -> Detail`

## 2.4 Execuția nu iese din cockpit decât controlat

`inline` > `drawer / side sheet` > `handoff controlat`

## 2.5 Dosarul și monitorizarea sunt rezultat

Nu sunt loc de lucru înainte de închiderea cazului.

---

## 3. Scheletul pe secțiuni

## 3.1 Landing

### Intenția dominantă

Să convingă userul să înceapă imediat.

### Întrebarea userului

`Este pentru mine și ce se întâmplă dacă încep?`

### Ordinea UI / UX

1. badge de urgență / context piață
2. H1 clar
3. subtitlu cu traseul complet
4. CTA principal `Începe gratuit`
5. journey în 4 pași
6. problem framing
7. ce primești
8. pentru cine
9. pricing teaser

### CTA dominant

`Începe gratuit`

### CTA secundar

`Vezi demo live`

### Ce nu are voie

- 3 CTA-uri primare
- secțiuni prea tehnice
- să sară peste `monitorizare` în promisiune

### Gap din audit

- CTA nu deschide register-first
- journey are 3 pași, nu 4
- lipsește problem section explicit

---

## 3.2 Login / Register

### Intenția dominantă

Să bage userul în produs fără fricțiune.

### Întrebarea userului

`Cum intru imediat?`

### Ordinea UI / UX

1. logo + tagline scurt
2. 2-3 value props scurte
3. tab clar `Login / Creează cont`
4. form simplu
5. eroare inline
6. submit

### CTA dominant

`Creează cont` sau `Autentificare`, în funcție de mod

### Ce nu are voie

- fricțiune mare înainte de onboarding
- mod implicit greșit pentru CTA-ul de pe landing

### Gap din audit

- landing duce în login, nu în register
- register cere prea mult prea devreme

---

## 3.3 Onboarding

### Intenția dominantă

Să transforme datele de intrare în primul snapshot clar.

### Întrebarea userului

`Ce mai trebuie să completez acum ca să primesc findings bune?`

### Ordinea UI / UX

#### Coloană stânga

1. brand
2. progress rail
3. headline scurt
4. rol selectat
5. stare curentă

#### Coloană dreapta

1. pas activ
2. titlu clar
3. un singur obiectiv per ecran
4. întrebările curente
5. CTA `Continuă`

### Pași canonici

1. `Rol`
2. `Profil firmă`
3. `Întrebări suplimentare`
4. `Verificare automată`
5. `Snapshot`

### CTA dominant

`Continuă`

### Ce nu are voie

- card care se umflă cu întrebări noi
- întrebări noi fără framing nou
- ieșire identică pentru toate persoanele dacă produsul promite altceva

### Gap din audit

- nu există pas explicit de `legi aplicabile și de ce`
- partner și compliance nu ies persona-aware

---

## 3.4 Home / Snapshot

### Intenția dominantă

Să orienteze userul imediat spre următoarea acțiune cu impact.

### Întrebarea userului

`Ce fac acum?`

### Ordinea UI / UX

1. `Primary Action Hero`
2. `Ce ți se aplică`
3. `Ce am găsit deja`
4. KPI strip
5. activitate recentă
6. instrumente secundare sub disclosure

### CTA dominant

`Rezolvă acum`

### Ce nu are voie

- 3 carduri de aceeași greutate în primul ecran
- feed sau utilitare concurente cu next action

### Gap din audit

- `NextBestAction` este doar unul dintre trei carduri egale

---

## 3.5 De rezolvat

### Intenția dominantă

Să lase userul să aleagă rapid următorul caz.

### Întrebarea userului

`Care este următorul caz pe care îl închid?`

### Ordinea UI / UX

1. PageIntro cu număr de cazuri
2. filtre simple
3. search
4. listă severity desc
5. empty state util
6. filtre secundare sub disclosure

### CTA dominant

click pe rândul de finding

### Ce nu are voie

- board greu
- analytics concurent
- prea multe moduri de vedere primare

### Stare actuală

Această secțiune este aproape corectă și poate rămâne baza.

---

## 3.6 Cockpit

### Intenția dominantă

Să închidă cazul într-un singur loc.

### Întrebarea userului

`Cum închid cazul ăsta, acum?`

### Ordinea UI / UX canonică

1. header compact
2. mini-stepper sticky
3. bloc dominant `Acum faci asta`
4. modul de execuție
5. bloc de validare a dovezii
6. success strip
7. context / legal / dossier details sub fold

### Pași canonici de stepper

1. `Confirmi cazul`
2. `Pregătești rezolvarea`
3. `Verifici dovada`
4. `Trimiți la Dosar`
5. `Monitorizat`

### Tipuri de execuție

#### Documentar

- generator
- preview
- regenerate / replace
- continue to validation

#### Operațional

- instrucțiuni scurte
- evidence note
- upload
- checklist dacă e necesar

#### Specialist

- mini-wizard inline
- sau drawer
- sau handoff controlat

#### Revalidation

- dovada anterioară
- reconfirmare
- next review

### CTA dominant per stare

- `Confirm și rezolv`
- `Generează draftul`
- `Verifică dovada`
- `Confirmă și salvează`
- `Următorul caz`

### Ce nu are voie

- 3 panouri grele egale
- context mai sus decât acțiunea
- draft -> dovadă finală fără validate
- 4 CTA-uri primare simultan
- redirect arbitrar fără return logic

### Gap din audit

- `FindingExecutionCard` nu este montat
- `FindingNarrativeCard` nu este montat
- multe flow-uri încă folosesc `workflowLink` ca execuție principală

---

## 3.7 Dosar

### Intenția dominantă

Să arate ce s-a închis și cu ce dovadă.

### Întrebarea userului

`Ce am deja pregătit pentru audit sau control?`

### Ordinea UI / UX

1. PageIntro
2. `Cazuri rezolvate și dovezi`
3. `Documente generate`
4. `Export`
5. `Trasabilitate / audit`

### CTA dominant

`Deschide cazul` sau `Exportă`

### Ce nu are voie

- să devină loc de lucru înainte de închiderea cazului
- să împrăștie userul în 4 output surfaces egale

### Gap din audit

- output-ul este încă fragmentat
- success-ul din cockpit nu întoarce suficient de clar spre `Dosar`

---

## 3.8 Monitoring

### Intenția dominantă

Să păstreze continuitatea după închiderea cazului.

### Întrebarea userului

`Ce trebuie reverificat și când?`

### Ordinea UI / UX

1. success strip după închidere
2. next review
3. motivul monitoringului
4. triggerii de redeschidere
5. feed / notificări

### CTA dominant

`Următorul caz`

### CTA secundar

`Deschide Dosarul`

### Ce nu are voie

- să pară badge mort
- să trimită userul în alt dashboard imediat după succes

### Gap din audit

- monitoring-ul există în date, dar nu e încă exprimat uniform în cockpit

---

## 3.9 Scan

### Intenția dominantă

Să alimenteze produsul cu surse noi.

### Întrebarea userului

`Ce aduc în Compli ca să genereze findings noi?`

### Ordinea UI / UX

1. PageIntro clar de intake
2. selector de sursă
3. workspace-ul sursei curente
4. rezultat
5. CTA spre `De rezolvat`
6. istoric sub nivelul activ

### Ce nu are voie

- să dubleze cockpitul
- să devină centru de execuție pentru findings

### Regula structurală

`Scan` rămâne în spine doar pentru:
- document
- text
- website

Tot ce este:
- manifest
- yaml
- mod agent
- discovery specializat

trece în mod secundar, nu în primul flow.

---

## 3.10 Module specialist

### Intenția dominantă

Să ofere execuție avansată sau suport secundar, fără să concureze cu spine-ul.

### Regula structurală

Pentru `DSAR`, `NIS2`, `Fiscal`, `Sisteme`, `DORA`, `Whistleblowing`:

1. dacă țin de un finding, intrarea trebuie să vină din cockpit
2. return-ul trebuie să păstreze `findingId`
3. trebuie să fie clar de ce pleacă userul și unde revine
4. dacă flow-ul poate fi făcut inline sau drawer, asta bate full-page

### Ce nu are voie

- să devină centrul primar de execuție pentru cazul din cockpit
- să introducă alt stack principal pentru același caz

### Realitate curentă

- `Scan` este aproape corect
- `DSAR` și `Fiscal` sunt parțial corecte
- `NIS2` este încă suită separată
- `Sisteme`, `DORA`, `Whistleblowing` sunt produse paralele

---

## 3.11 Partner / Portfolio

### Intenția dominantă

Să permită triage cross-client, nu execuție haotică cross-client.

### Întrebarea userului

`Pe ce client trebuie să intru acum?`

### Ordinea UI / UX

1. overview portofoliu
2. alerts / urgency
3. click în client
4. intrare în workspace client
5. execuție în flow-ul normal al clientului
6. reporting după

### Regula structurală

Portofoliul este:
- triage
- prioritizare
- raportare

Nu este cockpitul principal.

### Gap din audit

- `portfolio/tasks` împinge produsul spre execuție batch cross-client
- `portfolio/reports` nu este încă raport livrabil matur

---

## 3.12 Settings

### Intenția dominantă

Să configureze workspace-ul, nu să arate un admin console disproporționat.

### Întrebarea userului

`Ce trebuie să configurez, nu ce infrastructură are produsul?`

### Ordinea UI / UX

1. profil workspace
2. membri / acces
3. integrări relevante
4. billing
5. operațional avansat doar pentru cine are nevoie

### Ce nu are voie

- să fie vizibil prea infrastructural pentru solo
- să dubleze `settings / setari / account settings`

---

## 4. Ce înseamnă asta pentru refactor

Refactorul corect nu începe din motor.

Începe din:

1. scheletul secțiunilor
2. ordinea lor
3. CTA-ul dominant per secțiune
4. ce este primar vs secundar
5. ce rămâne în cockpit vs ce pleacă în handoff controlat

Abia după aceea refactorizăm:
- kernel consumption
- workflow links
- module specialist
- aftercare / dossier
- monitoring rendering

---

## 5. Decizia finală

Da, `compliai_smart_resolve_cockpit_bible.md` este suficient de bun ca să devină:
- sursa de adevăr pentru cockpit
- sursa de adevăr pentru onboarding observabil
- sursa de adevăr pentru ordinea pe ecran în cazurile de rezolvare

Dar nu este suficient singur pentru tot produsul.

Pentru tot produsul, trebuie combinat cu auditul 1:1.

Formula corectă este:

`Bible = reguli și ordine pentru cockpit/onboarding`

plus

`Audit 1:1 = adevărul despre unde runtime-ul actual respectă sau rupe produsul`

Din combinația lor rezultă acest schelet.

Acesta este documentul după care trebuie refăcută structura. Motorul vine după.
