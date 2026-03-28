# CompliAI — 3 User App Skeleton & IA Bible

## Ce este acest document

Acesta este documentul corect pentru:
- cei 3 useri țintă
- scheletul aplicației
- Information Architecture
- ordinea ecranelor
- traseul complet de la awareness până la dosar, monitorizare și redeschidere
- ce vede userul
- ce citește
- ce decide
- pe ce apasă
- unde ajunge
- ce trebuie să facă sistemul

Acesta NU este:
- document abstract
- document de principii
- document doar pentru cockpit

Acesta este:
## harta exactă a aplicației, construită pentru cei 3 useri reali

---

# 1. Ce construim de fapt

Produsul nu este:
- un dashboard generic
- un tool de scanare
- un generator de documente
- un centru de rapoarte

Produsul este:
## un sistem care ia un user de la „am auzit de problema asta” la „am închis cazul, am dovadă, sunt monitorizat”

Formula produsului:

**awareness -> intrare -> profilare firmă -> applicability -> findings -> resolve -> dovadă -> dosar -> monitorizare -> redeschidere când trebuie**

---

# 2. Cei 3 useri țintă

## U1 — Mihai / Proprietar IMM / Solo
### Ce vrea
- să înțeleagă repede dacă are probleme
- să știe ce i se aplică
- să vadă primul pas
- să închidă un caz fără haos
- să aibă „ce arăta” la control

### Ce nu vrea
- jargon
- tool-uri multe
- pagini specialist în față
- hub-uri grele
- alegere între prea multe direcții

### Metric de succes
- a intrat
- a văzut snapshot-ul
- a închis primul caz
- a văzut dovada în Dosar
- înțelege că sistemul îl monitorizează

---

## U2 — Diana / Consultant / Partner
### Ce vrea
- să vadă repede ce client arde
- să intre în workspace-ul clientului corect
- să rezolve cazuri fără pierdere de context
- să livreze pachete și status clar clientului

### Ce nu vrea
- să se piardă între org-uri
- să vâneze informații prin 5 module
- să facă handoff-uri manuale fără urmă

### Metric de succes
- vede urgentele pe portofoliu
- intră pe clientul corect
- închide finding-ul
- livrează pachetul / dovada

---

## U3 — Radu / Compliance intern
### Ce vrea
- control real
- audit trail
- claritate pe gap-uri
- execuție disciplinată
- vizibilitate pe monitorizare și revalidare

### Ce nu vrea
- produse paralele
- lipsă de urmă
- validări „soft”
- ambiguitate între stări

### Metric de succes
- spine-ul funcționează
- finding-urile se închid curat
- dovezile sunt acceptabile
- dosarul este credibil
- monitoring-ul este viu

---

# 3. IA principală a aplicației

## Primară — obligatorie pentru toți
- **Acasă**
- **Scanează**
- **De rezolvat**
- **Dosar**
- **Setări**

## Secundară / contextuală / specialist
- NIS2
- DSAR
- Fiscal
- Vendor Review
- DORA
- Whistleblowing
- Audit Log
- Trust / exports avansate
- Agents
- Calendar
- sisteme AI
- alte module de profunzime

## Regula
Userul standard nu trebuie să-și facă treaba prin modulele specialist.
Acestea sunt:
- suport
- profunzime
- tool-uri contextuale
nu scheletul principal.

---

# 4. Scheletul complet al aplicației

## Stratul 1 — Public / Awareness
- Landing
- Pricing
- Login / Register

## Stratul 2 — Entry / Activation
- Onboarding
- First Snapshot

## Stratul 3 — Core operation
- Home
- De rezolvat
- Finding cockpit
- Dosar

## Stratul 4 — Continuity
- Monitoring
- Alerts / feed
- Revalidation
- Reopen

## Stratul 5 — Specialist depth
- NIS2
- DSAR
- Fiscal
- AI systems
- etc.

---

# 5. Harta completă per user — Mihai / Solo

## 5.1 Awareness
### Trigger
- vede reclamă
- aude de produs
- contabilul îi spune că trebuie să facă ceva
- caută pe Google ceva legat de GDPR / NIS2 / e-Factura

### Intrare
- `/`
- `/pricing`

### Ce trebuie să vadă
1. ce face produsul
2. că nu este doar scanner
3. că pleacă de la firmă și ajunge la dovadă
4. că există un traseu simplu
5. CTA clar

### Ce citește
- headline
- subheadline
- 3 pași
- 3 rezultate
- CTA

### Ce decide
- Începe gratuit
- Vezi demo
- Vezi pricing
- părăsește

---

## 5.2 Signup / Login
### Route
- `/login`
- `/register`

### Ce face
- intră
- creează cont
- se autentifică

### Ce primește
- sesiune activă
- redirect la onboarding

---

## 5.3 Onboarding — wizard real, observabil
### Route
- `/onboarding`

## Structură obligatorie
### Pas 1 — Rol
- alege: Proprietar / Manager
- vede clar că e pasul 1
- apasă `Continuă`

### Pas 2 — Date firmă
- introduce CUI
- introduce website
- confirmă sector
- confirmă mărime
- alte date minime relevante

### Pas 3 — Întrebări suplimentare
Dacă sistemul are nevoie de clarificări, acestea NU apar prin card growth.
Trebuie să apară clar ca:
- pas nou
sau
- sub-pas nou

Userul trebuie să vadă:
- `Mai avem 3 întrebări`
- `Pas 3 din 5`

### Pas 4 — Compli verifică
- sistemul rulează
- userul vede clar că sistemul muncește

### Pas 5 — Primul Snapshot
- ce se aplică
- ce am găsit
- ce faci acum

## Ce nu trebuie să existe
- `/onboarding/finish` ca ecran duplicat
- două CTA-uri concurente după snapshot
- întrebări care apar pe ascuns
- survey lung fără framing

---

## 5.4 First Snapshot
### Scop
Să-i arate lui Mihai exact:
1. ce i se aplică
2. ce s-a găsit
3. ce face acum

### Ce face
- citește aplicabilitatea
- vede 2–5 findings inițiale
- vede CTA principal

### Click principal
- `Deschide primul caz`
sau
- `Mergi la De rezolvat`

### Next route
- `/dashboard/resolve`

---

## 5.5 Acasă
### Când vine aici
- după onboarding
- la reveniri
- din navigație

### Ce trebuie să vadă
1. readiness global
2. ce se aplică
3. ce am găsit
4. ce faci acum
5. 3–4 KPI
6. max 3 evenimente recente

### Ce face
- se orientează
- decide dacă merge direct în `De rezolvat`
- vede dacă e mai bine sau mai rău decât data trecută

### CTA principal
- `Deschide cazul`

### Nu trebuie să facă aici
- scan
- benchmark
- executive summary lung
- tool shopping
- specialist navigation

---

## 5.6 De rezolvat
### Route
- `/dashboard/resolve`

### Ce vede
- findings active
- severitate
- status
- ce trebuie făcut
- CTA / intrare

### Ce face
- alege primul caz
- intră în cockpit

### Click
- row / CTA

### Next route
- `/dashboard/resolve/[findingId]`

---

## 5.7 Cockpit — Mihai
### Ce trebuie să simtă
- „Am intrat în caz”
- „Aici îl rezolv”
- „Nu mă plimbă”

## Stack obligatoriu
### Sus
- titlu finding
- severitate
- mini-stepper
- „Acum faci asta”

### Pasul 1 — Confirmi cazul
Mihai înțelege și confirmă:
- `Confirm și rezolv`
sau
- `Nu se aplică`

### Pasul 2 — Pregătești rezolvarea
#### Dacă e documentar
- generator
- preview

#### Dacă e operațional
- note
- upload
- checklist simplu

#### Dacă e extern
- handoff controlat

### Pasul 3 — Verifici dovada
#### Dacă e documentar
- scan / validate
- pass / fail
- ce lipsește

#### Dacă e operațional
- dovadă suficientă / incompletă

### Pasul 4 — Trimiți la Dosar
- `Confirmă și salvează`

### Pasul 5 — Monitorizat
- next review
- success
- CTA:
  - `Următorul caz`
  - `Deschide Dosarul`

---

## 5.8 Dosar — Mihai
### Route
- `/dashboard/dosar`

### Ce vrea el
- să vadă ce are
- să vadă ce lipsește
- să vadă dacă este „în regulă”
- să poată arăta ceva

## Structura
### Overview
- status pack
- dovezi valide
- gap-uri active
- drift deschis
- CTA:
  - `Rezolvă gap-urile`
  - `Deschide Audit Pack`

### Dovezi & Gap-uri
- ce are
- ce lipsește
- link spre caz

### Pachete & Export
- pack client
- export

### Trasabilitate
- doar dacă are nevoie

---

## 5.9 Monitoring — Mihai
### Cum ajunge aici
- feed în Home
- alertă
- dosar status
- caz reaprins

### Ce vede
- ce s-a verificat
- ce s-a schimbat
- dacă un caz s-a redeschis

### Ce face
- intră din nou în același cockpit

### Next route
- `/dashboard/resolve/[findingId]`

---

## 5.10 Reopen
### Când se întâmplă
- drift
- review date
- schimbare legală / situațională
- dovadă expirată

### Ce vede
- cazul nu mai este doar închis
- sistemul explică de ce s-a reaprins
- stepper-ul revine într-o stare relevantă

### Ce face
- reverifică
- actualizează
- reconfirmă
- retrimite la Dosar
- rămâne sub watch

---

# 6. Harta completă per user — Diana / Partner

## 6.1 Awareness
### Trigger
- recomandare
- networking
- LinkedIn
- client problem
- competitor research

### Intrare
- landing
- pricing
- demo

### Ce trebuie să înțeleagă
- nu cumpără doar compliance
- cumpără:
  - portofoliu
  - urgențe
  - execuție
  - livrare către client

### Decizie
- începe trial
- cere demo
- cere plan Partner

---

## 6.2 Signup / Login
### Ce face
- creează cont
- intră
- selectează modul Consultant / Partner

### Next route
- onboarding

---

## 6.3 Onboarding — Diana
### Pas 1
- alege `Consultant / Partner`

### Pas 2
- profil propriu
- eventual date firmă / cabinet / brand

### Pas 3
- confirmă că va lucra pe mai mulți clienți

### Pas 4
- sistemul pregătește workspace-ul de portofoliu

### Pas 5
- ajunge în:
  - portfolio view
  sau
  - onboarding pentru primul client

---

## 6.4 Portfolio / client intake
### Ce vede
- portofoliu gol sau cu clienți
- CTA:
  - `Adaugă client`

### Ce face
- adaugă client
- introduce CUI client
- eventual website
- pornește profilarea clientului

### Ce face sistemul
- creează workspace client
- rulează ANAF / website / profiling
- generează findings client

---

## 6.5 Portfolio working loop
### Ce vede
- clienți
- urgențe
- scoruri
- ce client arde

### Ce face
- alege clientul
- intră în workspace-ul clientului

### Next routes
- `/dashboard`
- `/dashboard/resolve`
- `/dashboard/dosar`
dar în contextul clientului

---

## 6.6 Resolve — Diana
### Scop
Să intre pe cazul clientului și să-l închidă fără să piardă contextul de portofoliu.

### Ce face
- intră în `De rezolvat` al clientului
- deschide finding-ul
- lucrează în cockpit

### Regula
Execuția per client trebuie să fie aceeași ca la Mihai.
Diferența este doar contextul și faptul că:
- lucrează în numele clientului
- are nevoie de handoff și livrare clare

---

## 6.7 Cockpit — Diana
### Ce are diferit
- poate avea note pentru client
- poate avea workflow de livrare
- poate avea handoff clar după închidere

### Dar regulile rămân
- un caz
- un cockpit
- un fir
- dovadă
- Dosar
- Monitorizare

---

## 6.8 Dosar — Diana
### Ce vrea
- să vadă ce poate trimite clientului
- să vadă ce este încă blocat
- să exporte

### Ce face
- intră în Dosar
- verifică blockers
- deschide pachetul
- exportă / trimite

### Output
- raport
- pack
- handoff clar către client

---

## 6.9 Monitoring — Diana
### Ce vrea
- să știe ce client cere atenție
- să reintre rapid în cazul clientului

### Flow
- alertă în portofoliu
- click pe client
- click pe caz
- reentry în cockpit

---

# 7. Harta completă per user — Radu / Compliance intern

## 7.1 Awareness
### Trigger
- audit intern
- board request
- incident
- nevoie de sistem
- maturitate compliance

### Intrare
- demo
- pricing
- sales conversation
- trial

### Ce trebuie să înțeleagă
- produsul are spine operațional
- are audit trail
- are dovadă
- are monitorizare
- nu este doar o jucărie UI

---

## 7.2 Signup / Login
### Ce face
- intră
- selectează `Responsabil conformitate`

---

## 7.3 Onboarding — Radu
### Ce este diferit
- poate avea mai multe clarificări
- poate activa module specialist
- poate avea nevoie de setări mai precise

### Dar structura rămâne wizard
Nu are voie să devină haos.

### Pași
1. rol
2. firmă
3. clarificări
4. verificare
5. snapshot

---

## 7.4 Home — Radu
### Ce vrea
- stare reală
- readiness
- gap-uri active
- revalidări
- schimbări

### Ce trebuie să vadă
- același Home clar
- eventual cu mai multă adâncime disponibilă, dar nu în fața principală

---

## 7.5 Resolve — Radu
### Ce vrea
- prioritizare
- severitate
- stări reale
- acces rapid în caz
- posibilitate de a lucra sistematic

### Flow
- triage
- deschide caz
- lucrează în cockpit
- închide
- verifică Dosar
- monitorizează revalidarea

---

## 7.6 Cockpit — Radu
### Ce are nevoie în plus
- urmă clară
- dovadă clară
- context legal disponibil
- close conditions clare
- revalidation clară

### Dar UX-ul nu trebuie să devină mai prost
Adâncimea e disponibilă:
- sub fold
- în accordion
- în tabs secundare
nu sus peste acțiune

---

## 7.7 Dosar — Radu
### Ce vrea
- pachet credibil
- blockers
- validări
- traceability
- timeline
- audit trail

### Structură corectă
- overview simplu
- evidence & gaps
- packs & export
- traceability & audit

### Important
Radu are nevoie de profunzime.
Dar profunzimea nu are voie să infecteze overview-ul pentru toată lumea.

---

## 7.8 Monitoring — Radu
### Ce vrea
- vizibilitate pe ce s-a schimbat
- review dates
- reopened cases
- drift
- follow-up

### Flow
- vede alertă
- intră în caz
- reverifică
- confirmă
- actualizează
- retrimite la Dosar
- lasă sub monitorizare

---

# 8. Scheletul aplicației pe etape

## Etapa 1 — Public
### Ecrane
- Landing
- Pricing
- Login / Register

### Ce face fiecare user aici
- înțelege produsul
- decide să intre

---

## Etapa 2 — Activation
### Ecrane
- Onboarding wizard
- Snapshot final

### Ce face fiecare user aici
- definește cine este
- definește firma / clientul
- lasă sistemul să profileze
- vede ce se aplică și ce s-a găsit

---

## Etapa 3 — Core work
### Ecrane
- Home
- De rezolvat
- Finding cockpit

### Ce face fiecare user aici
- se orientează
- alege cazul
- execută
- închide

---

## Etapa 4 — Proof
### Ecrane
- Dosar
- Pachete & export

### Ce face fiecare user aici
- vede ce are
- vede ce lipsește
- exportă când e gata

---

## Etapa 5 — Continuity
### Ecrane
- feed / alerts
- monitoring status
- reopened cases

### Ce face fiecare user aici
- află ce s-a schimbat
- revine în caz
- reverifică
- reînchide

---

# 9. Reguli IA și UX obligatorii

## Rule 1
Acasă nu este tot produsul.
Este orientare + stare + next action.

## Rule 2
Scanează este intake, nu centru de verdict și nu pseudo-cockpit.

## Rule 3
De rezolvat este inbox + intrare, nu loc de rezolvare completă.

## Rule 4
Cockpitul este locul real de execuție.

## Rule 5
Dosar este rezultat + dovadă + export, nu proces.

## Rule 6
Monitoring vine după închidere și trimite userul înapoi în caz, nu într-un nou haos.

## Rule 7
Întrebările noi din onboarding trebuie să apară ca pași noi observabili.

## Rule 8
Nicio dovadă validabilă nu sare direct din draft în „acceptat” fără validate.

---

# 10. Click-path summary per user

## Mihai
Landing -> Login/Register -> Onboarding -> Snapshot -> Resolve -> Cockpit -> Dosar -> Monitoring -> Reopen -> Cockpit

## Diana
Landing/Pricing -> Login/Register -> Onboarding Partner -> Portfolio -> Client Workspace -> Resolve -> Cockpit -> Dosar -> Export -> Monitoring -> Reopen

## Radu
Demo/Pricing -> Login/Register -> Onboarding Compliance -> Home -> Resolve -> Cockpit -> Dosar -> Monitoring -> Revalidation / Reopen

---

# 11. Ce trebuie să ofere aplicația ca userul să ducă taskul cap-coadă

## Pentru Mihai
- claritate
- primul caz
- generator dacă se poate
- validate evidence
- dovadă la Dosar
- monitorizare

## Pentru Diana
- context client clar
- cazuri prioritizate
- execuție rapidă
- handoff clar
- export clar

## Pentru Radu
- urmă reală
- close conditions reale
- validări serioase
- traceability
- revalidation și reopen curate

---

# 12. Ce nu avem voie să facem

1. să amestecăm spine-ul cu modulele specialist
2. să lăsăm onboarding-ul să ascundă pași
3. să lăsăm Dosarul să fie reports dump
4. să lăsăm Home să fie tool mall
5. să lăsăm cockpitul să expulzeze userul arbitrar
6. să tratăm toate evidențele identic
7. să lăsăm userul fără next action clar
8. să construim ecrane fără responsabilitate clară

---

# 13. Formula finală

Pentru toți cei 3 useri, aplicația trebuie să se simtă așa:

**aud de produs -> înțeleg ce face -> intru -> sistemul îmi înțelege contextul -> văd ce se aplică și ce s-a găsit -> intru pe cazul corect -> îl rezolv cap-coadă în cockpit -> dovada intră la Dosar -> cazul rămâne monitorizat -> dacă se reaprinde, mă întorc în același loc și îl reînchid**

Asta este harta corectă a aplicației.
