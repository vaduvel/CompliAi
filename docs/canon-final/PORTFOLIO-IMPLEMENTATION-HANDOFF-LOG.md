# CompliScan — Portfolio Implementation Handoff Log

Data: `2026-03-22`
Status: `ACTIVE`
Regulă:
- acest log este append-only
- se actualizează la fiecare wave sau checkpoint relevant
- scopul lui este continuitatea între execuție și preluare

Canon de implementare:
- [COMPLISCAN-UX-IA-DEFINITIV-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-CANON.md)
- [COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-UX-IA-DEFINITIV-v1.1-ADDENDUM-CANON.md)
- [COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PORTFOLIO-TECH-SPEC-CANON.md)
- [COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-PLAN-IMPLEMENTARE-CANON.md)
- [COMPLISCAN-MIGRATION-MATRIX-CANON.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MIGRATION-MATRIX-CANON.md)

---

## Actualizare 2026-03-22 — Snapshot după aprobarea Wave 0A

Context curent:
- branch activ: `codex/portfolio-wave-0b1`
- implementarea rulează incremental după planul canonic
- `Evidence OS v1` rămâne baza vizuală
- sursa activă de adevăr este doar `docs/canon-final/*`

Wave-uri:
- `Wave 0A` = aprobată
- `Wave 0B1` = în lucru
- `Wave 0B2` = nu a început

Commits aprobate până acum:
- `c008b76` — `Wave 0A: introduce userMode + onboarding flow`
- `863dcf0` — `Wave 0A: fix tests + remove unused imports`

Ce există deja din Wave 0A:
- [app/onboarding/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/onboarding/page.tsx)
- [components/compliscan/onboarding-form.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/onboarding-form.tsx)
- [app/api/auth/set-user-mode/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/set-user-mode/route.ts)
- [app/api/auth/me/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/me/route.ts) returnează `userMode`
- [app/dashboard/layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/layout.tsx) redirecționează spre onboarding pentru user autenticat fără `userMode`
- [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts) conține `UserMode`, `getUserMode`, `setUserMode`

Validare Wave 0A:
- `npm test` -> verde (`125` fișiere, `665` teste, `0 failed`)
- `npm run lint` -> verde, fără warning-uri noi din wave
- `npm run build` -> verde

Decizie de control:
- `Wave 0A` este închisă
- nu se trece la `0B2` înainte de închiderea curată a `0B1`

---

## Actualizare 2026-03-22 — Snapshot Wave 0B1 în lucru

Scop curent:
- introducere `partner_manager`
- membership support
- route guards / permission guards
- fără `workspaceMode`
- fără `/portfolio`
- fără billing nou

Fișiere atinse în `Wave 0B1` la momentul acestui snapshot:
- [app/api/agents/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/agents/route.ts)
- [app/api/ai-conformity/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/ai-conformity/route.ts)
- [app/api/audit-log/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/audit-log/route.ts)
- [app/api/auth/members/[membershipId]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/members/[membershipId]/route.ts)
- [app/api/auth/members/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/members/route.ts)
- [app/api/documents/generate/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/documents/generate/route.ts)
- [app/api/drifts/[id]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/drifts/[id]/route.ts)
- [app/api/exports/annex-lite/client/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/exports/annex-lite/client/route.ts)
- [app/api/exports/audit-pack/bundle/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/exports/audit-pack/bundle/route.ts)
- [app/api/exports/audit-pack/client/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/exports/audit-pack/client/route.ts)
- [app/api/exports/audit-pack/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/exports/audit-pack/route.ts)
- [app/api/exports/compliscan/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/exports/compliscan/route.ts)
- [app/api/integrations/supabase/status/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/integrations/supabase/status/route.ts)
- [app/api/policies/acknowledge/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/policies/acknowledge/route.ts)
- [app/api/policies/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/policies/route.ts)
- [app/api/release-readiness/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/release-readiness/route.ts)
- [app/api/settings/summary/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/settings/summary/route.ts)
- [app/api/state/baseline/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/state/baseline/route.ts)
- [app/api/state/drift-settings/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/state/drift-settings/route.ts)
- [app/api/tasks/[id]/evidence/[evidenceId]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/tasks/[id]/evidence/[evidenceId]/route.ts)
- [app/api/tasks/[id]/evidence/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/tasks/[id]/evidence/route.ts)
- [app/api/tasks/[id]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/tasks/[id]/route.ts)
- [components/compliscan/dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- [components/compliscan/settings-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings-page.tsx)
- [components/compliscan/settings/settings-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings/settings-shared.tsx)
- [lib/compliance/types.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/types.ts)
- [lib/server/auth.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.test.ts)
- [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- [lib/server/rbac.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.ts)
- [lib/server/supabase-tenancy-read.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/supabase-tenancy-read.ts)
- [lib/server/rbac.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.test.ts) (nou)

Fișiere care NU fac parte din wave și trebuie ignorate:
- [docs/final-guide-plan/Screenshot 2026-03-21 at 1.27.36 PM.png](/Users/vaduvageorge/Desktop/CompliAI/docs/final-guide-plan/Screenshot%202026-03-21%20at%201.27.36%E2%80%AFPM.png)

Reguli ferme pentru preluare:
- nu presupui că `Wave 0B1` e gata doar pentru că există multe fișiere atinse
- verifici mereu:
  - `npm test`
  - `npm run lint`
  - `npm run build`
- înainte de `0B2`, `0B1` trebuie să aibă commit curat și raport explicit

Acceptance criteria Wave 0B1:
- `partner_manager` există în tipuri, sesiune, membership records și guards
- `GET /api/auth/summary` include `role: "partner_manager"` când e cazul
- endpoint-urile owner-only răspund `403` pentru `partner_manager`
- shell-ul și settings nu crapă când membership-ul are rolul nou
- niciun element din `workspaceMode` / `/portfolio` / billing nou nu apare în acest wave

---

## Notă operațională

De aici înainte:
- eu țin acest log la fiecare checkpoint important
- folosesc logul ca punct de preluare dacă Claude cade, se oprește sau deviază

---

## Actualizare 2026-03-22 — Wave 0B1 verificată și aprobată

Verdict:
- `Wave 0B1` = aprobată
- commit verificat: `f6d7406`
- branch: `codex/portfolio-wave-0b1`

Ce am verificat direct în cod:
- `partner_manager` a fost adăugat end-to-end în [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- matricea RBAC a fost actualizată în [lib/server/rbac.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.ts)
- membership parsing acceptă rolul nou în:
  - [app/api/auth/members/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/members/route.ts)
  - [app/api/auth/members/[membershipId]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/members/[membershipId]/route.ts)
- UI/runtime type unions au fost actualizate în:
  - [components/compliscan/dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
  - [components/compliscan/settings/settings-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings/settings-shared.tsx)
  - [lib/compliance/types.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/types.ts)
- testele dedicate există în:
  - [lib/server/auth.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.test.ts)
  - [lib/server/rbac.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/rbac.test.ts)

Validare Wave 0B1:
- `npm test` -> verde (`126` fișiere, `678` teste, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente, fără warning-uri noi din wave
- `npm run build` -> verde

Observație de control:
- `partner_manager` a intrat în `DELETE_ROLES`, dar rutele owner-only pentru membership/state reset rămân blocate explicit; acceptabil pentru acest wave

Ce NU s-a atins corect:
- niciun element din `workspaceMode`
- niciun endpoint `select-workspace`
- nicio rută `/portfolio`
- nicio nav adaptivă nouă
- niciun billing nou

Următorul checkpoint permis:
- `Wave 0B2`
- scope strict: `workspaceMode` + `select-workspace` + routing/guards aferente

---

## Actualizare 2026-03-22 — Wave 0B2 verificată și aprobată

Verdict:
- `Wave 0B2` = aprobată
- commit verificat: `dca2a0d`
- branch: `codex/portfolio-wave-0b2`

Ce am verificat direct în cod:
- `workspaceMode` a fost adăugat ca extensie de sesiune în [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- token-urile vechi rămân compatibile: fallback la `workspaceMode = "org"` în [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
- login și switch-org emit `workspaceMode: "org"` în:
  - [app/api/auth/login/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/login/route.ts)
  - [app/api/auth/switch-org/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/switch-org/route.ts)
- noul endpoint există și este testat în:
  - [app/api/auth/select-workspace/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/select-workspace/route.ts)
  - [app/api/auth/select-workspace/route.test.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/select-workspace/route.test.ts)
- runtime-ul expune `workspaceMode` în:
  - [app/api/auth/me/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/me/route.ts)
  - [app/api/auth/summary/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/summary/route.ts)
- redirect-urile de bază există în:
  - [app/dashboard/layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/layout.tsx)
  - [app/portfolio/layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/layout.tsx)
- `/portfolio` există doar ca placeholder minim în [app/portfolio/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/page.tsx)

Validare Wave 0B2:
- `npm test` -> verde (`126` fișiere, `678` teste, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; `/portfolio` compilează

Observații de control:
- `orgId` și `orgName` rămân în sesiune; `workspaceMode` este extensie, nu înlocuire
- nu s-a introdus modelul interzis `activeOrgId = null`
- `/portfolio` nu este încă `Portfolio Lite`; este doar target minim de routing/guard

Ce NU s-a atins corect:
- nicio nav adaptivă nouă
- nicio pagină portfolio bogată
- niciun billing nou
- nicio agregare cross-client

Următorul checkpoint permis:
- `Wave 1`
- scope strict: navigație adaptivă pe baza `userMode` și `workspaceMode`, fără a deschide încă `Portfolio Lite`

---

## Actualizare 2026-03-22 — Wave 1 verificată și aprobată

Verdict:
- `Wave 1` = aprobată
- branch verificat: `codex/portfolio-wave-1`

Ce am verificat direct în cod:
- configurația de navigație adaptivă există în [lib/compliscan/nav-config.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.ts)
- shell-ul dashboard folosește acum `userMode + workspaceMode + role` în [components/compliscan/dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- nav-ul mobil folosește itemii adaptați în [components/compliscan/mobile-bottom-nav.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/mobile-bottom-nav.tsx)
- există switcher explicit `org <-> portfolio` în [components/compliscan/workspace-mode-switcher.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/workspace-mode-switcher.tsx)
- `/portfolio` folosește un shell dedicat minim în:
  - [components/compliscan/portfolio-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/portfolio-shell.tsx)
  - [app/portfolio/layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/layout.tsx)
  - [app/portfolio/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/page.tsx)
- compatibilitatea cu cockpit-ul a fost păstrată prin [components/compliscan/use-cockpit.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/use-cockpit.tsx)
- testele dedicate pentru nav există în [lib/compliscan/nav-config.test.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.test.ts)

Validare Wave 1:
- `npm test` -> verde (`128` fișiere, `695` teste, `1 skipped`, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; `/portfolio` compilează și build-ul generează `112` pagini

Observații de control:
- `Evidence OS v1` a rămas baza vizuală; nu există redesign nou
- `/portfolio` este încă doar shell + placeholder, nu `Portfolio Lite`
- nu s-au introdus agregări cross-client, billing nou sau claim flow
- `workspaceMode` rămâne extensie a sesiunii, nu înlocuire a `orgId`

Următorul checkpoint permis:
- `Wave 2`
- scope strict: `Portfolio Lite` real, cu reutilizare controlată din `/dashboard/partner`, fără billing nou

## Actualizare 2026-03-23 — Wave 2 verificată și aprobată

Verdict:
- `Wave 2` = aprobată
- branch verificat: `codex/portfolio-wave-2`

Ce am verificat direct în cod:
- agregarea server-side pentru portofoliu există în [lib/server/portfolio.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/portfolio.ts)
- API-urile noi sunt prezente în:
  - [app/api/portfolio/overview/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/portfolio/overview/route.ts)
  - [app/api/portfolio/alerts/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/portfolio/alerts/route.ts)
  - [app/api/portfolio/tasks/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/portfolio/tasks/route.ts)
  - [app/api/portfolio/vendors/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/portfolio/vendors/route.ts)
  - [app/api/portfolio/reports/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/portfolio/reports/route.ts)
- overview-ul de portofoliu reutilizează controlat suprafața existentă din [app/dashboard/partner/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/partner/page.tsx) prin [components/compliscan/portfolio-overview-client.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/portfolio-overview-client.tsx)
- subpaginile `Portfolio Lite` există în:
  - [app/portfolio/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/page.tsx)
  - [app/portfolio/alerts/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/alerts/page.tsx)
  - [app/portfolio/tasks/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/tasks/page.tsx)
  - [app/portfolio/vendors/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/vendors/page.tsx)
  - [app/portfolio/reports/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/portfolio/reports/page.tsx)
- drilldown-ul din portofoliu spre lucru per-org folosește [app/api/auth/select-workspace/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/select-workspace/route.ts) prin [components/compliscan/portfolio-org-action-button.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/portfolio-org-action-button.tsx)
- compatibilitatea cu vechiul `/dashboard/partner` a fost păstrată; nu există route rename timpuriu

Validare Wave 2:
- `npx vitest run lib/server/portfolio.test.ts app/api/portfolio/portfolio-routes.test.ts lib/compliscan/nav-config.test.ts` -> verde (`18` teste)
- `npm test` -> verde (`130` fișiere, `707` teste, `1 skipped`, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; build-ul generează `117` pagini și compilează `/portfolio/*`

Observații de control:
- `Evidence OS v1` a rămas baza vizuală
- `Wave 2` livrează `Portfolio Lite`, nu încă ownership claim sau billing nou
- drilldown-ul schimbă explicit `workspaceMode` și păstrează modelul de sesiune cu `orgId`
- deduplicarea vendorilor cross-org folosește acum fallback pe nume când review-ul nu are `CUI`

Următorul checkpoint permis:
- `Wave 3`
- scope strict: cleanup runtime per-org ca să se potrivească mai bine cu noul strat portfolio-first, fără billing nou și fără claim flow

## Actualizare 2026-03-23 — Wave 3 verificată și aprobată

Verdict:
- `Wave 3` = aprobată
- branch verificat: `codex/portfolio-wave-3`

Ce am verificat direct în cod:
- contextul runtime pentru paginile per-org există în [components/compliscan/dashboard-runtime.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-runtime.tsx) și este injectat din [components/compliscan/dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- `Mod Solo` are nav dedicat în:
  - [components/compliscan/navigation.ts](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/navigation.ts)
  - [lib/compliscan/nav-config.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliscan/nav-config.ts)
- `/dashboard/documente` nu mai este redirect; suprafața reală este în:
  - [app/dashboard/documente/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/documente/page.tsx)
  - [components/compliscan/documents-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/documents-page.tsx)
- paginile canonice per-org citesc acum contextul de runtime și se simplifică fără route dupes:
  - [app/dashboard/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/page.tsx)
  - [components/compliscan/scan-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/scan-page.tsx)
  - [components/compliscan/resolve-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/resolve-page.tsx)
  - [components/compliscan/reports-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/reports-page.tsx)
  - [components/compliscan/settings-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings-page.tsx)

Validare Wave 3:
- `npx vitest run lib/compliscan/nav-config.test.ts` -> verde (`7` teste)
- `npm test` -> verde (`130` fișiere, `707` teste, `1 skipped`, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; build-ul generează `117` pagini și compilează `/dashboard/documente`

Observații de control:
- `Evidence OS v1` a rămas baza vizuală
- `Wave 3` nu introduce billing nou, claim flow sau route rename
- `Mod Solo` refolosește rutele existente și nu creează produs paralel

Următorul checkpoint permis:
- `Wave 4`
- scope strict: ownership și claim flow, fără billing nou

## Actualizare 2026-03-23 — Wave 4 verificată și aprobată

Verdict:
- `Wave 4` = aprobată
- branch verificat: `codex/portfolio-wave-4`

Ce am verificat direct în cod:
- modelul de ownership este acum derivat și nu introduce membership-uri false:
  - [lib/server/auth.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/auth.ts)
  - [lib/server/claim-ownership.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/claim-ownership.ts)
- există API-uri dedicate pentru claim flow:
  - [app/api/auth/claim-invite/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/claim-invite/route.ts)
  - [app/api/auth/claim-status/[orgId]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/claim-status/[orgId]/route.ts)
  - [app/api/auth/claim-accept/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/claim-accept/route.ts)
- owner-ul poate elimina consultantul din organizatie prin:
  - [app/api/auth/members/[membershipId]/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/auth/members/[membershipId]/route.ts)
- `Setări > Acces` afișează acum suprafața reală de `Ownership și claim` în:
  - [components/compliscan/settings-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings-page.tsx)
  - [components/compliscan/settings/settings-shared.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings/settings-shared.tsx)
- există și suprafață minimă de acceptare claim în:
  - [app/claim/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/claim/page.tsx)
  - [app/login/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/login/page.tsx) pentru `next` safe redirect
- importul CSV pentru partener creează acum org neclaim-uit și pregătește claim invite, cu guard explicit pentru modul `partner`, în:
  - [app/api/partner/import-csv/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/partner/import-csv/route.ts)

Validare Wave 4:
- `npm test` -> verde (`133` fișiere, `722` teste, `1 skipped`, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; compilează `/claim` și rutele noi de auth

Observații de control:
- `owner = system` rămâne stare derivată, nu record fake în memberships
- `claim flow` este separat de billing și nu schimbă modelul de planuri
- `/portfolio` și runtime-ul per-org rămân compatibile cu `workspaceMode`
- importul CSV este acum legat de rol și de `userMode = partner`, nu doar de existența sesiunii

Următorul checkpoint permis:
- `Wave 5`
- scope strict: billing partner, fără redesign nou și fără a rupe claim flow-ul deja livrat

## Actualizare 2026-03-23 — Wave 5 verificată și aprobată

Verdict:
- `Wave 5` = aprobată
- branch verificat: `codex/portfolio-wave-5`

Ce am verificat direct în cod:
- există acum strat separat de `partner account billing` în:
  - [lib/server/plan.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/plan.ts)
  - [lib/shared/plan-constants.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/shared/plan-constants.ts)
- `/api/plan` expune contractul nou pentru contul partner, fără să rupă răspunsul vechi per-org, în:
  - [app/api/plan/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/plan/route.ts)
- checkout și portal Stripe înțeleg acum `billingScope = org | account`, în:
  - [app/api/stripe/checkout/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/stripe/checkout/route.ts)
  - [app/api/stripe/portal/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/stripe/portal/route.ts)
  - [app/api/stripe/webhook/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/stripe/webhook/route.ts)
- există suprafață reală de `Setări cont` în:
  - [app/account/layout.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/account/layout.tsx)
  - [app/account/settings/page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/account/settings/page.tsx)
  - [components/compliscan/account-settings-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/account-settings-page.tsx)
- shell-ul expune acum intrare spre `Setări cont` prin:
  - [components/compliscan/dashboard-shell.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/dashboard-shell.tsx)
- billingul per-org rămâne separat și clar delimitat în:
  - [components/compliscan/settings-billing-page.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/settings-billing-page.tsx)
- blocajul de capacitate pentru adăugarea de firme noi este aplicat și în UI, și în API, în:
  - [components/compliscan/portfolio-overview-client.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/portfolio-overview-client.tsx)
  - [app/api/partner/import-csv/route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/partner/import-csv/route.ts)

Validare Wave 5:
- `npm test` -> verde (`138` fișiere, `732` teste, `1 skipped`, `0 failed`)
- `npm run lint` -> trece; doar warning-uri istorice preexistente
- `npm run build` -> verde; compilează `/account/settings`, rutele Stripe extinse și guard-urile noi

Observații de control:
- billingul per-org nu a fost rupt; `free / pro / partner` rămâne compatibil pentru org-urile vechi
- `partner account billing` este strat nou separat, cu fallback legacy pentru utilizatorii vechi care aveau `partner` la nivel de org
- `/portfolio` nu a primit agregări noi în afara a ceea ce era deja în `Wave 2`; doar capacitate și blocaj comercial
- `Evidence OS v1` a rămas baza vizuală

Următorul checkpoint permis:
- `Wave 6`
- scope strict: cleanup final, feature flags, route bridges și eventuale rename-uri doar dacă aduc claritate reală
