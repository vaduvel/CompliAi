# CompliScan - Functionalitati aplicatie

## Ce este CompliScan

CompliScan este o aplicatie de conformitate asistata de AI. Scopul ei este sa ajute o echipa sa analizeze documente, sa tina evidenta sistemelor AI folosite si sa urmareasca schimbarile care pot crea risc de conformitate.

Aplicatia nu inlocuieste validarea umana. Recomandarile trebuie verificate de o persoana responsabila.

## Functionalitati principale

### 1. Dashboard de overview

Dashboard-ul afiseaza rapid:

- scorul curent de conformitate
- nivelul de risc
- urmatoarea actiune recomandata
- sursele scanate recent
- alertele active
- baseline-ul validat si drift-ul deschis

### 2. Scanare documente

Aplicatia poate analiza:

- PDF
- imagini PNG sau JPG
- text introdus manual

Fluxul include:

- incarcare sursa
- extragere text
- review al textului extras
- analiza conformitate
- generare findings, alerte si task-uri

### 3. Scanare manifest / repo

Aplicatia poate analiza fisiere tehnice precum:

- package.json
- package-lock.json
- pnpm-lock.yaml
- yarn.lock
- requirements.txt
- pyproject.toml
- poetry.lock

Pe baza lor poate detecta:

- provideri AI folositi
- framework-uri si dependinte relevante
- sisteme AI potentiale
- semnale initiale de risc

### 4. Inventar de sisteme AI

Aplicatia mentine un inventar AI cu informatii precum:

- nume sistem
- scop
- vendor sau provider
- model
- utilizare date personale
- verificare umana
- nivel de risc

Sistemele detectate automat pot avea status:

- detected
- reviewed
- confirmed
- rejected

### 5. Baseline si drift detection

Aplicatia poate salva un baseline validat si poate compara snapshot-urile noi cu acel baseline.

Poate semnala schimbari precum:

- provider nou
- model schimbat
- framework nou
- aparitia procesarii de date personale
- lipsa verificarii umane
- schimbare de scop
- crestere de risc

### 5.1. compliscan.yaml si repo sync

Aplicatia poate folosi un fisier `compliscan.yaml` ca sursa de adevar pentru configuratia declarata a unui sistem AI.

Prin endpoint-ul de repo sync, echipa tehnica poate trimite catre aplicatie doar fisierele relevante, de exemplu:

- compliscan.yaml
- package.json
- requirements.txt
- lockfiles

Pe baza acestor fisiere, aplicatia poate:

- genera findings cu mapare legala
- detecta sisteme AI
- actualiza snapshot-ul curent
- semnala drift fata de baseline

### 6. Findings, alerte si remediere

Pentru fiecare analiza, aplicatia poate genera:

- findings
- alerte
- task-uri de remediere
- recomandari de actiune
- sugestii de dovezi necesare

### 7. Export si rapoarte

Aplicatia poate exporta:

- raport PDF
- checklist
- compliscan.json
- compliscan.yaml

Aceste exporturi pot include:

- surse scanate
- sisteme AI confirmate
- findings
- drift
- sumar general

### 8. Jurnal de activitate

Aplicatia pastreaza istoric pentru:

- scanari
- detectii AI
- confirmari in inventar
- schimbari de status
- drift detectat
- actiuni de remediere

## Module aplicatie

Modulele principale sunt:

- Dashboard
- Scanari
- Documente
- Sisteme AI
- Checklists
- Alerte
- Rapoarte
- Setari

## Limitari

- Recomandarile sunt asistate de AI si necesita verificare umana.
- Auto-discovery-ul din manifest identifica semnale tehnice, dar are nevoie de confirmare umana pentru contextul de business.
- Drift-ul este util doar daca exista baseline validat sau snapshot-uri anterioare relevante.

## Rezumat

CompliScan combina trei zone principale:

- analiza documentelor
- inventar si control pentru sisteme AI
- urmarirea schimbarilor prin snapshot si drift

Valoarea principala a aplicatiei este ca transforma semnalele brute in actiuni, dovezi si control operational.
