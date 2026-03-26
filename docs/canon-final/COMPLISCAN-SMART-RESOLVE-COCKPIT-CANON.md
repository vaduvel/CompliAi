# CompliScan — Smart Resolve Cockpit Canon

Data: `2026-03-25`
Status: `FINAL FORM OF TRUTH`
Owner: `Product canon`

Acest document este adevărul principal de produs pentru CompliScan de acum înainte.
Acest document absoarbe ideile valide din `CompliScan_User_Journey_Truth`.
Acest document absoarbe ideile valide din `CompliScan_Experience_Blueprint`.
Acest document absoarbe ideile valide din `CompliScan_Screen_by_Screen_Blueprint`.
Acest document absoarbe ideile valide din `CompliScan_Wireframe_Logic_Spec`.
Dacă există conflict între un document vechi de journey și acest canon, acest canon câștigă.

Ordine de precedență:
1. acest document conduce direcția de produs, UX, IA și flow
2. runtime-ul real și codul validează fezabilitatea și implementarea incrementală
3. documentele vechi pot inspira, dar nu mai operează ca adevăr paralel

Nu plecăm de la zero.
Nu aruncăm ce există.
Nu mai construim un produs fragmentat în care userul aleargă între 7 locuri pentru aceeași problemă.

Păstrăm ce există deja și îl reorganizăm într-un sistem mai inteligent, mai dens și mai util.

Regulă fermă:
- `finding-ul` devine locul principal de lucru
- `dosarul` devine memoria și dovada permanentă
- `scanarea`, `generatorul`, `NIS2`, `vendor review`, `e-Factura` și restul rămân instrumente și puncte de intrare
- userul nu mai este plimbat între suprafețe diferite pentru aceeași rezolvare

---

## 0. Cum folosim acest canon

Acest document nu este doar o viziune.
Este documentul după care trebuie judecate:
- flow-urile noi
- refactor-ele de IA și navigație
- wireframe-urile
- UI recipes
- backlog-ul
- PR-urile și implementările

Reguli de folosire:
1. dacă un flow nou contrazice canonul, flow-ul se schimbă
2. dacă un document vechi contrazice canonul, documentul vechi devine doar referință
3. dacă runtime-ul actual este fragmentat, refactorul trebuie să meargă spre acest model, nu spre încă o pagină separată
4. nu mai creăm documente noi de adevăr paralel; extindem acest canon
5. orice implementare trebuie să reducă distanța dintre `finding`, `rezolvare`, `dovadă`, `dosar` și `monitorizare`

---

## 1. Ce este CompliScan

CompliScan nu este doar:
- un scanner
- un generator de documente
- un dashboard
- un checklist tool

CompliScan este un `compliance operating system` pentru firme românești.

Rolul lui este:
1. să înțeleagă firma
2. să detecteze ce se aplică și ce lipsește
3. să deschidă findings clare
4. să ajute userul să le rezolve într-un singur loc
5. să salveze dovada în dosar
6. să monitorizeze continuu dacă lucrurile rămân valide în timp

Formula canonică a produsului este:

`Intake -> Detection -> Smart Resolve Cockpit -> Dossier -> Continuous Monitoring`

---

## 2. Principiul central

Problema actuală a produsului nu este lipsa de funcții.

Problema este fragmentarea:
- finding-ul este într-un loc
- explicația în alt loc
- generatorul în alt loc
- dovada în alt loc
- re-scanarea în alt loc
- dosarul în alt loc

Canonul nou este:

`1 finding -> 1 cockpit -> 1 rezultat verificabil -> 1 intrare în dosar`

Userul nu trebuie să navigheze între pagini ca să închidă o singură problemă.
Userul trebuie să intre într-un singur spațiu de lucru și să termine problema acolo.

### 2.1 Cum trebuie să pară produsul pentru user

Pentru user, CompliScan trebuie să pară simultan:

1. `Ghid inteligent`
   - spune ce se aplică și de unde să înceapă
2. `Mecanism de rezolvare`
   - nu doar arată problema, ci ajută și la închidere
3. `Dosar viu`
   - ce rezolvă nu dispare, rămâne la dosar
4. `Scut activ`
   - chiar și când userul nu intră în aplicație, sistemul verifică pentru el
5. `Infrastructură de încredere`
   - când este întrebat, are ce să arate

### 2.1.1 Pilonii de wow care nu trebuie pierduți

În timpul refactorului spre `Smart Resolve Cockpit`, nu avem voie să pierdem stratul de wow al produsului.

Pilonii nenegociabili sunt:
1. `Smart onboarding`
   - scanare
   - prefill
   - sugestii
   - demonstrație de inteligență din primele minute
2. `Dovadă`
   - nu doar rezolvi
   - rămâne ceva real, verificabil și reutilizabil
3. `Scut`
   - produsul veghează și când userul nu este în aplicație
4. `Încredere`
   - când userul trebuie să arate ceva, are ce arăta
5. `Detectiv`
   - produsul găsește, corelează și explică semnalele
6. `Te ține la curent`
   - schimbări în workspace
   - schimbări relevante din zona de compliance
   - reminder-e și revalidări

Regulă:
- `Resolve` devine centrul de execuție
- dar `smart onboarding`, `proof`, `shield`, `trust`, `detective` și `keep-you-current` rămân puterea generală a produsului

### 2.2 Ordinea corectă a experienței

CompliScan trebuie trăit în ordinea asta:

1. landing page
2. onboarding inteligent
3. primul snapshot
4. prima rezolvare
5. prima dovadă salvată
6. monitorizare continuă
7. credibilitate externă
8. infrastructură pe termen lung

Dacă ordinea se rupe, produsul pare fragmentat.
Dacă ordinea este respectată, produsul pare coerent, inteligent și inevitabil.

### 2.3 Promisiunea de produs în primele secunde

Formula canonică pentru landing și primele ecrane este:

`Afli ce ți se aplică, rezolvi ce lipsește și păstrezi dovada într-un singur loc.`

Subhero canonic:

`Pornim din CUI, website și semnalele tale operaționale. Apoi CompliScan îți arată ce ți se aplică, ce lipsește, te ajută să generezi ce ai nevoie și îți păstrează istoricul la dosar.`

### 2.4 Durerile canonice pe care le rezolvăm

Userii noștri nu intră în CompliScan relaxați și curioși.
Intră de cele mai multe ori:
- confuzi
- speriați
- surprinși de cât de mult s-a adunat
- grăbiți
- nesiguri dacă au făcut suficient

Canonul de produs trebuie să rezolve explicit aceste stări.

Asta înseamnă:
- nu arătăm haosul înainte să arătăm direcția
- nu arătăm doar lipsuri; arătăm și ce putem construi imediat
- nu cerem expertiză juridică înainte să oferim orientare
- nu lăsăm userul singur să lege detectarea de rezolvare

CompliScan trebuie să transmită:

`Nu ești singur. Îți arăt ce contează, te ajut să închizi și păstrez dovada pentru tine.`

### 2.5 Cele 3 situații canonice de utilizare

Produsul trebuie să funcționeze coerent pentru 3 situații reale:

1. `Firma nouă`
   - intră
   - vede ce i se aplică
   - rezolvă primele lipsuri
   - rămâne la zi zilnic și săptămânal

2. `Operatorul care ține zona legislativă / compliance`
   - are nevoie de workspace clar
   - vede tot ce este deschis
   - poate urmări, valida, genera și păstra dovezile într-un singur sistem

3. `Userul solo care vrea să-și țină singur spatele`
   - are nevoie de claritate
   - are nevoie de ajutor cap-coadă
   - nu vrea jargon, nici procese rupte

Regulă:
- nu construim flow-uri doar pentru un operator expert
- nu simplificăm atât de mult încât să pierdem controlul operațional
- produsul trebuie să pară în același timp ghid, workspace și scut activ

---

## 3. Modelul canonic al aplicației

Aplicația are 5 layere:

### 3.1 Intake

Aici intră datele și semnalele noi.

Surse:
- login
- CUI
- ANAF
- e-Factura / semnale fiscale, când există
- website
- documente noi încărcate
- vendori noi
- formulare și evaluări completate de user

Scop:
- să reducem cât mai mult completarea manuală
- să facem prefill inteligent
- să pornim cu context, nu cu pagină goală

### 3.2 Detection

Aici CompliScan decide:
- ce se aplică firmei
- ce obligații sunt relevante
- ce riscuri sau lipsuri există
- ce findings trebuie deschise

Output:
- applicability
- findings structurate pe severitate
- asset-uri recomandate
- ordine de lucru recomandată

### 3.3 Smart Resolve Cockpit

Acesta este centrul produsului.

Fiecare finding are propriul cockpit de rezolvare.

În cockpit, userul vede și face tot:
- problema
- impactul
- de ce a fost detectată
- ce trebuie făcut
- ce asset trebuie generat
- ce trebuie aprobat uman
- ce dovadă trebuie urcată
- ce verificare / re-scan este necesar
- când poate marca rezolvat

### 3.4 Dossier

Dosarul nu este o pagină decorativă.

Dosarul este memoria operațională și probatorie a aplicației.

Aici se acumulează:
- documente generate
- drafturi aprobate
- dovezi urcate
- rezultate de re-scan
- note de validare
- timeline de remediere
- audit trail
- metadata de expirare / review / stare

### 3.5 Continuous Monitoring

După rezolvare, aplicația nu uită.

Tot ce a fost rezolvat rămâne sub watch.

CompliScan monitorizează:
- drift
- schimbări legislative
- schimbări pe website
- semnale ANAF / e-Factura / fiscal
- documente expirate
- vendor changes
- re-scanuri necesare
- reminder-e
- revalidări periodice

`Rezolvat` nu înseamnă `mort`.
Înseamnă `închis operațional, arhivat în dosar, monitorizat continuu`.

### 3.6 Lanțul canonic de valoare

Pentru user, aplicația trebuie să pară o mână de ajutor cap-coadă.

Lanțul canonic este:
1. `verificare`
2. `auto-găsire și completare`
3. `descoperire și generare`
4. `reverificare și păstrare`
5. `reminder și suport`
6. `scut activ și cercetaș`

Traducerea corectă în produs:
- verificăm ce se poate automat
- găsim și completăm ce știm sigur
- descoperim ce se aplică și ce lipsește
- generăm ce poate fi generat
- reverificăm după acțiune
- păstrăm rezultatul la dosar
- notificăm ce se schimbă
- cercetăm câmpul relevant pentru user și revenim cu semnale utile

CompliScan nu trebuie perceput ca pagină de raportare.
Trebuie perceput ca `ajutor operațional care găsește, explică, pregătește, validează, salvează și monitorizează`.

---

## 4. Flow-ul canonic al userului

### 4.1 Intrare și înțelegere firmă

Landing-ul și intrarea în produs trebuie să promită un traseu clar:
- bagi CUI-ul
- analizăm ce putem
- vedem ce ți se aplică
- vedem ce lipsește
- închizi prima problemă
- salvezi prima dovadă
- rămâi monitorizat

Flow:
1. userul se loghează
2. introduce CUI
3. CompliScan caută date disponibile
4. dacă există, preia ANAF, website și alte semnale utile
5. userul completează doar ce lipsește sau corectează ce este greșit

Scop:
- minim de input manual
- maxim de context automat

### 4.2 Onboarding

Onboarding-ul nu este un formular infinit.

Onboarding-ul trebuie să facă doar 3 lucruri:
1. să confirme profilul firmei
2. să confirme ce se aplică
3. să pornească lista de findings inițiale

Outputul onboarding-ului:
- firm profile confirmat
- applicability clar
- findings ordonate pe severitate

Ce trebuie să simtă userul:
- nu completez doar un formular
- aplicația chiar verifică ceva pentru mine
- pornesc din date reale, nu din pagină goală

Ce nu trebuie să se întâmple:
- 20+ întrebări din prima
- jargon tehnic
- haos de framework-uri
- lipsa unei senzații că sistemul lucrează pentru user

### 4.3 După onboarding

După onboarding, userul trebuie să vadă imediat:
- ce se aplică firmei
- ce am găsit
- ce este critic
- care este primul finding pe care trebuie să-l rezolve

Nu îl trimitem într-un dashboard vag.
Îl trimitem într-un sistem de lucru.

Formula canonică a primului snapshot este:

`Ce ți se aplică`
`Ce am găsit deja`
`Ce faci acum`

Primul snapshot nu trebuie să fie:
- 14 findings deodată
- 7 framework-uri prezentate simultan
- 20 task-uri fără ordine
- 5 dashboard-uri care concurează între ele

### 4.4 Rezolvarea unui finding

Când userul intră într-un finding, acolo trebuie să poată face tot.

Cockpit-ul unui finding conține:
- `Ce este problema`
- `De ce contează`
- `Ce faci acum`
- `Ce asset recomandăm`
- `Generează`
- `Aprobă`
- `Atașează dovada`
- `Rulează re-scan / revalidare`
- `Marchează rezolvat`

Nu există motiv valid să-l trimitem din acel finding în 4 pagini diferite pentru aceeași muncă.

Lecția pe care userul trebuie să o învețe aici este:

`CompliScan nu doar raportează. CompliScan ajută să închizi ceva real.`

Flow canonic:

`Problemă -> Generează -> Confirmă -> Salvează -> Rezolvat`

Exemplu canonic:
- găsim lipsa unei politici
- oferim buton direct `Generează acum`
- documentul se deschide deja în context
- userul completează doar minimul necesar
- confirmă că datele reflectă realitatea
- salvăm documentul
- închidem finding-ul doar după confirmare și dovadă

Ce nu acceptăm:
- text vag de tip `mergi în generator`
- lipsa CTA-ului contextual
- întoarcere manuală haotică
- închidere automată fără confirmare umană

### 4.5 După rezolvare

După ce finding-ul este închis:
- documentul generat merge în dosar
- aprobarea merge în dosar
- dovada merge în dosar
- rezultatul re-scanului merge în dosar
- istoricul rămâne disponibil pentru audit, control sau export

Și apoi finding-ul intră în monitorizare.

Acesta este momentul în care produsul trebuie să pară infrastructură, nu doar interfață.

Userul trebuie să înțeleagă clar:

`Ai rezolvat ceva și acum există la dosar.`

Nu arătăm doar:
- toast de success
- task complete

Arătăm:
- dovada a fost salvată
- artefactul a fost atașat
- snapshot-ul a fost actualizat
- dosarul conține acum primul rezultat verificabil

### 4.6 Home-ul pe etape

Home-ul nu rămâne static.
El trebuie să evolueze odată cu maturitatea userului.

`Home în prima sesiune`
- ce ți se aplică
- ce am găsit
- top 3 acțiuni

`Home după prima rezolvare`
- ce ai acumulat
- ce e urgent acum
- ce s-a verificat pentru tine

`Home după 1-3 luni`
- acumulare
- feed de activitate
- dovezi / rapoarte / timeline
- evenimente noi
- trust / share / export

### 4.7 Blueprint executabil al experienței

Secțiunea asta este traducerea canonică a experienței în format executabil.

Pentru fiecare suprafață mare definim:
- ce vede userul
- ce face sistemul
- ce trebuie să afișăm în UI

#### Landing page

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Hero clar, promisiune simplă | Nu rulează nimic încă | Headline: `Afli ce ți se aplică, rezolvi ce lipsește și păstrezi dovada.` |
| CTA principal | Pregătește intrarea în onboarding | CTA: `Începe gratuit` + subtext: `Pornim din CUI, website și semnalele tale operaționale.` |
| 3 pași simpli | Explică traseul complet | `1. Introduci CUI / website 2. Vezi ce ți se aplică 3. Rezolvi și păstrezi dovada` |
| Dovadă de output | Arată rezultatul final, nu lista de feature-uri | Preview: Audit Pack, Trust Center, dovadă salvată, rapoarte |
| Segmentare buyer | Pregătește intrarea potrivită | Blocuri: `Pentru IMM` / `Pentru consultant` / `Pentru compliance intern` |

#### Onboarding

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Pas 1: cine ești | Colectează minimul necesar | `CUI`, `website`, `mod de lucru: solo / consultant / intern` |
| Pas 2: Compli verifică | Rulează prefill și verificări automate | Mesaje live: `Verificăm datele firmei`, `Analizăm website-ul`, `Căutăm semnale`, `Pregătim snapshot-ul` |
| Pas 3: rezultat inițial | Construiește primul snapshot | `Asta ți se aplică`, `Asta am găsit deja`, `Asta facem acum` |
| Save and return | Salvează progresul | Buton și mesaj: `Poți continua mai târziu` |

#### Primul snapshot

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Ce ți se aplică | Mapează framework-uri aplicabile | Carduri simple: `GDPR`, `e-Factura`, `NIS2: da / nu / posibil`, `AI Act: da / nu / posibil` |
| Ce am găsit deja | Agregă rezultate din CUI, website și semnale | Checklist vizual: politică, site, SPV, furnizori, zone de completat |
| Top 3 acțiuni | Prioritizează următorul pas | `1 acțiune principală + 2 secundare`, cu timp estimat și rezultat estimat |

#### Prima rezolvare

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Problemă clară | Leagă finding-ul de rezolvare | Titlu simplu + `de ce contează` + `ce obții dacă rezolvi` |
| CTA contextual | Deschide flow-ul corect | Buton: `Generează acum` / `Adaugă dovada` / `Continuă` |
| Generator preselectat | Completează contextul task-ului | Template deja selectat, date preumplute unde este sigur |
| Confirmare explicită | Blochează închiderea automată | Checkbox-uri de confirmare + CTA final: `Confirm și salvez dovada` |

#### Momentul de dovadă

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Task rezolvat | Salvează artefactul și actualizează snapshot-ul | Mesaj principal: `Dovada a fost salvată la dosar.` |
| Primul artefact | Înregistrează documentul / dovada | Link direct spre `Vault` / `Artifact` / `Timeline` |
| Snapshot actualizat | Recalculează starea | `Snapshot-ul tău a fost actualizat` + scor / progres, dacă există |

#### Home după prima sesiune

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Ce ai acumulat | Numără dovezi, rapoarte, luni monitorizate | Card: dovezi, rapoarte, furnizori monitorizați, luni, ultimul audit pack |
| Ce e urgent acum | Prioritizează lucrurile deschise | Top 3 acțiuni urgente |
| Ce am verificat pentru tine | Afișează activitate utilă | Feed: SPV, furnizori, site, NIS2, changes |

#### Faza 2 — continuitate

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| Activitate recentă utilă | Consumă cron-uri, semnale și verificări | `Am verificat pentru tine...`, `Am detectat...`, `Ți-am pregătit...` |
| Eveniment extern relevant | Leagă piața / autoritatea de workspace-ul userului | `1 eveniment real + cum stai tu față de el + 1 CTA` |
| Notificări utile | Filtrează zgomotul | Doar schimbări relevante, deadline-uri, respingeri, rights requests |

#### Layerul agentic

| Ce vede userul | Ce face sistemul | Ce trebuie să afișăm în UI |
|---|---|---|
| `Compli lucrează pentru tine` | Rulează agenți și monitorizări | Fără jargon tehnic. Doar: `Am verificat`, `Am comparat`, `Am găsit`, `Am salvat` |
| Status de supraveghere | Arată că sistemul este activ | Bloc simplu: `ce monitorizăm` și `când am verificat ultima dată` |

#### Regula generală de suprafață

Dacă fiecare ecran nu spune clar:
- ce vede userul
- ce a făcut sistemul
- ce trebuie să facă userul acum

atunci experiența este prea abstractă și trebuie simplificată.

### 4.8 Screen-by-screen recipes canonice

Secțiunea asta fixează rețetele concrete pentru ecranele principale.
Nu este un document separat.
Este parte din canonul principal.

#### Landing Page

`Obiectiv`
- să explice în 5 secunde ce face produsul, de unde pornește și ce livrează

`Userul trebuie să înțeleagă`
- nu trebuie să știe toată legislația
- pornim din date reale
- nu doar găsim probleme, ci ajutăm la rezolvare
- ce rezolvă rămâne la dosar

`Structură UI`
- hero cu headline-ul canonic
- subheadline-ul bazat pe `CUI + website + semnale`
- CTA principal: `Începe gratuit`
- CTA secundar: `Vezi cum funcționează`
- bloc `Cum funcționează` în 3-5 pași
- bloc `Ce primești`
- bloc `Pentru cine este`

`Nu afișăm`
- jargon tehnic
- listă completă de module
- 10 framework-uri în hero
- promisiuni vagi fără rezultat concret

#### Onboarding — Step 1

`Obiectiv`
- să luăm minimul necesar fără să copleșim userul

`Câmpuri canonice`
- CUI
- website
- folosești e-Factura / SPV?
- mod de lucru: solo / consultant / intern

`CTA`
- principal: `Continuă`
- secundar: `Continui mai târziu`

`Nu afișăm`
- 20 întrebări
- termeni de tip engine, pipeline, extractor

#### Onboarding — Step 2

`Obiectiv`
- să arătăm că sistemul chiar verifică ceva

`UI canonic`
- loader cu progres lizibil
- mesaje de tip:
  - `Verificăm datele firmei`
  - `Analizăm website-ul`
  - `Căutăm semnale relevante`
  - `Identificăm ce ți se aplică`
  - `Pregătim primele acțiuni`

`Nu afișăm`
- log tehnic
- job ids
- termeni de tip `scan pipeline`, `runner`, `drift engine`

#### Onboarding — Step 3 / Finish

`Obiectiv`
- să închidă onboarding-ul cu senzația că baza a fost pusă

`UI canonic`
- titlu: `Am pregătit baza firmei tale`
- bullets:
  - am creat primul snapshot
  - am detectat ce ți se aplică
  - am pregătit primele acțiuni
  - tot ce rezolvi de acum rămâne la dosar

`CTA`
- principal: `Văd ce am acumulat`
- secundar: `Merg la prima acțiune`

`Nu afișăm`
- listă lungă de findings
- wording de tip `ai 12 probleme grave`

#### Dashboard initial / primul snapshot

`Obiectiv`
- orientare imediată

`Structură UI`
- bloc `Ce ți se aplică`
- bloc `Ce am găsit deja`
- bloc `Ce faci acum`

`Nu afișăm`
- 10 widget-uri egale
- scoruri multiple fără context
- liste foarte lungi

#### Resolve screen / finding cockpit

`Obiectiv`
- să lege direct problema de rezolvarea ei

`Structură UI`
- zonă stânga:
  - titlul problemei
  - descriere scurtă
  - impact
  - dovada acceptată
- zonă dominantă / dreapta:
  - `Acum faci asta`
  - generează sau deschide flow-ul corect
  - confirmă că reflectă realitatea
  - salvează dovada
  - validează și actualizează snapshot-ul

`CTA`
- principal: `Generează acum`
- secundar: `Am deja dovada`
- terțiar: `Continui mai târziu`

`Nu afișăm`
- `mergi în generator` fără legătură directă
- confirmare automată fără user

#### Generator screen

`Regulă canonică importantă`
- dacă userul intră liber, generatorul poate exista ca pagină separată
- dacă userul vine dintr-un finding, generatorul trebuie să fie tratat ca parte din cockpit, nu ca detur obligatoriu

`Structură UI`
- titlu specific documentului
- subtitlu: pornim de la problema găsită și completăm doar ce e necesar
- stepper simplu:
  - date specifice firmei
  - preview
  - confirmare
  - salvare la dosar

`CTA`
- principal: `Confirm și salvez dovada`
- secundar: `Revizuiesc mai întâi`

`Nu afișăm`
- template chooser generic când userul vine din finding
- prea multe tipuri de documente simultan

#### Dovadă salvată / success moment

`Obiectiv`
- să transforme o acțiune într-un asset

`UI canonic`
- titlu: `Dovada a fost salvată la dosar`
- subtext: documentul a fost atașat și snapshot-ul a fost actualizat
- quick facts:
  - artefact nou
  - data salvării
  - unde îl găsești
  - legătura cu finding-ul rezolvat

`CTA`
- principal: `Vezi dosarul`
- secundar: `Merg la următoarea acțiune`

`Nu afișăm`
- doar toast vag
- succes fără link spre artifact / vault / timeline

#### Dashboard după prima rezolvare

`Obiectiv`
- să introducă ideea de acumulare și continuitate

`Structură UI`
- bloc `Ce am construit pentru tine`
- bloc `Ce e urgent acum`
- bloc `Ce am verificat pentru tine`

`Mesaj canonic`
- `Tot ce rezolvi aici rămâne la dosar și poate fi folosit mai târziu ca dovadă.`

#### Activity Feed / Continuitate

`Obiectiv`
- să arate că aplicația lucrează și când userul nu este prezent

`Exemple bune`
- `Am verificat SPV-ul firmei tale`
- `Am detectat o modificare relevantă în zona NIS2`
- `Am reverificat 3 furnizori activi`
- `Am salvat snapshot-ul lunar`
- `Am găsit o schimbare pe site care cere atenție`

`Nu afișăm`
- `cron completed`
- `sync executed`
- `job completed`
- identificatori interni

#### Notificări

`Obiectiv`
- revenire legitimă, nu enervantă

`Structură canonică`
- ce s-a schimbat
- de ce contează
- ce faci acum

#### Portfolio

`Obiectiv`
- să transforme consultantul sau contabilul într-un operator eficient

`Structură UI`
- urgency queue
- firme cu evoluție pozitivă / negativă
- acțiuni disponibile:
  - batch safe drafts
  - drilldown
  - rapoarte

`Regulă`
- după intrarea pe firmă păstrăm banner persistent de context

#### Trust / Export / Share

`Obiectiv`
- să transforme produsul în ceva ce poate fi arătat altora

`Export card canonic`
- Audit Pack
- One-page report
- Trust Center
- Share link

`CTA`
- `Trimite Trust Center-ul tău`
- `Copiază linkul de partajare`
- `Descarcă Audit Pack`

`Nu afișăm`
- denumiri confuze
- exporturi fără context
- diferență neclară între `Trust Center`, `Trust Profile` și `Vault`

### 4.9 Legile canonice de wireframe și ierarhie

Secțiunea asta fixează logica de wireframe și block-order pentru toate suprafețele mari.
Nu descrie design vizual.
Descrie ordinea corectă a informației și greutatea fiecărui bloc.

#### 4.9.1 Cele 5 întrebări pe care trebuie să le răspundă orice ecran

Pe orice ecran important, structura trebuie să răspundă în ordinea asta:

1. `Unde sunt?`
2. `Ce este important acum?`
3. `Ce a făcut sistemul pentru mine?`
4. `Ce fac eu mai departe?`
5. `Ce pot vedea mai jos dacă vreau detaliu?`

Dacă ordinea se rupe, produsul pare greu, tehnic și fragmentat.

#### 4.9.2 Regula de above the fold

Above the fold trebuie să conțină numai:
1. contextul ecranului
2. cel mai important lucru de acum
3. CTA-ul principal
4. dovada că sistemul a făcut deja ceva pentru user

Tot ce este:
- detaliu
- istoric
- breakdown
- explicație juridică lungă
- log
- ajutor secundar
merge below the fold sau în expand.

#### 4.9.3 Formula de layout canonic

Toate suprafețele mari trebuie să respecte aceeași logică:

`Sus`
- claritate
- orientare
- urgență

`Centru`
- ce a făcut sistemul
- ce face userul acum
- acțiunea dominantă

`Dreapta`
- reassurance
- acumulare
- context util
- dovadă / rezultat

`Jos`
- detalii
- istoric
- explicații
- breakdown

#### 4.9.4 Legea de densitate

CompliScan nu trebuie să fie nici gol, nici aglomerat.

Regula corectă este:
- densitate mare de valoare
- densitate mică de zgomot

Asta înseamnă:
- puține blocuri, dar fiecare util
- un CTA dominant
- rezultate vizibile
- fără duplicarea aceleiași informații în 3 carduri

#### 4.9.5 Legea de compact cockpit

În zona `Resolve`, versiunea corectă este un `smart resolve compact cockpit`.

Nu facem:
- mega-card decorativ
- panouri egale care concurează între ele
- 7 suprafețe separate pentru aceeași muncă

Facem:
- un finding activ
- un stepper orientativ adaptiv
- un rezumat clar
- un workspace activ
- o dovadă vizibilă de progres
- legătură directă cu dosarul

Regulă:
- stepper-ul există ca `hartă de progres`, nu ca wizard rigid
- userul trebuie să știe unde se află în schemă
- userul nu trebuie să fie trimis în altă pagină pentru a face pasul următor

#### 4.9.6 Legea de block-order pentru ecranele cheie

`Landing`
- promisiune
- primul pas
- output concret
- credibilitate

`Onboarding step 1`
- câmpuri
- clarificări
- sentimentul că durează puțin

`Onboarding verificare`
- sistemul lucrează
- nu durează mult
- rezultatul urmează imediat

`Finish`
- am construit deja ceva
- nu ai doar probleme
- uite unde mergi acum

`Primul snapshot`
- applicability
- ce am găsit
- ce faci acum
- ce ai acumulat

`Resolve`
- problema
- impactul
- ce faci acum
- buton direct
- dovadă și validare

`Generator`
- minimul necesar
- preview
- confirmare
- salvare la dosar

`Success`
- dovada există
- snapshot-ul s-a schimbat
- ai progres real

`Dashboard după prima rezolvare`
- urgență
- acumulare
- activitate automată
- export / trust / dovezi

`Portfolio`
- ce arde azi
- pe ce firmă intri
- ce faci sigur în batch

`Trust / Export / Share`
- ce output e acesta
- cui îi servește
- ce faci mai departe

#### 4.9.7 Regula finală de wireframe

Dacă un ecran nu reușește să spună clar:
- unde sunt
- ce contează
- ce a făcut Compli pentru mine
- ce fac eu acum

atunci ecranul trebuie simplificat înainte de orice polish vizual.

### 4.10 Ce trebuie să valideze cercetările din faza 2

Cercetările din faza 2 nu trebuie să deschidă încă o direcție de produs.
Trebuie să valideze și să rafineze acest canon.

Ele trebuie structurate în jurul acestor întrebări:

1. `Landing-ul promite exact ce urmează să facă produsul?`
   - userul trebuie să poată introduce exact ce promitem: `CUI`, `website`, semnale relevante

2. `Onboarding-ul demonstrează suficient de repede inteligența CompliScan?`
   - extragem din `CUI`
   - extragem din `e-Factura`, unde există
   - analizăm `website`, unde există
   - arătăm clar că sistemul lucrează pentru user

3. `Primul snapshot demonstrează că produsul nu doar scanează și raportează, ci și rezolvă?`
   - trebuie să fie clar că există next action și cockpit de închidere

4. `Momentul de dovadă salvată este suficient de puternic?`
   - userul trebuie să vadă clar că soluția a intrat la dosar

5. `Monitorizarea continuă este percepută ca valoare reală?`
   - userul trebuie să înțeleagă că este notificat pentru:
     - schimbări în propriul workspace
     - schimbări relevante din domeniul său de compliance
     - revalidări și reverificări necesare

6. `Layerul agentic este vizibil ca ajutor real, nu ca jargon?`
   - userul trebuie să simtă simplu că `Compli lucrează pentru mine`

Regulă:
- faza 2 cercetează cum rafinăm acest traseu
- nu redeschide întrebarea dacă produsul trebuie să fie fragmentat sau orchestrat
- Smart Resolve Cockpit, Dossier și Monitoring rămân axa centrală

---

## 5. Ce rămâne în produs și de ce

Nu distrugem suprafețele existente.
Le schimbăm rolul.

### 5.1 `Scanări`

Rămâne.

Rol:
- punct de intrare pentru documente noi
- scanare manuală la cerere
- captare de semnale noi

Regulă:
- dacă scanarea găsește ceva nou, creează findings noi
- rezolvarea nu se face în pagina de scanare
- rezolvarea se face în cockpit-ul finding-ului

### 5.2 `Generator`

Rămâne.

Rol:
- generare liberă de documente
- folosire standalone când userul vrea document direct, fără finding

Regulă:
- când documentul este cerut de un finding, generatorul apare în cockpit
- generatorul nu mai este destinație obligatorie pentru rezolvarea unui finding

### 5.3 `NIS2`, `DORA`, `DSAR`, `Vendor Review`, `Fiscal`, `AI`

Rămân.

Rol:
- module specializate
- puncte de intrare și de operare directă
- management dedicat pentru procese mai complexe

Regulă:
- orice problemă reală detectată aici trebuie să poată deveni finding
- orice finding trebuie să poată fi rezolvat prin același model de cockpit

### 5.4 `Resolve`

Devine pagina centrală de execuție.

Nu doar listă de findings.

Trebuie să devină:
- work queue
- orchestration layer
- smart cockpit surface

### 5.5 `Reports / Audit Pack / Vault / Dosar`

Rămân.

Rol:
- loc de export
- loc de prezentare
- loc de verificare
- loc de audit extern

Regulă:
- nu sunt locul principal de muncă
- sunt locul în care se vede și se livrează ce a fost deja făcut

---

## 6. Smart Resolve Cockpit — definiția canonică

### 6.1 Ce este

Un cockpit compact și inteligent, atașat fiecărui finding, care permite rezolvarea cap-coadă într-un singur loc.

### 6.2 Ce nu este

Nu este:
- un mega-card aglomerat
- o pagină cu 20 de panouri egale
- o copie miniaturală a tuturor modulelor din app

### 6.3 Structura canonică

Cockpitul trebuie să respecte aceeași logică de wireframe ca restul produsului.

`Sus`
- titlu finding
- severitate
- status tradus uman
- sursă
- o propoziție simplă de orientare

`Centru`
- stepper adaptiv de orientare
- problema
- impact
- de ce a fost detectată
- `Acum faci asta`
- un singur CTA principal
- workspace-ul activ:
  - generator
  - aprobare
  - upload dovadă
  - re-scan

`Dreapta`
- ce a pregătit sistemul
- ce dovadă se acceptă
- ce se salvează la dosar
- ce se schimbă după închidere
- ce se monitorizează de acum înainte
- când trebuie reverificat
- ce eveniment poate redeschide finding-ul

`Jos`
- istoric
- validare
- log de schimbări
- explicații complete

Regulă:
- nu dublăm aceeași informație în header, sidebar și cardul central
- nu lăsăm pași morți sau decorativi
- fiecare bloc trebuie să împingă finding-ul spre `rezolvare verificabilă`

### 6.3.1 Stepper-ul canonic

Stepper-ul din cockpit trebuie să existe.
Dar nu ca listă decorativă de 7 pași morți.

Rolul lui corect este:
- să arate unde este userul acum
- să arate ce urmează
- să facă vizibil faptul că finding-ul nu moare după rezolvare, ci intră în monitorizare

Canon:
- `stepper orientativ`
- `workspace unic de execuție`

Adică:
- userul vede pașii
- userul execută pasul activ în același cockpit
- nu sare între 4 pagini doar pentru că există o hartă de progres

### 6.3.2 Stepper adaptiv, nu fix

Stepper-ul trebuie să fie adaptiv după tipul de finding.

Setul de bază este:
1. `Detectat`
2. `Pregătești soluția`
3. `Confirmi / atașezi dovada`
4. `Verificat`
5. `Monitorizat`

Exemple:
- dacă finding-ul cere document, pasul `Pregătești soluția` devine `Generezi draftul`
- dacă userul are deja dovada, pasul 2 poate deveni `Încarci dovada`
- dacă finding-ul cere re-scan, pasul `Verificat` devine `Re-scan / revalidare`
- după `Rezolvat`, cockpit-ul trebuie să poată arăta clar că finding-ul intră în `Monitorizat`

### 6.3.3 Rail-ul din dreapta

Cockpit-ul trebuie să aibă un rail clar de `dossier + monitoring`.

În acest rail trebuie să apară:
- ce artefact sau dovadă intră în dosar
- cine a aprobat
- când a fost salvat
- unde se găsește în dosar
- când este următoarea reverificare
- ce drift sau schimbare poate redeschide cazul

Regulă:
- `rezolvat` nu este doar un badge
- `rezolvat` înseamnă `dovadă salvată + urmă de aprobare + regulă de monitorizare`

### 6.4 Regula de densitate

Cockpitul trebuie să fie:
- compact
- inteligent
- orientat pe acțiune

Nu trebuie să fie:
- verbos
- decorativ
- plin de explicații pasive

### 6.5 Regula CTA

La orice moment, userul trebuie să aibă un singur pas principal clar.

Exemple:
- `Generează draftul`
- `Confirmă și aprobă`
- `Atașează dovada`
- `Rulează re-scan`
- `Marchează rezolvat`

---

## 7. Status model canonic

Statusurile interne ale unui finding trebuie să permită orchestration clară.

Set canonic:
- `detected`
- `in_progress`
- `draft_generated`
- `waiting_human_approval`
- `evidence_attached`
- `revalidated`
- `resolved`
- `under_monitoring`

În UI, nu trebuie să expunem jargon inutil.
UI-ul trebuie să traducă aceste stări în limbaj uman.

Exemple:
- `Necesită acțiune`
- `În lucru`
- `Draft pregătit`
- `Așteaptă confirmarea ta`
- `Dovadă salvată`
- `Verificat`
- `Rezolvat`
- `Monitorizat`

---

## 8. Dosarul de rezolvări — definiția canonică

Dosarul este locul unde se adună rezultatul real al muncii.

Nu este doar un export.

Este:
- memorie operațională
- memorie juridică
- memorie de audit

Pentru fiecare finding rezolvat, dosarul trebuie să păstreze:
- finding-ul sursă
- asset-ul generat
- versiunea aprobată
- dovada
- userul care a confirmat
- data rezolvării
- data ultimei verificări
- rezultatul re-scanului
- legătura către monitorizare ulterioară

Regulă:
- tot ce userul produce într-un cockpit relevant trebuie să aibă cale directă în dosar
- userul nu trebuie să mute manual artefacte între suprafețe

---

## 9. Continuous Monitoring — definiția canonică

Monitorizarea continuă pornește automat după rezolvare și urmărește dacă starea rămâne validă.

Semnale urmărite:
- drift pe site
- schimbări de furnizori
- documente expirate
- schimbări legislative
- semnale ANAF
- semnale e-Factura
- incidente / evenimente operaționale
- re-scanuri necesare
- reminder-e de revalidare

Când apare un semnal nou:
- fie se redeschide finding-ul existent
- fie se deschide unul nou, dar legat de istoricul anterior din dosar

Scop:
- să nu tratăm conformitatea ca pe o bifă unică
- să o tratăm ca pe un proces viu

---

## 10. Rolul AI în produs

În 2026, AI-ul din CompliScan nu are voie să fie doar generator de text.

AI-ul trebuie să aducă valoare reală în tot flow-ul:
- face prefill
- explică finding-ul pe limbaj uman
- recomandă următorul pas
- generează asset-ul relevant
- ajută la aprobare
- spune ce dovadă trebuie
- compară înainte / după
- decide dacă e nevoie de re-scan
- rezumă ce s-a schimbat
- leagă totul de dosar și monitorizare

Canon:
- AI-ul asistă decizia și execuția
- omul aprobă unde este necesar
- sistemul păstrează dovada

AI-ul nu trebuie vândut ca jargon.
Userul nu trebuie să vadă:
- agent orchestration
- autonomous runners
- intelligence fabric
- multi-agent workflows

Userul trebuie să simtă simplu:

`Compli lucrează pentru tine și când nu ești în aplicație.`

Traducerea canonică în UI:
- `Am verificat pentru tine...`
- `Am detectat...`
- `Ți-am pregătit...`
- `Am comparat față de ultima variantă...`
- `Ți-am salvat...`
- `Ți-am semnalat...`

Rolul AI-ului este:
- continuitate
- grijă
- protecție
- muncă automată reală

---

## 11. Decizii ferme

1. Nu mai fragmentăm rezolvarea unui finding între multe pagini.
2. `Resolve` devine suprafața principală de execuție.
3. `Scanări`, `Generator`, `NIS2`, `Fiscal`, `Vendor`, `AI`, `DSAR` rămân ca instrumente și intake surfaces.
4. Orice finding relevant trebuie să poată fi închis cap-coadă din propriul cockpit.
5. Tot ce se generează, se aprobă sau se validează merge în dosar.
6. Tot ce intră în dosar intră sub monitorizare continuă.
7. Nu rescriem produsul de la zero; refolosim și reordonăm ce există.
8. Nu implementăm UI nou care să rupă această logică.
9. Nu construim features izolate care nu se leagă de findings, dosar sau monitorizare.
10. Nu mai menținem documente paralele de adevăr; acest canon este locul unde absorbim și clarificăm.
11. Orice ecran important trebuie să respecte ordinea: context, prioritate, acțiune, dovadă, detaliu.
12. Orice wireframe sau UI nou pentru `Resolve` trebuie să urmărească modelul `smart resolve compact cockpit`.

---

## 12. Ce nu facem

Nu facem:
- o singură pagină monstru cu toate modulele deschise simultan
- încă o pagină separată pentru fiecare sub-pas de remediere
- un generator care produce documente fără să intre în dosar
- o rezolvare marcată închisă fără dovadă și fără memorie
- monitorizare separată de ceea ce s-a rezolvat înainte

---

## 13. North Star de implementare

Orice decizie de produs, UX, IA sau engineering trebuie evaluată prin această întrebare:

`Reduce distanța dintre detectare și rezolvare verificabilă într-un singur loc?`

Dacă răspunsul este `da`, suntem pe direcția corectă.
Dacă răspunsul este `nu`, ne întoarcem la fragmentare.

North Star final:

`Pages for intake`
`Findings for execution`
`Dossier for memory`
`Monitoring for continuity`

Acesta este adevărul de produs pentru CompliScan.

---

## 14. Ce trebuie să fie clar pentru implementare

Dacă acest document urmează să fie implementat cap-coadă, el trebuie citit ca document de execuție, nu doar de direcție.

Pentru implementare, trebuie să fie clare 5 lucruri:
1. ce rămâne din produsul actual
2. ce se transformă
3. ce devine central
4. care este ordinea de migrare
5. ce înseamnă `gata` pentru fiecare val

Regulă:
- nu implementăm după impresii
- nu facem refactor de dragul refactorului
- fiecare schimbare trebuie legată de un rezultat concret în flow

---

## 15. Maparea canonică din produsul actual spre modelul nou

### 15.1 Ce păstrăm

Păstrăm ca suprafețe sau capabilități:
- `Landing`
- `Onboarding`
- `Dashboard`
- `Resolve`
- `Scanări`
- `Generator`
- `NIS2`
- `Vendor Review`
- `Fiscal / e-Factura / semnale`
- `Reports / Audit Pack / Trust / Vault / Dosar`
- `Portfolio`
- `Notifications`

Nu le păstrăm însă cu același rol.

### 15.2 Ce se schimbă ca rol

`Landing`
- devine promisiune corectă a întregului flow

`Onboarding`
- devine demonstrație de inteligență și prefill
- nu mai este formular lung și inert

`Dashboard`
- devine snapshot + orientare + acumulare
- nu mai este tablou de bord generic

`Resolve`
- devine centrul aplicației
- listă de findings + cockpit de execuție

`Scanări`
- rămâne punct de intake
- nu mai devine loc principal de rezolvare

`Generator`
- rămâne pentru generare liberă
- când vine dintr-un finding, este componentă a cockpit-ului

`Dosar / Vault / Audit Pack / Trust`
- devin ieșirea verificabilă a muncii
- nu locul principal în care userul muncește

`Notifications / Feed / Monitoring`
- devin continuitatea produsului
- nu doar semnalistică pasivă

### 15.3 Ce devine central

Centrul aplicației devine:

`Finding + Smart Resolve Cockpit + Dossier linkage + Monitoring`

Tot restul trebuie să alimenteze sau să susțină acest nucleu.

---

## 16. State machine canonic pentru Smart Resolve Cockpit

### 16.1 Stările canonice

Stările tehnice de bază:
- `detected`
- `in_progress`
- `draft_generated`
- `waiting_human_approval`
- `evidence_attached`
- `revalidated`
- `resolved`
- `under_monitoring`

### 16.2 Traducerea în limbaj uman

În UI folosim:
- `Necesită acțiune`
- `În lucru`
- `Draft pregătit`
- `Așteaptă confirmarea ta`
- `Dovadă salvată`
- `Verificat`
- `Rezolvat`
- `Monitorizat`

### 16.3 Tranzițiile canonice

Fluxul standard:

`detected -> in_progress -> draft_generated -> waiting_human_approval -> evidence_attached -> revalidated -> resolved -> under_monitoring`

Tranziții alternative permise:
- `detected -> evidence_attached`
  - când userul are deja dovada și nu mai trebuie generator
- `in_progress -> resolved`
  - doar dacă există dovadă validă și confirmare explicită
- `under_monitoring -> detected`
  - când apare drift sau schimbare nouă
- `under_monitoring -> in_progress`
  - când redeschidem aceeași temă cu istoric existent

### 16.4 Reguli de blocare

Nu permitem:
- `resolved` fără dovadă sau justificare clară
- `draft_generated` să fie confundat cu `rezolvat`
- `revalidated` fără o urmă de verificare
- închidere automată tăcută

---

## 17. Structura minimă a cockpit-ului implementabil

Orice cockpit implementat trebuie să aibă, minim:

1. `Identity block`
- titlu finding
- severitate
- status
- sursă

2. `Meaning block`
- ce este problema
- de ce contează
- ce risc produce

3. `Action block`
- un singur CTA principal
- eventual un CTA secundar sigur

4. `Work block`
- generator sau upload dovadă sau confirmare sau re-scan

5. `Outcome block`
- ce s-a produs
- ce s-a salvat
- unde găsești în dosar

6. `Verification block`
- cine a confirmat
- când s-a verificat
- ce se monitorizează de acum înainte

Dacă una dintre aceste 6 bucăți lipsește, cockpit-ul nu este complet.

---

## 18. Ordinea canonică de implementare

Nu implementăm tot produsul simultan.
Îl mutăm în modelul nou în valuri controlate.

### Valul 1

Obiectiv:
- `Landing -> Onboarding -> Primul Snapshot -> Resolve`

Livrăm:
- promisiunea corectă în landing
- onboarding scurt cu demonstrație de inteligență
- primul snapshot coerent
- primul cockpit compact pentru findings prioritare

Rezultatul urmărit:
- userul vede că produsul găsește și ajută la închidere

### Valul 2

Obiectiv:
- `Generator contextual + Dovadă salvată + Dossier linkage`

Livrăm:
- generator integrat în finding flow
- success moment puternic
- intrare automată în dosar
- timeline clar de remediere

Rezultatul urmărit:
- userul înțelege că soluția nu dispare, ci rămâne verificabilă

### Valul 3

Obiectiv:
- `Continuous Monitoring + Feed + Notifications + Reopen logic`

Livrăm:
- activitate utilă
- notificări relevante
- reminder-e
- drift / schimbări / reverificări
- redeschidere coerentă a finding-urilor

Rezultatul urmărit:
- produsul pare viu și protector, nu doar punctual

### Valul 4

Obiectiv:
- `Portfolio + batch-safe work + trust surfaces`

Livrăm:
- flow clar pentru consultant / operator multi-client
- batch-uri sigure
- trust / export / share bine legate de dosar

Rezultatul urmărit:
- produsul devine infrastructură de lucru pentru operatori mai maturi

---

## 19. Criterii de acceptare canonice

O implementare este aliniată cu acest document numai dacă:

1. userul poate ajunge dintr-un finding la o rezolvare verificabilă fără să alerge între multe suprafețe
2. tot ce generează sau încarcă relevant ajunge la dosar fără mutare manuală
3. după rezolvare există o formă clară de monitoring sau revalidare
4. dashboard-ul și resolve-ul nu concurează între ele, ci joacă roluri diferite
5. generatorul nu rupe contextul când este chemat dintr-un finding
6. success moment-ul arată progres real, nu doar toast
7. notificările și feed-ul spun ceva util, nu statusuri interne
8. UI-ul arată ce a făcut sistemul pentru user, nu doar ce mai lipsește

Dacă aceste criterii nu sunt îndeplinite, implementarea este doar parțial aliniată.

---

## 20. Ce mă obligă pe mine la implementare

Pentru că eu urmează să implementez acest canon, documentul mă obligă la:

1. să nu introduc suprafețe noi care rup nucleul `finding -> cockpit -> dosar -> monitoring`
2. să prefer integrarea și reordonarea înaintea duplicării
3. să tratez `Resolve` ca suprafață principală de execuție
4. să fac generatorul contextual când vine dintr-un finding
5. să leg orice rezultat important de dosar
6. să nu las monitoring-ul ca strat separat și uitat
7. să transform UI-ul în produs de lucru, nu doar în suprafață de prezentare

Acest document nu este doar ghid pentru echipă.
Este și contractul meu de implementare pentru CompliScan.
