# Functionalitatile aplicatiei CompliScan

## Ce face aplicatia

CompliScan este o aplicatie de control de conformitate asistat de AI. Scopul ei este sa ajute echipa sa:

- scaneze documente sau surse tehnice relevante
- identifice riscuri GDPR, EU AI Act si semnale e-Factura
- organizeze sistemele AI intr-un inventar clar
- urmareasca schimbarile aparute intre snapshot-uri
- pregateasca dovezi si exporturi pentru audit intern sau verificare externa

Aplicatia nu inlocuieste validarea umana. Recomandarile si scorurile trebuie confirmate de o persoana responsabila.

## Functionalitati principale

### 1. Dashboard de overview

Dashboard-ul central arata rapid:

- scorul curent de conformitate
- nivelul de risc
- urmatoarea actiune recomandata
- starea surselor scanate
- daca exista baseline validat pentru drift
- alerte si activitate recenta

Rolul dashboard-ului este de orientare si prioritizare, nu de executie a tuturor fluxurilor.

### 2. Scanare documente

Aplicatia poate analiza:

- PDF
- imagini PNG/JPG
- text introdus manual

Fluxul de scanare include:

- incarcare sursa
- extragere text
- revizuire text extras
- analiza conformitate
- generare findings, alerte si task-uri

Rezultatul ramane legat de documentul scanat, impreuna cu data si dovezile extrase.

### 3. Scanare manifest / repo pentru auto-discovery

Aplicatia poate analiza fisiere tehnice de tip:

- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `requirements.txt`
- `pyproject.toml`
- `poetry.lock`

Pe baza lor poate detecta:

- provideri AI folositi
- framework-uri si dependinte relevante
- sisteme AI potentiale
- semnale initiale de risc

Sistemele detectate automat nu intra direct in inventarul final. Ele trec printr-un flux de review.

### 4. Inventar de sisteme AI

Aplicatia permite pastrarea unui inventar AI cu:

- nume sistem
- scop
- vendor / model
- utilizare date personale
- prezenta sau absenta verificarii umane
- nivel de risc
- actiuni recomandate

Sistemele pot avea stari precum:

- detected
- reviewed
- confirmed
- rejected

### 5. Baseline si drift detection

Aplicatia poate salva un baseline validat si compara snapshot-urile noi cu acel baseline.

Tipuri de schimbari urmarite:

- provider nou sau eliminat
- model schimbat
- framework nou
- detectare date personale
- lipsa verificare umana
- schimbare de scop
- crestere de risc
- aparitie de noi semnale de conformitate

Astfel, echipa vede nu doar ce exista acum, ci si ce s-a schimbat fata de o stare considerata valida.

### 6. Findings, alerte si plan de remediere

Pentru fiecare analiza, aplicatia poate genera:

- findings
- alerte
- task-uri de remediere
- recomandari de actiune
- sugestii de dovezi necesare

Aceste rezultate ajuta echipa sa transforme o analiza intr-un plan de lucru clar.

### 7. Rapoarte si export

Aplicatia poate exporta:

- raport PDF
- checklist
- `compliscan.json`
- `compliscan.yaml`

Exporturile pot include:

- sursele scanate
- sistemele AI confirmate
- findings
- drift
- sumarul general

### 8. Activitate si jurnal de evenimente

Aplicatia pastreaza jurnal pentru actiuni precum:

- scanare noua
- detectare sistem AI
- confirmare inventar
- schimbari de status
- drift detectat
- actiuni de remediere

Acest jurnal ajuta la trasabilitate si audit intern.

## Modulele aplicatiei

Aplicatia este organizata in urmatoarele zone principale:

- `Dashboard` - overview si prioritizare
- `Scanari` - scan document, text sau manifest
- `Documente` - rezultate pentru documente scanate
- `Sisteme AI` - inventar, detectii si baseline
- `Checklists` - semnale si verificari operationale
- `Alerte` - risc activ si drift deschis
- `Rapoarte` - exporturi si snapshot-uri
- `Setari` - reset, configurare si control workspace

## Limitari actuale

- Recomandarile sunt asistate de AI si necesita verificare umana.
- Auto-discovery-ul din manifest identifica semnale si dependinte, dar nu poate intelege perfect contextul de business fara confirmarea utilizatorului.
- Drift-ul este util doar daca exista un baseline validat sau snapshot-uri anterioare relevante.

## Pe scurt

CompliScan combina trei lucruri intr-un singur produs:

- analiza documentelor
- inventar si control pentru sisteme AI
- urmarirea schimbarii in timp prin snapshot si drift

Valoarea principala a aplicatiei este ca transforma semnalele brute in actiuni, dovada si control operational.
