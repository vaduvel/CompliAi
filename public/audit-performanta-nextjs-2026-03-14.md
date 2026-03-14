# Audit de performanta Next.js - 2026-03-14

## Scop

Acest audit raspunde la intrebarile:

1. cat de grea a devenit aplicatia
2. daca `Next.js` a fost o alegere buna
3. de ce apare des ecranul de incarcare
4. ce putem optimiza fara sa distrugem:
   - logica actuala
   - arhitectura de produs
   - flow-urile care merg acum

Acesta este un audit defensiv.

Nu propune:

- rescriere de framework
- refactor mare fara garduri
- schimbari care ating modelul de domeniu sau flow-urile critice

## Verdict executiv

### 1. Aplicatia a devenit grea

Da.

Greutatea este reala, nu doar subiectiva.

Semnalele cele mai clare:

- `components/compliscan/use-cockpit.ts` are `1635` linii
- exista `66` fisiere cu `"use client"`
- `10` pagini de dashboard folosesc `useCockpit()`
- `useCockpit()` face `24` fetch-uri
- nu exista `loading.tsx` sub `app/dashboard`
- dashboard-ul foloseste chunk-uri client foarte mari:
  - `dashboard/page` -> `2.6M`
  - `dashboard/documente/page` -> `2.6M`
  - `dashboard/checklists/page` -> `2.8M`
  - `dashboard/sisteme/page` -> `3.4M`
  - `dashboard/scanari/page` -> `3.9M`

### 2. Next.js nu este problema principala

`Next.js` a fost o alegere buna.

Problema principala nu este framework-ul, ci faptul ca dashboard-ul este folosit acum mai aproape de un SPA mare decat de un app care profita serios de:

- server components
- server-side data bootstrapping
- segment loading
- granular payloads

### 3. Ecranul de incarcare apare des pentru ca il cerem explicit

Pattern-ul actual este repetat in aproape toate paginile mari:

- pagina este `"use client"`
- apeleaza `useCockpit()`
- face fetch la `/api/dashboard`
- returneaza `LoadingScreen` pana vine tot payload-ul

Practic:

- montare noua
- fetch nou
- loading full-screen nou

### 4. Nu recomand schimbarea framework-ului

Nu recomand:

- migrare de pe `Next.js`
- rescriere in alt framework

Ar fi cost mare, risc mare si castig mic pe termen scurt.

## Ce am masurat

### Client-side footprint

- fisiere cu `"use client"`: `66`
- fisiere totale in `app/components/lib`: `303`
- pagini dashboard care folosesc `useCockpit()`: `10`
- fetch-uri in `useCockpit()`: `24`
- fisiere `loading.tsx` in `app/dashboard`: `0`

### Build footprint local

Rezultat observat in `.next/static/chunks/app/dashboard/*`:

- `layout.js` -> `1.0M`
- `page.js` -> `2.6M`
- `documente/page.js` -> `2.6M`
- `checklists/page.js` -> `2.8M`
- `sisteme/page.js` -> `3.4M`
- `scanari/page.js` -> `3.9M`

Aceste valori nu sunt un benchmark final de productie, dar sunt suficiente ca sa confirme greutatea structurala.

## Sursele principale de greutate

## 1. Hook client monolitic

Fisier:

- `components/compliscan/use-cockpit.ts`

Problema:

- tine prea multe responsabilitati in acelasi loc:
  - incarcare dashboard
  - mutatii task-uri
  - dovezi
  - scanare
  - exporturi
  - traceability
  - drifts
  - AI systems
  - baseline
  - efactura

Impact:

- chunk-uri client mari
- rerendering mai larg decat trebuie
- front-end orchestration foarte grea
- debugging si optimizare mai dificile

Verdict:

- cel mai clar hotspot de performanta din produs

## 2. Full-page loading la aproape fiecare pagina mare

Fisiere relevante:

- `app/dashboard/page.tsx`
- `app/dashboard/scanari/page.tsx`
- `app/dashboard/documente/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/sisteme/page.tsx`
- `app/dashboard/alerte/page.tsx`
- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- `app/dashboard/setari/page.tsx`
- `app/dashboard/asistent/page.tsx`

Pattern:

- `"use client"`
- `const cockpit = useCockpit()`
- `if (cockpit.loading || !cockpit.data) return <LoadingScreen />`

Impact:

- fiecare intrare in pagina pare mai lenta
- utilizatorul simte ca "toata aplicatia asteapta"
- se pierde perceptia de continuitate intre sectiuni

## 3. Payload dashboard prea bogat pentru folosire universala

Fisier:

- `lib/server/dashboard-response.ts`

Payload-ul contine la pachet:

- `state`
- `summary`
- `remediationPlan`
- `workspace`
- `compliancePack`
- `traceabilityMatrix`

Impact:

- chiar si paginile care au nevoie de 20% din date primesc aproape tot
- costul de serializare, transport si hidratare creste
- orice refresh client pare mai greu

## 4. Fetch-uri suplimentare in shell si in `Setari`

Fisiere:

- `components/compliscan/dashboard-shell.tsx`
- `app/dashboard/setari/page.tsx`

Problema:

- shell-ul face fetch separat pentru:
  - `/api/auth/me`
  - `/api/auth/memberships`
- `Setari` face multe fetch-uri paralele la mount

Impact:

- cascada de request-uri
- flicker operational
- timp mai mare pana la stabilizarea completa a ecranului

## 5. App Router este folosit prea putin in mod server-first

Fapt:

- aproape toate paginile mari din dashboard sunt `"use client"`

Impact:

- pierdem mare parte din avantajul natural al `Next.js`
- incarcam mult JS in browser
- obtinem UX de SPA greu, nu de app hibrid bine partitionat

## A fost `Next.js` o alegere buna?

Da.

Motive:

- routing si layout-uri bune pentru produsul nostru
- API routes bune pentru flow-urile actuale
- server-side integration naturala pentru auth, storage, audit, traceability
- suporta foarte bine exact directia in care trebuie sa mergem:
  - server-first pentru date initiale
  - client doar pentru mutatii si interactiuni locale

Concluzie:

- nu framework-ul este problema
- utilizarea actuala este prea client-heavy pentru dimensiunea aplicatiei

## Ce NU trebuie sa facem

Ca sa nu stricam ce merge acum, NU recomand:

1. rescriere de framework
2. refactor mare in care rupem `useCockpit()` in 10 fisiere dintr-un foc
3. rescriere simultana a dashboard-ului si a API-urilor
4. schimbarea modelului de domeniu in acelasi val cu optimizarea de performanta
5. schimbari de caching agresive fara audit functional

## Ce putem face fara sa distrugem logica si arhitectura

## Val A - quick wins sigure

Risc: mic

### A1. Inlocuim loading full-screen cu loading local pe sectiune

Ce facem:

- pastram shell-ul si header-ul vizibile
- mutam `LoadingScreen` doar pe zonele care chiar asteapta date
- introducem skeleton-uri locale

Ce NU schimbam:

- logica de business
- endpoints
- modelul de date

Castig:

- aplicatia pare mult mai rapida imediat
- reduce senzatia de "totul se reincarca"

### A2. Reducem fetch-urile paralele din `Setari`

Ce facem:

- agregam endpoint-urile strict de diagnostic intr-un endpoint compus
- sau secventiem mai inteligent request-urile secundare

Ce NU schimbam:

- auth
- release readiness
- supabase checks

Castig:

- ecran mai stabil
- mai putin flicker

### A3. Pastram user/org in shell din date initiale, nu doar fetch la mount

Ce facem:

- mutam bootstrap-ul minim pentru `DashboardShell` spre server sau layout-provided props

Ce NU schimbam:

- membership logic
- switch-org logic

Castig:

- eliminam doua request-uri frecvente din shell

## Val B - optimizare structurala fara rescriere

Risc: mediu, dar controlabil

### B1. Transformam `useCockpit()` in:

- `useCockpitData()`
- `useCockpitMutations()`
- hooks locale per pagina sau per pilon

Important:

- facem split intern, nu schimbam din prima contractele publice peste tot
- putem pastra un adaptor `useCockpit()` pentru compatibilitate temporara

Castig:

- chunk-uri mai mici
- ownership mai clar
- rerendering mai local

### B2. Dashboard payload-uri per suprafata

Ce facem:

- `overview payload`
- `scan payload`
- `audit payload`
- `settings payload`

Ce NU facem:

- nu rupem imediat `/api/dashboard` daca inca hraneste multe suprafete

Abordare sigura:

- introducem endpoint-uri specializate in paralel
- migram treptat paginile

Stare curenta:

- endpoint nou `GET /api/dashboard/core` pentru payload minimal (state, summary, remediationPlan, workspace)
- cockpit foloseste acum payload-ul `core` by default, iar paginile care cer `compliancePack`/`traceabilityMatrix` fac lazy load la payload-ul complet

Castig:

- mai putin transport inutil
- mai putina hidratare inutila

### B3. Lazy load pentru zone grele

Candidate bune:

- `Auditor Vault`
- `Export center`
- panouri mari din `Scanari`
- `Assistant` unde se poate

Castig:

- pagina initiala porneste mai repede
- heavy UI intra doar cand e cerut

## Val C - utilizare mai buna a `Next.js`

Risc: mediu

### C1. Server-first pentru date initiale pe paginile mari

Ce facem:

- pagina server preia payload initial
- clientul preia doar:
  - mutatii
  - optimistic UI
  - refresh local

Acesta este pasul cel mai valoros pe termen mediu.

### C2. Folosim segmente si `loading.tsx` unde chiar ajuta

Acum:

- avem `0` fisiere `loading.tsx` sub `app/dashboard`

Putem introduce:

- loading segmentat
- fara sa depindem de `LoadingScreen` full-page peste tot

### C3. `router.refresh()` doar unde e necesar

Exista deja locuri unde refresh-ul poate re-simti greu pentru utilizator.

Scop:

- refresh mai putin global
- mutatii locale mai precise

## Ordinea recomandata

Ca sa nu stricam ce merge:

1. `Val A1` - loading local, nu full-screen
2. `Val A2` - reducere request-uri in `Setari`
3. `Val A3` - bootstrap mai bun pentru shell
4. `Val B1` - split intern controlat pentru `useCockpit()`
5. `Val B2` - endpoint-uri specializate in paralel
6. `Val C1` - server-first data bootstrapping pentru paginile cele mai grele

## Definirea succesului

Auditul de performanta este reusit daca obtinem:

1. mai putine ecrane full-page de incarcare
2. shell stabil intre navigari
3. chunk-uri mai mici pentru dashboard
4. request-uri mai putine la mount
5. niciun regres functional in:
   - scanare
   - remediere
   - dovezi
   - audit
   - auth / org switching

## Recomandarea finala

Da, aplicatia este acum grea.

Da, senzatia de "se incarca des" este reala.

Dar:

- `Next.js` ramane alegerea buna
- nu recomand schimbarea framework-ului

Recomandarea corecta este:

- sa tratam performanta ca pe un val de maturizare arhitecturala
- sa mutam dashboard-ul din modelul:
  - "client monolitic + loading full-screen"
- spre modelul:
  - "server-first bootstrap + client pentru mutatii + loading local"

Aceasta directie pastreaza:

- logica
- arhitectura de produs
- flow-urile validate deja

si reduce greutatea fara rescriere periculoasa.

## Implementare initiala (Val A0)

Am aplicat un prim pas sigur, fara schimbare de logica:

- am introdus un `CockpitProvider` care tine starea `useCockpit` la nivel de `app/dashboard/layout.tsx`
- paginile din dashboard consuma acum aceeasi instanta de store, fara a reinitializa pe fiecare navigare
- `use-cockpit` a fost trecut in `components/compliscan/use-cockpit.tsx` pentru a permite provider-ul React

Efect imediat:

- shell-ul ramane stabil intre pagini
- scade frecventa ecranelor full-page de incarcare
- nu se modifica flow-ul de scanare / remediere / audit

Validare:

- `npm run lint`
- `npm test`
- `npm run build`

## Implementare Val A1 (loading local)

Am redus impactul de "full-screen loading" pe paginile mari:

- `LoadingScreen` are acum variantă `section`
- paginile din dashboard folosesc `LoadingScreen variant="section"`
- loader-ul rămâne local, nu mai acoperă tot viewport-ul
- `reloadDashboard()` nu mai seteaza `loading=true` daca exista deja date

Impact:

- percepție mai bună la navigare
- fără schimbare de logică sau date

## Implementare Val A2 (Setari)

Am redus numarul de request-uri la mount in `Setari`:

- endpoint agregat nou: `GET /api/settings/summary`
- pagina `Setari` foloseste acum un singur fetch pentru:
  - repo sync status
  - sesiune curenta (`auth/me`)
  - membri organizatie
  - status Supabase
  - health check aplicatie
  - release readiness (doar pentru roluri permise)

Impact:

- mai putine request-uri paralele la mount
- acelasi comportament de acces si aceleasi mesaje
- fara schimbari de logica sau arhitectura

## Implementare Val A3 (Shell bootstrap)

Am redus request-urile din `DashboardShell`:

- endpoint agregat nou: `GET /api/auth/summary`
- `DashboardShell` incarca acum user + memberships intr-un singur fetch

Impact:

- mai putine request-uri la fiecare intrare in dashboard
- acelasi comportament de autentificare si schimbare org

## Implementare Val B1 (scaffold)

Am introdus separarea `data` vs `mutations` in `use-cockpit`:

- noi hook-uri: `useCockpitData()` si `useCockpitMutations()`
- pagini migrate: `Alerte`, `Audit si export`, `Audit si dovezi`, `Control sisteme AI`, `Documente`, `Remediere`, `Scanari`, `Asistent`, `Dashboard`, `Setari`

Impact:

- pregateste split-ul intern fara a schimba contractul existent
