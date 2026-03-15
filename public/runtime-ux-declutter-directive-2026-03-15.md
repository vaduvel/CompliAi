# Runtime UX declutter directive

Data: 2026-03-15

## Verdict scurt

CompliScan nu are o problema de lipsa de feature-uri.

Problema actuala este de runtime UX:

- produsul explica prea mult
- prea multe blocuri primesc greutate similara
- executia, sumarul si proof-ul concureaza prea des in acelasi ecran

Pe scurt:

- arhitectura este mai matura decat experienta de folosire
- produsul este mai bun decat pare
- UX-ul actual il sub-vinde

## Ce ramane adevarat

- lantul principal ramane:
  - `sursa -> verdict -> remediere -> dovada -> audit`
- omul valideaza
- `Evidence OS` ramane sistemul oficial
- `Agent Evidence OS` ramane layer peste produsul existent, nu produs paralel

## Regula noua de executie

Nu cautam idei noi si nu facem redesign mare.

Cautam:

- taierea framing-ului redundant
- cresterea dominanței zonelor actionabile
- claritate mai dura pentru:
  - starea curenta
  - blocaj
  - urmatorul pas

Formula simpla:

- starea si urmatorul pas trebuie sa bata explicatia

## Ce trebuie sa bata in runtime

1. blocajul sau urgenta
2. actiunea primara
3. handoff-ul corect
4. abia dupa aceea explicatia si contextul lung

## Ce nu mai facem

- nu dam greutate egala la:
  - intro
  - sumar
  - suport read-only
  - executie
  - export
- nu urcam panouri suport deasupra actiunii reale
- nu impingem `Agent Evidence OS` ca suprafata concurenta cu cockpit-ul principal

## Ordinea de atac corecta

1. inchidem integrarea:
   - `codex/evidence-os-agent-workspace`
   - `codex/scanare-wave-2`
2. facem browser audit pe firul canonic
3. intram in `Checklists wave 1`
4. curatam `Dashboard` pana devine orientare pura
5. abia dupa aceea impingem mai departe `Agent Evidence OS` acolo unde chiar creste claritatea

## Prioritati de runtime

### 1. `Checklists`

Tinta:

- triere mai rapida
- executie mai rapida
- mai putin preambul deasupra board-ului
- `TaskCard` mai usor de scanat

### 2. `Dashboard`

Tinta:

- orientare pura
- blocajul si urmatorul pas sa fie dominante
- fara competitie cu proof, export sau control-room detaliat

### 3. `Scanare`

Tinta:

- continuam declutter-ul deja pornit
- pagina ramane poarta de intrare in lucru activ
- tot ce este read-only sau lookup ramane secundar

## Criteriul de succes

Pe fiecare pagina mare, un user nou trebuie sa inteleaga in primele 5-10 secunde:

- ce face aici
- ce nu face aici
- care este urmatorul pas corect

Daca explicația concureaza cu actiunea, pagina nu este suficient de curata.
