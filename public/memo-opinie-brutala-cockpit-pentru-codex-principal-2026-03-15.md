# Memo - opinie brutala despre cockpit, pentru Codex principal

Data: 2026-03-15

## Scop

Acest document este un memo de decizie, nu sursa oficiala de status.

Rolul lui:

- sa fixeze verdictul sincer dupa auditul pe:
  - feedback nou
  - imagini runtime CompliScan
  - imagini de concurenta
  - auditul nou de UX cockpit
- sa dea lui Codex principal un filtru dur de prioritizare

## Verdict scurt

CompliScan are produs real, dar UX-ul runtime il sub-vinde.

Problema principala nu mai este lipsa de functionalitate.
Problema principala este lipsa unei ierarhii suficient de dure intre:

- stare
- actiune
- explicatie
- handoff

Pe scurt:

- arhitectura este mai matura decat experienta de folosire
- produsul este mai bun decat pare
- runtime-ul se explica prea mult

## Ce este excelent

1. Modelul mare de produs:
   - `sursa -> verdict -> remediere -> dovada -> audit`
2. `AI Compliance Pack` ca obiect principal structurat
3. `human review` obligatoriu si commit strict
4. `Dovada` ca diferentiator real:
   - task-uri
   - evidence
   - vault
   - audit pack
5. tonul `Evidence OS`:
   - dens
   - enterprise
   - coerent

## Ce este doar mediocru acum

1. `Dashboard`
   - util, dar nu destul de autoritar
2. `Scanare`
   - informativa, dar prea explicata
3. `Checklists`
   - corecta conceptual, dar prea grea operational
4. `Audit si export`
   - aproape buna, dar poate aluneca in hibrid
5. `Setari`
   - mai sanatoasa, dar inca prea framed

## Cele 10 lucruri pe care le-as taia primele din runtime

1. Blocurile care explica de doua ori aceeasi idee pe aceeasi pagina.
2. Textele de tip:
   - `cum citesti pagina`
   - `flux canonic`
   - `unde continui dupa`
   cand structura si CTA-ul spun deja asta.
3. Cardurile de doctrină care nu schimba decizia userului in primele 5-10 secunde.
4. Egalitatea vizuala dintre prea multe carduri primare.
5. Handoff-urile afisate prea devreme, inainte de workspace-ul real.
6. KPI-urile sau strip-urile care doar confirma ce userul stie deja din stare.
7. CTA-urile tertiare puse prea aproape de actiunea principala.
8. Filtrele care au aceeasi greutate vizuala desi au roluri diferite.
9. Cardurile suport care imping sub fold work queue-ul sau formularul principal.
10. Orice tentatie de a transforma `Agent Evidence OS` in produs paralel.

## Cele 5 lucruri pe care le-as lasa sa domine produsul

1. `Next action`
   - userul trebuie sa stie instant ce face acum
2. `Blocked / urgent state`
   - drift
   - weak evidence
   - blocked readiness
3. Workspace-ul real al paginii
   - `Scanare` = incepi analiza
   - `Checklists` = executi
   - `Control` = confirmi
4. Dovada si validarea umana
   - produsul castiga prin incredere, nu prin spectacol
5. Separarea clara intre:
   - executie
   - ledger
   - livrabil

## Ce spune concurenta, tradus brutal

Concurenta nu castiga pentru ca are UI-uri mai frumoase.
Castiga pentru ca:

- home-ul se citeste in cateva secunde
- listele operationale sunt monotone si clare
- problema domina, nu explicatia
- reporting-ul nu concureaza cu executia
- trust/public proof nu concureaza cu cockpitul intern

## Ce NU trebuie sa faca Codex principal

1. Sa inventeze produs nou.
2. Sa deschida un nou sistem mental paralel pentru agenti.
3. Sa copieze grafice sau dashboard-uri de concurenta fara valoare operationala imediata.
4. Sa impinga feature breadth inaintea disciplinei de cockpit.
5. Sa confunde `mai mult continut` cu `mai multa claritate`.

## Ce ar trebui sa faca Codex principal

1. Sa termine declutter-ul pe `Scanare`.
2. Sa faca `Checklists` mai usor de triat si executat.
3. Sa curete `Dashboard` pana devine orientare pura.
4. Sa tina `Audit si export` strict pe readiness + livrabil.
5. Sa impinga `Agent Evidence OS` doar dupa ce cockpitul mare nu mai este didactic.

## Regula de decizie

Daca un bloc:

- nu schimba decizia userului
- nu reduce timpul pana la actiune
- nu clarifica starea risc / dovada / blocaj

atunci blocul trebuie:

- taiat
- mutat sub fold
- comprimat
- sau coborat la helper

## Concluzia cea mai sincera

CompliScan nu mai are o problema de produs.
Are o problema de disciplina UX.

Daca urmatoarele valuri taie framing-ul redundant si intaresc ierarhia de cockpit, produsul poate urca repede in perceptia de:

- control room serios
- audit-ready
- usor de invatat

Daca nu, va continua sa para:

- foarte inteligent
- foarte bogat
- dar mai complicat decat este de fapt
