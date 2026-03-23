# CompliScan — Plan Implementare Canon

Data: `2026-03-22`
Status: `CANON FINAL`
Bază:
- [COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md)
- [COMPLISCAN-UX-IA-DEFINITIV-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md)
- [COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md)
- [MASTER-AUDIT-CANONIC-2026-03-22.md](/Users/vaduvageorge/Desktop/CompliAI/docs/MASTER-AUDIT-CANONIC-2026-03-22.md)
- [COMPLISCAN-MIGRATION-MATRIX-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MIGRATION-MATRIX-CANON.md)

Acest document este planul canonic de implementare pentru trecerea CompliScan de la modelul actual `single active org` la modelul `portfolio-first` pentru consultant / contabil / auditor.

Reguli:
- daca un plan mai vechi din `Downloads` contrazice acest document, acest document castiga
- `Evidence OS v1` ramane neschimbat ca baza vizuala
- nu facem rename de rute in wave-urile timpurii
- nu blocam livrarea UX pe migrarea de billing

---

## 1. Obiectiv

Livram un produs care functioneaza corect pentru doua moduri reale:

1. `single-org`
   - owner / compliance / reviewer / viewer opereaza pe o singura firma activa

2. `portfolio-first`
   - consultantul opereaza pe 10-50 firme fara `org switch` repetitiv
   - porneste din portofoliu agregat
   - intra in context per-firma doar cand are nevoie de drilldown

Tinta finala:
- portfolio clar pentru P1
- runtime per-firma curat pentru P2
- fara haos de navigatie
- fara rescriere completa a aplicatiei

---

## 2. Principii canonice

1. Livram valoarea pentru consultant cat mai devreme.
2. Pastram codul actual functional si facem migrare incrementala.
3. `workspaceMode` castiga in fata variantei `activeOrgId: null`.
4. `partner_manager` este migrare transversala auth + API + UI, nu patch local.
5. Billing-ul nou nu blocheaza fundatia portfolio UX.
6. Nu redenumim rutele existente pana la final, si doar daca merita cu adevarat.
7. Fiecare wave trebuie sa poata intra in `main` fara sa sparga flow-ul actual.
8. `dashboard/partner` se reutilizeaza ca baza pentru `/portfolio`, nu se rescrie orb.
9. Modul Solo refoloseste rutele existente cu compozitie simplificata; nu cream un produs paralel.

---

## 3. Decizii ferme

### 3.1 Session model

Canon:

```typescript
type SessionPayload = {
  userId: string
  orgId: string
  orgName: string
  membershipId: string | null
  role: OrgRole
  userMode: "solo" | "partner" | "compliance" | "viewer"
  workspaceMode: "org" | "portfolio"
  exp: number
}
```

Reguli:
- `orgId` ramane obligatoriu in sesiune
- `workspaceMode` decide contextul curent
- `portfolio` pastreaza ultimul `orgId` valid ca `last active org`
- nu folosim `activeOrgId = null` ca fundatie

### 3.2 Roluri

Canon:

```typescript
type OrgRole =
  | "owner"
  | "partner_manager"
  | "compliance"
  | "reviewer"
  | "viewer"
```

Reguli:
- `partner_manager` are acces operational, nu de ownership sau billing
- trebuie propagat in auth, membership, guards, UI si teste

### 3.3 Billing

Canon:
- billing-ul actual per-org ramane functional in fundatia initiala
- `partner account billing` este wave separat, dupa ce portfolio UX de baza este functional
- nu blocam navigatia, onboardingul si portfolio-lite pe migrarea Stripe

### 3.4 Rute

Canon:
- folosim rutele existente in primele wave-uri
- nu facem rename masiv devreme
- eventualul rename ramane optional si tarziu

---

## 4. Ordinea implementarii

### Wave 0A — userMode + onboarding

Scop:
- sistemul stie cine este userul si ce mod de lucru foloseste

Implementam:
- `userMode` pe profilul userului
- pagina `onboarding`
- `POST /api/auth/set-user-mode`
- redirect la onboarding pentru userii fara mod ales
- `/api/auth/me` returneaza `userMode`

Nu atingem:
- token/session contract
- billing
- rute existente
- shell principal

Acceptance criteria testabile:
- user autentificat cu `userMode = null` care intră pe `/dashboard` -> redirect valid către `/onboarding`
- `POST /api/auth/set-user-mode` cu o valoare validă -> `200`
- `POST /api/auth/set-user-mode` cu o valoare invalidă -> `400`
- `GET /api/auth/me` după setare -> include `userMode` corect
- user cu `userMode` deja setat nu mai este retrimis în loop la onboarding

Definition of done:
- user nou sau user vechi fara `userMode` trece prin onboarding
- `solo`, `partner`, `compliance` sunt persistate corect
- zero regressii pe flow-urile actuale

### Wave 0B1 — partner_manager + membership + guards

Scop:
- introducem rolul nou fara sa schimbam inca modelul de workspace

Implementam:
- `partner_manager` in tipuri, sesiune, membership records si guards
- extinderea testelor de auth si membership
- route guards compatibile cu noul rol

Nu implementam aici:
- `workspaceMode`
- routing portfolio
- billing nou
- rename de rute

Acceptance criteria testabile:
- `POST /api/auth/login` pentru user cu membership `partner_manager` -> `200`
- `GET /api/auth/summary` -> include `role: "partner_manager"`
- o rută permisă operațional pentru consultant răspunde `200`
- o rută de billing/membership exclusiv owner răspunde `403` pentru `partner_manager`
- testele de auth și membership trec

Definition of done:
- `partner_manager` este acceptat cap-coada
- sesiunea și membership records acceptă rolul nou
- guards nu dau regressii pentru `owner`, `compliance`, `reviewer`, `viewer`

### Wave 0B2 — workspaceMode + select-workspace + routing

Scop:
- introducem contextul portfolio fără să rupem contractul actual cu `orgId`

Implementam:
- `workspaceMode: "org" | "portfolio"` in sesiune
- `POST /api/auth/select-workspace`
- guards pentru `/portfolio/*`, `/dashboard/*` si `/account/settings`
- shell capabil sa inteleaga `workspaceMode`

Nu implementam aici:
- billing nou
- rename de rute
- portfolio pages finale

Acceptance criteria testabile:
- `POST /api/auth/select-workspace` cu `{ "workspaceMode": "portfolio" }` -> `200`
- `POST /api/auth/select-workspace` cu `{ "workspaceMode": "org", "orgId": "<valid>" }` -> `200`
- `GET /dashboard` pentru user `partner` aflat în `workspaceMode=portfolio` -> redirect valid către `/portfolio`
- `GET /portfolio` pentru user `solo` -> redirect valid către `/dashboard`
- sesiunea păstrează `orgId` valid și schimbă doar `workspaceMode`

Definition of done:
- sesiunea functioneaza cu `workspaceMode`
- `/portfolio/*` nu cere null org
- `/dashboard/*` continua sa functioneze pentru toti userii actuali

### Wave 1 — navigatie adaptiva fara rename de rute

Scop:
- userul vede UX diferita in functie de mod si context

Implementam:
- `lib/compliscan/nav-config.ts`
- org selector clar
- shell adaptiv pentru:
  - `solo`
  - `partner`
  - `compliance`
- placeholder pages pentru portfolio acolo unde e nevoie

Acceptance criteria testabile:
- user `partner` vede secțiunea `Portofoliu` în nav
- user `solo` nu vede `Portofoliu`
- user `solo` nu vede grupuri complexe nerelevante
- click pe selectorul de firmă schimbă contextul și păstrează nav coerentă
- niciuna dintre rutele existente din [COMPLISCAN-MIGRATION-MATRIX-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MIGRATION-MATRIX-CANON.md) nu rămâne fără verdict

Partner nav canonic:
- `Portofoliu`
- `Alerte`
- `Remediere`
- `Furnizori`
- `Rapoarte`
- separator
- context per-firma:
  - `Acasa`
  - `Scaneaza`
  - `Monitorizare`
  - `Actiuni`
  - `Rapoarte`
  - `Setari`

Definition of done:
- userul partner vede clar diferenta intre portfolio si firma activa
- nu face `org switch` orb ca sa descopere urgentele
- rutele actuale raman functionale

### Wave 2 — Portfolio Lite

Scop:
- livram valoarea P1 cat mai devreme

Implementam:
- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/tasks`
- `/portfolio/vendors`
- `/portfolio/reports`
- reutilizare explicită din `/dashboard/partner`:
  - tabel clienți
  - summary strip
  - filtre/sortare
  - CSV import/export
- API-uri agregate:
  - `GET /api/portfolio/overview`
  - `GET /api/portfolio/alerts`
  - `GET /api/portfolio/tasks`
  - `GET /api/portfolio/vendors`
  - `GET /api/portfolio/reports`

Acceptance criteria testabile:
- `GET /api/portfolio/overview` pentru user `partner` -> `200`
- `GET /api/portfolio/overview` pentru user non-partner -> `403` sau redirect corect
- `/portfolio` afișează tabel cu mai multe firme fără org-switch repetitiv
- click pe un client setează workspace `org` și duce userul în `/dashboard`
- `/dashboard/partner` rămâne funcțional până la redirect-ul final

Ce afiseaza Portfolio Lite:
- lista firme
- scor / status / findings critice / taskuri / ultim scan
- urgente cross-client
- expirari si drift cross-client
- acces rapid la drilldown pe firma

Definition of done:
- consultantul poate opera pe portofoliu fara sa schimbe firma una cate una
- exista vedere agregata utila, nu doar selector de org

### Wave 3 — clean runtime per-org pe structura noua

Scop:
- paginile per-firma devin coerente in noul model

Refacem incremental:
- `Acasa`
- `Scaneaza`
- `De rezolvat`
- `Rapoarte`
- `Setari`

Clarificare Solo:
- Solo refolosește rutele existente
- nu se creează rute paralele
- `/dashboard/documente` devine suprafață Solo compusă în loc să rămână simplu redirect
- `/dashboard/resolve` are shell simplificat pentru Solo, nu logică dublată

Reguli:
- nu redesenam vizual
- pastram `Evidence OS v1`
- fiecare pagina are o intentie dominanta
- suportul sta sub fold, in taburi sau disclosure

Acceptance criteria testabile:
- fiecare pagină canonică are o singură intenție dominantă și un CTA principal
- user `solo` vede doar rutele din modelul Solo fără pagini noi paralele
- user `partner` poate intra din `/portfolio` într-o firmă și găsește aceleași pagini per-org coerente
- support routes rămân funcționale sau redirectează conform matricei

Definition of done:
- drilldown-ul pe firma este coerent din portfolio
- paginile nu mai presupun ca userul lucreaza exclusiv pe o singura firma toata ziua

### Wave 4 — ownership si claim flow

Scop:
- modelam corect relatia consultant-client

Implementam:
- owner placeholder `system`, unde e nevoie
- flow de `claim ownership`
- flow de invitare / eliminare `partner_manager`
- reguli clare pentru cine poate scoate consultantul si cine poate prelua ownership

Definition of done:
- fiecare org are ownership model clar
- consultantul nu devine owner implicit
- clientul poate revendica si controla firma cand trebuie
- flow-ul nu rupe runtime-ul existent pentru org-urile deja create

### Wave 5 — partner billing migration

Scop:
- introducem planul pentru consultant fara sa blocam rollout-ul UX

Implementam:
- `partner_10`, `partner_25`, `partner_50`
- `/api/plan` cu:
  - `planType`
  - `maxOrgs`
  - `currentOrgs`
  - `canAddOrg`
- Stripe checkout/webhook pentru cont partner
- blocaj la `Adauga client` cand limita este depasita

Definition of done:
- consultantul poate avea plan pe contul lui
- limitarile de portofoliu sunt clare
- userii vechi per-org nu sunt rupti

### Wave 6 — cleanup final si optional route rename

Scop:
- curatam resturile istorice dupa ce valoarea reala e deja livrata

Optional:
- route rename doar daca:
  - aduce claritate reala
  - are mapping simplu
  - nu sparge analytics, links sau support docs

In aceasta wave:
- cleanup docs
- cleanup feature flags
- cleanup route bridges
- optional rename de rute

---

## 5. Fisiere si zone principale de impact

### Auth si session
- [auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- [rbac.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.ts)
- `middleware.ts`
- `app/api/auth/*`

### Dashboard si UX
- [layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/layout.tsx)
- [dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- [navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts)
- `lib/compliscan/nav-config.ts`

### Portfolio
- `app/portfolio/*`
- `app/api/portfolio/*`
- [partner/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/partner/page.tsx)
- [partner clients route](/Users/vaduvageorge/Desktop/CompliAI/app/api/partner/clients/route.ts)
- [COMPLISCAN-MIGRATION-MATRIX-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MIGRATION-MATRIX-CANON.md)

### Billing
- [checkout route](/Users/vaduvageorge/Desktop/CompliAI/app/api/stripe/checkout/route.ts)
- `app/api/stripe/webhook/route.ts`
- `lib/server/plan.ts`

---

## 6. Ce nu facem

- nu blocam UX pe billing rewrite
- nu facem rename de rute inainte de Portfolio Lite
- nu reconstruim tot dashboard-ul de la zero
- nu folosim `activeOrgId = null` ca fundatie
- nu lasam consultantul sa opereze prin `org switch` repetitiv

---

## 7. Definition of done final

Planul este considerat implementat cand:

- consultantul are `portfolio-first UX` reala
- `workspaceMode` functioneaza fara regressii
- `partner_manager` este suportat cap-coada
- paginile per-firma sunt coerente in noua IA
- billing-ul partner este functional daca Wave 5 este activata
- `Evidence OS v1` este pastrat
- eventualele route renames raman strict finale si optionale

---

## 8. Ordinea executabila recomandata

1. Wave 0A
2. Wave 0B1
3. Wave 0B2
4. Wave 1
5. Wave 2
6. Wave 3
7. Wave 4
8. Wave 5
9. Wave 6

Aceasta este ordinea canonica.

Nu se implementeaza wave-uri din urma inainte de a inchide fundatia auth/session.
