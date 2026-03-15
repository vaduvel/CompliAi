## Task Codex 2 - Audit si export wave 1 components

Data: 2026-03-15

## Context

`Audit si export` este deja mult mai clar ca intentie:

- readiness
- snapshot
- livrabil

Problema ramasa nu este de business logic.
Problema ramasa este ca unele componente inca explica prea mult si concureaza prea egal intre ele.

Tinta ta este sa faci zona mai:

- scanabila
- autoritara operational
- clara pe ierarhia:
  - ce trimiti acum
  - ce este suport
  - ce este detaliu tehnic

Nu faci redesign mare.
Nu schimbi shell-ul paginii.
Nu schimbi wiring-ul de export.

## Scop

Sa livrezi un `component-level density pass` pentru `Audit si export`, fara sa intri peste page shell.

Pagina trebuie sa se simta si mai clar ca:

- snapshot + livrabil

nu:

- pagina hibrida
- board de remediere
- centru cu toate optiunile egale

## Fisiere pe care ai voie sa le atingi

- `components/compliscan/export-center.tsx`
- `components/compliscan/rapoarte/reports-support-panels.tsx`

Optional, doar daca ai nevoie ca sa tii codul curat:

- componente noi strict locale sub:
  - `components/compliscan/rapoarte/*`

## Fisiere pe care NU ai voie sa le atingi

- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/page.tsx`
- `components/compliscan/navigation.ts`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/use-cockpit.tsx`
- `components/evidence-os/*`
- `app/api/*`
- `lib/*`
- documentele canonice:
  - `public/sprinturi-maturizare-compliscan.md`
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`

## Ce trebuie sa schimbi

### 1. `ExportCenter`

Tinte:

- `Raport PDF` sa domine mai clar
- actiunile de `audit / review` sa fie clar secundare
- actiunile `tehnice` sa fie clar tertiare
- sa scada senzatia de "toate optiunile sunt la fel de importante"

Ce urmarim:

- mai putin text repetitiv in hint-uri
- ierarhie mai dura intre sectiuni
- scanare rapida in 3-5 secunde
- fara efecte vizuale gratuite

Nu schimbi:

- lista de actiuni
- onClick wiring
- semantica exporturilor

### 2. `reports-support-panels.tsx`

Tinte:

- `ExportArtifactsCard` sa ramana explicativ, dar mai compact
- `RecentDriftCard` sa arate mai clar:
  - ce drift intra in snapshot
  - de ce conteaza
  - ce urmeaza
- detaliile suport sa nu mai aiba aceeasi greutate cu mesajul principal

Ce urmarim:

- mai putina densitate in fiecare card
- mai putin text lung la acelasi nivel
- progressive disclosure acolo unde informatia e utila, dar nu primara

Nu schimbi:

- modelul drift
- policy lookup
- SLA logic
- formatarea relativa

## Reguli stricte

- nu schimbi business logic
- nu schimbi routing
- nu schimbi shell-ul paginii
- nu introduci limbaj nou de produs
- nu transformi pagina in workspace de executie
- nu faci `Audit si export` sa concureze cu `Remediere`

Pastrezi doctrina:

- o pagina = o intentie dominanta
- `summary / detail / action`
- starea si urmatorul pas bat explicatia
- omul valideaza

## Validare

Rulezi:

- `npm test`
- `npm run lint`

Rulezi si:

- `npm run build`

pentru ca atingi bundle-uri de ruta si componente de dashboard.

## Predare

La final predai:

1. lista exacta de fisiere atinse
2. ce ai simplificat concret
3. ce a ramas pentru owner-ul de page shell
4. confirmarea explicita ca:
   - nu ai atins shell-ul paginii
   - nu ai schimbat business logic
