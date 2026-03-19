# CompliScan - Backlog Recheck Post Sprint 7

Data: 2026-03-14

## Scop

Acest document revalideaza backlog-ul parcat intentionat dupa:

- inchiderea operationala a Sprinturilor 1-7
- adoptia `Evidence OS` pe `Val 1`
- convergenta serioasa pe `Val 2`
- pornirea reala a `Val 3`

Nu este un roadmap nou. Este un filtru de adevar:

- ce ramane relevant
- ce este deja inchis
- ce este intentionat amanat
- ce nu mai merita redeschis

## Verdict rapid

Backlog-ul ramas este real, dar s-a micsorat.

Cele mai importante fronturi ramase sunt acum:

1. finalizarea adoptiei `Evidence OS` pe `Val 3`
2. cleanup de performanta fara rescriere
3. administrare membri / invitatii
4. normalizare relationala mai puternica pe termen mediu
5. parser XML robust pentru `e-Factura`

Ce NU mai este backlog activ:

- auth de baza
- tenancy minima
- evidence privat controlat
- RLS de baza
- release readiness minim
- audit defensibility de baza

## Inchis sau redus puternic

### 1. Auth / sesiune / roluri / multi-org minim

Acest front nu mai este backlog major.

Stare:

- inchis operational prin Sprint 4 si Sprint 5
- ramas doar:
  - invitatii
  - administrare membri mai buna

### 2. Evidence privat si storage controlat

Nu mai este backlog de fundatie.

Stare:

- traseu privat local
- bucket privat Supabase
- `public.evidence_objects`
- signed redirect / route controlat

### 3. RLS / cloud readiness minim

Nu mai este backlog deschis de fundatie.

Stare:

- verificat live
- inclus in `preflight:release`

### 4. Audit quality de baza

Nu mai este backlog zero-to-one.

Stare:

- quality gates
- evidence quality
- `auditDecision`
- blocaje reale la confirmarea de audit

## Relevant in continuare

### 1. Finalizarea `Evidence OS` pe `Val 3`

Ramane backlog activ.

Suprafete:

- `app/dashboard/scanari/*`
- `app/dashboard/alerte/page.tsx`
- `app/dashboard/rapoarte/*`
- `app/dashboard/setari/*`

Realitatea de azi:

- `Alerte`, `Rapoarte`, `Auditor Vault`, `Setari` sunt bine avansate
- `Scanari` ramane cea mai hibrida pagina mare

### 2. Cleanup de performanta fara schimbare de arhitectura

Ramane backlog important.

Vezi:

- `public/audit-performanta-nextjs-2026-03-14.md`

Prioritati:

- split controlat pentru `useCockpit`
- bootstrap mai bun pe server
- payload-uri mai mici pe paginile mari
- mai putine loading screens full-page

### 3. Invitatii si administrare membri

Ramane backlog legitim.

Motiv:

- modelul de membership exista
- UI minim exista
- dar onboarding-ul real de echipa nu este inchis

### 4. Normalizare relationala mai puternica

Ramane tinta de arhitectura, nu task imediat de rewrite.

Directie:

- findings
- tasks
- evidence
- drift
- events
- controls

### 5. Parser XML robust pentru `e-Factura`

Ramane backlog tehnic concret.

Nu este urgent peste `Evidence OS`, dar este real.

## Amanat intentionat

### 1. Policy Engine separat

Amanat constient.

Motiv:

- tinta buna
- nu e momentul pentru runtime nou

### 2. Event-driven core

Amanat constient.

Motiv:

- ar complica prea devreme produsul
- nu rezolva blocajele actuale de UX, performanta si coerenta

### 3. Enterprise GRC expansion

Amanat constient.

Motiv:

- nu ne ajuta acum sa tinem firul produsului

## Nu redeschidem

Aceste teme nu trebuie redeschise ca si cum ar fi inca bug-uri centrale:

- "nu exista auth real"
- "dovezile sunt publice"
- "platforma este single-tenant"
- "release readiness e doar in documente"

Acestea au fost valide istoric, dar nu mai descriu starea curenta.

## Prioritate recomandata dupa inchiderea `Evidence OS`

1. performance cleanup incremental
2. invitatii / member admin
3. architecture cleanup pentru state si page decomposition
4. parser XML robust
5. target architecture items mai mari

## Concluzie

Backlog-ul nu mai este un sac de lucruri amestecate.

Dupa Sprint 7 si adoptia actuala `Evidence OS`, el se reduce la:

- finalizarea coerentei vizuale si structurale
- performanta
- administrare de echipa
- cateva imbunatatiri tehnice bine delimitate
