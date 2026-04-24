# CLAUDE-DESIGN-P1-SHORT-CONTRACT-2026-04-22

## Ce este
Contract scurt pentru suprafetele P1:
- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/client/[orgId]`
- `/dashboard/actiuni/remediere/[findingId]`

Acesta este documentul scurt de parity pe care il dai langa codul paginii curente.

## Reguli comune
1. Lista sau feed-ul principal trebuie sa ramana suprafata dominanta.
2. CTA-ul principal trebuie sa fie clar.
3. Bulk actions raman vizibile cand exista selectie.
4. Stari obligatorii:
   - loading
   - error
   - empty
   - filtered empty
5. Nu pierzi handoff-urile catre firma sau cockpit.

## 1. `/portfolio`

### Job
Triage cross-client. Intri in firma doar cand trebuie sa executi.

### Must keep
- page intro / summary
- KPI strip
- filter bar
- search
- sort
- lista de firme
- selectie
- bulk actions
- CTA clar per firma

### Nu ai voie
- sa transformi pagina in card grid ca default
- sa o faci tabel administrativ rece
- sa ascunzi actiunea principala

### Directie aprobata
- list view scanabil
- densitate operationala
- CTA per row: intri in executie

## 2. `/portfolio/alerts`

### Job
Inbox cross-client. Triage dimineata fara sa intri in fiecare firma.

### Must keep
- page intro
- summary stats
- top priorities / top 3
- feed grouped by time/day
- selectie
- bulk actions
- filtre:
  - severitate
  - sursa
  - firma
  - framework

### CTA logic
- primary: deschide cazul / vezi finding-ul
- secondary: intra in firma doar cand chiar ai nevoie de context extins

### Nu ai voie
- sa transformi pagina in simple cards decorative
- sa muti userul direct in firma ca flow implicit
- sa pierzi grouped feed sau bulk bar

## 3. `/portfolio/client/[orgId]`

### Job
Client drill-in din Portofoliu. Este context page, nu dashboard complet de firma.

### Must keep
- context clar despre firma
- focused finding daca exista `?finding=...`
- score / risk summary
- alte findings deschise
- summary NIS2
- summary vendor review
- CTA spre cockpit
- CTA spre firma

### CTA hierarchy
- primary: deschide finding-ul in cockpit
- secondary: intra in firma clientului

### Nu ai voie
- sa transformi pagina in org dashboard replacement
- sa lasi NIS2 si Furnizori sa domine finding-ul principal
- sa pierzi focused finding state

## 4. `/dashboard/actiuni/remediere/[findingId]`

### Job
Cockpit de executie pe un finding. Este suprafata principala de lucru, nu detail page generic.

### Must keep
- finding principal dominant
- context + impact
- evidence / document flow
- completeness / readiness
- approval / revalidation states
- CTA principal de executie
- handoff spre dosar / monitorizare unde exista

### Model conceptual
Problema -> impact -> dovada -> confirmare -> rezultat / handoff

### Nu ai voie
- sa spargi pagina in panouri egale fara ierarhie
- sa diluezi finding-ul principal
- sa faci dashboard frumos dar inutil

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
Pentru P1, focusul este:
- claritate
- triage
- handoff corect
- densitate controlata

Nu urmarim frumusete abstracta. Urmarim suprafete de lucru care bat live-ul si nu pierd putere operationala.
