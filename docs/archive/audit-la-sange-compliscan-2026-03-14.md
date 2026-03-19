# CompliScan – Audit la sânge (2026‑03‑14, Cursor read‑only)

> Scop: descriere onestă a punctelor tari și a zonelor de risc tehnic/UX, fără a atinge nucleul de business sau engine-ul. Este un document de referință pentru decizii, nu pentru blame.

## 1. Puncte foarte solide (de evitat schimbări brute)

- **Model de domeniu pentru compliance**
  - `lib/compliance/types.ts` definește tipuri bogate: `ComplianceState`, `ScanFinding`, `AISystemRecord`, `ComplianceDriftRecord`, `TaskEvidenceAttachment`, `EvidenceQualityAssessment`, `DashboardSummary` etc.
  - Tipurile fac explicită legătura: *finding → task → evidence → drift → control/pack*.
  - Nu există shortcut-uri periculoase de genul „any peste tot” – codul de domeniu folosește tipuri clare, cu enumuri restrânse pentru severitate, scopuri AI, stări de task, calitate a dovezii.

- **Engine de normalizare și scoring**
  - `lib/compliance/engine.ts` tratează corect:
    - filtrarea findings „informational legacy”,
    - calculul `highRisk`, `lowRisk`, `gdprProgress`, `efacturaSignalsCount`,
    - validarea `efacturaSyncedAtISO` și a snapshot‑urilor baseline.
  - `lib/server/dashboard-response.ts` construiește un payload complet, cu:
    - `state` normalizat,
    - `summary`,
    - `remediationPlan`,
    - `compliancePack`,
    - `traceabilityMatrix`,
    - `workspace`.
  - Fluxul „scanare → verdict → remediere → dovadă → audit pack” este consistent și bine trasat.

- **Evidence OS ca design system oficial**
  - Confirmat în `public/audit-final-evidence-os-2026-03-14.md`:
    - Val 1–3 declarate închise,
    - `components/evidence-os/*` canonice,
    - `app/evidence-os.css` sursă principală de tokens,
    - cockpitul Compliscan consumă în mod real primitivele DS‑ului.
  - `RiskHeader`, `route-sections`, `task-card`, `remediation-board`, `export-center` etc. folosesc în mod corect aceste primitive.

- **Arhitectură de audit și traceability**
  - `lib/server/compliance-trace.ts`, `lib/server/audit-pack.ts`, `lib/server/audit-pack-client.ts`, `lib/server/compliscan-export.ts` sunt bine aliniate:
    - există `auditDecision`, `bundleCoverageStatus`, `traceabilityMatrix`,
    - exporturile (client PDF/JSON/ZIP) sunt centralizate.
  - `app/dashboard/rapoarte/auditor-vault/page.tsx` construiește o vedere audit‑ready clară, nu doar un log de evenimente.

**Concluzie:** nucleul de business, engine‑ul și DS‑ul sunt **puternice și coerente**. Orice rewrite agresiv aici ar fi o greșeală strategică.

## 2. Zone de greutate / risc tehnic identificate

### 2.1. Hook client monolitic – `components/compliscan/use-cockpit.ts`

- ~1600 de linii, `"use client"`, 20+ fetch‑uri:
  - `/api/dashboard`
  - `/api/scan/*`
  - `/api/tasks/*`
  - `/api/evidence/*`
  - `/api/ai-systems/*`
  - `/api/efactura/*`
  - etc.
- Responsabilități amestecate:
  - încărcare dashboard,
  - mutații pe tasks, alerts, drifts,
  - extragere OCR, analiză documente,
  - orchestrare exporturi, traceability, AI systems, efactura, baseline.
- Impact:
  - chunk JS foarte mare pentru orice pagină care îl folosește,
  - rerendering extins la orice mică actualizare,
  - debugging dificil și risc mare la schimbări viitoare.

### 2.2. Paginile gigantice din `/dashboard/*`

- Exemple:
  - `app/dashboard/scanari/page.tsx` – ~800 linii, combină:
    - UI pentru 4 surse (document, text, manifest, yaml),
    - work queue pentru candidate AI,
    - agent workflow,
    - rezumat ultima scanare,
    - drifts pentru manifest/yaml,
    - integrare cu `useCockpit` + `useAgentFlow`.
  - `app/dashboard/setari/page.tsx` – ~1200 linii:
    - repo sync, supabase health, release readiness, drift policy overrides, members admin, etc.
  - `app/dashboard/rapoarte/auditor-vault/page.tsx` – ~1700 linii:
    - snapshot/baseline, drift watch, ledger de evidențe, legal matrix, traceability matrix, exporturi.
- Impact:
  - deși fiecare pagină este logică ca „hub”, mărimea actuală le face greu de întreținut,
  - orice schimbare aparent mică riscă să afecteze multe zone simultan,
  - re-randarea și analiza statică sunt îngreunate.

### 2.3. Pattern de full‑page loading repetat

- Pattern comun (ex. `scanari`, `setari`, `auditor-vault`):

  ```tsx
  const cockpit = useCockpit()
  if (cockpit.loading || !cockpit.data) return <LoadingScreen />
  ```

- Consecințe:
  - fiecare intrare în pagină = fetch nou + ecran de încărcare full,
  - percepția utilizatorului: aplicația este „grea” și „se tot încarcă”,
  - pierdem avantajul App Router (layout persistent, streaming pe secțiuni).

### 2.4. Fetch suplimentar în shell și Setări

- `components/compliscan/dashboard-shell.tsx`:
  - dacă cockpit aduce deja `workspace`, shell-ul mai face:
    - `/api/auth/me`,
    - `/api/auth/memberships`.
- `app/dashboard/setari/page.tsx`:
  - adaugă multe fetch‑uri paralele la mount:
    - `/api/integrations/repo-sync/status`,
    - `/api/integrations/supabase/status`,
    - `/api/health`,
    - `/api/release-readiness`,
    - plus ce vine deja prin `useCockpit`.
- Consecință:
  - cascade de request‑uri la intrare în cockpit / Setări,
  - jitter vizibil pe conexiuni mai slabe.

### 2.5. Dublură UI demo vs. UI producție

- UI demo:
  - `components/dashboard/*` + vechiul `RiskScoreCircle`, 4 carduri fixed.
- UI producție:
  - `components/compliscan/*` + `Evidence OS`.
- Riscul nu este tehnic direct, ci de **coordonare echipă**:
  - cine nu cunoaște contextul poate modifica UI-ul vechi crezând că schimbă cockpitul, sau invers.

## 3. Zone de risc conceptual (dar bine controlate)

> Aici sunt lucruri sensibile ca temă (risk, audit, legal), nu bug-uri actuale, dar care cer atenție continuă.

- **Scoruri de risc și clasificări**
  - `ScanFinding.risk: "high" | "low"` coexistă cu `severity: ComplianceSeverity`.
  - `AISystemRiskLevel = "minimal" | "limited" | "high"`.
  - `ComplianceDriftSeverity` reuse `ComplianceSeverity`.
  - **Observație:** mapping‑ul dintre aceste noțiuni există, dar trebuie păstrat sincron în timp (mai ales dacă EU AI Act mai schimbă categorizări).

- **e-Factura ca „wedge” local**
  - `EFacturaValidationRecord`, `efacturaSignalsCount`, fluxuri în dashboard și în engine.
  - Documentele din `public/` sunt clare că nu vrem să pivotăm întreg produsul pe e‑Factura, dar codul suportă scenarii destul de avansate.
  - Important ca backlog‑ul să păstreze e-Factura drept *feature local* și nu să umfle UI principal în jurul lui.

- **Control vs. conformitate**
  - Codul folosește în mod corect limbaj de tip:
    - „control complet / bun / parțial / minim”,
    - „scor curent de risc”,
    - „drift activ”,
  - și NU promite „compliant 100%”.
  - Este totuși important ca orice nouă contribuție să respecte aceeași linie (verificare periodică cu `rg "compliant"` e sănătoasă).

## 4. Recomandări „la sânge”, dar fără a atinge engine‑ul

> Toate recomandările de mai jos sunt safe pentru nucleu: ating *orchestrare, structură și UX*, nu logica de scoring sau modelul de date.

1. **Fragmentarea `useCockpit` în 3–5 hook‑uri tematice**
   - ex. `useDashboardState`, `useScanWorkflow`, `useTasksAndEvidence`, `useDriftAndBaseline`, `useEfacturaPanel`.
   - fiecare pagină importă doar ce are nevoie.

2. **Segmentarea `/api/dashboard` pe capabilități**
   - păstrați `buildDashboardPayload` ca orchestrator intern,
   - dar expuneți:
     - rute / selectori mai înguste pentru paginile care nu au nevoie de tot (ex. `GET /api/dashboard/auditor-vault`),
     - sau faceți derivarea (summary, compliancePack, traceability) pe server, nu în client.

3. **Refactor incremental al paginilor mari**
   - pentru `Setari`, `Scanari`, `Auditor Vault`:
     - introduceți sub‑componente container (ex. `SettingsReleaseReadinessCard`, `ScanDocumentSection`, `AuditEvidenceLedger`),
     - extrageți logica lor în hook‑uri mici,
     - folosiți `Suspense` + `loading.tsx` local, nu doar full‑page.

4. **Consolidare shell + bootstrap de user/org**
   - mutați logica de user + memberships în `app/dashboard/layout.tsx` (server-side),
   - injectați datele ca props în `DashboardShell`,
   - păstrați `DashboardShell` ca „pur UI” + foarte puțină orchestrare.

5. **Curățare UI demo vs. producție**
   - mutați `components/dashboard/*` în `legacy/` sau eliminați din build,
   - lăsați un mic README pentru ca nimeni să nu mai confunde cockpitul real cu demo-ul.

6. **Audit recurent al limbajului de risc**
   - la fiecare iterație majoră:
     - rulați căutări pentru „compliant”, „100%”, „garantat”,
     - confirmați că rămânem la „scor de risc / recomandare AI / verificare umană / dovadă”.

## 5. Cum să folosească alți agenți acest audit

- Pentru orice task nou, întrebați‑vă:
  1. Îi atinge logica de domeniu sau engine‑ul de scoring?  
     - Dacă da, verificați mai întâi `lib/compliance/types.ts`, `engine.ts`, `dashboard-response.ts` și doc‑urile din `public/` (`raport-maturitate`, `roadmap`, `audit-final-evidence-os`).
  2. Poate fi rezolvat prin:
     - structurare mai bună a UI,
     - split de hook,
     - payload mai îngust,
     - fără a schimba modul în care definim risc și dovadă?
  3. Dacă da, urmați recomandările din acest fișier înainte de a propune rewrites mari.

_Acest audit a fost făcut în regim read‑only, fără a modifica engine‑ul sau modelul de business. Orice schimbare inspirată de aici ar trebui implementată incremental și validată cu testele existente (`npm test`, `npm run lint`, `npm run build`)._

