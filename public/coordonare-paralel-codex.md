# Coordonare paralelă Codex

Data: 2026-03-14

## Scop

Lucrăm în paralel pe două fire:

1. `runtime and maturity work post Sprint 7`
2. `Evidence OS design system integration`

Ca să iasă bine tot, cele două fire trebuie separate clar:

- **Codex principal** ține fundatia, runtime-ul, sprinturile și integrarea finală
- **Codex secundar** livrează doar UI/design system izolat pentru `Evidence OS`

Nu lucrăm amândoi în aceeași zonă critică în același timp.

## Regula de bază

### Codex principal deține

- `lib/server/*`
- `lib/compliance/engine.ts`
- `lib/server/audit-pack.ts`
- `lib/server/compliance-trace.ts`
- `app/api/*`
- `app/dashboard/rapoarte/*`
- `app/dashboard/scanari/*`
- documentele de status:
  - `public/log-sprinturi-maturizare.md`
  - `public/status-arhitectura.md`
  - `public/task-breakdown-tehnic.md`
  - `public/sprinturi-maturizare-compliscan.md`

### Codex secundar deține

- `public/evidence-os-design-system-v1.md`
- `app/evidence-os.css`
- `components/evidence-os/*`
- `app/dashboard/asistent/page.tsx`

Si, in faza 2 de integrare controlata, poate atinge si:

- `lib/compliance/agent-workspace.tsx`
- `lib/compliance/IntakeSystemCard.tsx`
- `lib/compliance/FindingProposalCard.tsx`
- `lib/compliance/DriftProposalCard.tsx`
- `components/compliscan/agent-workspace.tsx`

Opțional:

- `app/globals.css`, dar doar pentru:
  - import stiluri
  - variabile CSS dedicate `Evidence OS`
  - fără schimbări care afectează restul aplicației

## Ce NU are voie să facă Codex secundar

- să modifice `app/api/*`
- să modifice `lib/server/*`
- să modifice `lib/compliance/*` care țin de runtime, în afară de adaptorii enumerați mai sus
- să modifice `Audit Pack`, `traceability`, `auth`, `mvp-store`, `scan-workflow`
- să actualizeze logurile și checkpoint-urile de sprint
- să schimbe navigația produsului
- să schimbe framing-ul produsului (`aplicația oferă suport, omul validează`)
- să modifice:
  - `app/dashboard/scanari/*`
  - `app/dashboard/rapoarte/*`
  - `app/dashboard/setari/*`

## Ce are voie să facă Codex secundar

- să implementeze componente UI curate și izolate
- să mapeze design system-ul din document în:
  - badge-uri
  - butoane
  - cards
  - tabs
  - panel-uri
  - token-uri CSS dedicate
- să curețe inconsistențele vizuale în `components/evidence-os/*`
- să livreze un shell `Evidence OS` fără logică critică nouă
- să convertească adaptorii runtime ai `Agent Workspace` în:
  - re-exporturi
  - wrappere subțiri
  - layout orchestrat prin pattern-urile canonice din `components/evidence-os/*`
- să reducă dublarea de UI între:
  - `components/evidence-os/*`
  - `lib/compliance/*Card.tsx`

## Workflow recomandat

### Varianta bună

Codex secundar lucrează în:

- branch separat: `codex/evidence-os-ds-finish`

și ideal în:

- worktree separat

Codex principal rămâne pe branchul/sesiunea curentă de sprint.

### Dacă rămâneți în același worktree

Atunci regula devine:

- Codex secundar atinge **doar** fișierele din zona `evidence-os`
- Codex principal **nu** intră în `components/evidence-os/*` decât pentru audit sau integrare finală
- orice schimbare în afara zonei permise se oprește și se revizuiește înainte de continuare

## Ritual de integrare

1. Codex secundar livrează batch mic.
2. Codex principal face audit pe diff.
3. Codex principal decide:
   - ce intră
   - ce se mută
   - ce se respinge
4. Codex principal rulează:
   - `npm test`
   - `npm run lint`
   - `npm run build`
5. Doar Codex principal actualizează documentele de control.

## Faza curentă

Pentru că `Sprint 7` este închis operațional, Codex secundar poate intra acum în:

1. convergență pe cardurile canonice:
   - `IntakeSystemCard`
   - `FindingProposalCard`
   - `DriftProposalCard`
2. convergență pe layout-ul local din `AgentWorkspace`
3. polish de surface pentru `Evidence OS`
4. integrarea UI din `app/dashboard/asistent/page.tsx`

Nu poate intra încă în:

- `Scanări`
- API
- exporturi
- runtime critic de audit

## Semnal de oprire

Dacă apare oricare din acestea, se oprește lucrul în paralel și se face integrare controlată:

- modificări în `app/api/*`
- modificări în `lib/server/*`
- modificări în `lib/compliance/*` critice
- build roșu din cauza unui fir paralel
- styling global care afectează cockpit-ul principal

## Obiectivul corect

Nu vrem doi agenți care „lucrează mult”.

Vrem:

- un agent care întărește fundația
- un agent care îmbunătățește shell-ul vizual izolat

Asta e formula prin care ies bine ambele:

- `Sprint 6` nu se blochează
- `Evidence OS` avansează
- repo-ul rămâne coerent
