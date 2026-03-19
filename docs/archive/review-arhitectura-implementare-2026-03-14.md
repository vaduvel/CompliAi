# CompliScan - Review Arhitectura si Implementare

Data: 2026-03-14

## Verdict scurt

Firul produsului este inca tinut bine.

Golden path-ul ramane recognoscibil:

- sursa
- analiza
- control
- dovada
- audit

Problema principala nu este ruptura de arhitectura.

Problema principala este acumularea de greutate si mix de responsabilitati in cateva locuri mari.

## Ce este sanatos

### 1. Firul de domeniu se vede in cod

Stratul de audit si traceability este coerent:

- `lib/server/compliance-trace.ts`
- `lib/server/audit-pack.ts`
- `lib/server/audit-pack-client.ts`
- `lib/server/dashboard-response.ts`

Ce este bine:

- `auditDecision` exista
- `bundleCoverageStatus` exista
- evidence quality exista
- hydratarea metadata de evidence din cloud exista

### 2. Fundatia operationala nu mai este de demo

Stare buna:

- auth
- memberships
- org switching
- RLS
- release readiness
- health
- request IDs

### 3. `Evidence OS` nu mai este doar experiment local

Acum exista:

- sursa canonica de design
- sursa canonica de implementare
- primitive canonice
- adaptoare runtime subtiri

## Unde se vede greutatea

### 1. `useCockpit` a devenit prea mare

`components/compliscan/use-cockpit.ts`

Dimensiune:

- `1635` linii

Implica:

- incarcare dashboard
- mutatii
- exporturi
- evidence
- traceability
- family reuse

Concluzie:

- este util ca adaptor central
- dar este prea mare pentru a ramane neschimbat

### 2. Avem pagini mari care combina prea multe responsabilitati

Exemple:

- `app/dashboard/rapoarte/auditor-vault/page.tsx` -> `1749` linii
- `app/dashboard/setari/page.tsx` -> `1282` linii
- `app/dashboard/scanari/page.tsx` -> `794` linii
- `app/dashboard/rapoarte/page.tsx` -> `534` linii

Concluzie:

- nu cer rewrite
- cer decompozitie controlata

### 3. Payload-ul de dashboard ramane prea central

`/api/dashboard` alimenteaza prea multe suprafete simultan prin:

- `state`
- `summary`
- `workspace`
- `traceabilityMatrix`
- `compliancePack`
- `remediationPlan`

Concluzie:

- bun pentru MVP avansat
- greu pentru performanta si ownership

### 4. Adoptia `Evidence OS` este reala, dar inca partiala pe produsul mare

Nu mai avem haos complet, dar inca exista:

- suprafete migrate bine
- suprafete hibrid
- suprafete partial migrate

Cel mai clar exemplu ramas:

- `app/dashboard/scanari/page.tsx`

## Ce NU recomand

### 1. Nu recomand rewrite de framework

`Next.js` ramane alegerea buna.

### 2. Nu recomand rescriere completa a store-ului acum

Ar rupe:

- momentum
- validare
- predictibilitate

### 3. Nu recomand replatformare UI inca o data

`Evidence OS` trebuie finalizat, nu inlocuit.

## Ce recomand

### 1. Dupa inchiderea `Evidence OS`, facem performance cleanup incremental

Ordinea buna:

1. split controlat pentru `useCockpit`
2. payload-uri mai mici pe suprafete mari
3. bootstrap server-first unde aduce castig clar
4. loading local pe sectiuni, nu full-page repetat

### 2. Decompozitie controlata pe paginile mari

Ordine buna:

1. `Setari`
2. `Auditor Vault`
3. `Scanari`

### 3. Normalizare relationala mai puternica, dar dupa cleanup

Nu inainte.

## Verdict final

Arhitectura a tinut firul produsului.

Nu suntem intr-o zona de "am pierdut produsul".

Suntem intr-o zona de:

- produs mare
- fundatie serioasa
- puncte grele localizate

Adica exact momentul in care trebuie:

- sa inchidem coerenta UI
- sa curatam performanta
- sa evitam rewrites mari
