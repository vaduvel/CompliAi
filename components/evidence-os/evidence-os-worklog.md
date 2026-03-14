# Evidence OS Worklog

Data start log: 2026-03-13

## Scop

Acest fișier ține jurnalul local pentru integrarea UI a `Evidence OS` pe baza documentului:

- `public/evidence-os-design-system-v1.md`

Logul este ținut separat de documentele de sprint ca să nu interfereze cu firul paralel de lucru pe `Sprint 6 - Audit defensibility`.

## Guardrails active

- Se modifică doar:
  - `app/evidence-os.css`
  - `app/globals.css` pentru import izolat
  - `components/evidence-os/*`
- plus adaptoarele runtime permise explicit de delegația Codex:
  - `lib/compliance/agent-workspace.tsx`
  - `lib/compliance/IntakeSystemCard.tsx`
  - `lib/compliance/FindingProposalCard.tsx`
  - `lib/compliance/DriftProposalCard.tsx`
  - `components/compliscan/agent-workspace.tsx`
- Nu se atinge:
  - `app/api/*`
  - `lib/server/*`
  - alte zone `lib/compliance/*` din afara adaptoarelor permise
  - paginile principale din dashboard
  - documentele oficiale de sprint / status

## Intrări log

### 2026-03-13 1

Am stabilit sursa unică de design pentru acest fir:

- `public/evidence-os-design-system-v1.md`

Concluzie:

- nu se mai folosește varianta introdusă anterior de Gemini ca referință de design
- `Evidence OS v1` devine baza pentru token-uri, semantici, badge-uri, carduri, tabs și limbaj UI

### 2026-03-13 2

Am creat layer-ul CSS izolat:

- `app/evidence-os.css`

Conținut introdus:

- token-uri `eos-*` pentru suprafețe, border, text, accent, status, spacing, radius, shadow și motion
- mapare dark/light fără rescrierea temei globale a cockpit-ului principal
- namespace separat pentru a evita coliziuni vizuale

### 2026-03-13 3

Am conectat layer-ul nou în:

- `app/globals.css`

Schimbare:

- import izolat pentru `evidence-os.css`

### 2026-03-13 4

Am refăcut primitivele de bază din `Evidence OS` după design system:

- `components/evidence-os/Badge.tsx`
- `components/evidence-os/Button.tsx`
- `components/evidence-os/Card.tsx`
- `components/evidence-os/Tabs.tsx`

Obiectiv:

- aceleași token-uri și aceeași semnatică vizuală pe toate suprafețele `Evidence OS`

### 2026-03-13 5

Am adus în DS componentele compuse:

- `components/evidence-os/ReviewPolicyCard.tsx`
- `components/evidence-os/HumanReviewPanel.tsx`
- `components/evidence-os/ProposalCard.tsx`
- `components/evidence-os/ProposalBundlePanel.tsx`
- `components/evidence-os/CommitSummaryCard.tsx`
- `components/evidence-os/AgentRunBadge.tsx`
- `components/evidence-os/SourceEnvelopeCard.tsx`

Direcții urmărite:

- dark-first
- contrast mai puternic
- badge-uri semantice
- UI română-first
- consistență între panouri și carduri

### 2026-03-13 6

Am populat componentele canonice goale din zona permisă:

- `components/evidence-os/IntakeSystemCard.tsx`
- `components/evidence-os/FindingProposalCard.tsx`
- `components/evidence-os/DriftProposalCard.tsx`

Ce afișează acum:

- confidence
- severitate / risc sugerat
- semnale sursă
- rationale
- remediere propusă
- diferențe înainte / după pentru drift

### 2026-03-13 7

Am curățat interferențele cu runtime-ul:

- au fost eliminate modificările rămase accidental în `lib/compliance/*`

Rezultat:

- diff-ul activ pentru acest fir rămâne doar în zona permisă pentru `Evidence OS`

### 2026-03-13 8

Am făcut încă un batch de polish vizual în componentele `Evidence OS`.

Ajustări:

- labels tabs mai aproape de vocabularul produsului
- `sourceType` mapat în etichete UI mai clare
- `HumanReviewPanel` aliniat mai bine cu limbajul de audit
- `AgentRunBadge` și `CommitSummaryCard` aduse mai aproape de semantica statusurilor din DS
- risc sugerat în `IntakeSystemCard` diferențiat mai corect pe `minimal`, `limited`, `high`

### 2026-03-13 9

Validare rulată:

- `npm run lint`

Rezultat:

- fără warnings
- fără errors

### 2026-03-13 10

Am rulat auditul de aliniere între:

- `public/evidence-os-design-system-v1.md`
- `app/evidence-os.css`
- `components/evidence-os/*`
- consumul real din runtime

Concluzii majore:

- primitivele și token layer-ul sunt pe direcția corectă
- runtime-ul consumă deja parțial `Evidence OS`
- dar încă există strat hibrid, pentru că workspace-ul real păstrează carduri duplicate în `lib/compliance/*`
- coexistă mai multe sisteme de token-uri, deci `Evidence OS` nu este încă sursă unică de adevăr

Output livrat:

- `components/evidence-os/evidence-os-integration-map.md`

### 2026-03-13 11

Am fixat ordinea sigură de migrare:

1. convergență pe cardurile canonice din `components/evidence-os/*`
2. convergență pe pattern-uri compuse (`ProposalBundlePanel`, `SourceEnvelopeCard`, `HumanReviewPanel`)
3. extragere badge-uri semantice dedicate
4. polish final de limbaj Romanian-first

Scop:

- `Evidence OS` să intre peste suprafața existentă fără dublă mentenanță și fără să atingă firul paralel de sprint 6

### 2026-03-13 12

Am început centralizarea semantică direct în layer-ul canonic `Evidence OS`.

Componente noi:

- `components/evidence-os/SeverityBadge.tsx`
- `components/evidence-os/ProposalConfidenceBadge.tsx`
- `components/evidence-os/RiskClassBadge.tsx`

Componente actualizate să le consume:

- `components/evidence-os/ProposalCard.tsx`
- `components/evidence-os/IntakeSystemCard.tsx`
- `components/evidence-os/FindingProposalCard.tsx`
- `components/evidence-os/DriftProposalCard.tsx`

Efect:

- logica de mapare pentru severitate, confidence și risc sugerat nu mai este împrăștiată în fiecare card
- `Evidence OS` devine mai ușor de introdus în runtime prin convergență pe componente semantice mici

### 2026-03-13 13

Am aplicat următorul pas de integrare sigur pentru a reduce și mai mult munca de wiring în runtime.

Componente noi:

- `components/evidence-os/LifecycleBadge.tsx`
- `components/evidence-os/EvidenceReadinessBadge.tsx`
- `components/evidence-os/EvidenceReadinessCard.tsx`

Scop:

- statusurile de tip lifecycle să aibă componentă canonică dedicată
- `auditReadiness` să aibă badge semantic propriu
- blocul de dovezi să aibă deja o variantă compusă canonică, gata de înlocuire peste implementarea manuală din runtime

### 2026-03-13 14

Am extins stratul semantic pentru transparență și review.

Componente noi:

- `components/evidence-os/SourceFieldStatusBadge.tsx`
- `components/evidence-os/HumanOversightBadge.tsx`
- `components/evidence-os/HumanReviewStateBadge.tsx`

Integrare imediată:

- `IntakeSystemCard` afișează acum starea pe câmpuri și controlul uman
- `ReviewPolicyCard` poate primi opțional `state` și randă badge-ul corespunzător

Efect:

- `Evidence OS` se aliniază mai bine cu principiul din spec:
  - trust through transparency
  - field confidence indicators
  - review state explicit

### 2026-03-13 15

Am continuat canonizarea zonei de evidence.

Componente noi:

- `components/evidence-os/ControlCoverageBadge.tsx`
- `components/evidence-os/EvidenceChecklistCard.tsx`

Componentă compusă extinsă:

- `components/evidence-os/EvidenceReadinessCard.tsx`

Ce face acum:

- mapează `covered` / `partial` / `missing` prin componentă semantică dedicată
- poate afișa lista de controale cu badge de coverage
- separă checklist-ul stakeholder într-un card canonic reutilizabil

Efect:

- blocul de evidence este mai aproape de a înlocui direct implementarea manuală din runtime

### 2026-03-13 16

Am început canonizarea layout-ului agentic și a stărilor structurale ale workspace-ului.

Componente noi:

- `components/evidence-os/AgentReviewLayout.tsx`
- `components/evidence-os/SourceContextPanel.tsx`
- `components/evidence-os/ProposalSectionHeader.tsx`
- `components/evidence-os/AgentStartStateCard.tsx`

Scop:

- tri-column pattern-ul din spec să existe ca pattern canonic, nu doar ca implementare manuală în runtime
- panoul de context să poată înlocui ulterior blocul construit în `agent-workspace`
- starea inițială și header-ele de secțiune să fie mutate în piese reutilizabile

### 2026-03-13 17

Am făcut primul wiring real în runtime după închiderea firului paralel de `Sprint 6`.

Fișiere runtime atinse:

- `lib/compliance/agent-workspace.tsx`
- `lib/compliance/IntakeSystemCard.tsx`
- `lib/compliance/FindingProposalCard.tsx`
- `lib/compliance/DriftProposalCard.tsx`

Ce s-a schimbat:

- `agent-workspace` consumă acum componente canonice `Evidence OS` pentru:
  - start state
  - tri-column layout
  - context panel
  - proposal tabs
  - section headers
  - evidence readiness
  - human review panel
- cardurile duplicate din `lib/compliance/*` au devenit adaptoare subțiri către `components/evidence-os/*`

Efect:

- runtime-ul agentic nu mai dublează UI-ul principal al `Evidence OS`
- schimbările din DS se propagă mult mai direct în suprafața reală

Validare:

- `npm run lint`

Rezultat:

- fără warnings
- fără errors

## Stare curentă

Integrat și izolat:

- token layer `Evidence OS`
- primitivele DS
- principalele carduri și panouri canonice din `components/evidence-os/*`
- wiring-ul runtime permis pentru `Agent Evidence OS`

Neintegrat intenționat în acest fir:

- runtime nou
- wiring API
- schimbări în alte zone `lib/compliance/*` din afara adaptoarelor permise
- schimbări în `Audit Pack`
- schimbări în `traceability`

### 2026-03-13 18

Am redus și mai mult markup-ul local din runtime prin canonizarea shell-urilor rămase.

Componente noi:

- `components/evidence-os/EmptyState.tsx`
- `components/evidence-os/ProposalColumnShell.tsx`
- `components/evidence-os/ReviewDecisionPanel.tsx`

Runtime actualizat:

- `lib/compliance/agent-workspace.tsx`

Ce s-a schimbat:

- stările goale din tabs nu mai sunt helper local, ci componentă canonică `Evidence OS`
- coloana de propuneri și loading state-ul ei au acum shell canonic
- panoul de decizie finală este mutat într-o componentă dedicată, care compune:
  - `CommitSummaryCard`
  - `ReviewPolicyCard`
  - `HumanReviewPanel`

Efect:

- `agent-workspace` rămâne și mai mult un orchestrator de flux, nu un autor de markup
- shell-urile structurale importante există acum în `components/evidence-os/*`
- integrarea în alte suprafețe similare devine mai ușoară

### 2026-03-13 19

Am mutat și orchestration-ul vizual al tab-urilor într-o componentă canonică dedicată.

Componentă nouă:

- `components/evidence-os/AgentProposalTabs.tsx`

Runtime actualizat:

- `lib/compliance/agent-workspace.tsx`

Ce s-a schimbat:

- tabs-urile `intake`, `findings`, `drift`, `evidence` nu mai sunt randate direct în runtime
- secțiunile, header-ele, `ScrollArea`, `TabsContent`, cardurile canonice și stările goale sunt acum compuse în `AgentProposalTabs`
- `agent-workspace` păstrează doar:
  - starea tab-ului activ
  - selecția item-urilor respinse
  - logica de commit final

Efect:

- suprafața centrală `Agent Evidence OS` are acum source of truth vizual aproape complet în `components/evidence-os/*`
- wiring-ul runtime rămâne minim și predictibil

### 2026-03-14 20

Am făcut un batch de polish pentru accesibilitate și structură semantică, fără schimbări de contract sau logică de business.

Componente actualizate:

- `components/evidence-os/ProposalBundlePanel.tsx`
- `components/evidence-os/ProposalColumnShell.tsx`
- `components/evidence-os/EmptyState.tsx`
- `components/evidence-os/SourceContextPanel.tsx`
- `components/evidence-os/SourceEnvelopeCard.tsx`
- `components/evidence-os/ReviewDecisionPanel.tsx`
- `components/evidence-os/CommitSummaryCard.tsx`
- `components/evidence-os/HumanReviewPanel.tsx`

Ce s-a schimbat:

- tabs-urile anunță mai clar categoriile și count-urile prin etichete accesibile
- loading state-ul și empty state-urile sunt marcate semantic pentru feedback mai clar
- panourile principale folosesc acum mai consecvent `section`, `aria-labelledby` și `aria-describedby`
- cardurile de context și review au etichete mai explicite pentru tehnologii asistive

Efect:

- `Evidence OS` este mai robust pentru navigație, audit UI și mentenanță
- am împins layer-ul canonic mai departe fără să ies din zona permisă după închiderea Sprint 7

### 2026-03-14 21

Am continuat cu un batch de centralizare pentru micro-pattern-urile repetate din cardurile canonice.

Componente noi:

- `components/evidence-os/ProposalRejectButton.tsx`
- `components/evidence-os/SignalBadgeList.tsx`

Componente actualizate:

- `components/evidence-os/IntakeSystemCard.tsx`
- `components/evidence-os/FindingProposalCard.tsx`
- `components/evidence-os/DriftProposalCard.tsx`
- `components/evidence-os/SourceContextPanel.tsx`

Ce s-a schimbat:

- butonul de respingere a propunerilor este acum o componentă canonică unică
- lista de semnale este randată printr-un pattern comun, atât în carduri, cât și în panoul de context
- cardurile agentice au mai puțină duplicare și o semnatică UI mai consistentă

Efect:

- `Evidence OS` devine mai ușor de întreținut și de extins când se deschid alte suprafețe
- orice polish viitor pe semnale sau pe acțiunea de respingere se face într-un singur loc

### 2026-03-14 22

Am început împingerea `Evidence OS` în afara suprafeței agentice, cu aprobare explicită pentru extindere în restul secțiunilor.

Suprafață integrată:

- `app/dashboard/asistent/page.tsx`

Componente noi:

- `components/evidence-os/AssistantMessageBubble.tsx`
- `components/evidence-os/AssistantSuggestionChip.tsx`

Ce s-a schimbat:

- pagina `Asistent` folosește acum shell, token-uri și componente `Evidence OS`
- conversația, sugestiile și composer-ul sunt mutate pe limbajul vizual `EOS`
- motorul conversațional și endpoint-ul `/api/chat` rămân neschimbate

Efect:

- `Evidence OS` nu mai este limitat doar la `Agent Workspace`
- avem prima integrare reală într-o secțiune separată a produsului, fără schimbări de backend

### 2026-03-14 23

Am început împingerea `Evidence OS` și în `Scanari`, dar într-un batch controlat care atinge doar stratul de ghidaj și selecție de sus.

Suprafață integrată:

- `app/dashboard/scanari/page.tsx`

Componente noi:

- `components/evidence-os/ScanSourceTypeSelector.tsx`
- `components/evidence-os/ScanFlowOverviewCard.tsx`
- `components/evidence-os/SectionDividerCard.tsx`
- `components/evidence-os/SourceModeGuideCard.tsx`

Ce s-a schimbat:

- selectorul de sursă pentru `document / text / manifest / yaml` folosește acum `Evidence OS`
- ghidul pentru modul activ este randat prin componentă canonică nouă
- sumarul de flow și divizoarele de etapă au fost mutate pe shell-uri `EOS`
- fluxurile de scanare, discovery și rezultatele de jos rămân neschimbate în acest batch

Efect:

- `Scanari` începe să intre pe limbajul vizual `Evidence OS` fără să riscăm regresii în runtime-ul de analiză
- am deschis o cale sigură pentru batch-urile următoare pe aceeași pagină

## Regula de update

Pentru fiecare batch nou pe `Evidence OS`, acest fișier trebuie actualizat cu:

- ce s-a schimbat
- în ce fișiere
- de ce
- ce validare a fost rulată
