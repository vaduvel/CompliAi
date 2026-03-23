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
