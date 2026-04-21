# IA-TARGET-DIAGRAM.md — Cum va arăta IA-ul nou după DESTINATION.md

> **Diagramă vizuală a Information Architecture țintă.**
> Sursă canon: [DESTINATION.md §2 + §3](./DESTINATION.md). Acest document e **reprezentarea vizuală** pentru review înainte de implementare.

**Data**: 2026-04-20

---

## 1. SIDEBAR PER MOD — ASCII TREES (vizualizare directă)

### 1.1 Mod PARTNER (Diana — consultant cu 10-30 clienți)

**Aterizare default**: `/portfolio` (NU `/dashboard`)

```
╔══════════════════════════════════════════════╗
║ CompliAI                    🔔 (3)          ║
║ PARTNER · Cabinet Popescu                   ║
╠══════════════════════════════════════════════╣
║                                              ║
║ ▸ PORTOFOLIU           [cross-org, 24/7]     ║
║   📊 Prezentare         /portfolio           ║
║   📥 Alerte        (3)  /portfolio/alerte    ║
║   🏁 Remediere          /portfolio/remediere ║
║   📁 Furnizori          /portfolio/furnizori ║
║   📄 Rapoarte           /portfolio/rapoarte  ║
║                                              ║
║ ──────── separator ────────                  ║
║                                              ║
║ ▾ FIRMA: [LogiTrans SRL ▼]   (org selector) ║
║   🏠 Acasă              /dashboard           ║
║   🔍 Scanează           /dashboard/scaneaza  ║
║   👁️ Monitorizare       /dashboard/monitorizare/*
║      ├ Conformitate     /conformitate        ║
║      ├ Furnizori        /furnizori           ║
║      ├ Sisteme AI *     /sisteme-ai          ║
║      ├ NIS2 *           /nis2                ║
║      └ Alerte           /alerte              ║
║   🎯 Acțiuni            /dashboard/actiuni/* ║
║      ├ Remediere        /remediere           ║
║      ├ Politici         /politici            ║
║      └ Vault            /vault               ║
║   📄 Rapoarte           /dashboard/rapoarte  ║
║   ⚙️ Setări             /dashboard/setari    ║
║                                              ║
║ ──────── separator ────────                  ║
║                                              ║
║ 👤 Diana Popescu · 23 clienți                ║
║ ⚙️ Setări cont          /account/settings    ║
╚══════════════════════════════════════════════╝

* = apare doar dacă applicability.{aiAct|nis2} === true
```

### 1.2 Mod COMPLIANCE (Radu — DPO intern, o singură firmă)

**Aterizare default**: `/dashboard`
**Diferență vs Partner**: fără secțiunea PORTOFOLIU + fără org dropdown (lucrează pe o singură firmă)

```
╔══════════════════════════════════════════════╗
║ CompliAI                    🔔 (3)          ║
║ COMPLIANCE · Acme SRL                        ║
╠══════════════════════════════════════════════╣
║                                              ║
║ 🏠 Acasă              /dashboard             ║
║ 🔍 Scanează           /dashboard/scaneaza    ║
║ 👁️ Monitorizare                              ║
║    ├ Conformitate     /monitorizare/conformitate
║    ├ Furnizori        /monitorizare/furnizori║
║    ├ Sisteme AI *     /monitorizare/sisteme-ai
║    ├ NIS2 *           /monitorizare/nis2     ║
║    └ Alerte           /monitorizare/alerte   ║
║ 🎯 Acțiuni                                   ║
║    ├ Remediere        /actiuni/remediere     ║
║    ├ Politici         /actiuni/politici      ║
║    └ Vault            /actiuni/vault         ║
║ 📄 Rapoarte           /dashboard/rapoarte    ║
║ ⚙️ Setări             /dashboard/setari      ║
║                                              ║
║ ──────── separator ────────                  ║
║                                              ║
║ 👤 Radu Dobre                                ║
║ ⚙️ Setări cont        /account/settings      ║
╚══════════════════════════════════════════════╝
```

### 1.3 Mod SOLO (Mihai — SME owner, nav simplificat)

**Aterizare default**: `/dashboard`
**Diferență vs Compliance**: fără Monitorizare grup expandabil, fără Vault separat, rute colapsate

```
╔══════════════════════════════════════════════╗
║ CompliAI                    🔔               ║
║ SOLO · Bistro Mihai SRL                      ║
╠══════════════════════════════════════════════╣
║                                              ║
║ 🏠 Acasă              /dashboard             ║
║ 🔍 Scanează           /dashboard/scaneaza    ║
║ 🏁 De rezolvat        /dashboard/de-rezolvat ║
║                       (findings + tasks)     ║
║ 📁 Documente          /dashboard/documente   ║
║                       (politici + scan hist.)║
║ 📄 Rapoarte           /dashboard/rapoarte    ║
║ ⚙️ Setări             /dashboard/setari      ║
║                                              ║
║ ──────── separator ────────                  ║
║                                              ║
║ 👤 Mihai Ionescu                             ║
║ ⚙️ Setări cont        /account/settings      ║
╚══════════════════════════════════════════════╝
```

### 1.4 Mod VIEWER (membru invitat, read-only)

**Aterizare default**: `/dashboard` (read-only)
**Diferență**: 4 itemi, fără Monitorizare/Acțiuni/Rapoarte completi

```
╔══════════════════════════════════════════════╗
║ CompliAI                    🔔               ║
║ VIEWER · invitat la Acme SRL                 ║
╠══════════════════════════════════════════════╣
║                                              ║
║ 🏠 Acasă              /dashboard   (read-only)
║ 🏁 Task-urile mele    /dashboard/de-rezolvat ║
║                       (doar atribuite mie)   ║
║ 📁 Documente          /dashboard/documente   ║
║                       (read-only)            ║
║ ⚙️ Setări cont        /account/settings      ║
║                       (doar profil personal) ║
║                                              ║
╚══════════════════════════════════════════════╝
```

### 1.5 Mod AUDITOR EXTERN (link partajat 72h)

**Fără sidebar**. Pagini publice, fără cont necesar:
- `/trust/[orgId]` — Trust Center public
- `/shared/[token]` — Dosar partajat 72h
- `/whistleblowing/[token]` — Whistleblowing portal

---

## 2. GRAFIC RUTE CANONICE — MERMAID TREE

```mermaid
graph LR
    Root((Landing /)) --> Login[/login/]
    Root --> Pricing[/pricing/]
    Root --> Legal["Legal<br/>/privacy /terms /dpa"]
    Root --> TrustPublic["/trust/[orgId]<br/>Public Trust Center"]

    Login --> Onboarding[/onboarding/]
    Onboarding --> ModeSelect{userMode?}

    ModeSelect -->|partner| PortfolioRoot[Portfolio Mode]
    ModeSelect -->|compliance| OrgRoot[Compliance Mode]
    ModeSelect -->|solo| SoloRoot[Solo Mode]
    ModeSelect -->|viewer| ViewerRoot[Viewer Mode]

    PortfolioRoot --> P1["/portfolio<br/>Prezentare"]
    PortfolioRoot --> P2["/portfolio/alerte<br/>Inbox JTBD #1"]
    PortfolioRoot --> P3["/portfolio/remediere"]
    PortfolioRoot --> P4["/portfolio/furnizori"]
    PortfolioRoot --> P5["/portfolio/rapoarte"]

    PortfolioRoot -.->|drill-in firmă| OrgRoot

    OrgRoot --> O1["/dashboard<br/>Acasă"]
    OrgRoot --> O2["/dashboard/scaneaza"]
    OrgRoot --> Monit[Monitorizare]
    OrgRoot --> Actiuni[Acțiuni]
    OrgRoot --> O5["/dashboard/rapoarte"]
    OrgRoot --> O6["/dashboard/setari"]

    Monit --> M1[conformitate]
    Monit --> M2[furnizori]
    Monit --> M3["sisteme-ai *"]
    Monit --> M4["nis2 *"]
    Monit --> M5[alerte]

    Actiuni --> A1[remediere]
    Actiuni --> A2[politici]
    Actiuni --> A3[vault]

    A1 --> Cockpit["/dashboard/actiuni/remediere/[findingId]<br/>Smart Resolve Cockpit"]

    SoloRoot --> S1["/dashboard"]
    SoloRoot --> S2["/dashboard/scaneaza"]
    SoloRoot --> S3["/dashboard/de-rezolvat"]
    SoloRoot --> S4["/dashboard/documente"]
    SoloRoot --> S5["/dashboard/rapoarte"]
    SoloRoot --> S6["/dashboard/setari"]

    ViewerRoot --> V1["/dashboard<br/>read-only"]
    ViewerRoot --> V2["/dashboard/de-rezolvat<br/>doar atribuite"]
    ViewerRoot --> V3["/dashboard/documente<br/>read-only"]
    ViewerRoot --> V4["/account/settings"]

    classDef partner fill:#3B5BDB20,stroke:#3B5BDB,color:#E7ECF2
    classDef compliance fill:#34D39920,stroke:#34D399,color:#E7ECF2
    classDef solo fill:#FBBF2420,stroke:#FBBF24,color:#E7ECF2
    classDef viewer fill:#64748B20,stroke:#64748B,color:#E7ECF2
    classDef critical fill:#F8717120,stroke:#F87171,color:#E7ECF2

    class PortfolioRoot,P1,P2,P3,P4,P5 partner
    class OrgRoot,O1,O2,Monit,Actiuni,O5,O6,M1,M2,M3,M4,M5,A1,A2,A3 compliance
    class SoloRoot,S1,S2,S3,S4,S5,S6 solo
    class ViewerRoot,V1,V2,V3,V4 viewer
    class Cockpit,P2 critical
```

---

## 3. FLOW UTILIZATOR PRINCIPAL — DIANA 9:15 AM (JTBD #1)

```mermaid
sequenceDiagram
    actor Diana
    participant Sidebar
    participant Inbox as /portfolio/alerte
    participant Cockpit as Smart Resolve Cockpit
    participant API

    Diana->>Sidebar: Login
    Sidebar->>Inbox: Redirect default partner
    Note over Inbox: "14 itemi, 3 critice, 2 firme afectate din 23"
    Inbox->>Diana: Dense list cu severity bars
    Diana->>Inbox: Scanează vizual 20s
    Diana->>Inbox: Select 3 findings "intake GDPR"
    Inbox->>Diana: BulkActionBar: [Confirmă | Respinge]
    Diana->>Inbox: Click "Respinge" (bulk)
    Inbox->>API: POST /api/portfolio/findings/batch
    API->>Inbox: 3 findings dismissed
    Inbox->>Diana: Toast "3 respinse. 11 rămase."
    Diana->>Inbox: Click rând critic "Apex SRL NIS2"
    Inbox->>Cockpit: Navigate /dashboard/actiuni/remediere/[id]
    Cockpit->>API: GET /api/findings/[id]
    Cockpit->>Diana: Context + Impact + Pași + Evidence + Decide
    Diana->>Cockpit: Click "Confirmă finding"
    Cockpit->>API: PATCH /api/findings/[id] status=confirmed
    API->>Cockpit: OK
    Cockpit->>Inbox: Redirect back (cu toast)
    Note over Diana: Total timp: 8 min (vs 45-60 min Excel+SPV)
```

---

## 4. REDIRECTS LEGACY → CANONIC (22 rute)

```mermaid
graph LR
    subgraph Legacy["🔴 Legacy (STATE-NOW)"]
        L1[/dashboard/scan/]
        L2[/dashboard/scanari/]
        L3[/dashboard/resolve/]
        L4[/dashboard/resolve/id/]
        L5[/dashboard/findings/id/]
        L6[/dashboard/reports/]
        L7[/dashboard/reports/vault/]
        L8[/dashboard/reports/policies/]
        L9[/dashboard/audit-log/]
        L10[/dashboard/politici/]
        L11[/dashboard/generator/]
        L12[/dashboard/sisteme/]
        L13[/dashboard/conformitate/]
        L14[/dashboard/alerte/]
        L15[/dashboard/nis2/]
        L16[/dashboard/nis2/maturitate/]
        L17[/dashboard/setari/]
    end

    subgraph Canon["🟢 Canon (DESTINATION)"]
        C1[/dashboard/scaneaza/]
        C2[/dashboard/actiuni/remediere/]
        C3[/dashboard/actiuni/remediere/id/]
        C4[/dashboard/rapoarte/]
        C5[/dashboard/actiuni/vault/]
        C6[/dashboard/actiuni/politici/]
        C7[/dashboard/monitorizare/sisteme-ai/]
        C8[/dashboard/monitorizare/conformitate/]
        C9[/dashboard/monitorizare/alerte/]
        C10[/dashboard/monitorizare/nis2/]
        C11[/dashboard/setari/]
    end

    L1 -.->|301| C1
    L2 -.->|301| C1
    L3 -.->|301| C2
    L4 -.->|301| C3
    L5 -.->|301| C3
    L6 -.->|301| C4
    L7 -.->|301| C5
    L8 -.->|301| C6
    L9 -.->|301 + ?tab=log| C4
    L10 -.->|301| C6
    L11 -.->|301| C6
    L12 -.->|301| C7
    L13 -.->|301| C8
    L14 -.->|301| C9
    L15 -.->|301| C10
    L16 -.->|301 + ?tab=maturitate| C10
    L17 -.->|301| C11

    classDef legacy fill:#F8717120,stroke:#F87171
    classDef canon fill:#34D39920,stroke:#34D399
    class L1,L2,L3,L4,L5,L6,L7,L8,L9,L10,L11,L12,L13,L14,L15,L16,L17 legacy
    class C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11 canon
```

---

## 5. TABEL COMPARATIV — CURENT vs TARGET

| Aspect | CURENT (cod) | TARGET (DESTINATION) | Diff |
|---|---|---|---|
| **Sidebar Partner** | 1 secțiune "Flux principal" cu 5 itemi + portfolio mix | 2 secțiuni distincte: PORTOFOLIU (5) + FIRMĂ (7) + org dropdown | Refactor nav-config |
| **Sidebar Compliance** | Identic cu Partner | Per-firmă fără PORTOFOLIU | Split logic per mode |
| **Sidebar Solo** | 6 itemi dar nav-config inconsistent | 6 itemi simplificați (De rezolvat + Documente colapsate) | Rute noi: `/de-rezolvat`, `/documente` |
| **Sidebar Viewer** | Nu e implementat distinct | 4 itemi read-only | Refactor + ghid filter |
| **Aterizare Partner** | `/dashboard` | `/portfolio` | Redirect în login |
| **Aterizare Compliance/Solo** | `/dashboard` | `/dashboard` ✅ | OK |
| **Ruta resolve canonică** | `/dashboard/resolve/[id]` | `/dashboard/actiuni/remediere/[id]` | Redirect 301 |
| **Rute cu prefix `/actiuni`** | Nu există | `/dashboard/actiuni/remediere \| politici \| vault` | Mutare cod |
| **Rute cu prefix `/monitorizare`** | Nu există | `/dashboard/monitorizare/conformitate \| furnizori \| sisteme-ai \| nis2 \| alerte` | Mutare cod |
| **Applicability gating** | Toți văd toate | `sisteme-ai` + `nis2` doar dacă `applicability.{aiAct\|nis2}` | Wire check în nav-config |
| **Rute orfane** | 14 pagini funcționale fără link | 0 (toate linked sau șterse) | DELETE + REDIRECT |
| **Rute RO duplicate** | 7 (`/setari`, `/scanari`...) | 0 (doar canonic RO) | Șterge duplicate, redirect |
| **Breadcrumb universal** | Inconsistent | Peste tot (`/dashboard/*`, `/portfolio/*`) | Wire `DashboardBreadcrumb` |
| **Label "Firma activa"** | Actualul label | "FIRMĂ" (per canon) | Rename |

---

## 6. SCHIMBĂRI ROUTE — VIEW DE ÎNALTĂ ALTITUDINE

```mermaid
graph TB
    subgraph Azi["🔴 AZI"]
        A1["/dashboard<br/>(sidebar unic 'Flux principal')"]
        A2["/dashboard/resolve"]
        A3["/dashboard/politici"]
        A4["/dashboard/nis2"]
        A5["/dashboard/sisteme"]
        A6["/dashboard/setari <br/>(RO duplicate)"]
        A7["/dashboard/settings"]
        A8["/dashboard/alerte <br/>(orfan)"]
        A9["/dashboard/checklists <br/>(orfan)"]
    end

    subgraph Maine["🟢 MÂINE (DESTINATION)"]
        T1["/dashboard<br/>sidebar per mod: Partner/Compliance/Solo/Viewer"]
        T2["/dashboard/actiuni/remediere"]
        T3["/dashboard/actiuni/politici"]
        T4["/dashboard/monitorizare/nis2 *<br/>applicability gate"]
        T5["/dashboard/monitorizare/sisteme-ai *<br/>applicability gate"]
        T6["/dashboard/setari<br/>RO canonic"]
        T7["/dashboard/monitorizare/alerte"]
        T8["DELETE checklists"]
    end

    A1 -->|refactor nav| T1
    A2 -->|301 redirect + move code| T2
    A3 -->|301 redirect + move code| T3
    A4 -->|301 redirect + applicability wire| T4
    A5 -->|301 redirect + applicability wire| T5
    A6 -->|keep, delete /settings| T6
    A7 -.->|DELETE duplicate| T6
    A8 -->|301 redirect| T7
    A9 -.->|DELETE orphan| T8

    classDef today fill:#F8717110,stroke:#F87171
    classDef tomorrow fill:#34D39910,stroke:#34D399
    class A1,A2,A3,A4,A5,A6,A7,A8,A9 today
    class T1,T2,T3,T4,T5,T6,T7,T8 tomorrow
```

---

## 7. IMPLEMENTARE — ORDINE CONCRETĂ (fără UI changes)

Pașii de implementare IA (strict structure, zero vizual):

```mermaid
gantt
    title Pasul 1 IA — 3-5 zile
    dateFormat  YYYY-MM-DD
    section Navigation
    Refactor nav-config per mod     :a1, 2026-04-21, 1d
    Update navigation.ts (item groups):a2, after a1, 1d
    section Routes
    22 redirects middleware.ts       :b1, 2026-04-21, 1d
    Applicability gating sidebar     :b2, after a2, 1d
    section Structural
    Mute /actiuni + /monitorizare (cod exists?) :c1, after b1, 1d
    Breadcrumb universal wire        :c2, after b2, 0.5d
    Delete rute orfane confirmate    :c3, after c1, 0.5d
    section Verify
    Per-persona smoke test           :d1, after c2, 0.5d
    User acceptance                  :d2, after d1, 0.5d
```

---

## 8. DECIZII DE CONFIRMAT ÎNAINTE DE IMPLEMENTARE

Pentru a implementa corect IA-ul, am nevoie de răspuns pe:

1. **Aterizare Partner**: DESTINATION zice `/portfolio`. Azi login redirect la `/dashboard`. **Confirmi** că Partner aterizează pe `/portfolio`?
2. **`/dashboard/setari` (RO) vs `/dashboard/settings` (EN)**: canon zice RO canonic. **Confirmi** că ștergem varianta EN + redirect?
3. **Sub-rute `/actiuni/*` și `/monitorizare/*`**: aceste directoare NU EXISTĂ încă în cod. **Confirmi** că mut fișierele existente (ex: `app/dashboard/resolve/` → `app/dashboard/actiuni/remediere/`)?
4. **Mod Solo — rute colapsate `/de-rezolvat` + `/documente`**: aceste rute noi nu există. **Confirmi** că le creez?
5. **Org dropdown în sidebar Partner**: unde apare concret vizual? DESTINATION zice `FIRMA: [LogiTrans SRL ▼]` — e un dropdown care schimbă firma activă. **Confirmi** că dropdown-ul îl păstrăm ca în cod actual (WorkspaceModeSwitcher) sau îl rescriem simplu?
6. **Rute orfane confirmate pentru ștergere**: `/dashboard/checklists`, `/dashboard/asistent` (deja șters), `/dashboard/alerte` (va fi redirect?) — **confirmi lista finală** din `FAZA-1-DECISION-MATRIX.md`?

---

## 9. REZUMAT — CE VA FI DIFERIT

Un user care intră azi vs după Pasul 1 IA:

| User action | Azi | După IA rework |
|---|---|---|
| Diana face login | Aterizează `/dashboard` | Aterizează `/portfolio` |
| Diana deschide sidebar | "Flux principal" cu 5 itemi generic | 2 secțiuni distincte: PORTOFOLIU + FIRMĂ (cu dropdown) |
| Diana dă click pe "Inbox" | `/portfolio/alerts` (inconsistent EN label "Schimbări detectate" în RO) | `/portfolio/alerte` (RO canonic) |
| User tastează `/dashboard/resolve/abc` | Merge direct la pagina veche | Redirect 301 la `/dashboard/actiuni/remediere/abc` |
| Radu (compliance) loghează | Vede exact același sidebar ca Diana | Vede sidebar fără PORTOFOLIU + fără org dropdown |
| Org fără NIS2 (applicability) | Vede NIS2 în sidebar (nu poate face nimic) | NU vede NIS2 în sidebar |
| Solo user vede `/dashboard/actiuni/remediere` | Sidebar cu 5 itemi + resolve detail | Sidebar simplificat 6 itemi cu "De rezolvat" unificat |

**Schimbarea vizuală nulă** (zero UI changes în Pasul 1 — doar structură, rute, nav). Vizualul vine abia în Pasul 3 UI.

---

---

## 10. USER JOURNEYS CAP-COADĂ — PE FIECARE PERSONA

> Flow-uri end-to-end de la **achiziție** (primul contact cu produsul) până la **offboarding** (ce face ultimul). Fiecare pas include **rută exactă** + **ce face user-ul** + **ce vede**.

---

### 10.1 DIANA — PARTNER CONSULTANT (sweet spot €149/lună)

**Context**: Diana (35 ani, contabil CECCAR cu 20 clienți SRL), află de CompliAI din grupul FB Contabili România (50k+). Vrea să monetizeze compliance ca serviciu rebill.

#### STADIUL 1 — ACHIZIȚIE (pre-signup)
```mermaid
sequenceDiagram
    actor Diana
    participant FB as FB Contabili România
    participant Landing as / (landing)
    participant Pricing as /pricing
    participant Register as /register

    Diana->>FB: vede post colega "CompliAI economisește 2h/zi"
    Diana->>Landing: click link
    Note over Landing: hero: "Workbench compliance<br/>pentru cabinete cu 10-30 clienți"
    Diana->>Landing: scroll — vezi 3 persone + screenshot-uri
    Diana->>Pricing: click "Vezi prețuri"
    Note over Pricing: 3 planuri: Solo €29, Pro €149, Agency €399
    Diana->>Pricing: alege "Pro 14 zile gratis"
    Pricing->>Register: redirect cu planul preselectat
```

**Pași concreti**:
1. `/` — landing page: hero, 3 persone, testimoniale, CTA "Încearcă gratis 14 zile"
2. `/pricing` — tabel 3 planuri, FAQ, buton "Începe Pro gratuit"
3. Click CTA → `/register?plan=partner-pro-trial`

#### STADIUL 2 — SIGNUP + ONBOARDING (primele 10 min)
```mermaid
sequenceDiagram
    actor Diana
    participant Register as /register
    participant API as /api/auth/register
    participant Onboarding as /onboarding
    participant PartnerStep as Wizard Partner
    participant Portfolio as /portfolio

    Diana->>Register: email + parolă + "Cabinet Popescu SRL"
    Register->>API: POST register
    API->>Register: sesiune + trial activat
    Register->>Onboarding: redirect
    Onboarding->>Diana: 3 carduri: Solo / Partner / Compliance
    Diana->>Onboarding: click "Consultant / Contabil / Auditor"
    Onboarding->>PartnerStep: wizard setup cabinet
    Note over PartnerStep: nume cabinet, specializare (GDPR/NIS2/fiscal), site opțional
    Diana->>PartnerStep: completează + click "Finalizează"
    PartnerStep->>API: POST /api/auth/set-user-mode (partner)
    PartnerStep->>Portfolio: redirect /portfolio (aterizare default)
    Portfolio->>Diana: Empty state: "Niciun client încă"<br/>CTA: "Adaugă primul client"
```

**Pași**:
1. `/register` — form 3 câmpuri. Submit → API register + auto-login.
2. `/onboarding` — 3 carduri persona. Click Partner.
3. Wizard 2 pași: nume cabinet, specializare. Submit.
4. `/api/auth/set-user-mode` → `partner`. Redirect `/portfolio`.
5. `/portfolio` empty state cu CTA "+ Adaugă firmă".

#### STADIUL 3 — PRIMUL CLIENT (următoarele 5 min)
```mermaid
sequenceDiagram
    actor Diana
    participant Portfolio as /portfolio
    participant AddDialog as Dialog Add Client
    participant ANAF as /api/anaf/lookup
    participant Baseline as /api/partner/import/baseline-scan
    participant DashboardFirm as /dashboard (context: Apex SRL)

    Diana->>Portfolio: click "+ Adaugă firmă"
    Portfolio->>AddDialog: open modal
    Diana->>AddDialog: tastează CUI "RO12345678"
    AddDialog->>ANAF: lookup
    ANAF->>AddDialog: "Apex Romania SRL, vAT activ, e-Factura obligat"
    Diana->>AddDialog: confirmă
    AddDialog->>Baseline: scan site + signals
    Baseline->>AddDialog: 6 findings generate (3 critic, 2 high, 1 medium)
    AddDialog->>Portfolio: close modal
    Portfolio->>Diana: listă cu Apex SRL + score 40%
    Diana->>Portfolio: click "Intră în firmă"
    Portfolio->>DashboardFirm: redirect /dashboard (cu context Apex)
```

**Pași**:
1. `/portfolio` → click "Adaugă firmă"
2. Dialog: tastează CUI → API `/api/anaf/lookup` populează orgName, vatActive, efacturaRegistered
3. Click "Confirmă" → API baseline scan → findings generate
4. Listă updated cu Apex SRL + score
5. Click pe rând → `/dashboard` cu context Apex

#### STADIUL 4 — BULK IMPORT 19 CLIENȚI (o singură dată)
```mermaid
sequenceDiagram
    actor Diana
    participant Portfolio as /portfolio
    participant Import as Import Wizard
    participant API as /api/partner/import-csv
    participant Batch as batch scan

    Diana->>Portfolio: click "Import firme"
    Portfolio->>Import: open wizard 3 pași
    Diana->>Import: upload CSV (19 rânduri: CUI, nume, rol)
    Import->>API: preview
    API->>Import: "19 găsite, 18 valide, 1 CUI invalid"
    Diana->>Import: fix CUI invalid → re-upload
    Diana->>Import: click "Importă"
    Import->>API: bulk create
    API->>Batch: queue 19 baseline scans
    Batch->>Portfolio: progress bar per firmă
    Note over Portfolio: "15/19 scanate..."
    Batch->>Portfolio: complete
    Portfolio->>Diana: 20 firme listate cu score fiecare
```

**Pași**:
1. `/portfolio` → "Import firme"
2. Upload CSV (template vine cu aplicația)
3. Preview + fix errors → confirm
4. Background batch scan (5-10 min)
5. Portfolio cu 20 firme

#### STADIUL 5 — DAILY MORNING RITUAL (9:15 AM, 8 min)
```mermaid
sequenceDiagram
    actor Diana
    participant Login as /login
    participant Inbox as /portfolio/alerte
    participant BulkBar as BulkActionBar
    participant Cockpit as Smart Resolve Cockpit

    Diana->>Login: deschide laptop, login
    Login->>Inbox: redirect (partner default landing = portfolio, but Inbox e primul item)
    Inbox->>Diana: "14 itemi, 3 critice, 2 firme afectate din 20"
    Note over Inbox: grupat pe zile (Azi / Ieri / Săpt asta)
    Diana->>Inbox: scanează vizual 20 sec
    Diana->>Inbox: select 5 items "intake-gdpr" (bulk)
    Inbox->>BulkBar: show: [Confirmă | Respinge | Marchează citit]
    Diana->>BulkBar: click "Respinge"
    BulkBar->>Inbox: 5 findings dismissed
    Inbox->>Diana: toast "5 respinse. 9 rămase."
    Diana->>Inbox: click rând CRITIC "Apex NIS2 incident"
    Inbox->>Cockpit: navigate /dashboard/actiuni/remediere/[id]
    Cockpit->>Diana: Context + Impact + Pași + Evidence + Decide
    Diana->>Cockpit: click "Generează politică"
    Cockpit->>Diana: PDF draft în 30s
    Diana->>Cockpit: review + click "Atașează ca evidence"
    Cockpit->>Diana: toast "Salvat. Finding rezolvat."
    Cockpit->>Inbox: back button
    Note over Diana: 8 min total · 9 findings restantele, medium severity
```

**Pași**:
1. `/login` → `/portfolio/alerte` (auto-redirect Partner)
2. Triage dense list cu keyboard shortcuts (J/K navigate, X select, E enter)
3. Bulk action pe 5 irrelevant findings
4. Click pe 1 critic → `/dashboard/actiuni/remediere/[id]`
5. Cockpit: confirm + generate doc + attach → resolve
6. Back la `/portfolio/alerte`. Diana închide laptop.

#### STADIUL 6 — WEEKLY REVIEW (vineri, 30 min)
```mermaid
sequenceDiagram
    actor Diana
    participant Remediere as /portfolio/remediere
    participant Furnizori as /portfolio/furnizori
    participant Schimbari as /portfolio/alerte?filter=drift

    Diana->>Remediere: listă cross-client task-uri (42 active)
    Note over Remediere: filtru: due în 7 zile · priority HIGH
    Diana->>Remediere: select 8 task-uri → assign la staff
    Diana->>Furnizori: vezi vendor-uri cu DPA expirat
    Note over Furnizori: 3 vendor-uri cross-portfolio au DPA >6 luni
    Diana->>Furnizori: bulk "Trimite reminder vendor"
    Diana->>Schimbari: check drift weekly digest
    Note over Schimbari: "Bitdefender site a modificat cookie policy"
```

#### STADIUL 7 — MONTHLY BATCH EXPORT (sfârșit lună, 1h)
```mermaid
sequenceDiagram
    actor Diana
    participant Rapoarte as /portfolio/rapoarte
    participant ExportWizard as Export Wizard
    participant API as /api/exports/compliscan
    participant Brand as White-label

    Diana->>Rapoarte: deschide hub rapoarte
    Rapoarte->>Diana: 20 firme checkbox + preview
    Diana->>Rapoarte: select 18 firme
    Diana->>ExportWizard: click "Generează rapoarte lunare"
    ExportWizard->>Diana: config: brand cabinet, perioada, nivel detaliu
    Diana->>ExportWizard: "brand Cabinet Popescu, lună curentă, nivel executiv"
    ExportWizard->>API: batch generate 18 PDF
    API->>Brand: inject logo Cabinet Popescu
    Brand->>Diana: 18 PDF-uri signed disponibile
    Diana->>Diana: descarcă ZIP + trimite email la fiecare client
    Note over Diana: 100 RON/client × 18 = 1800 RON revenue în 1h
```

#### STADIUL 8 — CLIENT AUDIT ANSPDCP (incidental, 2h)
```mermaid
sequenceDiagram
    actor Client
    actor Diana
    participant Switch as Org Selector
    participant Rapoarte as /dashboard/rapoarte (Apex)
    participant AuditPack as ANSPDCP Export

    Client->>Diana: telefon "ANSPDCP ne-a trimis notificare, ai pachet?"
    Diana->>Switch: sidebar dropdown → select Apex SRL
    Switch->>Rapoarte: redirect /dashboard/rapoarte (context Apex)
    Diana->>Rapoarte: click "Export ANSPDCP"
    Rapoarte->>AuditPack: generate pachet format oficial
    AuditPack->>Diana: PDF semnat cryptographic + checklist
    Diana->>Client: email cu PDF în 10 min (vs 2 săpt manual)
```

#### STADIUL 9 — BILLING + ACCOUNT (rar)
```mermaid
sequenceDiagram
    actor Diana
    participant Account as /account/settings
    participant Billing as Billing Tab
    participant Stripe as Stripe Portal

    Diana->>Account: click avatar bottom sidebar → Setări cont
    Account->>Diana: 4 tabs (Profil / Securitate / Sesiuni / Billing)
    Diana->>Billing: tab Billing
    Billing->>Diana: "Trial expiră în 5 zile. Plan Pro €149/lună"
    Diana->>Billing: click "Upgrade la Pro"
    Billing->>Stripe: redirect Stripe portal
    Stripe->>Billing: success webhook
    Billing->>Diana: "Abonament activ. Next billing: 2026-05-20"
```

#### STADIUL 10 — OFFBOARDING (rare, GDPR)
```mermaid
sequenceDiagram
    actor Diana
    participant Account as /account/settings
    participant GDPR as GDPR Rights
    participant API as /api/account/delete-data

    Diana->>Account: tab "Datele mele"
    Account->>Diana: 3 acțiuni: Export / Modifică / Șterge cont
    Diana->>GDPR: click "Solicitare ștergere"
    GDPR->>API: POST request-deletion
    API->>Diana: "Solicitare primită. Procesăm în 30 zile."
```

**Total JTBD-uri atinse**: 10 stadii × multiple flow-uri. **Majoritatea timpului** în STADIUL 5 (Daily 8 min), STADIUL 6 (Weekly 30 min), STADIUL 7 (Monthly 1h).

---

### 10.2 RADU — COMPLIANCE DPO INTERN (typically employed at SRL/SA €500K+ revenue)

**Context**: Radu (38 ani, DPO la Acme SRL — 80 angajați, sector fintech). Vine pe CompliAI prin management (manager i-a cumpărat licența ca să-l ajute). NU el cumpără, dar el e user-ul zilnic.

#### STADIUL 1 — ACHIZIȚIE + ACTIVARE (0 din partea Radu)
```mermaid
sequenceDiagram
    actor Manager
    actor Radu
    participant ClaimInvite as /api/auth/claim-invite
    participant Email as Resend
    participant Login as /login

    Manager->>ClaimInvite: setup licență Compliance pentru Acme SRL
    Manager->>Manager: invite radu@acme.ro ca DPO (role=compliance)
    ClaimInvite->>Email: trimite link magic
    Email->>Radu: email "Acme SRL te-a invitat pe CompliAI"
    Radu->>Login: click link
    Login->>Login: /login?claim=TOKEN
```

#### STADIUL 2 — ONBOARDING PRIMULUI LOGIN (10 min)
```mermaid
sequenceDiagram
    actor Radu
    participant Login as /login + claim
    participant Onboarding as /onboarding
    participant Wizard as ApplicabilityWizard
    participant Dashboard as /dashboard (Acme)

    Radu->>Login: set parolă prin magic link
    Login->>Onboarding: redirect (pre-selected role=compliance)
    Onboarding->>Radu: "Bună Radu, ești Compliance la Acme SRL"
    Onboarding->>Wizard: wizard applicability
    Note over Wizard: CUI Acme SRL → ANAF populate
    Wizard->>Radu: 4 întrebări: sector (fintech), size (>50), AI usage?, cloud vendors EU?
    Radu->>Wizard: completează
    Wizard->>Radu: "Acme SRL este aplicabilă: GDPR ✅ NIS2 ✅ DORA ✅ AI Act ❌"
    Radu->>Wizard: confirmă
    Wizard->>Dashboard: redirect /dashboard (Acme)
    Dashboard->>Radu: home: 18 findings preliminare + 3 critice
```

#### STADIUL 3 — PRIMUL SCAN COMPLET (30 min)
```mermaid
sequenceDiagram
    actor Radu
    participant Scan as /dashboard/scaneaza
    participant UploadDoc as Upload Documents
    participant SiteScan as Site Scan
    participant Results as Scan Results

    Radu->>Scan: 3 tab-uri (Site URL / Document / CUI lookup)
    Radu->>SiteScan: URL acme.ro → Scan
    SiteScan->>Radu: progress stepper (5 pași)
    SiteScan->>Results: 12 findings detectați
    Radu->>UploadDoc: upload politici existente (PDF, 5 fișiere)
    UploadDoc->>Results: procesare OCR + classification
    Results->>Radu: "8 politici recunoscute ca drafts valide"
    Note over Radu: total 20 findings (12 site + 8 doc gaps)
```

#### STADIUL 4 — DAILY TRIAGE (15 min)
```mermaid
sequenceDiagram
    actor Radu
    participant Monit as /monitorizare/conformitate
    participant Tabs as Tabs GDPR/NIS2/DORA
    participant Cockpit as /actiuni/remediere/[id]
    participant Gen as /actiuni/politici

    Radu->>Monit: 4 tabs (GDPR / NIS2 / DORA / Cross)
    Radu->>Tabs: selectează GDPR (12 findings)
    Tabs->>Radu: rows dens cu severity
    Radu->>Cockpit: click pe finding "Privacy Policy lipsă art. 13"
    Cockpit->>Radu: Context + Impact legal + Pași generare
    Radu->>Gen: click "Generează Privacy Policy"
    Gen->>Radu: wizard 3 pași → draft PDF în 2 min
    Radu->>Gen: review + adjust → sign ca evidence
    Gen->>Cockpit: document atașat
    Cockpit->>Radu: buton verde "Rezolvă finding"
    Cockpit->>Monit: back cu 11 findings restantele
```

#### STADIUL 5 — NIS2 ASSESSMENT (săptămânal, 1h)
```mermaid
sequenceDiagram
    actor Radu
    participant NIS2 as /monitorizare/nis2
    participant Assess as Assessment Tab
    participant Incidents as Incidents Tab
    participant DNSC as DNSC Register

    Radu->>NIS2: 3 tabs (Assessment / Incidente / Registru DNSC)
    Radu->>Assess: maturity matrix 26 controls
    Note over Assess: 14/26 complete, 8 partial, 4 missing
    Radu->>Assess: update 2 controls → score crește
    Radu->>Incidents: verific incident log
    Note over Incidents: 0 incidente săpt curentă
    Radu->>DNSC: verifică înregistrare DNSC
    DNSC->>Radu: "Înregistrat 2025-09-01, renew 2026-09-01"
```

#### STADIUL 6 — DSAR HANDLING (incidental, 2h per cerere)
```mermaid
sequenceDiagram
    actor Angajat
    actor Radu
    participant DSAR as /monitorizare/alerte (DSAR tab)
    participant Response as DSAR Response
    participant Export as Export Pack

    Angajat->>Radu: email "cer toate datele mele conform Art. 15"
    Radu->>DSAR: creează cerere DSAR nouă
    DSAR->>Radu: wizard: tip cerere, subject identification, deadline 30 zile
    Radu->>Response: colectează date (HR system, payroll, CompliAI context)
    Response->>Export: generate DSAR pack PDF
    Export->>Radu: pachet semnat + checklist art. 15
    Radu->>Angajat: email cu pachet
```

#### STADIUL 7 — AUDIT ANSPDCP (ad-hoc, cel mai stressor moment)
```mermaid
sequenceDiagram
    actor Authority as ANSPDCP
    actor Radu
    participant Rapoarte as /dashboard/rapoarte
    participant AuditExport as Audit Pack
    participant Vault as /actiuni/vault

    Authority->>Radu: notificare "Audit programat în 10 zile"
    Radu->>Rapoarte: click "Generează pachet ANSPDCP"
    Rapoarte->>AuditExport: collect all evidence + policies
    AuditExport->>Radu: PDF signed cu format ANSPDCP
    Radu->>Vault: review pachet vs checklist oficial
    Vault->>Radu: 95% complet. Gap: "DPIA high-risk processing lipsă"
    Radu->>Radu: fix gap cu /actiuni/politici → regenerate
    Radu->>Authority: trimite pachet cu 5 zile înainte
```

#### STADIUL 8 — MONTHLY REPORT to CEO (1h)
```mermaid
sequenceDiagram
    actor CEO
    actor Radu
    participant Report as /dashboard/rapoarte
    participant Dashboard as executive summary

    Radu->>Report: click "Raport executiv lunar"
    Report->>Radu: config: perioada, audience (board), format
    Report->>Dashboard: PDF 2 pagini
    Note over Dashboard: scor conformitate, risk heat map, 3 highlights
    Radu->>CEO: email raport
```

#### STADIUL 9 — SETĂRI + TEAM (rar)
```mermaid
sequenceDiagram
    actor Radu
    participant Setari as /dashboard/setari
    participant Membri as Membri Tab
    participant Account as /account/settings

    Radu->>Setari: 9 tabs
    Radu->>Membri: invită 2 colegi ca Viewer
    Membri->>Radu: invites sent
    Radu->>Account: personal profile (optional)
```

**JTBD-uri atinse**: Radu are ~8 flow-uri distincte. **Cel mai stressant**: audit ANSPDCP (STADIUL 7). **Cel mai frecvent**: daily triage (STADIUL 4).

---

### 10.3 MIHAI — SOLO SME OWNER (€29-49/lună, sweet spot SRL <10 angajați)

**Context**: Mihai (42 ani, patron Bistro Mihai SRL — 3 angajați, revenue €180K/an). Nu e pasionat de compliance, dar a primit notificare ANAF despre e-Factura. Se autoeducă, căută "GDPR SRL ieftin".

#### STADIUL 1 — ACHIZIȚIE (SEO + freemium entry)
```mermaid
sequenceDiagram
    actor Mihai
    participant Google as Google Search
    participant Landing as /
    participant Pricing as /pricing
    participant Register as /register

    Mihai->>Google: "GDPR politică simplă SRL gratis"
    Google->>Landing: top result "CompliAI — compliance pentru SRL-uri mici"
    Landing->>Mihai: hero + 3 persone → click "Solo"
    Landing->>Pricing: vezi Solo €29/lună (sau 14 zile gratis)
    Mihai->>Register: click "Încearcă gratis"
```

#### STADIUL 2 — ONBOARDING SIMPLIFICAT (5 min)
```mermaid
sequenceDiagram
    actor Mihai
    participant Register as /register
    participant Onboarding as /onboarding
    participant Applicability as ApplicabilityWizard
    participant Dashboard as /dashboard

    Mihai->>Register: email + parolă + "Bistro Mihai SRL"
    Register->>Onboarding: redirect
    Onboarding->>Mihai: 3 carduri
    Mihai->>Onboarding: click "Proprietar / Manager"
    Onboarding->>Applicability: wizard simplificat
    Applicability->>Mihai: doar 3 întrebări (sector=HoReCa, size=<10, cloud EU=yes)
    Applicability->>Mihai: "Aplicabil: GDPR + e-Factura. AI Act ❌, NIS2 ❌"
    Applicability->>Dashboard: redirect /dashboard (simplified)
```

#### STADIUL 3 — PRIMUL SCAN (5 min, "aha" moment)
```mermaid
sequenceDiagram
    actor Mihai
    participant Scan as /dashboard/scaneaza
    participant Results
    participant DeRezolvat as /dashboard/de-rezolvat

    Mihai->>Scan: input URL "bistromihai.ro"
    Scan->>Results: 4 findings detectate
    Note over Results: 1 critic (cookie consent lipsă)<br/>2 medium (privacy gaps)<br/>1 low (e-Factura setup)
    Results->>DeRezolvat: auto-redirect "De rezolvat"
    DeRezolvat->>Mihai: 4 items ordonate după severitate
    Note over Mihai: "Oh, deci atât?" - primul "aha"
```

#### STADIUL 4 — REZOLVĂ PRIMUL FINDING (10 min)
```mermaid
sequenceDiagram
    actor Mihai
    participant DeRezolvat as /dashboard/de-rezolvat
    participant Guided as Guided Wizard
    participant Doc as Generator

    Mihai->>DeRezolvat: click "Cookie consent lipsă"
    DeRezolvat->>Guided: wizard "Hai să rezolvăm pas cu pas"
    Note over Guided: UI foarte prietenos, explicații simple
    Guided->>Mihai: "Avem nevoie să plasezi un banner pe site"
    Guided->>Mihai: 2 opțiuni: Copy-paste code / "Generez politică cookie"
    Mihai->>Doc: click "Generează"
    Doc->>Mihai: PDF politică cookie + HTML snippet banner
    Mihai->>Mihai: copy-paste în site, upload PDF
    Guided->>Mihai: "Excelent! Finding rezolvat."
    Note over Mihai: primul win concret
```

#### STADIUL 5 — DOCUMENTE (săpt 1, 20 min)
```mermaid
sequenceDiagram
    actor Mihai
    participant Documente as /dashboard/documente
    participant Gen as Politici Generator

    Mihai->>Documente: hub unificat (politici + scans)
    Mihai->>Documente: "Generează Privacy Policy"
    Gen->>Mihai: 3 întrebări simple: website? newsletter? contact form?
    Gen->>Mihai: PDF draft 4 pagini
    Mihai->>Mihai: upload pe site
    Gen->>Documente: atașată ca evidence
```

#### STADIUL 6 — e-FACTURA SETUP (30 min, STADIUL SINGUR COMPLEX)
```mermaid
sequenceDiagram
    actor Mihai
    participant DeRezolvat as /dashboard/de-rezolvat
    participant Setup as e-Factura Setup
    participant ANAF as /api/anaf/connect

    Mihai->>DeRezolvat: click "e-Factura nu e activă"
    DeRezolvat->>Setup: wizard setup ANAF SPV
    Setup->>Mihai: 4 pași: auth cert ANAF, OAuth connect, verify, first factura
    Mihai->>ANAF: OAuth flow real
    ANAF->>Setup: success
    Setup->>Mihai: "Conectat. Facturile tale sunt monitorizate acum."
```

#### STADIUL 7 — MONTHLY SELF-CHECK (10 min, rar)
```mermaid
sequenceDiagram
    actor Mihai
    participant Rapoarte as /dashboard/rapoarte
    participant Snapshot

    Mihai->>Rapoarte: click "Status conformitate"
    Rapoarte->>Snapshot: PDF simplu 1 pagină
    Note over Snapshot: "Ești conform 85%. Acțiuni rămase: 3 (niciuna critică)"
    Snapshot->>Mihai: email lunar automat
```

#### STADIUL 8 — UPGRADE OPPORTUNITY (1-3 luni după)
```mermaid
sequenceDiagram
    actor Mihai
    participant DeRezolvat as /dashboard/de-rezolvat
    participant PlanGate as Plan Gate Modal
    participant Stripe

    Mihai->>DeRezolvat: încearcă să adauge un employee DPA
    DeRezolvat->>PlanGate: "Plan Solo nu include multi-user. Upgrade?"
    PlanGate->>Mihai: 3 opțiuni: Pro €149 / Agency / Skip
    Mihai->>Stripe: upgrade (sau skip)
```

#### STADIUL 9 — OFFBOARDING / DEACTIVATE (rare)
```mermaid
sequenceDiagram
    actor Mihai
    participant Account
    participant API

    Mihai->>Account: tab "Abonament"
    Account->>Mihai: click "Dezabonează-te"
    Mihai->>API: POST cancel
    API->>Mihai: "Abonament anulat. Acces până la 2026-05-20."
```

**JTBD-uri Mihai**: foarte puține, dar frequente. **Aha moment-ul crucial**: primul finding rezolvat cu wizard guided (STADIUL 4). Dacă asta merge smooth → conversie la paid. Dacă nu → churn.

---

## 11. OBSERVAȚII CROSS-PERSONA

| Aspect | Diana (Partner) | Radu (Compliance) | Mihai (Solo) |
|---|---|---|---|
| **Timp onboarding** | 10 min (wizard partner) | 10 min (applicability + invited) | 5 min (simplificat) |
| **Primul "aha"** | Bulk dismiss 5 findings | Primul scan complet cu 20 findings | Primul finding rezolvat cu wizard |
| **Frecvență zilnic** | 10 min (9:15 AM triage) | 15 min (GDPR/NIS2 tabs) | 0 (intră săpt o dată) |
| **Frecvență săptămânal** | 30 min (remediere + vendor) | 1h (NIS2 assess + incidents) | 10 min (check status) |
| **Frecvență lunar** | 1h (batch reports revenue) | 1h (CEO report) | 5 min (snapshot email) |
| **Moment critic** | Client audit (30 min save) | Audit ANSPDCP (2 săpt save) | e-Factura setup (blocker ANAF) |
| **Valoarea cheie** | Revenue rebill 100-300 RON/client × 20 | Audit-ready în 1 click vs 2 săpt | Compliance fără stres în 30 min/lună |
| **Paginile ce ating** | 8 rute principale | 10 rute principale | 5 rute simplificate |

---

## 12. CE TREBUIE FIXAT ÎN IA PENTRU FLOW-URILE DE MAI SUS

| User | Flow | Ce lipsește acum (blocher) |
|---|---|---|
| Diana | STADIUL 1 (achiziție) | Landing + Pricing sunt funcționale. OK. |
| Diana | STADIUL 5 (daily) | `/portfolio/alerte` există ca `/portfolio/alerts` — redenumire necesară + bulk actions wire |
| Diana | STADIUL 6 (weekly) | `/portfolio/remediere` nu există în rute (e `/portfolio/tasks`) — redenumire |
| Diana | STADIUL 7 (monthly) | `/portfolio/rapoarte` e `/portfolio/reports` — redenumire |
| Radu | STADIUL 2 (onboarding) | Claim invite flow există dar nu pre-populează mode=compliance automat |
| Radu | STADIUL 4 (daily) | `/monitorizare/conformitate` nu există ca rută (e `/dashboard/conformitate`) |
| Radu | STADIUL 5 (NIS2) | `/monitorizare/nis2` nu există (e `/dashboard/nis2`) |
| Radu | STADIUL 7 (audit ANSPDCP) | Endpoint există (`/api/exports/anspdcp-pack/[orgId]`) dar format nevalidat juridic |
| Mihai | STADIUL 3 (primul scan) | `/dashboard/de-rezolvat` (rută simplificată Solo) NU EXISTĂ — de creat |
| Mihai | STADIUL 5 (docs) | `/dashboard/documente` hub simplificat NU EXISTĂ — de creat |
| Mihai | STADIUL 6 (e-Factura) | Setup wizard complet funcțional |

**Concluzie IA Pasul 1**: majoritatea flow-urilor sunt blocate de rute RO nepotrivite (nu există `/portfolio/alerte` ca redirect de la `/portfolio/alerts`, etc.). După redirect map din §4 + rute noi Solo, toate 3 persone pot parcurge flow-urile integral.

---

> **END IA-TARGET-DIAGRAM v1.1 (cu User Journeys cap-coadă)** — 2026-04-20.
> Folosit pentru review înainte de implementare Pasul 1. După OK, implementez.
