# CompliScan - UX/UI Flow + Arhitectura (audit si clarificare)

Data: 2026-03-14

## Scop
- Sa reducem haosul din cockpit si sa facem user flow-ul clar.
- Sa pastram Evidence OS ca limbaj vizual, dar sa imbunatatim arhitectura UX.
- Sa mapam sectiunile existente intr-o structura coerenta.

## Surse folosite
- Evidence OS v1: `public/evidence-os-design-system-v1.md`
- Audituri Cursor (structura + flow):
  - `public/audit-cursor-dashboard-2026-03-14.md`
  - `public/next-steps-performance-and-risk-2026-03-14.md`
  - `public/review-arhitectura-implementare-2026-03-14.md`
- Navigatia curenta: `components/compliscan/navigation.ts`

---

## 1) Arhitectura UX tinta (din Evidence OS)

### Doctrina canonica de page governance

Aceasta sectiune devine sursa de adevar pentru compozitia paginilor mari din produs.

Daca alt document intra in conflict cu aceste reguli, aceasta sectiune castiga.

Combo-ul canonic este:

- `Progressive Disclosure`
- `Trust Through Transparency`
- `Role-Aware Surfaces`
- `Tab-based sub-navigation`
- `Summary / Detail / Action separation`
- `One dominant page intent`

Ce inseamna operational:

1. o pagina mare are o singura intentie dominanta
   - `Dashboard` = orientare
   - `Scanare` = intake + analiza
   - `Control` = confirmare + baseline + drift
   - `Dovada` = remediere + dovada + livrabil
   - `Setari` = administrare operationala

2. complexitatea se scoate in straturi, nu se afiseaza simultan
   - summary
   - detail
   - drill-down

3. userul trebuie sa inteleaga de ce vede ceva si ce urmeaza dupa
   - provenance
   - rationale
   - owner / validare umana
   - handoff clar spre pagina urmatoare

4. sub-sectiunile stau in tabs locale, nu in shortcut-uri persistente concurente

5. sumarul, executia si exportul nu se amesteca pe aceeasi pagina ca intentii egale

6. `Evidence OS` nu este doar component library
   - este si sistem de arhitectura informationala pentru paginile mari

### IA top-level aprobata

- Dashboard
- Scanare
- Control
- Dovada
- Setari

Observatie:

- `Scanare / Control / Dovada` raman pilonii de executie
- `Dashboard` este home/orchestrator
- `Setari` este suprafata de operare si administrare
- `Asistent` ramane utilitar global, nu pilon si nu sub-sectiune din `Dovada`

### Subcategorii (tabs) aprobate

| Zona | Tabs recomandate |
|---|---|
| Dashboard | Readiness, Drift feed, Next best action, Evidence quality summary, Audit readiness snapshot |
| Scanare | Adauga sursa, Rezultat curent, Istoric |
| Control | Overview, Sisteme, Drift, Review |
| Sisteme (sub-tabs) | Inventar, Discovery, Compliance Pack, Baseline |
| Dovada | Remediere, Dovezi, Audit Pack, Vault |
| Setari | Workspace, Integrari, Acces, Operational, Avansat |

### Golden Path
Sursa -> Verdict -> Remediere -> Dovada -> Audit/Export

---

## 2) Navigatia curenta (din cod)

### Primary
- Dashboard -> `/dashboard`
- Scanare -> `/dashboard/scanari`
- Control -> exprimat azi prin `/dashboard/sisteme` si `/dashboard/alerte`
- Dovada -> exprimat azi prin `/dashboard/checklists`, `/dashboard/rapoarte`, `/dashboard/rapoarte/auditor-vault`
- Setari -> `/dashboard/setari`

### Secondary curent
- Scanare: Flux scanare (`/dashboard/scanari`), Documente (`/dashboard/documente`)
- Control: Sisteme AI (`/dashboard/sisteme`), Alerte (`/dashboard/alerte`)
- Dovada: Remediere (`/dashboard/checklists`), Audit si export (`/dashboard/rapoarte`), Auditor Vault (`/dashboard/rapoarte/auditor-vault`)
- Utilitare: Setari (`/dashboard/setari`), Asistent (`/dashboard/asistent`)

---

## 3) Audit pe sectiuni (haos detectat + clarificare)

### Scanari (pag. `/dashboard/scanari`)
**Problema:** 4 moduri de lucru amestecate in acelasi workspace, fara separare clara intre lucru activ si rezultat/istoric.
**Clarificare propusa:**
- Un singur flux activ, cu alegere de sursa in pasul 1.
- Separare clara in tabs: Adauga sursa / Rezultat curent / Istoric.

### Documente (pag. `/dashboard/documente`)
**Observat:** pagina curata, functioneaza ca istoric.
**Clarificare:** redenumita conceptual ca "Istoric documente".

### Sisteme AI (pag. `/dashboard/sisteme`)
**Problema:** pagina amesteca Discovery, Inventory, Baseline, Drift, Compliance Pack, e-Factura.
**Clarificare propusa:** separare pe tabs in Control:
- Discovery (candidate)
- Sisteme AI (inventar)
- Baseline (snapshot validat)
- Drift (schimbari)
- Compliance Pack (pre-fill / review)
- e-Factura mutat in Setari/Integrari (nu in Control)

### Alerte (pag. `/dashboard/alerte`)
**Observat:** focus pe drift + task-uri generate.
**Clarificare:** redenumire ca tab "Drift" sub Control. Task-urile raman in Remediere.

### Dashboard (pag. `/dashboard`)
**Observat:** summary + next best action + agregari. Nu e haotic, dar e "overview".
**Clarificare:** ramane top-level ca home/orchestrator. Nu devine subpagina de Control.
Contine doar:
- readiness
- drift feed
- next best action
- evidence quality summary
- audit readiness snapshot

### Remediere (pag. `/dashboard/checklists`)
**Observat:** flow clar, board de task-uri.
**Clarificare:** ramane in Dovada.

### Audit si export (pag. `/dashboard/rapoarte`)
**Problema:** contine RemediationBoard + export + snapshot + drift. Amesteca actiuni de remediere cu export.
**Clarificare propusa:**
- Remedierea sta doar in Remediere.
- Audit/Export ramane pentru snapshot, readiness si exporturi.

### Auditor Vault (pag. `/dashboard/rapoarte/auditor-vault`)
**Observat:** vedere audit-ready, coerenta dar mare.
**Clarificare:** tab separat "Auditor Vault" in Dovada.

### Setari (pag. `/dashboard/setari`)
**Problema:** pagina extrem de densa (membri, repo sync, supabase, health, release readiness, drift overrides, reset).
**Clarificare propusa:** sub‑sectiuni sau tabs:
- Workspace
- Integrari
- Acces
- Operational
- Avansat

### Asistent (pag. `/dashboard/asistent`)
**Observat:** UX clar si izolat.
**Clarificare:** ramane utilitar global, cu pagina separata pentru istoric lung, dar nu in `Dovada`.

---

## 4) Arhitectura UX propusa (clarificata)

### Dashboard
Scop: orientezi rapid utilizatorul, fara sa amesteci workspace-uri de executie.

Contine:
- readiness
- drift feed
- next best action
- evidence quality summary
- audit readiness snapshot

Nu contine:
- discovery
- remediation board
- export center

### Zona 1: Scanare
Scop: colectezi sursa si obtii verdict.

Tabs:
- Adauga sursa (lucru activ)
- Rezultat curent
- Istoric documente (scanari trecute)

### Zona 2: Control
Scop: controlezi inventarul, baseline si drift.

Tabs:
- Overview (summary)
- Sisteme
- Drift
- Review

Sub-tabs in `Sisteme`:
- Inventar
- Discovery
- Compliance Pack
- Baseline

### Zona 3: Dovada
Scop: transformi verdictul in dovada verificabila.

Tabs:
- Remediere (task-uri)
- Dovezi
- Audit Pack
- Vault

### Utilitare (non-pilon)
- Setari:
  - Workspace
  - Integrari
  - Acces
  - Operational
  - Avansat
- Asistent AI:
  - utilitar global

---

## 5) Scanare - Flow unificat (fix pentru cele 4 moduri)

### Ideea cheie
Cele 4 surse raman, dar devin sub-optiuni intr-un flow unic, nu moduri paralele.

### Flow propus
1. Alege sursa (card selector):
   - Document (default)
   - Text manual
   - Manifest (advanced)
   - compliscan.yaml (advanced)
2. Pregatire sursa:
   - Document: upload + OCR preview
   - Text: paste + nume clar
   - Manifest: select repo + extract
   - YAML: upload/parse config
3. Review extractie (obligatoriu pentru document/text)
4. Analiza -> Verdict
5. Actiuni:
   - Document/Text: Rezultat curent + Remediere
   - Manifest/YAML: Discovery -> confirmare -> Sisteme AI
6. Dovada + Audit/Export

### Separarea clara in UI
- Tab "Adauga sursa" contine doar pasii activi.
- Tab "Rezultat curent" contine doar ultimul verdict + explicatie.
- Tab "Istoric" contine doar lista de scanari trecute.

---

## 6) Mapping propus (rute actuale -> arhitectura UX)

| UX Tab | Ruta curenta | Ajustare propusa |
|---|---|---|
| Dashboard | /dashboard | Ramane top-level, ca home/orchestrator |
| Flux scanare | /dashboard/scanari | Ramane, dar contine doar flow activ |
| Rezultat curent | /dashboard/scanari (sub‑sectiune) | Mutat ca tab clar al Scanarii |
| Istoric documente | /dashboard/documente | Ramane (renumit conceptual) |
| Control / Overview | /dashboard/sisteme | Ramane in zona Control, nu in Dashboard |
| Sisteme | /dashboard/sisteme | Ramane, dar se organizeaza pe sub-tabs |
| Discovery | /dashboard/sisteme | Sub-tab in `Sisteme` |
| Compliance Pack | /dashboard/sisteme | Sub-tab in `Sisteme` |
| Baseline | /dashboard/sisteme sau /dashboard/setari | tinta corecta este in `Control / Sisteme` |
| Drift | /dashboard/alerte | Renumit conceptual ca Drift sub Control |
| Remediere | /dashboard/checklists | Ramane |
| Dovezi / Vault | /dashboard/rapoarte/auditor-vault | expus ca suprafata distincta in Dovada |
| Audit Pack | /dashboard/rapoarte | Curatat si tinut pentru snapshot + export |
| Setari | /dashboard/setari | top-level, cu tabs interne |
| Asistent | /dashboard/asistent | utilitar global, nu Dovada |

---

## 7) Prioritati de clarificare
1. IA oficiala: Dashboard / Scanare / Control / Dovada / Setari.
2. Scanare: unificare flow + separare Rezultat curent / Istoric.
3. Control: split clar Sisteme vs Drift vs Review, cu sub-tabs curate in `Sisteme`.
4. Dovada: separa Remediere / Dovezi / Audit Pack / Vault.
5. Setari: sub‑tabs interne si scoatere din competitia vizuala cu pilonii de executie.

---

## Non‑obiective
- Nu introducem piloni noi.
- Nu schimbam modelul de domeniu.
- Nu facem rewrite de UI.
