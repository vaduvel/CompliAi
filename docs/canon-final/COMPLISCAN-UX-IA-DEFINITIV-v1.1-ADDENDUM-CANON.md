# CompliScan — UX/IA Definitiv v1.1 ADDENDUM

Data: `2026-03-22`
Completare la: `COMPLISCAN-UX-IA-DEFINITIV.md` (v1.0)

Acest addendum rezolvă cele 5 clarificări cerute de Codex.
După aprobare, se integrează în v1.0 și documentul devine canonul activ.

Notă de aliniere tehnică:
- pe UX și IA, acest addendum completează documentul UX/IA principal
- pe auth, sesiune, ownership și billing, implementarea finală urmează:
  - [COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md)
  - [COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md)

---

## Clarificarea 1 — Modelul de ownership pentru client

### Când consultantul adaugă un client

La „Adaugă client" din Portofoliu, consultantul creează o organizație nouă.

Rolurile sunt:

```
Consultant (Elena)     → rol: `partner_manager` pe organizația clientului
Client real (Bogdan)   → nu are cont inițial
```

`partner_manager` este un rol nou, distinct de `owner`. Diferențe:

| Permisiune | owner | partner_manager | compliance | reviewer | viewer |
|------------|-------|-----------------|------------|----------|--------|
| Vede toate datele org | ✅ | ✅ | ✅ | Doar atribuite | Doar atribuite |
| Creează/editează findings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generează documente | ✅ | ✅ | ✅ | ❌ | ❌ |
| Exportă rapoarte | ✅ | ✅ | ✅ | ❌ | ❌ |
| Invită membri | ✅ | ❌ | ❌ | ❌ | ❌ |
| Schimbă plan/billing | ✅ | ❌ | ❌ | ❌ | ❌ |
| Șterge organizația | ✅ | ❌ | ❌ | ❌ | ❌ |
| Elimină partner_manager | ✅ | ❌ | ❌ | ❌ | ❌ |

### Când clientul real vrea acces

Consultantul nu poate invita pe nimeni. Consultantul solicită transfer de ownership:

```
Elena (partner_manager) → creează organizația „LogiTrans SRL"
Elena lucrează pe ea.
Bogdan (CEO LogiTrans) vrea cont propriu.
Elena îi trimite invitație de tip „Claim organization".
Bogdan acceptă → devine owner.
Elena rămâne partner_manager.
Bogdan poate acum invita alți membri, schimba planul etc.
```

### Reguli ferme

1. O organizație are maxim 1 `owner`. La creare de către consultant, owner-ul este `system` (placeholder) până clientul face claim.
2. `partner_manager` NU poate invita membri, NU poate schimba billing, NU poate șterge organizația.
3. `owner` poate elimina `partner_manager` oricând (clientul poate „concedia" consultantul).
4. `partner_manager` poate exista simultan cu `owner` + alți membri. Nu se bat cap în cap.
5. Un consultant poate fi `partner_manager` pe N organizații simultan.
6. Un user poate fi `owner` pe o org și `partner_manager` pe altele simultan (Elena gestionează cabinetul ei + clienții).

### Impact pe membership model

```typescript
type OrgRole = 'owner' | 'partner_manager' | 'compliance' | 'reviewer' | 'viewer'

// La login, /api/auth/memberships returnează:
[
  { orgId: 'elena-cabinet', role: 'owner' },        // firma ei
  { orgId: 'logitrans', role: 'partner_manager' },   // client
  { orgId: 'medplus', role: 'partner_manager' },      // client
  // ... 33 more
]
```

`userMode` se determină din memberships:
- Dacă are cel puțin 1 membership cu rol `partner_manager` → `userMode: 'partner'`
- Dacă are doar `owner` sau `compliance` pe 1 org → `userMode` din onboarding answer
- Dacă are doar `viewer` → `userMode: 'viewer'`

---

## Clarificarea 2 — Portofoliu vs sesiune per org (firmă activă)

### Modelul actual

Azi, aplicația are o singură `activeOrgId` pe sesiune. Toate API-urile citesc din `activeOrgId`.

### Modelul nou

Introducem două contexte:

```
portfolioContext    → citește date din TOATE organizațiile unde userul are acces
orgContext          → citește date din organizația selectată (orgId din sesiune)
```

### Ce se citește cross-org (portfolioContext)

Paginile din `/portfolio/*` citesc cross-org. Concret:

| Pagină | Ce citește cross-org | Cum |
|--------|---------------------|-----|
| Prezentare generală | Scor + findings count + ultima scanare per org | API nou: `GET /api/portfolio/overview` |
| Alerte | Toate alertele active din toate orgs | API nou: `GET /api/portfolio/alerts` |
| Remediere | Toate task-urile active din toate orgs | API nou: `GET /api/portfolio/tasks` |
| Furnizori | Toți vendorii din toate orgs, dedup pe CUI/nume | API nou: `GET /api/portfolio/vendors` |
| Rapoarte | Metadata rapoarte din toate orgs | API nou: `GET /api/portfolio/reports` |

Aceste API-uri returnează date agregate. NU returnează detalii granulare (nu întregul state al fiecărei org).

### Ce rămâne strict per-org (orgContext)

Tot ce e sub `/dashboard/*` citește strict din organizația activă din sesiune:

- Acasă, Scanează, Monitorizare/*, Acțiuni/*, Rapoarte, Setări
- Toate API-urile existente rămân neschimbate

### Când se schimbă contextul

```
User pe /portfolio/*        → workspaceMode = portfolio
User selectează firmă       → workspaceMode = org + orgId actualizat → redirect la /dashboard
User pe /dashboard/*        → workspaceMode = org
User click „Portofoliu"     → workspaceMode = portfolio, dar sesiunea păstrează ultimul org valid
```

### Regula de session

```typescript
// În session/cookie:
{
  userId: string
  orgId: string               // ultimul org valid / org activ
  userMode: 'partner' | 'compliance' | 'solo' | 'viewer'
  workspaceMode: 'portfolio' | 'org'
}
```

În `workspaceMode = portfolio`, userul folosește doar rutele `/portfolio/*`, dar sesiunea păstrează ultimul `orgId` valid.
În `workspaceMode = org`, userul intră în `/dashboard/*`.
Nu folosim `activeOrgId = null` ca mecanism canon.

---

## Clarificarea 3 — Operații cross-client vs per-client

### Operații permise cross-client (din Portofoliu)

| Operație | Cross-client | Confirmare |
|----------|-------------|------------|
| Vizualizare scoruri / findings / alerte | ✅ | Fără confirmare |
| Sortare / filtrare pe orice coloană | ✅ | Fără confirmare |
| Export raport portofoliu agregat (PDF) | ✅ | 1 click confirmare |
| Trimite digest email la toți clienții | ✅ | Confirmare: „Trimiți la 35 clienți?" |
| Generare audit pack selectiv (alege firme) | ✅ | Confirmare per firmă selectată |
| Vizualizare furnizori agregați | ✅ | Fără confirmare |

### Operații permise doar per-client (din /dashboard în `workspaceMode = org`)

| Operație | Per-client | De ce |
|----------|-----------|-------|
| Scanare document | ✅ doar per firmă | Documentul aparține unei firme |
| Upload dovadă | ✅ doar per firmă | Dovada e per finding per firmă |
| Marchează task complet | ✅ doar per firmă | Task-ul e per firmă |
| Generează DPA | ✅ doar per firmă | DPA e între firmă și furnizor |
| Completează assessment NIS2 | ✅ doar per firmă | Assessment-ul e per firmă |
| Modifică profil organizație | ✅ doar per firmă | Profilul e per firmă |
| Invită membri (doar owner) | ✅ doar per firmă | Membrii sunt per firmă |

### Operații care NU se fac niciodată în bulk

| Operație | Permisă în bulk | Motiv |
|----------|----------------|-------|
| Ștergere organizație | ❌ NICIODATĂ | Ireversibil, doar owner per firmă |
| Modificare plan/billing | ❌ NICIODATĂ | Fiecare firmă are planul ei |
| Reset state | ❌ NICIODATĂ | Destructiv |
| Trimitere raport DNSC | ❌ NICIODATĂ | Legal binding, per firmă, necesită review |
| Confirmare politică | ❌ NICIODATĂ | Semnificație legală per firmă |

### Regula generală

```
READ cross-client = da (portofoliu)
WRITE cross-client = doar batch safe (export, digest, generare draft)
WRITE destructiv = niciodată cross-client
WRITE legal binding = niciodată cross-client
```

---

## Clarificarea 4 — Separare Setări cont / Setări client / Portofoliu

### Trei niveluri distincte

```
Nivel 1: Setări cont (userul, nu organizația)
  Acces: ⚙ Setări cont (link fix în sidebar, sub separator)
  Rută: /account/settings
  Conține:
    - Profil utilizator (nume, email, parolă, 2FA)
    - Sesiuni active
    - Preferințe notificări (la nivel de cont, nu de firmă)
    - Facturare partner doar după wave-ul dedicat de billing; până atunci billing-ul rămâne per firmă conform canonului tehnic

Nivel 2: Setări firmă (organizația selectată)
  Acces: Setări (în sidebar per-firmă, în `workspaceMode = org`)
  Rută: /dashboard/setari
  Conține:
    - Organizație (denumire, CUI, CAEN, adresă, angajați, contact DPO)
    - Membri echipă + roluri
    - Integrări (ANAF, GitHub, Supabase — per firmă)
    - Automatizare (config agenți — per firmă)
    - Notificări (ce alerte se trimit pentru firma asta)
  Cine vede:
    - owner: totul
    - partner_manager: Organizație (read-only), Membri (read-only), Integrări, Automatizare
    - compliance: Organizație (read-only), Integrări
    - reviewer/viewer: nimic

Nivel 3: Portofoliu
  Acces: Secțiunea Portofoliu din sidebar (userMode partner)
  Rută: /portfolio/*
  Conține:
    - Lista clienți
    - Alerte / Remediere / Furnizori / Rapoarte cross-firmă
  NU conține setări. Portofoliul e operational, nu administrativ.
```

### Vizual în sidebar

```
PORTOFOLIU                      ← nivel 3 (cross-org, operational)
├── Prezentare generală
├── Alerte
├── ...

─── separator ───

FIRMA: [LogiTrans SRL ▼]       ← nivel 2 (per-org)
├── Acasă
├── ...
├── Setări                      ← Setări firmă (nivel 2)

─── separator ───

⚙ Setări cont                  ← nivel 1 (user personal)
🔔 Notificări (3)
```

Regulă: **niciodată nu amestecăm conținut din două niveluri în aceeași pagină.**

---

## Clarificarea 5 — Ce documente precedente devin deprecated

### Deprecated imediat (nu mai sunt canon)

Aceste documente NU mai au autoritate de implementare:

```
DEPRECATED:
  docs/final-guide-plan/02-ux-ia-blueprint.md          → înlocuit de prezentul document
  docs/final-guide-plan/03-ux-wireframe-prototype.jsx   → înlocuit
  public/gpt-ux-flow-brief.md                           → deprecated, mută în docs/archive/
  public/ux-ui-flow-arhitectura.md                      → deprecated, mută în docs/archive/
  public/evidence-os-design-system-v1.md                → deprecated ca spec UX, valid doar ca referință DS
  public/page-recipes-dashboard-scanare-2026-03-14.md   → deprecated, mută în docs/archive/
  public/page-recipes-setari-2026-03-14.md              → deprecated, mută în docs/archive/
  public/compliscan-ui-prompt.md                        → deprecated
```

### Rămân canon (nu se schimbă)

```
CANON:
  docs/final-guide-plan/04-implementation-reference-eos-v1.md  → referință DS, valid
  docs/final-guide-plan/00-master-source.md                    → doctrină produs, valid
  docs/MASTER-AUDIT-CANONIC-2026-03-22.md                      → audit stare, valid
  docs/AUDIT-COMPLET-COMPLIAI.md                               → anexă tehnică, valid
```

### Noul canon

```
NOU CANON:
  docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md                  → contractul de UX/IA
  docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md    → clarificări UX/IA
  docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md              → canon tehnic
  docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md                → plan de implementare
```

### Regula de tranziție

```
Dacă un document deprecated contrazice UX/IA Definitiv → UX/IA Definitiv câștigă.
Dacă un document canon (04-implementation, 00-master-source) contrazice UX/IA Definitiv 
  pe chestiuni de UX/IA → UX/IA Definitiv câștigă.
  pe chestiuni de DS vizual → 04-implementation câștigă (EOS v1 rămâne neschimbat).
  pe chestiuni de doctrină produs → se discută, nu se presupune.
```

---

## Rezumat modificări v1.1

| # | Clarificare | Rezolvare |
|---|-------------|-----------|
| 1 | Ownership model | Rol nou `partner_manager`, claim flow, reguli ferme de permisiuni |
| 2 | Portofoliu vs sesiune | Două contexte: `portfolioContext` (cross-org) vs `orgContext` (workspaceMode + orgId păstrat) |
| 3 | Cross-client vs per-client | Matrice READ/WRITE cu reguli de bulk, legal binding exclus din cross |
| 4 | Setări pe 3 niveluri | Cont (user) / Firmă (org) / Portofoliu (operational), cu billing partner separat de wave-ul UX foundation |
| 5 | Documente deprecated | Listă explicită: ce moare, ce rămâne, ce e nou, regula de conflict |

---

## Decizia cerută

Acest addendum împreună cu v1.0 formează noul canon UX/IA al CompliScan.

Dacă se aprobă:
1. Se integrează addendum-ul în v1.0 → devine v1.1
2. Se comit ambele în `docs/`
3. Se marchează documentele deprecated
4. Se începe implementarea conform planului de execuție

Dacă nu se aprobă:
- Se revine cu clarificări suplimentare înainte de commit
