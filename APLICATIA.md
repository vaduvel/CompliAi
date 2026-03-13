# CompliScan - ce face exact aplicatia

## Rezumat

CompliScan este un MVP de cockpit de conformitate pentru companii din Romania.
Aplicatia centralizeaza trei zone:

- EU AI Act: detecteaza indicii de fluxuri AI cu risc ridicat
- GDPR: marcheaza probleme probabile de consimtamant / tracking
- e-Factura: arata stare operationala si sincronizare demo

Aplicatia nu promite "100% compliant". Lucreaza cu:

- scor de risc
- recomandare AI
- verificare umana inainte de raport oficial

## Ce vede utilizatorul in produs

### 1. Pagina principala `/`

- landing page simplu
- explica pe scurt produsul
- trimite in dashboard

### 2. Dashboard `/dashboard`

Este pagina de overview si arata:

- scorul de risc curent
- eticheta de risc
- ultimul scan
- disclaimer legal
- "Next best action" generata din planul de remediere
- rezumat operare pentru GDPR / EU AI Act / e-Factura
- carduri operationale pentru:
  - EU AI Act
  - e-Factura
  - GDPR quick fixes
  - Sandbox
- centru de export
- alerte active
- analize documente recente

### 3. Scanari `/dashboard/scanari`

Este zona in care utilizatorul porneste analiza unui document.
Permite:

- introducere nume document
- text manual
- upload de imagine
- upload de PDF

Fluxul este:

1. utilizatorul incarca documentul sau lipeste text
2. daca exista OCR configurat, aplicatia extrage text din fisier
3. textul rezultat este analizat prin reguli keyword-based
4. se genereaza findings, alerte si task-uri de remediere
5. utilizatorul este trimis in pagina de documente

### 4. Documente `/dashboard/documente`

Arata:

- ultimul document analizat
- rezumat extras din document
- indicatori de tip sistem / date atinse / actiuni / focus revizie
- task-urile legate de ultimul document
- lista scanarilor recente
- drawer pentru textul extras complet

### 5. Alerte `/dashboard/alerte`

Arata toate task-urile deschise derivate din alerte si findings.

### 6. Checklists `/dashboard/checklists`

Arata planul de remediere ca board de task-uri.
Utilizatorul poate:

- filtra dupa prioritate
- marca task-ul ca done
- atasa o dovada mock
- exporta task-ul ca fisier text

Statusul task-urilor si numele dovezilor atasate sunt persistate in starea aplicatiei.

### 7. Rapoarte `/dashboard/rapoarte`

Combinatie intre:

- board-ul de remediere
- centru de export

Permite:

- generare raport HTML pentru print / PDF
- export checklist text
- copiere link pentru contabil

### 8. Sisteme `/dashboard/sisteme`

Arata:

- cele 4 carduri operationale
- inventar AI curent
- numar sisteme high-risk
- numar sisteme low-risk
- numar documente scanate

### 9. Setari `/dashboard/setari`

Arata un sumar static despre:

- workspace activ
- motor OCR
- scor curent
- ultimul scan

## Cum functioneaza analiza documentelor

Analiza documentelor este in mare parte simulata, bazata pe reguli.

Aplicatia cauta cuvinte cheie in numele documentului si in continutul extras:

- daca gaseste termeni ca `decizie automata`, `scoring`, `profilare`, `identificare biometrica`, `cv screening`
  - marcheaza caz posibil high-risk EU AI Act
  - adauga alerta rosie
- daca gaseste `cookies`, `tracking`, `analytics`
  - marcheaza posibil risc GDPR
  - adauga alerta galbena
- daca gaseste `factura`, `anaf`, `e-factura`, `xml`
  - adauga finding pentru flux e-Factura

Daca nu gaseste nimic relevant:

- aplica un finding generic de risc redus

## Ce date pastreaza

Starea aplicatiei retine:

- alerte
- findings
- scanari
- mesaje chat
- scor derivat din starea curenta
- progres GDPR
- stare e-Factura

Scanarea salveaza:

- numele documentului
- preview din continut
- text extras limitat
- data scanarii
- numarul de findings

## Persistenta

Aplicatia are doua moduri de persistenta:

### 1. Local file store

Implicit foloseste:

- `.data/compliance-state.json`

Acesta este modul principal de fallback pentru MVP.

### 2. Supabase REST

Daca exista variabilele de mediu necesare, aplicatia incearca sa citeasca / scrie in:

- schema `compliscan`
- tabela `app_state`

Organizatia folosita in prezent este hardcodata:

- `org-demo-ion-popescu`

## Ce integrari sunt reale si ce este demo

### Real / optional

- Google Vision API pentru OCR pe imagini si PDF-uri
- Gemini API pentru raspunsuri AI in endpoint-ul de chat
- Supabase REST pentru persistenta starii

### Demo / simulat

- e-Factura sync: doar marcheaza sincronizarea ca reusita
- generare PDF: produce HTML pentru print / export
- share cu contabil: copiaza un link
- sandbox: afiseaza doar toast
- task workflow: local in browser

## Endpoint-uri API disponibile

### `GET /api/dashboard`

Returneaza:

- starea curenta
- sumarul dashboard-ului
- planul de remediere

### `POST /api/scan`

Primeste:

- `documentName`
- `content`
- `imageBase64`
- `pdfBase64`

Returneaza:

- starea actualizata
- sumarul nou
- planul de remediere
- informatii OCR
- preview de text extras

### `POST /api/integrations/efactura/sync`

Simuleaza o sincronizare e-Factura si seteaza:

- `efacturaConnected = true`
- `efacturaSyncedAtISO = now`

### `PATCH /api/alerts/[id]/resolve`

Marcheaza o alerta ca inchisa.

### `PATCH /api/tasks/[id]`

Persista metadate operationale pentru task:

- `status` (`todo` / `done`)
- `attachedEvidence`

### `POST /api/reports`

Genereaza:

- un obiect de raport JSON
- un HTML simplu pentru print / export

### `POST /api/chat`

Genereaza raspuns pentru intrebari despre conformitate.

Ordinea de fallback este:

1. Gemini API, daca exista cheia
2. raspuns rule-based, daca Gemini lipseste sau esueaza

Mesajele sunt salvate in stare, dar in prezent nu exista un UI activ pentru chat in dashboard-ul nou.

### `POST /api/state/reset`

Reseteaza complet starea aplicatiei la starea initiala.
In productie, endpoint-ul trebuie protejat cu `COMPLISCAN_RESET_KEY`
trimis in header-ul `x-compliscan-reset-key`.

## Cum se calculeaza scorul de risc

Scorul este derivat din:

- numarul de alerte rosii
- numarul de alerte galbene
- numarul de findings high-risk
- numarul de findings low-risk

Scorul nu este o evaluare juridica.
Este doar un indicator operational pentru prioritizare.

## Ce limitari are acum

- nu exista autentificare
- nu exista multi-tenant real
- nu exista upload storage dedicat pentru documente
- nu exista procesare asincrona / job queue pentru fisiere mari
- nu exista integrare reala ANAF
- endpoint-ul de chat exista, dar nu este expus in UI-ul curent

## Pentru cine este util acum

Aplicatia este potrivita acum pentru:

- demo-uri de produs
- MVP intern
- validare de UX pentru un cockpit de conformitate
- testare flux scan -> findings -> task-uri -> export

Nu este inca pregatita pentru:

- productie multi-client
- audit formal fara validare umana
- automatizari juridice sau fiscale cu efect oficial
