# UI Audit Backlog

Data: 2026-03-14

Scop:

- să reducem densitatea inutilă
- să eliminăm copy-ul repetitiv
- să corectăm mixed language UI
- să întărim ierarhia vizuală și operațională
- să prevenim overflow și CTA noise

Principiu:

- nu tăiem informație utilă doar pentru aer
- compactăm doar unde claritatea și viteza de operare cresc
- păstrăm explicația acolo unde utilizatorul ia o decizie reală

## Actualizare 2026-03-14 - UX Wave 1 page system foundation

Închis local în acest lot, strict pe suprafața permisă `Evidence OS`:

- `9. Canonizare de page recipes`
  - închis în stratul canonic pentru:
    - `page intro`
    - `summary strip`
    - `action cluster`
    - `handoff`
    - `section boundary`
  - închis prin:
    - `components/evidence-os/PageIntro.tsx`
    - `components/evidence-os/SummaryStrip.tsx`
    - `components/evidence-os/ActionCluster.tsx`
    - `components/evidence-os/HandoffCard.tsx`
    - `components/evidence-os/SectionBoundary.tsx`
    - `components/evidence-os/SectionDividerCard.tsx`
    - `components/evidence-os/ScanFlowOverviewCard.tsx`
  - rezultat:
    - `Evidence OS` poate descrie și impune compoziție de pagină, nu doar primitive
    - `SectionDividerCard` nu mai este un shell izolat, ci un alias peste recipe-ul canonic de boundary
    - `ScanFlowOverviewCard` folosește acum un recipe generic de summary strip
- documentare de sistem
  - închis în:
    - `public/evidence-os-design-system-v1.md`
    - `public/legacy-dashboard-ui-map-2026-03-14.md`
  - rezultat:
    - DS-ul include reguli explicite de page composition
    - `components/dashboard/*` este marcat clar drept legacy/demo și exclus din baza canonică pentru lucrări noi

Rămas deschis intenționat pentru Codex principal:

- adoptarea recipe-urilor noi în:
  - `components/compliscan/route-sections.tsx`
  - `app/dashboard/page.tsx`
  - `app/dashboard/scanari/page.tsx`
  - `app/dashboard/sisteme/page.tsx`
  - `app/dashboard/rapoarte/*`
  - `app/dashboard/setari/page.tsx`
- demontarea efectivă a shell-urilor și cardurilor redundant-introductive din paginile mari
- izolarea fizică sau eliminarea finală a `components/dashboard/*` din repo

## Actualizare 2026-03-14 - lot safe polish

Închis în acest lot, pe suprafața permisă:

- `3. Compactare TaskCard`
  - închis prin:
    - `components/compliscan/task-card.tsx`
    - `components/compliscan/remediation-board.tsx`
    - `components/compliscan/next-best-action.tsx`
  - rezultat:
    - rezumat principal mai clar
    - `fixPreview` afișat doar când aduce semnal nou
    - CTA principal separat de dovadă și export
    - badge noise redus
- `6. Ierarhie clară pentru exporturi`
  - închis în:
    - `components/compliscan/export-center.tsx`
  - rezultat:
    - raportul principal este izolat vizual
    - exporturile de audit și cele tehnice sunt separate
    - label-urile sunt mai scurte
- `7. Overflow și wrapping`
  - închis pe suprafața permisă în:
    - `components/compliscan/floating-assistant.tsx`
    - `app/dashboard/asistent/page.tsx`
    - `components/evidence-os/EmptyState.tsx`
    - `components/evidence-os/ProposalBundlePanel.tsx`
    - `components/evidence-os/SourceContextPanel.tsx`
    - `components/evidence-os/SourceEnvelopeCard.tsx`
  - rezultat:
    - numele lungi și textele reale împing mai greu layout-ul
    - panoul flotant are limite mai sigure pe viewport-uri mici
    - focus ring-ul minim este explicit pe butonul flotant
- `8. Curățare CTA labels`
  - închis pe suprafața permisă în:
    - `components/compliscan/task-card.tsx`
    - `components/compliscan/next-best-action.tsx`
    - `components/compliscan/export-center.tsx`
    - `app/dashboard/asistent/page.tsx`

Parțial închis:

- `9. Canonizare de page recipes`
  - închis local pentru:
    - `dense operational list`
    - `summary + actions`
    - `empty state`
  - rămas deschis pentru `route-sections.tsx`, fiind în afara lotului curent permis

Rămas intenționat neatins pentru Codex principal:

- `1. Compactare Overview`
- `2. Compactare Drift în Overview și Alerte`
- orice punct care cere atingerea:
  - `app/dashboard/alerte/page.tsx`
  - `app/dashboard/rapoarte/*`
  - `app/dashboard/setari/*`
  - `components/compliscan/route-sections.tsx`
  - `components/compliscan/logo.tsx`

## Actualizare 2026-03-14 - lot Agent Workspace convergence

Închis în acest lot, pe suprafața permisă:

- convergență layout pentru `Agent Workspace`
  - închis în:
    - `lib/compliance/agent-workspace.tsx`
    - `components/evidence-os/AgentReviewLayout.tsx`
    - `components/evidence-os/ProposalColumnShell.tsx`
    - `components/evidence-os/AgentStartStateCard.tsx`
  - rezultat:
    - coloanele au raport mai stabil pe desktop
    - shell-urile au min-height și overflow safety mai bune
    - start state-ul comunică mai clar sursa și ieșirea așteptată
- tabs și review decision
  - închis în:
    - `components/evidence-os/AgentProposalTabs.tsx`
    - `components/evidence-os/ReviewDecisionPanel.tsx`
  - rezultat:
    - review-ul vede mai clar ce rămâne după respingeri
    - secțiunile au label-uri și count-uri mai executabile
    - CTA-ul principal rămâne confirmarea, iar contextul pentru acțiune este mai clar
- convergență pe cardurile canonice
  - închis în:
    - `components/evidence-os/IntakeSystemCard.tsx`
    - `components/evidence-os/FindingProposalCard.tsx`
    - `components/evidence-os/DriftProposalCard.tsx`
  - rezultat:
    - ierarhie mai apropiată între titlu, metadata, rationale și remediere
    - overflow safety mai bun pe nume, referințe și diff-uri JSON
    - mai puține pattern-uri locale divergente

Verificat și lăsat intenționat neschimbat:

- `components/compliscan/agent-workspace.tsx`
  - rămâne re-export subțire și nu cere lot nou de UI

Rămas deschis intenționat:

- micro-polish în:
  - `components/evidence-os/ProposalBundlePanel.tsx`
  - `components/evidence-os/CommitSummaryCard.tsx`
  - `components/evidence-os/HumanReviewPanel.tsx`
  deoarece sunt în afara listei permise pentru acest lot
- orice extindere în:
  - `app/dashboard/*`
  - `components/compliscan/navigation.ts`
  - `components/compliscan/route-sections.tsx`
  - `components/compliscan/use-cockpit.tsx`
  - `app/api/*`
  - `lib/server/*`
- warning-ul de build pe `/dashboard/rapoarte` legat de `SUPABASE_ORG_STATE_REQUIRED`
  - observat la `npm run build`
  - în afara lotului curent permis

## Actualizare 2026-03-16 - Canonizare recipes (partial)

Închis în acest lot:

- rețete canonice introduse pentru:
- `guide card` prin `components/evidence-os/GuideCard.tsx`
  - `metrics row` prin `components/evidence-os/MetricTile.tsx`
- `dense operational list` prin `components/evidence-os/DenseListItem.tsx`
- adoptate deja în:
  - `Auditor Vault` (indicatori detaliați + quick actions)
  - `DriftCommandCenter` + `Alerte`
  - `Scanare` (tab-uri)
  - `Control / Sisteme` (drift recent)
  - `Asistent` (flux canonic)
- `summary + actions` prin `ActionCluster`:
  - `Alerte` (drift actions)
  - `Auditor Vault` (export)
  - `DriftCommandCenter` (quick actions)
  - `Control / Sisteme` (handoff + confirmare)
  - `Setari` (baseline actions)

Rămas deschis:

- rețeta `summary + actions` pentru alte zone cu CTA multiple

## Val 1 - Ierarhie și compactare

### 1. Compactare `Overview`

Suprafață:

- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`

Problema:

- hero-ul ocupă prea mult spațiu
- există prea multe carduri introductive înainte de acțiune
- utilizatorul ajunge greu la workflow-ul real

Schimbare propusă:

- reducem înălțimea hero-ului
- păstrăm scorul, statusul și un singur mesaj principal
- mutăm explicațiile secundare în zone colapsabile sau în tooltips/copy scurt
- transformăm `DashboardGuideCard` într-un bloc mai compact de navigare

Rezultat urmărit:

- `Overview` devine tablou de comandă, nu landing page explicativ

### 2. Compactare `Drift` în `Overview` și `Alerte`

Suprafață:

- `components/compliscan/route-sections.tsx`
- `app/dashboard/alerte/page.tsx`

Problema:

- fiecare drift consumă prea mult spațiu vertical
- cardurile repetă aceeași structură explicativă

Schimbare propusă:

- definim un `drift summary row` compact pentru listare
- păstrăm versiunea detaliată doar pentru item-ul activ sau expandat
- mutăm `De ce contează / Ce faci acum / Dovadă / Escalare` în format progressive disclosure

Rezultat urmărit:

- scanare rapidă a listei de drift fără să pierdem profunzimea

### 3. Compactare `TaskCard`

Suprafață:

- `components/compliscan/task-card.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/next-best-action.tsx`

Problema:

- `summary` și `fixPreview` apar de mai multe ori
- cardul are prea multe secțiuni cu greutate egală
- zona de acțiuni este prea lată și greu de scanat

Schimbare propusă:

- păstrăm un singur rezumat principal
- mutăm detaliile tehnice în secțiuni secundare mai compacte
- grupăm CTA-urile în:
  - acțiune principală
  - dovadă
  - export
- reducem numărul de badge-uri afișate simultan

Rezultat urmărit:

- task-urile devin mai ușor de executat și mai puțin obositoare vizual

## Val 2 - Copy și limbă unică

### 4. Curățare mixed language

Suprafață:

- `components/compliscan/task-card.tsx`
- `app/dashboard/setari/page.tsx`
- `components/compliscan/export-center.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`
- alte carduri care încă folosesc etichete EN

Problema:

- UI-ul amestecă română și engleză
- unele label-uri sunt tehnice intern, nu user-facing

Schimbare propusă:

- stabilim romanian-first complet pentru suprafața vizibilă
- păstrăm engleza doar în termeni tehnici inevitabili sau nume de artefact
- uniformizăm statusuri:
  - `needs review`
  - `validated`
  - `open`
  - `done`
  - `Operational ready`
  - `Needs review`

Rezultat urmărit:

- produsul pare coerent și matur, nu “lipit” din fire diferite

### 5. Eliminare copy repetitiv pentru `baseline / snapshot / drift / verificare umană`

Suprafață:

- `components/compliscan/route-sections.tsx`
- `app/dashboard/scanari/page.tsx`
- `app/dashboard/alerte/page.tsx`
- `app/dashboard/setari/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`

Problema:

- aceleași explicații apar în multe locuri
- spațiul este consumat fără creștere reală de claritate

Schimbare propusă:

- definim o singură formulare canonică per concept
- în paginile secundare folosim doar versiune scurtă contextuală
- evităm să re-explicăm conceptul dacă pagina este deja în acel context

Rezultat urmărit:

- mai puțin zgomot, mai mult focus pe acțiunea curentă

## Val 3 - CTA hierarchy și overflow safety

### 6. Ierarhie clară pentru exporturi

Suprafață:

- `components/compliscan/export-center.tsx`
- `app/dashboard/rapoarte/page.tsx`
- `app/dashboard/rapoarte/auditor-vault/page.tsx`

Problema:

- prea multe acțiuni par la fel de importante
- label-urile sunt lungi și greu de parcurs

Schimbare propusă:

- definim:
  - export principal
  - exporturi secundare
  - exporturi tehnice
- grupăm acțiunile în secțiuni sau meniu contextual
- scurtăm label-urile fără pierdere de sens

Rezultat urmărit:

- utilizatorul știe imediat ce export trebuie să folosească

### 7. Overflow și wrapping

Suprafață:

- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/logo.tsx`
- `components/compliscan/task-card.tsx`
- pagini și carduri cu nume lungi de snapshot, fișiere, surse sau legi

Problema:

- texte lungi pot împinge layout-ul
- panoul flotant al asistentului are lățimi fixe
- subtitlurile și badge-urile pot deveni fragile pe mobil

Schimbare propusă:

- introducem reguli clare de wrapping și truncation
- definim breakpoints și max-width pentru panouri flotante
- protejăm zonele cu fișiere, snapshot ids, law refs și message content

Rezultat urmărit:

- mai puține rupturi vizuale pe mobil și pe conținut real

### 8. Curățare CTA labels

Suprafață:

- `components/compliscan/task-card.tsx`
- `app/dashboard/alerte/page.tsx`
- `components/compliscan/next-best-action.tsx`

Problema:

- butoane prea multe
- unele label-uri sunt prea lungi sau tehnice
- unele CTA-uri spun aproape același lucru în contexte diferite

Schimbare propusă:

- scurtăm label-urile
- definim verb + obiect clar
- limităm la un CTA primar și maximum 2 secundare per card

Rezultat urmărit:

- mai puțină fricțiune și mai puțină competiție vizuală între acțiuni

## Val 4 - Claritate de sistem

### 9. Canonizare de page recipes

Suprafață:

- `components/compliscan/route-sections.tsx`
- `components/evidence-os/*`

Problema:

- avem token-uri și componente, dar nu avem suficientă disciplină la nivel de compoziție de pagină

Schimbare propusă:

- definim rețete canonice pentru:
  - page header
  - metrics row
  - guide card
  - summary + actions
  - dense operational list
  - empty state

Rezultat urmărit:

- DS-ul controlează nu doar look-ul, ci și claritatea structurală

Status curent:

- `DenseListItem` adoptat in `RecentScansCard`, `AlertsList`, `LatestDocumentSection` (findings + tasks)

### 10. Reguli de densitate și copy

Suprafață:

- transversal

Problema:

- componentele și paginile au fost bune local, dar fără limită clară de densitate

Schimbare propusă:

- reguli simple:
  - maxim 1 mesaj principal per hero
  - maxim 3 CTA-uri per card
  - nu duplicăm același concept explicativ pe aceeași pagină
  - explicăm conceptele o dată, apoi doar contextual
  - badge-urile nu înlocuiesc structura

Rezultat urmărit:

- produsul devine predictibil, mai scurt și mai ușor de operat

## Ordine recomandată

1. `Overview` + `TaskCard`
2. `Alerte`
3. `Export / Auditor Vault`
4. `Setari`
5. `Floating Assistant`
6. canonizarea rețetelor de pagină

## Definiție de done pentru cleanup-ul UI

- fără texte care ies din carduri sau panouri
- fără mixed language user-facing neintenționat
- fără explicații duplicate în aceeași pagină
- CTA primar clar pe fiecare suprafață
- spacing consistent între secțiuni similare
- ierarhie clară: sumar -> acțiune -> detaliu
