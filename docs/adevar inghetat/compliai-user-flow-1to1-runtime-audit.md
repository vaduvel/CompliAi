# CompliAI — Audit 1:1 User Flow vs Runtime

Data: `2026-03-27`  
Status: `audit total / sursă de adevăr pentru corecția de produs`  
Baseline code: `HEAD fd6fd57` + working tree curent  

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
| Landing / login / onboarding | `CONFIRMAT LIVE` |
| Snapshot / Home | `CONFIRMAT LIVE, COMPACT` |
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
| Partner / portfolio | `CONFIRMAT PE FLOW PRINCIPAL, FUNCȚIONAL PE SECUNDARE` |
| Viewer / compliance IA | `BUN PE FLOW PRINCIPAL, FUNCȚIONAL PE SECUNDARE` |

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
| Landing clar cu promisiune de flow complet | `CONFIRMAT LIVE, PARȚIAL ALINIAT LA BLUEPRINT` | CTA duce în `register-first`, journey include monitorizare și funnel-ul public trece live cap-coadă |
| Register direct din CTA de landing | `DA` | CTA duce în `register-first` și funnel-ul public trece live cap-coadă |
| Onboarding pe 3 personas | `DA` | există alegerea rolului |
| Onboarding cu CUI + website + întrebări | `DA` | există |
| Rezultat clar după onboarding: ce se aplică, ce am găsit și ce faci acum | `CONFIRMAT LIVE` | destinațiile principale exprimă compact `Se aplică / Am găsit / Acum faci asta` |
| Ieșire persona-aware din onboarding | `DA` | `solo -> /dashboard/resolve`, `partner -> /portfolio`, `compliance -> /dashboard` |
| Snapshot clar | `CONFIRMAT LIVE, COMPACT` | stripul de intrare exprimă imediat `Se aplică / Am găsit / Acum faci asta` |
| Queue de findings clară | `DA` | există și e coerentă |
| Cockpit generator inline | `DA` | zona inline de generare există și funcționează |
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
- există 4 pași de journey
- există secțiune `Ce primești în schimb`
- există secțiune `Pentru cine`

### Unde deviază

- problem framing-ul cerut de blueprint este încă mai scurt decât în documentul master
- landing-ul este suficient pentru flow-ul real, dar nu încă atât de explicativ pe anxietatea de control cât cere blueprintul

### Verdict

`CONFIRMAT LIVE, PARȚIAL ALINIAT LA BLUEPRINT`

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

- CTA-ul principal din landing intră corect în `register-first`, dar pagina `/login` păstrează încă și tab-ul de autentificare
- register cere `Denumirea firmei` de la început, deci fricțiunea nu este zero

### Verdict

`CONFIRMAT LIVE, PARȚIAL ALINIAT CA FRICȚIUNE`

---

## 5.3 Onboarding

### Ce trebuie să se întâmple

Userul trebuie să treacă liniar prin:
- rol
- CUI
- ANAF
- site
- întrebări
- finalizare onboarding

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

- [app/onboarding/finish/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/onboarding/finish/page.tsx) rămâne ca rută legacy și introduce zgomot

### Verdict

`CONFIRMAT LIVE`

---

## 5.4 Snapshot / Home

### Ce trebuie să se întâmple

Userul trebuie să vadă imediat:
- ce se aplică
- ce am găsit
- ce face acum

într-o formă compactă, fără să piardă CTA-ul principal.

### Ce face userul acum

În [app/dashboard/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx) și [components/compliscan/resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx):

1. intră în Home
2. vede:
   - `Se aplică`
   - `Am găsit`
   - `Ce faci acum`
3. apasă CTA-ul din `NextBestAction`
4. merge în `/dashboard/resolve`

### Ce suportă runtime-ul bine

- snapshotul există
- `Home` nu mai este un tool mall
- există feed scurt și KPI utile

### Unde deviază

- pe `/dashboard`, acțiunea dominantă coexistă încă cu blocuri secundare mai grele decât la `solo`
- pentru `solo`, destinația primară corectă rămâne `/dashboard/resolve`, nu `Home`

### Verdict

`CONFIRMAT LIVE, COMPACT`

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
- generator-backed rows pot deschide direct generatorul inline prin `?generator=1`
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
4. se deschide zona inline de generare din [components/compliscan/generator-drawer.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/generator-drawer.tsx)
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

1. Snapshot-ul de ieșire din onboarding nu exprimă încă destul de clar `ce se aplică / ce am găsit / ce faci acum`.
2. `Home` nu face `Ce faci acum` dominant.
3. Cockpitul live nu montează clar execuție + context + aftercare.
4. `workflowLink` mută execuția reală a prea multor cazuri în afara cockpitului.
5. Dosarul este fragmentat în prea multe suprafețe.
6. Monitoring-ul există în date, dar nu este vizibil și autoritar în UX.
7. Partner flow principal este acum portofoliu-first cap-coadă, dar suprafețele secundare încă au drift.
8. Prea multe module specialist se comportă ca produse separate, nu ca unelte secundare.

---

## 10. Ce trebuie tăiat, mutat sau refăcut

## 10.1 P0 — fără acestea nu avem 1:1

1. `Snapshotul de ieșire trebuie să spună clar: ce se aplică / ce am găsit / ce faci acum`
2. `Home: mută acțiunea dominantă pe primul loc`
3. `Cockpit: montează vizibil execuția și aftercare-ul`
4. `Scoate redirect-driven execution din cockpit`
5. `Succesul trebuie să trimită în Dosar, nu în suprafețe adânci`

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
| `/` | landing / marketing | `CONFIRMAT LIVE, PARȚIAL ALINIAT` | CTA intră `register-first`, journey include watch, dar problem framing-ul e mai comprimat decât în blueprint |
| `/login` | login + register | `CONFIRMAT LIVE, PARȚIAL ALINIAT` | `register-first` merge corect; `Denumirea firmei` rămâne fricțiune acceptată |
| `/pricing` | pricing | `BUN` | clar și neinflamat |
| `/demo/*` | demo | `PARȚIAL` | există, dar nu este aici nucleul deviației |
| `/onboarding` | wizard principal | `CONFIRMAT LIVE` | persona-aware și iese în destinația corectă per rol |
| `/onboarding/finish` | legacy | `ZGOMOT` | nu este surfață necesară în flow-ul corect |
| `/dashboard` | snapshot / orientare | `CONFIRMAT LIVE, COMPACT` | stripul `Se aplică / Am găsit / Acum faci asta` exprimă clar rezultatul |
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
- `register API + user nou`
- `set user mode`
- `onboarding/profile API cu CUI + website`
- `dashboard`
- `scan results`
- `resolve queue`
- `finding cockpit documentar`
- `generator inline`
- `re-scan / validate evidence`
- `confirm generated document`
- `resolve risk with document`
- `send document to dosar`
- `monitoring state + reopen visibility`
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
| Flow documentar principal din cockpit merge cap-coadă | `CONFIRMAT LIVE` | `confirmă -> generează -> re-scannează -> confirmă documentul -> rezolvă riscul -> adaugă la Dosar -> Monitorizat` |
| Clasa `documentary` trece cap-coadă live | `CONFIRMAT LIVE` | `6/6` riscuri documentare reale validate live |
| Clasa `operational` trece cap-coadă live | `CONFIRMAT LIVE` | `7/7` riscuri operaționale validate live fără generator fals |
| Success moment apare după trimiterea la Dosar | `CONFIRMAT LIVE` | cockpitul afișează starea de succes și `Redeschide cazul` |
| Dosarul se actualizează după flow-ul documentar | `CONFIRMAT LIVE` | cazul închis și livrabilul apar în `Dosar` |
| Audit pack export răspunde | `CONFIRMAT LIVE` | `200`, download JSON |
| DSAR create răspunde | `CONFIRMAT LIVE` | `201`, draft generat |
| DSAR page afișează cererea creată | `CONFIRMAT LIVE` | requestul nou apare în UI |
| `GDPR-013` round-trip DSAR -> cockpit | `CONFIRMAT LIVE` | handoff controlat + revenire automată + dovadă precompletată |
| `GDPR-014` round-trip DSAR -> cockpit | `CONFIRMAT LIVE` | handoff controlat + revenire automată + dovadă precompletată |
| `NIS2-001` eligibilitate -> cockpit | `CONFIRMAT LIVE` | handoff controlat + revenire automată după rezultat |
| `NIS2-005` assessment -> cockpit | `CONFIRMAT LIVE` | handoff controlat + revenire automată după salvare |
| NIS2 incident create răspunde | `CONFIRMAT LIVE` | `201`, incident nou creat |
| NIS2 incidents page afișează incidentul creat | `CONFIRMAT LIVE` | incidentul nou apare în UI |
| `NIS2-015` incident -> cockpit | `CONFIRMAT LIVE` | early warning salvat -> revenire automată în finding cu `incidentFlow=done` |
| Fiscal / SPV page se încarcă | `CONFIRMAT LIVE` | suprafața există și răspunde |
| Notifications inbox răspunde | `CONFIRMAT LIVE` | payload cu notificări reale |
| Portfolio shell se încarcă în partner mode | `CONFIRMAT LIVE` | `/portfolio`, `/portfolio/alerts`, `/portfolio/tasks`, `/portfolio/reports` răspund |
| Cockpit pentru finding operațional se încarcă | `CONFIRMAT LIVE` | finding-ul operațional real apare în cockpit și poate fi confirmat |

### 14.3 Clarificare importantă pentru flow-ul documentar

În runda live inițială, flow-ul documentar a părut rupt.

Adevărul final după rerulare strictă este:
- flow-ul documentar `NU` este rupt live
- prima alarmă a fost produsă de auditul însuși
- testul folosea un `orgName` cu suffix dinamic care făcea validarea documentului să pice artificial

După rerulare cu nume de organizație stabil:
1. cockpitul se încarcă
2. CTA-ul corect este `Confirmă și generează`
3. zona inline de generare se deschide
4. draftul se generează
5. `Re-scannează` rulează validarea
6. documentul este confirmat pentru rezolvare
7. riscul se rezolvă cu documentul
8. documentul este trimis la `Dosar`
9. cazul intră în `Monitorizat`
10. `Redeschide cazul` devine vizibil

### Verdict live pentru flow-ul principal documentar

`Findings -> Cockpit documentar -> Validate evidence -> Resolve -> Dosar -> Monitorizare`

este `CONFIRMAT LIVE`.

### 14.4 Deviații live importante

- `landing -> register -> onboarding -> destination` este acum confirmat live click-by-click pe `solo`, `partner` și `compliance`
- rezultatul onboardingului este acum exprimat live compact ca `Se aplică / Am găsit / Acum faci asta` pe destinațiile principale
- `finding-ul operațional` confirmat live nu ajunge într-un flow complet de dovadă inline; rămâne pe handoff / ghidaj contextual, nu pe închidere cap-coadă confirmată live
- `partner` este acum confirmat live pe flow-ul principal:
  - onboarding partner -> portfolio
  - import client real
  - drilldown în workspace client
  - workspace schimbat corect pe client
- `portfolio/tasks` și `portfolio/reports` rămân suprafețe secundare neînchise complet ca adevăr final
- `SPV` se încarcă live, dar fără token ANAF activ auditul rămâne doar parțial pe semnale reale
- `partner import execute` este blocat live pe cont fresh de `PARTNER_PLAN_REQUIRED`, deci nu poți valida client intake-ul complet fără planul corect

### 14.5 Clarificare live pentru cele 3 clase de flow

După runde separate de audit live, adevărul pe clase este:

- `documentary` = `CONFIRMAT LIVE`
  - `6/6` riscuri documentare reale trec cap-coadă
  - formula confirmată live este:
    - `confirmi -> generezi -> validezi -> aprobi -> folosești documentul -> Dosar -> monitorizare`
- `operational` = `CONFIRMAT LIVE`
  - `7/7` riscuri operaționale reale trec cap-coadă
  - formula confirmată live este:
    - `confirmi -> faci acțiunea reală -> pui dovada -> Dosar -> monitorizare`
- `specialist_handoff` = `CONFIRMAT LIVE`
  - confirmate live:
    - `GDPR-013`
    - `GDPR-014`
    - `GDPR-019`
    - `NIS2-001`
    - `NIS2-005`
    - `NIS2-015`
    - `NIS2-GENERIC` guvernanță
    - `NIS2-GENERIC` maturitate
    - `NIS2-GENERIC` furnizori
  - formula confirmată live este:
    - `confirmi -> handoff controlat -> acțiune în modul specialist -> revenire automată în cockpit -> confirmare finală / dovadă -> Dosar -> monitorizare`

### 14.6 Continuitate live după închidere

- `revalidation` = `CONFIRMAT LIVE`
  - `SYS-002` trece live cap-coadă pe:
    - `confirmi -> reconfirmi dovada -> alegi data nouă de review -> închizi cazul -> Dosar -> monitorizare`
  - adevărul runtime confirmat este:
    - noua dată de review se salvează în finding
    - bannerul verde de succes afișează aceeași dată nouă de control
    - footerul cockpitului afișează aceeași dată nouă de control
- `reopen` = `CONFIRMAT LIVE`
  - documentary, operational și `specialist_handoff` trec live pe `monitorizare -> redeschidere`

### 14.7 Încă neconfirmat live

Nu sunt încă închise live cap-coadă:
- snapshotul de ieșire din onboarding, ca expresie clară a rezultatului

Note tehnice rămase:
- `alerts / drift UI` este acum `CONFIRMAT LIVE` pe `open -> acknowledge -> in_progress -> resolved -> reopen`
- în auditul live de drift încă apare în consolă `React #418`, dar fără să rupă lifecycle-ul sau state-ul driftului

### 14.8 Concluzie live

Auditul structural din acest document rămâne valid.

Dar după verificarea live din `2026-03-27`, adevărul s-a întărit astfel:
- coloana principală există live
- multe suprafețe răspund live
- modulele specialist esențiale se încarcă live
- funnelul `landing -> register -> onboarding -> findings` este confirmat live pe toate cele 3 personas
- flow-ul documentar principal este închis live cap-coadă
- clasa `operational` este și ea confirmată live cap-coadă
- clasa `specialist_handoff` este confirmată live cap-coadă cu revenire automată în cockpit
- `SYS-002 revalidation` este confirmat live cap-coadă
- `reopen` este confirmat live pentru documentary, operational și `specialist_handoff`
- `alerts / drift UI` este confirmat live cap-coadă pe seed dedicat
- partner și compliance sunt confirmate live pe flow-ul principal
- suprafețele secundare partner/compliance sunt funcționale live, dar încă mai late decât spine-ul principal

Prin urmare, produsul este mai sănătos decât arăta prima rundă de audit, dar tot nu poate fi declarat `1:1` sau `client-ready 100%` până când:
- snapshotul de ieșire din onboarding spune clar `ce se aplică / ce am găsit / ce faci acum`
- partner/compliance sunt verificate live pe ramurile reale de utilizare
