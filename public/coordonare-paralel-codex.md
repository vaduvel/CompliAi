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
- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/task-card.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/export-center.tsx`

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

Ținta curentă este oficializarea controlată `Evidence OS` în doi pași:

1. Codex secundar închide:
   - stabilizarea `Val 1`
   - canonizarea completă a suprafeței aprobate din `Val 2`
2. Codex principal preia:
   - restul `Val 2`
   - `Val 3`
   - polish final Sprint 1-7
   - backlog recheck
   - architecture + implementation review

Suprafața aprobată:

- `components/evidence-os/*`
- `app/dashboard/asistent/page.tsx`
- `components/compliscan/risk-header.tsx`
- `components/compliscan/route-sections.tsx`
- `components/compliscan/task-card.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/export-center.tsx`
- adaptorii runtime permisi:
  - `lib/compliance/agent-workspace.tsx`
  - `lib/compliance/IntakeSystemCard.tsx`
  - `lib/compliance/FindingProposalCard.tsx`
  - `lib/compliance/DriftProposalCard.tsx`
  - `components/compliscan/agent-workspace.tsx`

Suprafața rămasă la Codex principal:

- `app/dashboard/alerte/page.tsx`
- `app/dashboard/scanari/*`
- `app/dashboard/rapoarte/*`
- `app/dashboard/setari/*`
- orice extindere de pattern-uri `Evidence OS` peste cockpit-ul mare în afara suprafeței aprobate
- verificarea backlog-ului parcat intenționat
- verificarea de arhitectură și implementare
- declararea formală a oficializării `Evidence OS`

Pentru că `Sprint 7` este închis operațional, Codex secundar poate intra acum în:

1. convergență pe cardurile canonice:
   - `IntakeSystemCard`
   - `FindingProposalCard`
   - `DriftProposalCard`
2. convergență pe layout-ul local din `AgentWorkspace`
3. polish de surface pentru `Evidence OS`
4. integrarea UI din `app/dashboard/asistent/page.tsx`
5. implementarea itemilor din `components/evidence-os/ui-audit-backlog.md` doar dacă rămân în suprafața aprobată
6. eliminarea controlată a dependenței de `components/ui/*` pe suprafața aprobată, acolo unde există primitive canonice `Evidence OS`

Nu poate intra încă în:

- `Scanări`
- API
- exporturi
- runtime critic de audit
- itemii din backlog-ul local care cer atingerea cockpit-ului mare în afara suprafeței aprobate

## Criteriul de predare pentru Codex secundar

Codex secundar predă lotul când poate spune clar:

1. `Val 1` rămâne închis
2. suprafața aprobată din `Val 2` este 100% gata la nivelul definit în plan:
   - ierarhie
   - CTA
   - badge semantics
   - empty/loading states
   - overflow safety
   - fără pierdere de semnal critic
   - cu folosire canonică `Evidence OS` acolo unde există alternativă clară
3. ce rămâne legacy în suprafața lui este puțin, justificat și listat explicit
4. nu mai există duplicate UI concurente pe suprafața lui
5. ce rămâne deschis este listat explicit pentru Codex principal

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
