# CompliScan - Incident Runbook Minim

Data actualizarii: 2026-03-13

## Scop

Runbook-ul minim pentru incidentele cele mai probabile in etapa actuala.

## Tipuri de incident

### 1. Auth / sesiune

Semne:
- login pica
- utilizatorul este deconectat neasteptat
- `health check` raporteaza blocaj pe sesiune

Primii pasi:
- verificam `COMPLISCAN_SESSION_SECRET`
- verificam backend-ul de auth activ
- verificam `GET /api/health`

### 2. Supabase / tenancy

Semne:
- `Setari` arata tabele sau bucket lipsa
- `verify:supabase:*` pica
- datele nu se mai sincronizeaza cloud-first

Primii pasi:
- rulam:
  - `npm run verify:supabase:sprint5`
  - `npm run verify:supabase:strict`
  - `npm run verify:supabase:rls`
- verificam SQL-ul Sprint 5 si bucket-ul privat

### 3. Evidence access

Semne:
- dovada nu se deschide
- redirect-ul semnat pica
- `Auditor Vault` nu mai afiseaza metadata corecta

Primii pasi:
- verificam registrul `public.evidence_objects`
- verificam route-ul `/api/tasks/[id]/evidence/[evidenceId]`
- verificam bucket-ul `compliscan-evidence-private`

### 4. Audit Pack

Semne:
- exportul pica
- verdictul din export nu corespunde cu `Auditor Vault`

Primii pasi:
- verificam `traceability`
- verificam `auditDecision`
- verificam `auditGateCodes`
- rerulam testele dedicate pe `Audit Pack`

## Regula de operare

- nu facem fix "orb" direct in productie
- verificam mai intai:
  - health
  - status Supabase
  - ultimele schimbari pe runtime critic
- dupa incident, notam:
  - cauza
  - impact
  - remediere
  - test sau guard nou adaugat
