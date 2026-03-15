## Task Codex 2 - Setari austerity pass components

Data: 2026-03-15

## Context

`Setari` este deja mai buna structural:

- taburi clare
- separare intre intentii
- fara amestec cu `Control` sau `Dovada`

Problema ramasa este de densitate si ton:

- prea mult framing in unele zone
- prea multa explicatie la acelasi nivel cu statusul operational
- prea putina ierarhie intre:
  - stare
  - actiune
  - explicatie

Nu faci redesign mare.
Nu schimbi shell-ul paginii.
Nu schimbi business logic.

## Scop

Sa livrezi un `component-level austerity pass` pentru `Setari`, astfel incat pagina sa se simta mai clar:

- admin
- operational
- sobru

nu:

- mini-dashboard paralel
- pagina care explica prea mult

## Fisiere pe care ai voie sa le atingi

- `components/compliscan/settings/settings-integrations-tab.tsx`
- `components/compliscan/settings/settings-operational-tab.tsx`
- `components/compliscan/settings/settings-shared.tsx`

Optional, doar daca ai nevoie ca sa tii codul curat:

- componente noi strict locale sub:
  - `components/compliscan/settings/*`

## Fisiere pe care NU ai voie sa le atingi

- `app/dashboard/setari/page.tsx`
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

### 1. `settings-integrations-tab.tsx`

Tinte:

- statusul operational sa fie mai sus si mai clar
- CTA-urile utile sa fie mai vizibile decat explicatia
- textul de suport sa fie mai scurt
- zonele tehnice sau auxiliare sa nu stea la aceeasi greutate cu actiunea

Nu schimbi:

- wiring-ul integrarilor
- status fetch logic
- butoanele reale de actiune

### 2. `settings-operational-tab.tsx`

Tinte:

- ierarhie mai dura intre:
  - stare curenta
  - actiune recomandata
  - explicatie
- cardurile sa se scaneze mai repede
- orice framing inutil sa coboare sau sa se compacteze

Nu schimbi:

- persistenta
- state wiring
- semantica operationala

### 3. `settings-shared.tsx`

Tinte:

- daca exista blocuri shared prea narative, le faci mai austere
- componentizarea ramane sobria si reutilizabila
- fara sa introduci limbaj nou de produs

## Reguli stricte

- nu schimbi business logic
- nu schimbi shell-ul paginii
- nu schimbi routing
- nu transformi `Setari` in dashboard
- nu introduci efecte vizuale gratuite

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

pentru ca atingi componente de dashboard si bundle de ruta.

## Predare

La final predai:

1. lista exacta de fisiere atinse
2. ce ai simplificat concret
3. ce a ramas pentru owner-ul de page shell
4. confirmarea explicita ca:
   - nu ai atins shell-ul paginii
   - nu ai schimbat business logic
