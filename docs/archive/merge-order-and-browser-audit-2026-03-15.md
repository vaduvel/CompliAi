# Merge Order + Browser Audit

Data: 2026-03-15

## Ordinea corecta de merge

### 1. `codex/evidence-os-agent-workspace`

Motiv:

- este baza arhitecturala mare
- este `0` behind / `8` ahead fata de `main`
- `codex/scanare-wave-2` este construit peste aceasta baza

Commituri incluse pe acest lot:

- `a111aa5` `Polish Evidence OS safe surfaces`
- `70b8ded` `Align dashboard IA and advance agent workspace`
- `563433e` `Align navigation map with systems label`
- `5d1c395` `Add PR brief for agent workspace branch`
- `bd991d3` `Advance UX wave 1 and stabilize cockpit store`
- `8744c6b` `Split heavy control panels from initial bundle`
- `861b4b9` `Defer heavy vault sections behind local loading`
- `00c7881` `Split heavy settings tabs from initial route bundle`

### 2. `codex/scanare-wave-2`

Motiv:

- este un follow-up scurt peste baza de mai sus
- este `0` behind / `11` ahead fata de `main`
- dar fata de `codex/evidence-os-agent-workspace` este doar `3` commituri ahead

Commituri delta fata de `codex/evidence-os-agent-workspace`:

- `c64aefa` `Split scan verdicts and history from initial bundle`
- `38f6c0c` `Defer reports support panels behind local loading`
- `5044aa0` `Add scanare wave PR brief and follow-up audit`

## Regula simpla

- intai intra baza mare: `codex/evidence-os-agent-workspace`
- apoi intra follow-up-ul mic: `codex/scanare-wave-2`

Nu este sanatos sa incerci invers.

## Browser audit dupa merge

Auditul trebuie facut pe firul canonic, nu pe componente izolate.

Ordinea recomandata:

1. `Dashboard`
2. `Scanare`
3. `Control`
4. `Dovada / Remediere`
5. `Dovada / Audit si export`
6. `Dovada / Auditor Vault`
7. `Setari`

## Ce verifici pe fiecare pagina

### 1. Intrebare de intrare

Userul intelege in primele 5-10 secunde:

- ce face aici
- ce NU face aici
- care este prima actiune corecta

### 2. Intentie dominanta

Pagina respecta regula:

- o pagina = o intentie principala

Nu trebuie sa para simultan:

- workspace de executie
- explain page
- export page

### 3. Summary / detail / action

Ordinea trebuie sa fie clara:

- sumar
- detaliu
- actiune / handoff

Nu toate in paralel, la aceeasi greutate.

### 4. Handoff

Userul vede clar unde continua:

- `Scanare` -> `Control` sau `Dovada`
- `Remediere` -> `Auditor Vault` / `Audit si export`
- `Audit si export` -> inapoi in `Remediere` daca lipseste ceva

### 5. Rolul AI

Trebuie sa ramana clar peste tot:

- asistentul propune
- sistemul explica
- omul valideaza

## Blocaje reale de semnalat

Marchezi doar daca vezi:

- pagina cu intentie dubla sau tripla
- prima actiune neclara
- handoff rupt
- zona care pare sa faca altceva decat spune
- suprafata vizibil prea grea sau sufocata

Nu marca drept blocaj:

- preferinta personala minora de spacing
- text care poate fi polisat ulterior
- lipsa de perfectiune vizuala daca flow-ul e deja clar
