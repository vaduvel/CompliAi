# CompliAI — Audit 1:1 User Flow vs Runtime

Data: `2026-03-27`  
Status: `audit total / sursă de adevăr pentru corecția de produs`  
Baseline code: `HEAD c8c5536` + working tree curent  

---

## 0. Scop

Acest document există ca să oprească deriva.

Nu este un document de viziune.  
Nu este un document de pitch.  
Nu este un document de „aproape”.

Este auditul strict dintre:
- flow-ul cerut explicit de produs
- blueprint-ul master
- runtime-ul real al aplicației

Întrebarea unică este:

> La fiecare pas, pentru fiecare tip de user, utilizatorul poate face sau nu exact ce îi promitem?

---

## 1. Surse de adevăr

Ordinea de adevăr folosită aici este:

1. [docs/compliai-master-blueprint.md](/Users/vaduvageorge/Desktop/CompliAI/docs/compliai-master-blueprint.md)
2. flow-ul explicit stabilit în conversație:
   - `landing / marketing`
   - `login sau demo`
   - `onboarding: rol -> CUI -> ANAF -> site scan -> întrebări`
   - `snapshot clar`
   - `findings`
   - `rezolvare în cockpit`
   - `dosar`
   - `monitorizare`
   - `module standalone doar după, ca unelte secundare`
3. runtime-ul real din codul aplicației

---

## 2. Contractul de produs care NU mai trebuie încălcat

### 2.1 Traseul principal obligatoriu

Traseul principal corect este:

`Landing -> Login/Register/Demo -> Onboarding -> Snapshot -> De rezolvat -> Cockpit -> Dosar -> Monitorizare`

### 2.2 Regula de fier

`Un finding = un cockpit = un singur loc de execuție`

Asta înseamnă:
- confirmarea cazului se întâmplă în cockpit
- acțiunea principală se întâmplă în cockpit
- validarea dovezii se întâmplă în cockpit
- închiderea se întâmplă în cockpit
- dosarul primește rezultatul
- monitoring-ul primește cazul închis

Modulele specialist pot exista, dar ca:
- surfețe secundare
- unelte de suport
- panouri contextuale
- sau round-trip strict controlat, nu execuție primară implicită

### 2.3 Ce NU trebuie să se mai întâmple

- userul nu trebuie scos din cockpit ca să „rezolve” cazul
- ecranele nu trebuie să ascundă execuția reală în disclosure-uri care omoară ierarhia
- `Home` nu trebuie să concureze cu 6 intenții simultan
- `Dosar` nu trebuie să devină primul loc de lucru
- modulele specialist nu trebuie să pară produse complet paralele pentru userul principal

---

## 3. Verdict global

### 3.1 Verdict scurt

Aplicația NU este 1:1 cu flow-ul cerut.

Dar nici nu este haos total.

Adevărul corect este:
- coloana principală există
- multe părți din spine sunt reale și funcționale
- deriva vine din ierarhie, handoff-uri și suprafețe secundare care au crescut prea mult

### 3.2 Verdict pe zone

| Zonă | Verdict |
|---|---|
| Landing / login / onboarding | `PARȚIAL ALINIAT` |
| Snapshot / Home | `ALINIAT CU DERAPAJ DE IERARHIE` |
| Resolve queue | `BUN` |
| Cockpit generator | `BUN CA MOTOR, SLAB CA PREZENTARE LIVE` |
| Cockpit operațional | `PARȚIAL` |
| Dosar | `PARȚIAL ALINIAT` |
| Monitoring | `EXISTĂ ÎN LOGICĂ, SUB-EXPRIMAT ÎN UX` |
| Scan | `APROAPE CORECT` |
| DSAR | `PARȚIAL, DAR EXECUȚIA E MUTATĂ DIN COCKPIT` |
| NIS2 | `FUNCȚIONAL, DAR SUITĂ SEPARATĂ` |
| Fiscal | `PARȚIAL, DOAR SPV E APROAPE` |
| Sisteme / DORA / Whistleblowing | `PRODUSE PARALELE` |
| Partner / portfolio | `PARȚIAL` |
| Viewer / compliance IA | `PARȚIAL` |

---

## 4. Ce trebuie să poată face userul, pas cu pas

### 4.1 Formula corectă, user-centered

Pentru orice user principal:

1. înțelege că produsul e pentru el
2. intră fără fricțiune
3. completează onboarding-ul minim necesar
4. vede ce i se aplică și ce s-a găsit
5. intră într-un finding
6. îl rezolvă fără să fie plimbat
7. lasă dovada la dosar
8. intră în monitorizare
9. abia apoi folosește unelte standalone, dacă are nevoie

### 4.2 Ce oferim sau nu oferim azi

| Capacitate | Avem? | Observație |
|---|---|---|
| Landing clar cu promisiune de flow complet | `PARȚIAL` | există, dar nu spune complet traseul în 4 pași |
| Register direct din CTA de landing | `NU 1:1` | CTA duce la login, nu la register preselectat |
| Onboarding pe 3 personas | `DA` | există alegerea rolului |
| Onboarding cu CUI + website + întrebări | `DA` | există |
| Pas explicit „ce legi ți se aplică și de ce” | `PARȚIAL` | logica există, scena explicită nu |
| Ieșire persona-aware din onboarding | `NU` | toate modurile merg în `/dashboard/resolve` |
| Snapshot clar | `DA, DAR CU IERARHIE SLABĂ` | `Ce faci acum` nu domină suficient |
| Queue de findings clară | `DA` | există și e coerentă |
| Cockpit generator inline | `DA` | generator drawer există și funcționează |
| Cockpit operațional inline complet | `PARȚIAL` | gating există, dar multe flow-uri ies din cockpit |
| Dovadă automată la dosar | `DA, PARȚIAL FRAGMENTAT` | există, dar output-ul e împărțit în prea multe suprafețe |
| Monitorizare continuă vizibilă | `PARȚIAL` | logică există, UX-ul nu o exprimă uniform |
| Module standalone după flow-ul principal | `NU COMPLET` | multe dintre ele au crescut în produse separate |

---

## 5. Audit pas cu pas pe flow-ul principal

## 5.1 Landing

### Ce trebuie să se întâmple

Userul ajunge pe landing și trebuie să înțeleagă în 10 secunde:
- pentru cine este produsul
- ce traseu urmează
- ce câștigă
- de ce trebuie să acționeze acum

### Ce face userul

1. vede badge-ul de urgență
2. vede H1
3. vede subtitlul
4. vede journey-ul
5. apasă `Începe gratuit`

### Ce suportă runtime-ul

În [app/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/page.tsx):
- există H1 bun
- există subtitlu bun
- există CTA bun
- există 3 pași de journey
- există secțiune `Ce primești în schimb`
- există secțiune `Pentru cine`

### Unde deviază

- CTA-ul duce la `/login`, nu la `register` preselectat
- journey-ul are 3 pași, nu 4
- lipsește explicit pasul de `monitorizare`
- lipsește secțiunea de `problem framing` cerută de blueprint

### Verdict

`PARȚIAL`

---

## 5.2 Login / Register

### Ce trebuie să se întâmple

Userul trebuie să poată intra în maxim 2 minute, fără fricțiune inutilă.

### Ce face userul

1. ajunge în `/login`
2. dacă vine de pe CTA de landing, trebuie să poată crea cont imediat
3. completează email și parolă
4. intră în onboarding

### Ce suportă runtime-ul

În [app/login/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/login/page.tsx):
- există login și register
- register duce în onboarding
- copy-ul este bun

### Unde deviază

- intrarea implicită este `login`, nu `register`
- register cere și `Nume organizatie` de la început
- asta crește fricțiunea înainte ca userul să vadă valoarea internă

### Verdict

`PARȚIAL`

---

## 5.3 Onboarding

### Ce trebuie să se întâmple

Userul trebuie să treacă liniar prin:
- rol
- CUI
- ANAF
- site
- întrebări
- legi aplicabile

și să iasă în runtime-ul operațional potrivit.

### Ce face userul acum

În [components/compliscan/onboarding-form.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/onboarding-form.tsx):

1. alege rolul:
   - `Proprietar / Manager`
   - `Consultant / Contabil / Auditor`
   - `Responsabil conformitate`
2. apasă `Continuă cu profilul firmei`
3. intră în wizard
4. completează CUI și website
5. trece prin verificare
6. trece prin sector
7. trece prin mărime
8. trece prin AI / eFactura / intake
9. apasă `Salvează și intră în dashboard`

### Ce suportă runtime-ul bine

- alegerea celor 3 personas există
- onboarding-ul este liniar
- nu se oprește într-un finish festiv
- wizardul chiar pornește din date utile

### Unde deviază

- nu există scenă explicită și clară `ce legi ți se aplică și de ce`
- `partner`, `solo`, `compliance` ies toate spre aceeași destinație
- [app/onboarding/finish/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/onboarding/finish/page.tsx) rămâne ca rută legacy și introduce zgomot

### Verdict

`PARȚIAL`

---

## 5.4 Snapshot / Home

### Ce trebuie să se întâmple

Userul trebuie să vadă:
- ce i se aplică
- ce am găsit
- ce face acum

dar cu o ierarhie clară: acțiunea dominantă trebuie să câștige.

### Ce face userul acum

În [app/dashboard/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx):

1. intră în Home
2. vede:
   - `Ce ți se aplică`
   - `Ce am găsit deja`
   - `Ce faci acum`
3. apasă CTA-ul din `NextBestAction`
4. merge în `/dashboard/resolve`

### Ce suportă runtime-ul bine

- snapshotul există
- `Home` nu mai este un tool mall
- există feed scurt și KPI utile

### Unde deviază

- `Ce faci acum` este doar al treilea card într-un grid egal
- nu domină suficient primul ecran
- pentru un user nou, acțiunea principală nu este încă autoritară

### Verdict

`ALINIAT CU DERAPAJ DE IERARHIE`

---

## 5.5 De rezolvat

### Ce trebuie să se întâmple

Userul trebuie să vadă o listă clară de cazuri, sortată după severitate, și să poată intra rapid în fiecare cockpit.

### Ce face userul acum

În [components/compliscan/resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx):

1. intră în `/dashboard/resolve`
2. vede findings sortate severity desc
3. poate filtra
4. apasă un rând
5. intră în cockpitul finding-ului

### Ce suportă runtime-ul bine

- lista este clară
- rândurile sunt bune
- generator-backed rows pot deschide direct drawerul prin `?generator=1`
- empty state util există

### Verdict

`BUN`

---

## 5.6 Cockpit — finding cu generator

### Ce trebuie să se întâmple

Userul trebuie să poată:

1. confirma cazul
2. deschide generatorul în același cockpit
3. completa datele
4. genera
5. valida dovada
6. confirma și salva
7. închide cazul
8. trimite dovada la dosar
9. intra în monitorizare

### Ce face userul acum

În [app/dashboard/resolve/[findingId]/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/%5BfindingId%5D/page.tsx):

1. vede hero action
2. apasă `Confirmă și generează`
3. se actualizează finding-ul la `confirmed`
4. se deschide [components/compliscan/generator-drawer.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/generator-drawer.tsx)
5. parcurge:
   - `Completezi`
   - `Generezi`
   - `Validezi`
   - `Confirmi și salvezi`
6. la final primește succes și finding-ul intră în under monitoring

### Ce suportă runtime-ul bine

- generatorul rămâne inline
- pașii generatorului sunt buni
- validarea există
- confirmarea explicită există
- legarea la finding există

### Unde deviază

- cockpitul live nu montează `FindingExecutionCard`
- cockpitul live nu montează `FindingNarrativeCard`
- deci stepper-ul, close rule, aftercare-ul și contextul nu sunt prezente vizibil în runtime
- succesul trimite spre output surfaces prea adânci, nu spre `Dosar` primar

### Verdict

`BUN CA MOTOR, SLAB CA EXPUNERE LIVE`

---

## 5.7 Cockpit — finding operațional / fără generator

### Ce trebuie să se întâmple

Userul trebuie să poată:

1. confirma cazul
2. face acțiunea reală sau atașa dovada
3. valida nota / revalidarea
4. închide cazul
5. intra în dosar
6. intra în monitorizare

### Ce face userul acum

Pentru multe finding-uri operaționale:

1. userul confirmă cazul în cockpit
2. dacă există `workflowLink`, este împins către altă pagină
3. execută acțiunea acolo
4. revine cu `findingId`, `focus`, `incidentFlow=done`, `evidenceNote` sau alt query param
5. completează nota de dovadă în cockpit
6. apasă CTA-ul de închidere

### Ce suportă runtime-ul bine

- gating pentru evidence note există
- revalidation gating există
- success moment pentru cazurile fără document există

### Unde deviază

- execuția reală nu mai rămâne în cockpit
- DSAR, NIS2, breach, GDPR-005 și altele trimit userul în alte suprafețe
- asta rupe regula de fier

### Verdict

`PARȚIAL`

---

## 5.8 Dosar

### Ce trebuie să se întâmple

Dosarul trebuie să fie locul unde userul vede:
- cazurile rezolvate
- dovezile
- documentele generate
- exporturile

dar procesul de lucru trebuie să rămână în cockpit.

### Ce face userul acum

În [components/compliscan/dosar-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dosar-page.tsx):

1. intră în `/dashboard/dosar`
2. vede `Cazuri rezolvate și dovezi`
3. vede documentele generate și output-ul prin `ReportsPageSurface`

### Ce suportă runtime-ul bine

- lista de cazuri rezolvate există
- legătura cu documentele aprobate există
- empty state util există

### Unde deviază

- output-ul este încă fragmentat între:
  - `/dashboard/dosar`
  - `/dashboard/reports`
  - `/dashboard/reports/vault`
  - `/dashboard/reports/audit-log`
  - `/dashboard/documente`
- succesul din cockpit împinge uneori userul direct în `vault` / `audit-log`, nu în dosarul principal

### Verdict

`PARȚIAL ALINIAT`

---

## 5.9 Monitoring

### Ce trebuie să se întâmple

După închidere:
- cazul trebuie să rămână sub watch
- userul trebuie să vadă clar următorul review
- userul trebuie să știe de ce se poate redeschide cazul

### Ce suportă runtime-ul

- `under_monitoring` există
- `nextMonitoringDateISO` există
- monitoring signals există în kernel
- feed și notificări există

### Unde deviază

- monitoring-ul nu este exprimat uniform în UX
- `FindingExecutionCard`, care arată rail-urile de dossier și monitoring, nu este montat în cockpit
- astfel, muchia dintre `închis` și `sub watch` este sub-explicată tocmai în locul cel mai important

### Verdict

`EXISTĂ ÎN LOGICĂ, SUB-EXPRIMAT ÎN UX`

---

## 6. Audit pe personas

## 6.1 Mihai — Solo

### Flow dorit

`landing -> cont -> onboarding -> snapshot -> findings -> cockpit -> dosar -> monitorizare`

### Suport actual

- este persona cel mai bine servită
- are nav corectă cu 5 iteme
- poate trece cap-coadă prin flow-ul principal

### Devierea majoră

- `Home` nu domină suficient prin acțiunea principală
- cockpitul operațional încă scoate userul din caz prea des

### Verdict

`CEL MAI APROAPE DE 1:1`

---

## 6.2 Diana — Partner

### Flow dorit

`landing -> cont -> onboarding partner -> portofoliu -> client workspace -> findings client -> cockpit -> dosar client -> raport`

### Suport actual

- există mod partner
- există switch portofoliu / firmă activă
- există shell bun pentru context switching

### Devierea majoră

- onboardingul nu scoate partner-ul natural în portofoliu
- `portfolio/tasks` permite batch execution cross-client și rupe modelul curat „triage în portofoliu, execuție pe firmă”
- `portfolio/reports` nu este încă raport livrabil matur

### Verdict

`PARȚIAL`

---

## 6.3 Radu — Compliance

### Flow dorit

`cont -> onboarding compliance -> dashboard matur -> resolve/cockpit -> audit trail -> export`

### Suport actual

- are același nav principal curat
- are acces la modulele specialist
- audit / export / settings există

### Devierea majoră

- onboardingul nu are destinație sau configurare mai bogată pentru compliance
- `Setări` este prea infrastructural și prea lat
- multe suprafețe specialist se comportă ca produse paralele, nu ca extensii controlate ale spine-ului

### Verdict

`PARȚIAL`

---

## 7. Information Architecture reală

## 7.1 Ce este bun

În [components/compliscan/navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts) și [lib/compliscan/nav-config.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.ts):

- `solo` are 5 iteme corecte
- `viewer` are 4 iteme
- `partner` are mod portofoliu clar
- `compliance` folosește aceeași coloană principală

## 7.2 Unde e drift

- `viewer` promite `Taskurile mele`, dar merge tot în `/dashboard/resolve`
- `settings` / `setari` coexistă
- există și `account/settings` în afara arborelui principal
- `dosar` / `reports` / `documente` coexistă și slăbesc claritatea

### Verdict

`IA declarată este mai curată decât IA reală a rutelor`

---

## 8. Audit pe module specialist

## 8.1 Scan

### Ce este corect

- susține flow-ul principal pentru:
  - document
  - text
  - site
- rezultatele scanării există în [app/dashboard/scan/results/[scanId]/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/scan/results/%5BscanId%5D/page.tsx)
- spune clar că rezolvarea continuă în `De rezolvat`

### Ce deviază

- `manifest`
- `compliscan.yaml`
- `Mod Agent`
- AI discovery

toate acestea împing `Scan` spre un produs secundar prea mare pentru flow-ul userului simplu

### Verdict

`APROAPE CORECT`

---

## 8.2 DSAR

### Ce este corect

- primește `findingId`
- spune explicit că trebuie să te întorci în cockpit cu dovada
- poate fi folosit ca sistem DSAR real

### Ce deviază

- execuția reală a cazului DSAR are loc în modulul DSAR, nu în cockpit

### Verdict

`PARȚIAL`

---

## 8.3 NIS2

### Ce este corect

- există flow-uri reale:
  - eligibility
  - DNSC
  - incidents
  - maturity
  - governance
- există bannere și back links
- există return context pentru unele flow-uri

### Ce deviază

- utilizatorul este mutat în suită NIS2, nu rămâne în cockpit
- execuția reală e dispersată pe mai multe pagini

### Verdict

`FUNCȚIONAL, DAR SUITĂ SEPARATĂ`

---

## 8.4 Fiscal

### Ce este corect

- `SPV Check` este aproape de modelul bun
- există `findingId` și back link pentru unele cazuri

### Ce deviază

- restul fiscalului arată ca tax operations console separată
- cockpitul nu rămâne locul principal pentru tot ce ține de e-Factura / discrepanțe

### Verdict

`PARȚIAL`

---

## 8.5 Sisteme / DORA / Whistleblowing

### Ce este adevărat

Aceste suprafețe sunt funcționale, dar se comportă ca produse separate:

- [app/dashboard/sisteme/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/sisteme/page.tsx)
- [app/dashboard/dora/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/dora/page.tsx)
- [app/dashboard/whistleblowing/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/whistleblowing/page.tsx)

### De ce este problemă

Pentru flow-ul principal stabilit aici:
- ele nu sunt secundare suficient
- nu păstrează contractul `finding -> cockpit -> dovadă -> dosar -> monitorizare`

### Verdict

`PRODUSE PARALELE`

---

## 9. Cele mai importante deviații 1:1

Acestea sunt deviațiile mari, nu cosmetice:

1. CTA-ul de landing nu deschide corect register-first.
2. Onboardingul nu are scenă explicită de `legi aplicabile și de ce`.
3. Onboardingul nu este persona-aware la ieșire.
4. `Home` nu face `Ce faci acum` dominant.
5. Cockpitul live nu montează clar execuție + context + aftercare.
6. `workflowLink` mută execuția reală a prea multor cazuri în afara cockpitului.
7. Dosarul este fragmentat în prea multe suprafețe.
8. Monitoring-ul există în date, dar nu este vizibil și autoritar în UX.
9. Partner flow nu este încă portofoliu-first cap-coadă.
10. Prea multe module specialist se comportă ca produse separate, nu ca unelte secundare.

---

## 10. Ce trebuie tăiat, mutat sau refăcut

## 10.1 P0 — fără acestea nu avem 1:1

1. `Landing -> register-first`
2. `Pas explicit în onboarding pentru legi aplicabile`
3. `Ieșire persona-aware din onboarding`
4. `Home: mută acțiunea dominantă pe primul loc`
5. `Cockpit: montează vizibil execuția și aftercare-ul`
6. `Scoate redirect-driven execution din cockpit`
7. `Succesul trebuie să trimită în Dosar, nu în suprafețe adânci`

## 10.2 P1 — ca să nu mai pară produs rupt în două

1. comprimă output surfaces către `Dosar` clar
2. partner flow: triage în portofoliu, execuție în workspace client, fără batch drift
3. viewer flow: suprafață reală pentru `Taskurile mele`
4. settings: taie infrastructura prea vizibilă pentru userii non-admin

## 10.3 P2 — ca să nu mai avem produse paralele în produs

1. `NIS2` -> suport contextual sau cockpit subflows
2. `DSAR` -> panel contextual, nu loc principal de execuție pentru finding
3. `Fiscal` -> cockpit-first pentru mai mult decât SPV
4. `Sisteme`, `DORA`, `Whistleblowing` -> recadrate ca zone secundare, nu coloane paralele în mintea userului principal

---

## 11. Verdict final

### Întrebarea

Aplicația este 1:1 cu flow-ul cerut?

### Răspunsul

`Nu.`

### Adevărul complet

Aplicația are:
- un spine real
- multe motoare funcționale
- un queue bun
- un generator bun
- un dosar destul de bun

Dar nu este încă 1:1 pentru că:
- ierarhia s-a rupt
- execuția a fost scoasă din cockpit în prea multe cazuri
- unele module au devenit produse separate
- persona flows nu sunt complet respectate la ieșirea din onboarding și în partner mode

### Ce înseamnă asta

Nu trebuie refăcut „totul de la zero”.

Dar trebuie resetată disciplina pe aceste întrebări:
- care este traseul principal?
- unde se execută cazul?
- ce vede userul mai întâi?
- unde merge dovada?
- ce rămâne secundar?

Acest document este baza de control pentru acea corecție.

---

## 12. Formula de control de acum înainte

Orice ecran sau flow nou se verifică doar cu aceste 5 întrebări:

1. Userul înțelege în 5 secunde ce face aici?
2. Acțiunea principală este dominantă?
3. Cazul se rezolvă în cockpit sau produsul îl împinge în afară?
4. Dovada ajunge clar în dosar?
5. După închidere, monitorizarea este vizibilă și logică?

Dacă răspunsul la oricare este `nu`, ecranul nu este `client-ready`.

---

## 13. Anexă — acoperire pe familii de rute

Această anexă răspunde la întrebarea:

> în toată aplicația, fiecare familie de rute servește spine-ul principal sau îl diluează?

| Familie de rute | Rol intenționat | Verdict | Observație |
|---|---|---|---|
| `/` | landing / marketing | `PARȚIAL` | bun, dar nu spune complet traseul în 4 pași |
| `/login` | login + register | `PARȚIAL` | nu intră register-first |
| `/pricing` | pricing | `BUN` | clar și neinflamat |
| `/demo/*` | demo | `PARȚIAL` | există, dar nu este aici nucleul deviației |
| `/onboarding` | wizard principal | `PARȚIAL` | bun ca structură, incomplet persona-aware |
| `/onboarding/finish` | legacy | `ZGOMOT` | nu este surfață necesară în flow-ul corect |
| `/dashboard` | snapshot / orientare | `BUN CU DERAPAJ` | acțiunea principală nu domină suficient |
| `/dashboard/scan` | intake | `APROAPE CORECT` | bun pe document/text/site, prea extins pe agent/yaml/manifest |
| `/dashboard/scan/results/*` | rezultate scan | `BUN` | servește bine intake -> resolve |
| `/dashboard/resolve` | queue principal | `BUN` | una dintre cele mai curate suprafețe |
| `/dashboard/resolve/[findingId]` | cockpit | `PARȚIAL` | motor bun, expunere UX greșită și handoff-uri excesive |
| `/dashboard/dosar` | dosar principal | `BUN CU FRAGMENTARE` | suprafață bună, dar concurată de alte output surfaces |
| `/dashboard/reports*` | output secundar | `PREA VIZIBIL` | păstrează fragmentarea output-ului |
| `/dashboard/documente` | output legacy | `ZGOMOT` | dublează ideea de dosar/output |
| `/dashboard/settings` | setări | `PARȚIAL` | prea infrastructural pentru un flux client-ready |
| `/dashboard/setari` | redirect legacy | `ZGOMOT` | nume dublat |
| `/account/settings` | cont separat | `ZGOMOT` | în afara IA principale |
| `/dashboard/dsar` | modul specialist | `PARȚIAL` | round-trip util, dar execuția se mută din cockpit |
| `/dashboard/nis2*` | modul specialist | `PARȚIAL` | funcțional, dar suită separată |
| `/dashboard/fiscal` | modul specialist | `PARȚIAL` | aproape doar pe SPV |
| `/dashboard/sisteme*` | modul specialist | `PRODUS PARALEL` | nu servește flow-ul principal |
| `/dashboard/vendor-review` | modul specialist | `PARȚIAL` | util, dar încă prea autonom |
| `/dashboard/dora` | modul specialist | `PRODUS PARALEL` | nu stă sub cockpit-first |
| `/dashboard/whistleblowing` | modul specialist | `PRODUS PARALEL` | canal separat |
| `/portfolio*` | partner mode | `PARȚIAL` | shell bun, execuție și reporting încă nealiniate |

### Concluzie pe rute

Rutele bune pentru spine sunt:
- `/`
- `/login`
- `/onboarding`
- `/dashboard`
- `/dashboard/scan`
- `/dashboard/resolve`
- `/dashboard/resolve/[findingId]`
- `/dashboard/dosar`

Rutele care diluează experiența sunt:
- `/onboarding/finish`
- `/dashboard/reports*`
- `/dashboard/documente`
- `/account/settings`
- `/dashboard/setari`

Rutele care trebuie recadrate ca suport secundar, nu execuție primară:
- `/dashboard/dsar`
- `/dashboard/nis2*`
- `/dashboard/fiscal`
- `/dashboard/sisteme*`
- `/dashboard/dora`
- `/dashboard/whistleblowing`

---

## 14. Verificare live runtime — `2026-03-27`

Această secțiune separă clar:
- ce este confirmat live
- ce pică live
- ce rămâne încă neconfirmat live

URL verificat:
- `https://compliscanag.vercel.app`

### 14.1 Ce am verificat live, nu doar din cod

Pe runtime-ul live au fost executate:
- `landing`
- `login`
- `dashboard`
- `scan results`
- `resolve queue`
- `finding cockpit documentar`
- `generator drawer`
- `attach generated document`
- `dosar`
- `audit pack export`
- `DSAR create + DSAR page`
- `NIS2 incident create + NIS2 incidents page`
- `Fiscal / SPV page`
- `notifications API`
- `partner portfolio shell`

### 14.2 Confirmat live

| Capacitate | Verdict live | Observație |
|---|---|---|
| Landing CTA există | `CONFIRMAT LIVE` | CTA principal este prezent |
| Landing include și monitorizare în journey | `CONFIRMAT LIVE` | apare explicit `Rămâi sub watch` |
| Dashboard se încarcă după onboarding | `CONFIRMAT LIVE` | shell-ul privat răspunde corect |
| Resolve queue se încarcă | `CONFIRMAT LIVE` | flow-ul de intrare în findings există live |
| Scan results există și are CTA spre rezolvare | `CONFIRMAT LIVE` | pagina de rezultate nu lipsește |
| Audit pack export răspunde | `CONFIRMAT LIVE` | `200`, download JSON |
| DSAR create răspunde | `CONFIRMAT LIVE` | `201`, draft generat |
| DSAR page afișează cererea creată | `CONFIRMAT LIVE` | requestul nou apare în UI |
| NIS2 incident create răspunde | `CONFIRMAT LIVE` | `201`, incident nou creat |
| NIS2 incidents page afișează incidentul creat | `CONFIRMAT LIVE` | incidentul nou apare în UI |
| Fiscal / SPV page se încarcă | `CONFIRMAT LIVE` | suprafața există și răspunde |
| Notifications inbox răspunde | `CONFIRMAT LIVE` | payload cu notificări reale |
| Portfolio shell se încarcă în partner mode | `CONFIRMAT LIVE` | `/portfolio`, `/portfolio/alerts`, `/portfolio/tasks`, `/portfolio/reports` răspund |
| Cockpit pentru finding operațional se încarcă | `CONFIRMAT LIVE` | finding-ul operațional real apare în cockpit și poate fi confirmat |

### 14.3 Pică live

#### Flow documentar principal

Pe finding documentar live:
1. cockpitul se încarcă
2. CTA-ul corect este `Confirmă și generează`
3. drawer-ul se deschide
4. draftul se generează
5. checklistul poate fi bifat
6. butonul de attach poate fi apăsat

Dar:
- nu apare success moment-ul de dosar
- finding-ul nu intră vizibil în starea de închidere corectă
- `Dosar` nu afișează cazul închis în această rundă
- `Redeschide cazul` nu devine disponibil

### Verdict live pentru flow-ul principal

`Landing -> Onboarding -> Findings -> Cockpit documentar -> Dosar`

este `RUPT LIVE` la trecerea:

`generator / attach -> success / dosar / închidere`

Acesta este în momentul de față cel mai important bug runtime confirmat live.

### 14.4 Deviații live importante

- `login/register` nu este confirmat live ca experiență clar `register-first`
- `finding-ul operațional` confirmat live nu ajunge într-un flow complet de dovadă inline; rămâne pe handoff / ghidaj contextual, nu pe închidere cap-coadă confirmată live
- `partner` intră în portfolio shell, dar nu este încă confirmat live cap-coadă pe un client real importat și pe drilldown în workspace client
- `SPV` se încarcă live, dar fără token ANAF activ auditul rămâne doar parțial pe semnale reale
- `partner import execute` este blocat live pe cont fresh de `PARTNER_PLAN_REQUIRED`, deci nu poți valida client intake-ul complet fără planul corect

### 14.5 Încă neconfirmat live

Nu sunt încă închise live cap-coadă:
- `operational finding` până la monitorizare
- `revalidation`
- `reopen` după o închidere reușită reală
- `alerts / drift UI` cu seed dedicat
- `client import + client context` în partner mode pe cont fresh fără plan Partner
- `specialist round-trip` complet din cockpit înapoi în cockpit pentru toate familiile

### 14.6 Concluzie live

Auditul structural din acest document rămâne valid.

Dar după verificarea live din `2026-03-27`, adevărul s-a întărit astfel:
- coloana principală există live
- multe suprafețe răspund live
- modulele specialist esențiale se încarcă live
- însă flow-ul documentar principal nu este închis live cap-coadă

Prin urmare, produsul nu poate fi declarat `1:1` și nici `client-ready` cât timp această ruptură din cockpit -> dosar rămâne activă pe runtime-ul public.
