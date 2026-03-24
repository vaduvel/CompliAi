# CompliScan — Portfolio Tech Spec Canon

Data: `2026-03-22`
Status: `CANON FINAL`
Bază:
- `COMPLISCAN-UX-IA-DEFINITIV.md`
- `COMPLISCAN-UX-IA-DEFINITIV v1.1 ADDENDUM`
- `MASTER-AUDIT-CANONIC-2026-03-22.md`

Acest document înlocuiește draftul din Downloads și fixează deciziile tehnice minime pentru trecerea de la modelul actual `single active org` la modelul `portfolio-first` pentru consultant / contabil / auditor.

Regulă:
- dacă un document mai vechi contrazice acest spec pe portfolio, sesiune, ownership sau roluri, acest spec câștigă
- `Evidence OS v1` rămâne neschimbat ca bază vizuală

---

## 1. Scop

CompliScan trebuie să suporte două moduri reale de operare:

1. `single-org`
   - un owner / compliance / reviewer lucrează pe o singură firmă activă

2. `portfolio-first`
   - un consultant / contabil / auditor gestionează simultan mai multe firme
   - nu operează prin `org switch` repetitiv
   - are întâi vedere agregată, apoi drilldown pe firmă

Acest spec rezolvă cele 4 decizii tehnice blocate:
- modelul de roluri
- modelul de sesiune și context
- autorizarea / query model pentru portfolio
- relația dintre UX portfolio și billing

---

## 2. Decizia 1 — Modelul de roluri

### 2.1 Roluri canonice

```typescript
export type OrgRole =
  | "owner"
  | "partner_manager"
  | "compliance"
  | "reviewer"
  | "viewer"
```

### 2.2 Intenția rolurilor

- `owner`
  - proprietarul firmei
  - controlează membership, billing, ștergere organizație, claim și eliminarea consultantului

- `partner_manager`
  - consultant extern care operează firma clientului
  - poate citi și lucra operațional
  - nu poate controla membership/billing/ownership

- `compliance`
  - operator intern cu drepturi puternice, dar fără control de ownership/billing

- `reviewer`
  - poate lucra pe remediere/dovezi unde are acces, nu administrează firma

- `viewer`
  - read-only sau task-limited

### 2.3 Matrice permisiuni

| Permisiune | owner | partner_manager | compliance | reviewer | viewer |
|------------|-------|-----------------|------------|----------|--------|
| Citire date org | da | da | da | limitat | limitat |
| Scanare documente | da | da | da | nu | nu |
| Creare / editare findings | da | da | da | nu | nu |
| Generare documente | da | da | da | nu | nu |
| Export rapoarte | da | da | da | nu | nu |
| Upload dovadă | da | da | da | da, doar unde are acces | nu |
| Invită membri | da | nu | nu | nu | nu |
| Schimbă billing / plan | da | nu | nu | nu | nu |
| Șterge organizația | da | nu | nu | nu | nu |
| Elimină partner_manager | da | nu | nu | nu | nu |
| Configurare agenți / integrări | da | da | da | nu | nu |

### 2.4 Reguli ferme

- o organizație are exact un `owner` uman sau un placeholder `system`
- o organizație poate avea `0..N` `partner_manager`
- `partner_manager` nu poate deveni implicit `owner`
- un user poate fi:
  - `owner` pe org A
  - `partner_manager` pe org B-Z

### 2.5 Impact tehnic obligatoriu

Aceasta NU este doar o schimbare în `lib/server/rbac.ts`.

Migrarea `partner_manager` este transversală și trebuie făcută în toate straturile care cunosc roluri:
- [auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- [rbac.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.ts)
- route guards din `app/api/*`
- shell și pagini de settings
- teste de auth / API / UI

Definition of done pentru rol:
- rolul există în tipuri
- este acceptat în sesiune
- este acceptat în membership records
- este acoperit de route guards
- este acoperit de testele de auth și membership

---

## 3. Decizia 2 — Session model pentru portfolio

### 3.1 Problemă

Modelul actual presupune o organizație activă obligatorie.

Codul actual validează explicit `orgId` și `orgName` în token:
- [auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)

Și dashboardul citește imediat contextul per-org:
- [layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/layout.tsx)

Din acest motiv, varianta `activeOrgId = null` ca mecanism principal este prea riscantă pentru prima implementare.

### 3.2 Model canon final

Nu folosim `activeOrgId = null` ca fundație.

Folosim:

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

### 3.3 Reguli

- `orgId` rămâne obligatoriu în sesiune
- `workspaceMode` decide dacă userul este:
  - în context per-org
  - sau în context portfolio
- când userul intră în `portfolio`, sesiunea păstrează ultimul `orgId` valid
- `orgId` devine:
  - ultimul workspace activ
  - nu “contextul curent obligatoriu”

### 3.4 Beneficii

- nu rupem contractul actual al sesiunii
- nu rupem dashboard layout-ul existent
- putem construi portfolio fără a rescrie toate route-urile per-org în același pas

### 3.5 Routing canon

- `userMode = partner` și `workspaceMode = portfolio`
  - permis:
    - `/portfolio/*`
    - `/account/settings`
    - `/onboarding`
  - blocat:
    - acces direct în `/dashboard/*` doar dacă nu se selectează explicit orgul

- `userMode = partner` și `workspaceMode = org`
  - permis:
    - `/dashboard/*`
    - `/portfolio/*`
    - `/account/settings`

- `userMode != partner`
  - `/portfolio/*` redirecționează spre `/dashboard`

### 3.6 Schimbarea contextului

API canon:

```typescript
POST /api/auth/select-workspace
Body:
  { workspaceMode: "portfolio" }
  sau
  { workspaceMode: "org", orgId: string }
```

Reguli:
- `portfolio`
  - permis doar pentru `userMode = partner`
  - păstrează `orgId` în sesiune ca “last active org”
- `org`
  - verifică membership pe `orgId`
  - setează `workspaceMode = org`
  - reîmprospătează `orgId`, `orgName`, `membershipId`, `role`

Nu folosim `select-org(null)` ca mecanism canon.

---

## 4. Decizia 3 — Portfolio authorization și query model

### 4.1 Principiu

Portfolio nu citește întregul state brut al fiecărei organizații.

Portfolio citește agregat, controlat și minim:
- overview
- alerts
- tasks
- vendors
- reports metadata

### 4.2 API-uri canon

```typescript
GET /api/portfolio/overview
GET /api/portfolio/alerts
GET /api/portfolio/tasks
GET /api/portfolio/vendors
GET /api/portfolio/reports
```

### 4.3 Autorizare

Toate rutele `/api/portfolio/*` trebuie să aplice:

1. sesiune validă
2. `userMode === "partner"`
3. membership activ pe fiecare org inclusă în răspuns
4. rol permis:
   - `partner_manager`
   - `owner`
   - opțional `compliance` doar dacă business-ul o cere explicit

### 4.4 Query model

Portfolio APIs returnează agregat, nu state complet.

Exemple:

```typescript
type PortfolioOverviewRow = {
  orgId: string
  orgName: string
  role: OrgRole
  score: number
  criticalFindings: number
  totalTasks: number
  lastScanAtISO: string | null
  status: "red" | "amber" | "green" | "empty"
}
```

```typescript
type PortfolioAlertRow = {
  orgId: string
  orgName: string
  alertId: string
  severity: "critical" | "high" | "medium" | "low"
  framework: string
  title: string
  createdAtISO: string
}
```

### 4.5 Performance

Pentru implementarea inițială:
- `Promise.all()` pe memberships active este acceptabil
- se adaugă cache scurt
- se limitează payload-ul la agregate

Abia după validarea UX reală optimizăm prin:
- view Supabase
- RPC agregat
- precomputed summaries

### 4.6 Ordinea corectă de livrare

`Portfolio Lite` vine devreme:
- overview
- alerts
- selector de firmă

Nu așteptăm să terminăm toate refactorizările per-org înainte să livrăm valoare consultantului.

---

## 5. Decizia 4 — Billing model

### 5.1 Decizia finală de implementare

Billing-ul NU se schimbă în fundația UX/portfolio.

Pentru prima implementare canonică:
- billingul actual per-org rămâne în vigoare
- portfolio UX se livrează independent de migrarea de billing

### 5.2 Motiv

Astăzi checkout-ul este per-org:
- [checkout route](/Users/vaduvageorge/Desktop/CompliAI/app/api/stripe/checkout/route.ts)

O migrare spre `partner account billing` este:
- schimbare de business model
- schimbare Stripe metadata / entitlement model
- schimbare de limits și ownership comercial

Asta nu trebuie să blocheze livrarea portfolio UX.

### 5.3 Regula canon

Implementarea se sparge în două etape:

1. `Portfolio UX foundation`
   - fără schimbare de billing
   - partnerul poate opera portofoliu pe modelul existent

2. `Partner billing migration`
   - wave separat
   - planuri `Partner 10 / 25 / 50 / custom`
   - policy clară de sloturi și claim transfer

### 5.4 Ce rămâne valabil din draftul anterior

Conceptual, `partner account billing` rămâne direcția dorită.

Dar NU este prerequisite pentru:
- `userMode`
- `workspaceMode`
- `/portfolio/*`
- nav adaptivă
- portfolio APIs

---

## 6. Decizia 5 — Claim ownership flow

Flow-ul de claim rămâne valid și aprobat conceptual, cu o singură clarificare:

- `claim ownership` este un wave separat de fundația portfolio
- nu blochează apariția rolului `partner_manager`
- nu blochează livrarea `Portfolio Lite`

### 6.1 Stare inițială

- consultantul creează organizația clientului
- org are:
  - `owner = system`
  - `partner_manager = consultant`

### 6.2 Claim flow

API-uri țintă:
- `POST /api/auth/claim-invite`
- `POST /api/auth/claim-accept`
- `GET /api/auth/claim-status/[orgId]`

UI-ul de claim rămâne în `Setări` per firmă.

### 6.3 Reguli

- un singur `owner`
- tokenul expiră
- totul intră în audit log
- claim-ul nu mută automat billing

---

## 7. Ordinea canon de implementare

Ordinea finală corectă este:

1. `Wave 0A`
   - `userMode`
   - onboarding post-register
   - `workspaceMode`
   - middleware

2. `Wave 0B`
   - rol `partner_manager`
   - migrare auth + API + UI + teste

3. `Wave 1`
   - nav adaptivă
   - `Portfolio Lite`
   - org selector / workspace selector

4. `Wave 2`
   - portfolio APIs complete
   - pagini portfolio detaliate

5. `Wave 3`
   - refactor per-org pages pentru noua IA

6. `Wave 4`
   - claim ownership flow

7. `Wave 5`
   - partner billing migration

8. `Wave 6`
   - cleanup final

### Reguli de livrare

- nu facem rename masiv de rute înainte să existe valoare pentru consultant
- nu rupem sesiunile actuale pentru a simula portfolio
- nu blocăm portfolio UX pe billing rewrite
- nu tratăm `partner_manager` ca simplu alias de `compliance`

---

## 8. Checklist de aprobare

Acest spec este aprobat dacă acceptăm explicit:

- `partner_manager` ca rol nou canonic
- `workspaceMode` în sesiune, nu `activeOrgId = null`
- portfolio APIs agregate, nu state complet cross-org
- billing migration separat de UX foundation

Dacă acestea sunt aprobate, documentul poate fi folosit direct ca bază pentru implementation plan.
