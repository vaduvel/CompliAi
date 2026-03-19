# Audit CompliScan – Dashboard & Engine (Cursor, 2026‑03‑14)

> Scop: notițe pentru agenții Codex/Cursor care lucrează în paralel pe CompliScan. Nu schimbă codul singur, doar documentează ce există, riscuri, și recomandări de refactor.

## 1. Context și routing

- `app/layout.tsx`
  - Simplu, corect, doar:
    - importă `./globals.css`
    - învelește aplicația în `ThemeProvider` (`next-themes`) + `Toaster` (`sonner`)
    - setează `lang="ro"`, `defaultTheme="dark"`, `enableSystem={false}`.
  - **Efect:** dark mode controlat de aplicație (nu de sistem), bun pentru produs B2B.

- `app/dashboard/layout.tsx`
  - Wrap‑uiește toate sub‑rutele `/dashboard/*` în `components/compliscan/dashboard-shell`.
  - **Consecință:** tot cockpit‑ul rulează într‑un shell unic, ceea ce e corect pentru UX.

- `app/dashboard/page.tsx`
  - Pagina principală de cockpit:
    - `useCockpit()` → fetch + derive pentru:
      - `summary`, `state`, `workspace`, `nextBestAction`, `tasks`, `events`, `activeDrifts`, `openAlerts`, `gdprQuickFixes`, `validatedInvoicesToday`, `efacturaErrorsToday`.
    - `OverviewPageSections` primește tot payload‑ul și randează „pagină de control”.
  - **Observație:** este o pagină `\"use client\"`, deci toată orchestrarea cockpit‑ului e în client (nu SSR la nivel de pagină).

### Recomandări

- Dacă pe viitor avem probleme de TTFB / SEO pe `/dashboard`, putem:
  - muta `buildDashboardPayload` într‑un route handler sau RSC și să dăm jos o parte din logica din `useCockpit`.
  - dar pentru dashboard autentic „app only”, varianta actuală este acceptabilă.

---

## 2. Dashboard shell (UI/UX principal)

- `components/compliscan/dashboard-shell.tsx`
  - Gestionează:
    - **sidebar** sticky (`md+`), cu:
      - `CompliScanLogoLockup` + tagline „control operational pentru documente si sisteme AI”
      - listă nav primară (`dashboardPrimaryNavItems` + `isNavItemActive`)
      - text explicativ în card („Sub‑sectiunile apar ca tabs…”)
    - **header user/org**:
      - fetch la `/api/auth/me` + `/api/auth/memberships` în `useEffect` (client side)
      - derivă inițialele org‑ului pentru avatar text.
      - user‑menu pentru:
        - schimbare organizație (`/api/auth/switch-org`)
        - logout (`/api/auth/logout`)
      - toată interacțiunea are `toast.success/error` cu mesaje clare.
    - **conținut principal**: `{children}` (pagini `/dashboard/*`).
    - **mobile**:
      - `MobileBottomNav` cu secțiuni principale
      - `FloatingAssistant` pentru AI assistant contextual.

### Puncte tari

- Separă responsabilitățile:
  - shell (chrome, nav, user) vs. pagini (conținut).
  - fetch‑urile de auth sunt centralizate aici (nu împrăștiate în fiecare pagină).
- Copy consistent cu poziționarea produsului:
  - accent pe „scanare → recomandare AI → verificare umană”.

### Riscuri / oportunități

- **R1 – Auth fetch only on client**
  - `useEffect` face două `fetch`‑uri (user + memberships) la mount.
  - Dacă sesiunea expiră, totul se rezolvă din cod client (nu SSR).
  - **Consecință:** posibil „flash” de stare necunoscută / fallback pe mobile low‑end.
  - **Propunere fix:**
    - opțiunea A (minimală): extragem un `useCurrentUser()` + `useMemberships()` comun, dar tot client side.
    - opțiunea B (mai solidă): mutăm partea de user + memberships într‑un server component la nivel de `app/dashboard/layout.tsx`:
      - RSC cheamă direct `getOrgContext` / `getCurrentUser` și injectează datele ca props în `DashboardShell`.
      - Shell rămâne tot „client”, dar nu mai face fetch la mount.

- **R2 – User menu state management**
  - `userMenuOpen` este un boolean, nu se închide automat pe route change.
  - Dacă utilizatorul apasă un link din meniu sau navighează altfel, overlay‑ul poate rămâne logic „deschis” (deși nu mai este în DOM).
  - **Propunere:**
    - adăugăm mic efect: `useEffect(() => setUserMenuOpen(false), [pathname])`.

---

## 3. Header de risc și scor (versiunea nouă, „main”)

- `components/compliscan/risk-header.tsx`
  - Funcții pure:
    - `headerState(...)`:
      - determină ring color (`--color-risk-high/medium/low/info`).
      - generează mesaje coerente pentru:
        - onboarding (fără scan): „Nu ai suficiente dovezi…”
        - 0 riscuri active: „Nu exista probleme active…”
        - risc ridicat: „Semnalele colectate indica risc ridicat…”
        - risc mediu: „Ai deja semnale utile…”
        - fallback „control bun”.
      - păstrează accent pe:
        - **scor de risc**, baseline și control,
        - flux „scan → recomandare AI → verificare umană”.
    - `lastScanMeta`, `scoreCaption`:
      - mapări simple, expresive (ex. `score >= 75` → „control bun”).
  - `RiskHeader` primește explicit:
    - `score`, `riskLabel`, `lastScanLabel`, `activeRiskCount`, `hasEvidence`, `workspace`, `onScan`.
    - are fallback workspace local cu Ion Popescu + „Magazin Online S.R.L.”.

### Puncte tari

- **Nu apare nicăieri „100% compliant”**:
  - chiar și la `score === 100` mesajul este „control complet”, nu „compliant 100%”.
- Conținutul text este bine aliniat cu UXul dorit:
  - mereu amintește de „validare umană” la riscuri ridicate / medii.

### Recomandări

- **R3 – Unificare header-uri de risc**
  - Există încă un set vechi de componente demo:
    - `components/dashboard/RiskScoreCircle.tsx`
    - `components/dashboard/DashboardHeader.tsx`
    - plus restul de `components/dashboard/*`.
  - Acestea au fost folosite pentru mock‑ul cu 4 carduri, dar în main cockpit se folosește `RiskHeader`.
  - **Propunere:**
    - clar marcat `components/dashboard/*` ca „deprecated/demo” sau mutat în `legacy/`.
    - toate noile lucrări să folosească doar `RiskHeader` + noul shell.

---

## 4. Engine de compliance & payload de dashboard

- `lib/compliance/engine.ts`
  - Definește `initialComplianceState` cu câmpuri clare pentru:
    - `highRisk`, `lowRisk`, `gdprProgress`.
    - `efacturaConnected`, `efacturaSignalsCount`, `efacturaSyncedAtISO`.
    - `scannedDocuments`, `alerts`, `findings`, `scans`, `aiSystems`, `detectedAISystems`.
    - `driftRecords`, `driftSettings`, `snapshotHistory`, `events`.
  - `normalizeComplianceState(state)`:
    - filtrează findings „informational legacy” (`GEN-001` + „Scanare completă, risc redus”).
    - normalizează:
      - alerts, scans, taskState, overrides, traceabilityReviews,
      - AI systems, detected AI systems, e-Factura validations, drift, snapshots, events.
    - calculează:
      - `highRisk` = findings nerezolvate cu severitate `critical|high`.
      - `lowRisk` = findings nerezolvate `medium|low`.
      - `efacturaSignalsCount` = findings nerezolvate cu `category === "E_FACTURA"`.
      - `gdprProgress` = `clamp(100 - redAlerts*20 - yellowAlerts*8, 0, 100)` dacă există dovezi.
      - sanitizează `efacturaSyncedAtISO` prin `isValidIso`.
  - `computeDashboardSummary(state)`:
    - derivă structura folosită de `useCockpit` (`summary`), cu:
      - agregări de risc,
      - text de status,
      - scoruri pentru EU AI Act, GDPR, e-Factura, etc.

- `lib/server/dashboard-response.ts`
  - `buildDashboardPayload(state: ComplianceState)`:
    - `getOrgContext()` → workspace.
    - `hydrateEvidenceAttachmentsFromSupabase(...)`.
    - `normalizeComplianceState(...)`.
    - `computeDashboardSummary(...)`.
    - `buildRemediationPlan(...)`.
    - `buildCompliScanSnapshot(...)` (fallback dacă `snapshotHistory` e gol).
    - `buildAICompliancePack(...)`, `buildComplianceTraceRecords(...)`.
  - Returnează un obiect bine tipat (`DashboardPayload`) folosit direct în layer-ul UI (via `useCockpit`).

### Puncte tari

- Separație foarte bună între:
  - **stare brută** (ce vine de la storage / Supabase),
  - **normalizare** (curățare, completare, retro‑compatibilitate),
  - **derivare** (score, summary, remediation, traceability).
- Respectă clar principiul:
  - **AI propune scor → om validează → se salvează snapshot / trace**.

### Oportunități

- **R4 – Clarificare naming `highRisk` / `lowRisk`**
  - În engine, `highRisk` și `lowRisk` sunt despre **număr de findings nerezolvate**.
  - În UI, cuvântul „risc” mai apare și în `DashboardSummary` + mesaje.
  - **Sugestie:** în doc-uri interne (nu neapărat cod) să explicăm explicit:
    - `highRisk` = `# de findings active cu severitate high/critical`.
    - `lowRisk` = `# de findings active cu severitate medium/low`.

- **R5 – Defensive defaults pentru e-Factura**
  - Codul normalizează `efacturaSyncedAtISO` și `efacturaConnected`, dar:
    - ar fi util un mic test de property‑based / fixture pentru cazul:
      - `efacturaConnected: true` + `efacturaSyncedAtISO: ""` + `efacturaValidations: []`.
    - doar ca să fim siguri că UI-ul nu afișează „100% validat” când de fapt nu există validări.

---

## 5. Frontend „demo dashboard” (4 carduri) – situația actuală

- Există un set separat de componente:
  - `components/dashboard/*` (ex. `DashboardShell`, `DashboardCards`, `RiskScoreCircle`, `DashboardHeader`, `ActionBar`, `DashboardFooterDisclaimer`, `SidebarNav`).
  - Ele implementează mock‑ul cu:
    - cerc 87% „Risc Mediu”,
    - 4 carduri (EU AI Act Status, e-Factura Integration, GDPR Checklist, Alerte active),
    - butoane „Scan new documents / Generate raport PDF / Chat cu AI Agent”.

### Riscuri

- **R6 – Dublare de shell/UI**
  - Avem două variante de shell:
    - `components/dashboard/DashboardShell` (mock pur).
    - `components/compliscan/dashboard-shell.tsx` (prod).
  - Dacă cineva modifică doar varianta veche, comportamentul în `/dashboard` nu se schimbă, ceea ce poate crea confuzie în echipă.

### Recomandare clară

- Marcare / arhivare:
  - Mutați `components/dashboard/*` într-un folder `legacy/` sau prefix `legacy-dashboard-*.tsx`.
  - Lăsați un mic doc (ex. `public/legacy-demo-dashboard.md`) care explică:
    - că acest UI a fost un spike pentru prezentare,
    - că producția folosește `components/compliscan/*`.

---

## 6. Sugestii de lucru pentru agenți (fără a schimba nimic direct)

1. **Unificare UI cockpit**
   - [ ] Decideți oficial că `components/compliscan/*` este „sursa unică de adevăr”.
   - [ ] Marcați `components/dashboard/*` ca legacy și opriți noile modificări acolo.

2. **Îmbunătățire auth/session în shell**
   - [ ] Evaluați mutarea informațiilor de user + memberships în RSC la nivelul `app/dashboard/layout.tsx` (sau hook server-side).
   - [ ] Adăugați `useEffect(() => setUserMenuOpen(false), [pathname])` în `dashboard-shell` pentru UX curat la schimbarea rutei.

3. **Testare suplimentară pentru engine**
   - [ ] Adăugați teste dedicate edge‑caselor e-Factura (conectat dar fără date, date vechi, mix severități).
   - [ ] Documentați clar în `public/` cum se calculează `gdprProgress`, `highRisk`, `lowRisk`, pentru a putea explica clienților ce înseamnă scorul.

4. **Documentație UI/UX**
   - [ ] Creați un `docs/ui/compliscan-dashboard.md` (sau similar) care să descrie:
     - flow: `buildDashboardPayload` → `useCockpit` → `OverviewPageSections` → componente Compliscan.
     - cui aparțin textele critice (recomandări AI, disclaimere, copy în română).

5. **Verificare finală „poziționare produs”**
   - [ ] Căutați explicit în cod după stringuri precum „100% compliant”, „fully compliant”.
   - [ ] Păstrați limbajul actual:
     - „scor de risc”, „control”, „recomandare AI”, „verificare umană”, „dovadă”,
     - fără promisiuni de conformitate absolută.

---

## 7. Hartă completă a zonelor „risk” în cod

> Referință rapidă pentru toți agenții: unde apare conceptul de risc și cum este folosit. Lista este grupată pe categorii, **nu înseamnă că toate trebuie modificate**, dar ajută la căutări ulterioare.

### 7.1. Documentație & registru de risc (`public/`)

- `public/risk-register-operational.md` – registru de risc operațional (runbooks, incidente).
- `public/risk-register-brutal.md` – listă brută/expandată de riscuri.
- `public/raport-maturitate-compliscan.md` – descrie nivelurile de maturitate, inclusiv unghiul de risc.
- `public/status-arhitectura.md`, `public/ghid-engineering-compliscan.md`, `public/roadmap-compliscan.md` – fac referire la „risk gates”, „drift” și calitatea controalelor.
- `public/compliscan-evidence-os-ds-spec.md`, `public/evidence-os-oficializare-si-adoptie.md`, `public/evidence-quality-spec.md` – specificații pentru cum măsoară produsul risc și calitatea dovezilor.

### 7.2. UI – componente de risc (vizuale)

- `components/compliscan/risk-header.tsx` – **header principal de risc** (scor, label, mesaje de coaching, CTA).
- `components/evidence-os/RiskClassBadge.tsx` – badge pentru clasa de risc a unui finding / sistem.
- `components/dashboard/RiskScoreCircle.tsx` + `components/dashboard/DashboardCards.tsx` – varianta demo (mock) cu cerc 87% și carduri EU AI Act / e-Factura / GDPR / Alerte.
- `components/compliscan/ai-inventory-panel.tsx`, `components/compliscan/ai-discovery-panel.tsx` – afișează inventarul de sisteme AI și nivelurile lor de risc.
- `components/compliscan/next-best-action.tsx`, `components/compliscan/remediation-board.tsx`, `components/compliscan/ai-compliance-pack-card.tsx` – UI pentru „următoarea acțiune” și pachetele de conformitate / risc.
- `components/compliscan/route-sections.tsx`, `components/compliscan/floating-assistant.tsx` – fac referire la riscuri și recomandări în copy‑ul de asistent.

### 7.3. Engine de compliance & tipuri de risc (`lib/compliance/*`)

- `lib/compliance/engine.ts` – sursa principală pentru:
  - câmpuri `highRisk`, `lowRisk`, `gdprProgress`, `efacturaSignalsCount` etc.
  - `computeDashboardSummary(state)` care produce scorurile și etichetele de risc.
- `lib/compliance/types.ts` – definește tipuri precum:
  - `DashboardSummary`, `ComplianceAlert`, `Severity`, `RiskClass`, `ComplianceState`.
- `lib/compliance/rule-library.ts` – reguli de detectare a riscurilor (mapare între reguli, severități, categorii).
- `lib/compliance/finding-confidence.ts`, `lib/compliance/evidence-quality.ts` – calculează încrederea și calitatea dovezilor, care influențează scorul de risc.
- `lib/compliance/drift-policy.ts`, `lib/compliance/drift-lifecycle.ts`, `lib/compliance/events.ts` – tratează „drift” de risc în timp (schimbări ale controalelor / documentelor).
- `lib/compliance/ai-inventory.ts`, `lib/compliance/ai-compliance-pack.ts` – inventar de sisteme AI + pachete de controale și riscuri asociate.
- `lib/compliance/remediation.ts`, `lib/compliance/remediation-recipes.ts` – cum se închid riscurile și cum se construiesc planurile de remediere.

### 7.4. Layer server – payloaduri și exporturi de risc (`lib/server/*`)

- `lib/server/dashboard-response.ts` – construiește payloadul folosit de cockpit (scoruri, plan de remediere, traceability).
- `lib/server/compliscan-export.ts` – generează snapshoturi exportabile (inclusiv starea de risc).
- `lib/server/ai-compliance-pack.ts` – traduce starea în pachete AI compliance (inclusiv riscuri agregate).
- `lib/server/scan-workflow.ts`, `lib/server/detected-ai-systems.ts` – fluxurile de scanare și detecția sistemelor AI care intră în calculul de risc.
- `lib/server/manifest-autodiscovery.ts`, `lib/server/compliscan-yaml.ts` – autodetectare configurații / manifest care pot influența ce sisteme sunt considerate în perimetru de risc.

### 7.5. API & rute legate de risc (`app/api/*`, `app/dashboard/*`)

- `app/api/ai-systems/route.ts`, `app/api/ai-systems/detected/[id]/route.ts` – API pentru sisteme AI detectate (expuse în UI ca inventar de risc).
- `app/api/compliance-pack/fields/route.ts` – API pentru câmpuri de pachet de conformitate (inclusiv severity/risk).
- `app/api/reports/route.ts`, `app/api/chat/route.ts`, `app/api/agent/commit/route.ts` – endpointuri care pot genera / consuma rapoarte de risc sau sumarizări AI.
- `app/dashboard/scanari/page.tsx`, `app/dashboard/checklists/page.tsx`, `app/dashboard/alerte/page.tsx`, `app/dashboard/sisteme/page.tsx`, `app/dashboard/rapoarte/auditor-vault/page.tsx` – pagini care afișează liste de riscuri, alerte și rapoarte.

### 7.6. Observație de poziționare (verificare „100% compliant”)

- Căutarea pe tot repo‑ul (`rg "100% compliant"`, `rg "fully compliant"`) nu a găsit stringuri de genul acesta.
- Formulările curente folosesc:
  - „scor de risc”, „control bun/partial”, „risc ridicat/mediu/scăzut”,
  - „recomandare AI”, „validare umană”, „dovadă exportabilă”.
- Asta este aliniat cu cerința de a **nu promite 100% conformitate**, ci de a prezenta un scor și o recomandare ce necesită verificare umană.

_Acest fișier a fost generat automat în cursul auditului din Cursor, pentru a ajuta agenții care lucrează în paralel pe CompliScan să aibă un tablou clar al stării curente a dashboard‑ului, engine‑ului de compliance și tuturor zonelor care manipulează noțiuni de risc._ 

