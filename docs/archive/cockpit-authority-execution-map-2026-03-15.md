# Cockpit authority execution map

Data: 2026-03-15

## Scop

Acest document transforma concluziile auditului mare intr-un plan executabil cu ownership clar.

Nu este un nou roadmap.
Este harta practica pentru sprinturile urmatoare imediat dupa integrarea loturilor deja pregatite.

## Verdict de lucru

Avem deja:

- produs real
- model de domeniu bun
- fundatie buna

Problema dominanta ramane:

- runtime UX prea explicativ
- ierarhie insuficient de dura intre:
  - stare
  - actiune
  - handoff
  - explicatie

## Decizia mare

Nu deschidem produs nou.
Nu facem redesign mare.
Nu impingem acum partea futurista din `feedback.md`.

Facem:

1. integrare curata
2. browser audit
3. sprint scurt de `cockpit declutter si autoritate operationala`

## Ordinea sanatoasa

### Faza 0 - integrare

1. intra `codex/evidence-os-agent-workspace`
2. intra `codex/scanare-wave-2`

### Faza 1 - validare in produs

1. browser audit pe:
   - `Dashboard`
   - `Scanare`
   - `Control`
   - `Dovada / Remediere`
   - `Dovada / Audit si export`
   - `Dovada / Auditor Vault`
   - `Setari`
2. confirmam care este cea mai slaba pagina ramasa

### Faza 2 - sprint scurt activ

1. `Checklists wave 1`
2. `Dashboard` executive declutter
3. cleanup final pe `Scanare` doar daca browser auditul mai arata reziduuri

## Ce fac eu

Owner principal: Codex principal

### A. Governance si integrare

- tin firul canonic intre:
  - backlog
  - log
  - status arhitectura
  - task breakdown
- tin merge order-ul si browser auditul

### B. Page-level work

- `app/dashboard/checklists/page.tsx`
- `app/dashboard/page.tsx`
- orice schimbare de compozitie de pagina mare
- orice schimbare care atinge:
  - nav
  - handoff global
  - doctrine de pagina
  - suprafete top-level

### C. Convergenta produs

- decid ce intra acum si ce ramane parcat
- pastrez `Agent Evidence OS` ca layer, nu produs paralel

## Ce poate face Codex 2

Owner secundar: Codex 2

### Lot serios permis acum

`Checklists wave 1` la nivel de componente operationale.

Tinta:

- `RemediationBoard` mai compact
- `TaskCard` mai scanabil
- ierarhie mai buna pentru filtre si CTA-uri

Conditie:

- fara schimbare de business logic
- fara schimbare de routing
- fara schimbare de page shell

## Split clar de ownership

### Eu

- page shell
- ordine de sus a paginii
- handoff-uri
- doctrine si canon
- integrare finala

### Codex 2

- densitate si ierarhie in componentele de executie
- progressive disclosure intern in carduri
- compactare suport / metadate / filtre

## Ce NU facem acum

- `Trust OS`
- `Digital Twin`
- `Cross-Border Engine`
- `AI Black Box`
- `Live Trust Seal`
- `self-healing PR generation`
- produs paralel pentru agenti

## Criteriul de succes pentru sprintul scurt

1. `Checklists`:
   - board-ul intra mai repede in ecran
   - filtrele se citesc mai repede
   - actiunea primara domina clar

2. `Dashboard`:
   - in 5 secunde vezi ce este blocat
   - in 5 secunde vezi ce faci acum

3. produsul per total:
   - pare mai putin didactic
   - pare mai autoritar operational
   - nu pierde increderea si nu pierde human review
