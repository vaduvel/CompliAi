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

### Piloni
- Scanare
- Control
- Dovada

### Subcategorii (tabs) per pilon

| Pilon | Tabs recomandate Evidence OS |
|---|---|
| Scanare | Flux scanare, Verdicts, Rezultate |
| Control | Sisteme AI, Baseline, Drift, Discovery |
| Dovada | Remediere, Dovezi, Auditor Vault, Audit si export |

### Golden Path
Sursa -> Verdict -> Remediere -> Dovada -> Audit/Export

---

## 2) Navigatia curenta (din cod)

### Primary
- Scanare -> `/dashboard/scanari`
- Control -> `/dashboard`
- Dovada -> `/dashboard/checklists`

### Secondary curent
- Scanare: Flux scanare (`/dashboard/scanari`), Documente (`/dashboard/documente`)
- Control: Dashboard (`/dashboard`), Sisteme AI (`/dashboard/sisteme`), Alerte (`/dashboard/alerte`), Setari (`/dashboard/setari`)
- Dovada: Remediere (`/dashboard/checklists`), Audit si export (`/dashboard/rapoarte`), Asistent (`/dashboard/asistent`)

---

## 3) Audit pe sectiuni (haos detectat + clarificare)

### Scanari (pag. `/dashboard/scanari`)
**Problema:** 4 moduri de lucru amestecate in acelasi workspace, fara separare clara intre lucru activ si rezultat/istoric.
**Clarificare propusa:**
- Un singur flux activ, cu alegere de sursa in pasul 1.
- Separare clara in tabs: Flux activ / Verdicts / Istoric.

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
**Clarificare:** redenumit conceptual ca "Overview" in Control.

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
- Membri & Roluri
- Integrari (Repo Sync, Supabase)
- Operational (Health, Release Readiness)
- Politici (Drift overrides)
- Administrare (Reset, date)

### Asistent (pag. `/dashboard/asistent`)
**Observat:** UX clar si izolat.
**Clarificare:** poate ramane separat, dar nu in Dovada. Ideal in zona de utilitare.

---

## 4) Arhitectura UX propusa (clarificata)

### Pilon 1: Scanare
Scop: colectezi sursa si obtii verdict.

Tabs:
- Flux scanare (lucru activ)
- Verdicts (rezultat curent, explicatii)
- Istoric documente (scanari trecute)

### Pilon 2: Control
Scop: controlezi inventarul, baseline si drift.

Tabs:
- Overview (summary)
- Sisteme AI (inventar oficial)
- Discovery (candidate detectate)
- Baseline (snapshot validat)
- Drift (alerte)
- Compliance Pack (optional, daca ramane aici)

### Pilon 3: Dovada
Scop: transformi verdictul in dovada verificabila.

Tabs:
- Remediere (task-uri)
- Dovezi (ledger + quality)
- Auditor Vault (audit view read-only)
- Audit si export (snapshot + export)

### Utilitare (non-pilon)
- Setari (sub‑tabs interne)
- Asistent AI (tool separat)

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
   - Document/Text: Verdicts + Remediere
   - Manifest/YAML: Discovery -> confirmare -> Sisteme AI
6. Dovada + Audit/Export

### Separarea clara in UI
- Tab "Flux scanare" contine doar pasii activi.
- Tab "Verdicts" contine doar ultimul verdict + explicatie.
- Tab "Istoric" contine doar lista de scanari trecute.

---

## 6) Mapping propus (rute actuale -> arhitectura UX)

| UX Tab | Ruta curenta | Ajustare propusa |
|---|---|---|
| Flux scanare | /dashboard/scanari | Ramane, dar contine doar flow activ |
| Verdicts | /dashboard/scanari (sub‑sectiune) | Mutat din pagina generala |
| Istoric documente | /dashboard/documente | Ramane (renumit conceptual) |
| Overview | /dashboard | Ramane ca overview |
| Sisteme AI | /dashboard/sisteme | Ramane, dar curatat de discovery/baseline/drift |
| Discovery | /dashboard/sisteme (tab nou) | Separare a fluxului de candidate |
| Baseline | /dashboard/setari (sau /dashboard/sisteme tab) | Mutare in Control |
| Drift | /dashboard/alerte | Renumit tab Drift sub Control |
| Remediere | /dashboard/checklists | Ramane |
| Dovezi | /dashboard/rapoarte/auditor-vault (sub-tab) | Expus ca tab dedicat |
| Auditor Vault | /dashboard/rapoarte/auditor-vault | Expus in nav Dovada |
| Audit si export | /dashboard/rapoarte | Curatat de RemediationBoard |
| Setari | /dashboard/setari | Sub‑tabs interne (Membri, Integrari, Operational, Politici) |
| Asistent | /dashboard/asistent | Mutat la utilitare, nu Dovada |

---

## 7) Prioritati de clarificare
1. Scanare: unificare flow + separare Verdicts/Istoric.
2. Control: split clar Discovery vs Inventar vs Drift/Baseline.
3. Dovada: separa Remediere de Audit/Export, expune Auditor Vault in nav.
4. Setari: sub‑tabs interne, scoate baseline din Setari daca devine Control.

---

## Non‑obiective
- Nu introducem piloni noi.
- Nu schimbam modelul de domeniu.
- Nu facem rewrite de UI.

