# PR Brief - `codex/evidence-os-agent-workspace`

Data: 2026-03-14

## Titlu propus

`Align dashboard IA, compact Drift UX, and advance Agent Workspace`

## Branch

- source: `codex/evidence-os-agent-workspace`
- target: `main`

## Scope

Acest PR unifica trei loturi validate local:

1. clarificare IA oficiala in produs:
   - `Dashboard / Scanare / Control / Dovada / Setari`
   - `Dashboard` ramane home/orchestrator
   - `Setari` devine top-level clar, nu pseudo-sub-sectiune

2. cleanup UX pe cockpitul mare:
   - `Scanari` separat in:
     - flux activ
     - verdict curent
     - istoric
   - `Control` separat in:
     - discovery
     - sisteme
     - baseline
     - drift
     - compliance pack
     - integrari
   - `Dovada` separat clar intre:
     - remediere
     - audit si export
     - auditor vault
   - `Drift` compactat in `Dashboard` si in `/dashboard/alerte`

3. convergenta `Evidence OS` pe suprafata permisa:
   - `Agent Workspace`
   - tabs de propuneri
   - carduri canonice
   - review decision panel

## Ce s-a integrat din lotul Codex 2

Commitul deja validat:

- `a111aa5` `Polish Evidence OS safe surfaces`

A acoperit:

- `app/dashboard/asistent/page.tsx`
- `components/compliscan/export-center.tsx`
- `components/compliscan/floating-assistant.tsx`
- `components/compliscan/next-best-action.tsx`
- `components/compliscan/remediation-board.tsx`
- `components/compliscan/task-card.tsx`
- polish component-level pe `components/evidence-os/*`

## Commits din branch

- `a111aa5` `Polish Evidence OS safe surfaces`
- `70b8ded` `Align dashboard IA and advance agent workspace`
- `563433e` `Align navigation map with systems label`

## Validare locala

- `npm test` ✅
- `npm run lint` ✅
- `npm run build` ✅

Snapshot validat:

- `66` fisiere de test
- `231` teste verzi

## Observatii cunoscute

- `next build` raporteaza in continuare warning-uri cunoscute de `dynamic server usage` pentru pagini dashboard care citesc `org_state` prin fetch `no-store` din Supabase
- build-ul se inchide cu succes; warning-ul nu este introdus de acest PR

## Zone de review recomandate

1. `Setari`
   - tabs:
     - `Workspace`
     - `Integrari`
     - `Acces`
     - `Operational`
     - `Avansat`

2. `Drift`
   - `Dashboard` feed compact
   - `DriftCommandCenter`
   - `/dashboard/alerte` cu progressive disclosure

3. `Control`
   - titluri si wording:
     - `Control`
     - `Sisteme`
     - `Drift`

4. `Agent Workspace`
   - tabs de propuneri
   - decision panel
   - carduri de:
     - intake
     - findings
     - drift

5. documentatie
   - IA oficiala
   - coordonare paralela
   - harta de navigare si task-urile delegate

## Verdict de merge

Branch-ul este merge-ready fata de `main`:

- `0` behind
- `2` commit-uri functionale + `1` commit mic de consistenta documentara
- `git diff --check` curat

## Checklist scurt pentru reviewer

- [ ] `Dashboard` se simte orientare, nu workspace de executie
- [ ] `Control` se simte control, nu produs separat pe pagini paralele
- [ ] `Dovada` separa clar executia de livrabil
- [ ] `Drift` nu mai este supra-incarcat vizual
- [ ] `Agent Workspace` foloseste coerent limbajul `Evidence OS`
- [ ] nu exista regressii vizibile pe navigatie
