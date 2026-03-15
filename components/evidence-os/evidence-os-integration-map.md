# Evidence OS Integration Map

Data: 2026-03-13

## Obiectiv

Acest document traduce auditul de aliniere într-o hartă de integrare practică pentru `Evidence OS`, astfel încât design system-ul din:

- `public/evidence-os-design-system-v1.md`

să poată intra în produs incremental, fără interferență cu firul paralel de lucru pe `Sprint 6 - Audit defensibility`.

## Principiu de bază

`components/evidence-os/*` trebuie să devină sursa unică de adevăr pentru UI-ul `Agent Evidence OS`.

Ce înseamnă asta:

- token-urile vin din `app/evidence-os.css`
- primitivele vin din `components/evidence-os/Badge.tsx`, `Button.tsx`, `Card.tsx`, `Tabs.tsx`
- componentele compuse vin tot din `components/evidence-os/*`
- runtime-ul nu mai păstrează implementări UI paralele în `lib/compliance/*`

## Stare curentă

### 1. Ce este deja bine aliniat

- token layer izolat:
  - `app/evidence-os.css`
- import global controlat:
  - `app/globals.css`
- primitive DS:
  - `components/evidence-os/Badge.tsx`
  - `components/evidence-os/Button.tsx`
  - `components/evidence-os/Card.tsx`
  - `components/evidence-os/Tabs.tsx`
- pattern-uri DS deja implementate:
  - `components/evidence-os/ProposalBundlePanel.tsx`
  - `components/evidence-os/SourceEnvelopeCard.tsx`
  - `components/evidence-os/HumanReviewPanel.tsx`
  - `components/evidence-os/ReviewPolicyCard.tsx`
  - `components/evidence-os/CommitSummaryCard.tsx`
  - `components/evidence-os/AgentRunBadge.tsx`
- carduri canonice populate în layer-ul nou:
  - `components/evidence-os/IntakeSystemCard.tsx`
  - `components/evidence-os/FindingProposalCard.tsx`
  - `components/evidence-os/DriftProposalCard.tsx`

### 2. Ce este încă hibrid

Workspace-ul real consumă:

- primitive din `components/evidence-os/*`
- carduri și pattern-uri canonice din `components/evidence-os/*`
- adaptoare subțiri în:
  - `lib/compliance/IntakeSystemCard.tsx`
  - `lib/compliance/FindingProposalCard.tsx`
  - `lib/compliance/DriftProposalCard.tsx`

În plus, `lib/compliance/agent-workspace.tsx` încă:

- orchestrează local ordinea tabs-urilor și regulile de filtrare / commit
- rămâne punctul de compunere pentru `Agent Evidence OS`, dar cu markup structural mult redus

## Harta actuală de consum

### Runtime care consumă deja Evidence OS

- `lib/compliance/agent-workspace.tsx`
  - `AgentReviewLayout`
  - `AgentStartStateCard`
  - `AgentProposalTabs`
  - `SourceContextPanel`
  - `ProposalColumnShell`
  - `ReviewDecisionPanel`
  - adaptoarele subțiri pentru:
    - `IntakeSystemCard`
    - `FindingProposalCard`
    - `DriftProposalCard`

### Consecință

Avem acum un strat canonic dominant pentru UI-ul agentic:

- strat canonic:
  - `components/evidence-os/*`
- strat runtime adaptor:
  - `lib/compliance/*Card.tsx`

În acest punct, `Evidence OS` este deja sursa unică de adevăr pentru vizualul principal al workspace-ului agentic.
Ce mai rămâne local în runtime este selecția item-urilor respinse și commit-ul final.

## Extensie 2026-03-15 - cockpit runtime

În zona operațională principală a produsului:

- `app/dashboard/*`
- `components/compliscan/*`
- `lib/compliance/*`

primitivele de bază concurente `components/ui/*` pentru:

- `Badge`
- `Button`
- `Card`

au fost eliminate din traseul activ și înlocuite cu primitivele canonice din `components/evidence-os/*`.

Consecință:

- `Evidence OS` este acum:
  - sursa de adevăr pentru arhitectura de pagină
  - sursa de adevăr pentru workspace-ul agentic
  - stratul dominant de primitive UI în cockpit-ul runtime
  - namespace-ul canonic de authoring pentru runtime-ul produsului:
    - `app/*`
    - `components/*`
    - `lib/compliance/*`

Ce NU înseamnă încă:

- nu avem încă o autoritate unică absolută pentru toate token-urile și toate suprafețele repo-ului
- `components/ui/*` nu mai este folosit direct în runtime, dar există încă drept strat intern pentru unele wrapper-e `Evidence OS`

## Drift-uri identificate

### Drift 1. Multiple token systems

Există simultan:

- `app/evidence-os.css`
- `app/globals.css` tema principală emerald/carbon
- `lib/compliance/tokens.ts`

Impact:

- risc de semnatică dublă pentru culori, status și accent
- dificil de știut ce este “adevărul” pentru UI-ul agentic

Decizie recomandată:

- pentru suprafața `Evidence OS`, singura autoritate vizuală trebuie să fie `app/evidence-os.css`
- `lib/compliance/tokens.ts` trebuie tratat ca legacy UI helper sau eliminat din traseul UI

### Drift 2. Duplicate component implementations

Avem versiuni canonice în:

- `components/evidence-os/*`

și adaptoare runtime în:

- `lib/compliance/*`

Impact:

- rezolvat în mare parte pentru proposal cards
- riscul rămas este doar ca adaptoarele runtime să înceapă din nou să primească styling propriu

Decizie recomandată:

- `lib/compliance/*Card.tsx` nu trebuie să mai aibă styling propriu
- ideal rămân adaptoare foarte subțiri sau dispar complet când wiring-ul principal nu mai are nevoie de ele

### Drift 3. Semantica badge-urilor nu este încă centralizată

Spec-ul cere familii distincte:

- severity
- lifecycle
- system state
- evidence quality
- confidence

Momentan avem:

- un `Badge` generic pentru cazurile neutre
- componente semantice dedicate deja extrase pentru:
  - `SeverityBadge`
  - `LifecycleBadge`
  - `ProposalConfidenceBadge`
  - `RiskClassBadge`
  - `EvidenceReadinessBadge`
  - `ControlCoverageBadge`
  - `SourceFieldStatusBadge`
  - `HumanOversightBadge`
  - `HumanReviewStateBadge`

Impact:

- mult redus în `Evidence OS`
- mai poate exista logică semantică dispersată doar în suprafețe legacy sau în afara zonei curente de integrare

Decizie recomandată:

- orice badge nou din suprafața agentică trebuie adăugat mai întâi în `components/evidence-os/*`
- dacă apare nevoia în runtime, se consumă doar componenta semantică, nu mapări locale noi

### Drift 4. Romanian-first este parțial implementat

Spec-ul cere UI Romanian-first.

În stratul canonic nou:

- direcția este corectă

În runtime:

- suprafața agentică integrată în acest fir este în mare parte Romanian-first
- pot exista texte mixte doar în zone legacy, în afara suprafeței `Agent Evidence OS`, sau în fire neatinse de această migrare

Impact:

- pe suprafața agentică principală impactul este acum redus
- riscul de neuniformitate rămâne la granița cu suprafețele legacy

Decizie recomandată:

- orice wiring final spre runtime trebuie să consume doar componentele canonice română-first
- suprafețele legacy trebuie armonizate doar când intră oficial în zona permisă

## Plan de integrare sigur

### Faza 1. Convergență pe componente canonice

Obiectiv:

- runtime-ul agentic să nu mai aibă componente duplicate pentru proposal cards

Pași:

1. `lib/compliance/IntakeSystemCard.tsx` devine adaptor sau re-export pentru `components/evidence-os/IntakeSystemCard.tsx`
2. `lib/compliance/FindingProposalCard.tsx` devine adaptor sau re-export pentru `components/evidence-os/FindingProposalCard.tsx`
3. `lib/compliance/DriftProposalCard.tsx` devine adaptor sau re-export pentru `components/evidence-os/DriftProposalCard.tsx`

Rezultat:

- orice update DS intră direct în runtime fără dublă mentenanță

Stare:

- aplicată pentru:
  - `lib/compliance/IntakeSystemCard.tsx`
  - `lib/compliance/FindingProposalCard.tsx`
  - `lib/compliance/DriftProposalCard.tsx`
- aceste fișiere sunt acum adaptoare subțiri către `components/evidence-os/*`

### Faza 2. Convergență pe pattern-uri compuse

Obiectiv:

- `agent-workspace` să consume pattern-urile canonice, nu layout local hibrid

Ținte:

- `ProposalBundlePanel`
- `SourceEnvelopeCard`
- `HumanReviewPanel`

Rezultat:

- workspace-ul devine un orchestrator, nu un autor de UI

Stare:

- aplicată în:
  - `lib/compliance/agent-workspace.tsx`
- workspace-ul consumă acum:
  - `AgentReviewLayout`
  - `AgentStartStateCard`
  - `AgentProposalTabs`
  - `SourceContextPanel`
  - `ProposalColumnShell`
  - `ReviewDecisionPanel`
  - cardurile canonice `IntakeSystemCard`, `FindingProposalCard`, `DriftProposalCard`

### Faza 3. Centralizare semantică

Obiectiv:

- statusurile și severity mappings să nu mai stea împrăștiate

Ținte noi recomandate:

- `SeverityBadge.tsx`
- `LifecycleBadge.tsx`
- `ConfidenceDot.tsx` sau `ConfidenceBadge.tsx`
- `EvidenceQualityBadge.tsx`

Rezultat:

- severitate, confidence și lifecycle sunt randate identic oriunde în produs

Stare:

- începută parțial
- există acum componente canonice pentru:
  - `SeverityBadge.tsx`
  - `ProposalConfidenceBadge.tsx`
  - `RiskClassBadge.tsx`
  - `LifecycleBadge.tsx`
  - `EvidenceReadinessBadge.tsx`
  - `SourceFieldStatusBadge.tsx`
  - `HumanOversightBadge.tsx`
  - `HumanReviewStateBadge.tsx`
  - `ControlCoverageBadge.tsx`
- acestea sunt deja consumate de cardurile canonice din `components/evidence-os/*`
- există și pattern compus nou:
  - `EvidenceReadinessCard.tsx`
  - `EvidenceChecklistCard.tsx`
  - `AgentReviewLayout.tsx`
  - `SourceContextPanel.tsx`
  - `ProposalSectionHeader.tsx`
  - `AgentStartStateCard.tsx`
- acesta poate înlocui ulterior blocul manual de `evidence` din runtime

### Faza 4. Convergență de limbaj

Obiectiv:

- UI `Evidence OS` complet Romanian-first

Ținte:

- labels tabs
- panel headers
- status copy
- helper copy

Rezultat:

- experiență consistentă cu spec-ul

## Ce NU trebuie făcut în această migrare

- nu se schimbă contractele TypeScript folosite de backend
- nu se schimbă structura datelor de `AgentProposalBundle`
- nu se introduce logică de business nouă
- nu se mută fire de lucru din `Sprint 6`
- nu se amestecă `Evidence OS` cu re-theming global al cockpit-ului principal

## Ordinea recomandată de execuție

1. convergență carduri canonice
2. convergență workspace pe pattern-uri compuse
3. badge-uri semantice dedicate
4. polish final de limbaj și accesibilitate

## Criteriu de “intră ca o mănușă”

Considerăm integrarea reușită când:

- runtime-ul nu mai are implementări UI duplicate pentru `Agent Evidence OS`
- `components/evidence-os/*` este singurul loc unde se schimbă vizualul acestei suprafețe
- statusurile și severity-urile se randază prin mapări canonice
- limbajul este Romanian-first în toată suprafața agentică
- schimbările de DS se propagă în runtime fără editări paralele
