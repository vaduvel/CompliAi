# CLAUDE-DESIGN-P2-SHORT-CONTRACT-2026-04-22

## Ce este
Contract scurt pentru suprafete mari din FAZA 2:
- `dosar`
- `fiscal`
- `nis2`
- `vendor-review`
- `monitorizare/conformitate`
- `setari`

Aceste pagini trebuie sa reuseasca 2 lucruri:
- sa pastreze logica reala
- sa devina mai clare decat live-ul actual

## Reguli comune
1. Nu reinterpretezi feature-ul. Il clarifici.
2. Nu muti actiunea principala in plan secund.
3. Nu ascunzi stari sau subflows importante.
4. Summary sus, lucru real jos.
5. Nu transforma paginile in dashboards decorative.

## 1. Dosar

### Job
Suprafata de dovada / pachet / export / documente operative.

### Must keep
- starea documentului / pachetului
- sursa dovezii
- legatura cu finding sau caz
- actiuni de export / adoptare / atasare
- statele de readiness sau lipsa dovada

### Nu ai voie
- sa faci doar un file browser mai frumos
- sa pierzi starea operationala a documentului

## 2. Fiscal

### Job
Suprafata specializata, matura, nu doar tabel de discrepante.

### Must keep
- validator / rezultate
- severitate
- context juridic / operational minim
- urmatoarea actiune clara
- handoff spre remediere sau document

### Nu ai voie
- sa simplifici excesiv cazul fiscal
- sa pierzi trasabilitatea dintre semnal si actiune

## 3. NIS2

### Job
Workspace de monitorizare specializat.

### Must keep
- status maturity / assessment
- incidente
- furnizori critici
- handoff spre actiuni sau dovezi
- stari clare pentru ce e incomplet / deschis / conform

### Nu ai voie
- sa-l transformi in doar cateva carduri cu numere
- sa pierzi caracterul de workspace

## 4. Vendor review

### Job
Suprafata pentru review furnizori, backlog, criticitate, intarzieri si context contractual.

### Must keep
- lista review-urilor
- starea review-ului
- criticitate
- intarzieri
- ce necesita context / follow-up
- CTA clar pe review sau vendor

### Nu ai voie
- sa pierzi prioritatea review-urilor deschise
- sa reduci totul la simple tags

## 5. Monitorizare / conformitate

### Job
Hub de framework-uri si stari de conformitate.

### Must keep
- framework hubs reale
- handoff spre workspaces mature
- status pe framework
- next action clara

### Nu ai voie
- sa faci un landing gol
- sa ascunzi framework-urile mature deja existente

## 6. Setari

### Job
Suprafata de configurare, nu pagina de marketing intern.

### Must keep
- zone/tabs reale
- actiuni de configurare
- stari
- zone de risc / billing / members / integrations / notifications unde exista

### Nu ai voie
- sa pierzi densitatea utila
- sa transformi totul in card grid fara continut

## Pattern comun pentru FAZA 2
Pe toate paginile:
- hero scurt
- summary compact
- zona de lucru dominanta
- CTA principal clar
- secondary actions disciplinate
- stari empty/loading/error bune

## Ce atasam langa document
Pentru pagina curenta:
- screenshot before
- `page.tsx`
- componenta principala
- API route / data shape
- `tokens.css`
- `components.html`
- `patterns.md`

## Verdict
Pentru FAZA 2 nu vrem redesign “inventiv”.
Vrem:
- claritate
- parity
- ritm vizual coerent cu P1
- mai putina confuzie decat live
