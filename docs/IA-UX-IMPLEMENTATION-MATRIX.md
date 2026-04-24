# CompliAI — IA/UX Implementation Matrix

**Status:** contract de execuție pentru implementarea incrementală a `docs/IA-UX-PROPUNERE (1).md`  
**Data:** 2026-04-24  
**Scope:** transformă propunerea IA/UX în patch-uri mici, verificabile, fără big-bang refactor  
**North Star:** `docs/IA-UX-PROPUNERE (1).md` rămâne destinația. Acest document este planul de migrare.

---

## 0. Regula de lucru

Nu implementăm propunerea ca un singur refactor mare. O implementăm 100% ca direcție, prin patch-uri mici care păstrează produsul funcțional după fiecare pas.

Fiecare decizie din propunere primește unul dintre statusurile:

| Status | Sens |
|---|---|
| `TODO` | nu există încă în cod sau nu e validat |
| `PARTIAL` | există parțial, dar nu respectă complet principiul IA |
| `DONE` | implementat și verificat |
| `PARKED` | valid ca idee, dar nu intră în v1 imediat |
| `REJECTED` | respins explicit, cu motiv |

Nicio idee din propunere nu se pierde: fie intră în matrice, fie este parcată sau respinsă explicit.

---

## 1. Decizii operaționale înainte de cod

| ID | Decizie | Alegere pentru execuție | Motiv |
|---|---|---|---|
| DG-01 | Plan de sprinturi | Folosim planul nou cu **5 sprinturi: S0-S4** | Planul original are 4 sprinturi și amestecă ping-pong-ul cu cleanup-ul mare. Noi separăm bugul critic de refactorul IA. |
| DG-02 | Document sursă | `IA-UX-PROPUNERE (1).md` = North Star | Nu mai redesenăm IA de la zero după fiecare audit. |
| DG-03 | Task-urile originale | Cele 37 task-uri originale se remapează, nu se șterg | Păstrăm acoperire 100%, dar schimbăm ordinea. |
| DG-04 | Ruta cockpit | Codul folosește doar helperul `dashboardRoutes.resolve`; nu hardcodăm `/resolve` sau `/actiuni/remediere` în componente | Propunerea spune `/dashboard/resolve`, localul actual folosește `/dashboard/actiuni/remediere`, live a avut `/dashboard/resolve`. Decizia finală de naming se face în S1, nu în S0. |
| DG-05 | Sprint 0 | Sprint 0 = spine integrity: finding ping-pong + lifecycle documentar dovedit rupt | Asta repară rana reală din live înainte de schimbări mari de nav/rute. |
| DG-06 | Rute legacy | În primele sprinturi redirectăm și măsurăm; ștergerea din filesystem intră doar după validare | Evităm să rupem emailuri, bookmarks, shared links și teste. |
| DG-07 | Specialist modules | Nu le omorâm; le repoziționăm ca tool-uri ale cockpitului sau console Radu | Păstrăm valoarea produsului, tăiem doar labirintul. |

---

## 2. Sprint map 0-4

| Sprint | Nume | Obiectiv | Ce NU facem aici |
|---|---|---|---|
| S0 | Spine Integrity | Orice finding cunoscut ajunge direct în cockpit; lifecycle documentar funcționează cap-coadă | Nu rescriem tot nav-ul. Nu ștergem rute. Nu redesenăm cockpitul complet. |
| S1 | Shell, Nav, Routing | Context firmă vizibil, nav multi-mode, redirecturi legacy, batch execution interzis | Nu unificăm încă tot Dosarul și toate modulele specialist. |
| S2 | Dosar, Monitoring, Console | Dosar unic, Monitoring suite, console Radu/Diana Studio, specialist tools dual-mode | Nu intrăm încă pe white-label/export pipeline complet. |
| S3 | Partner GTM | White-label, brand capture, guest auditor, paywall, deep links, applicability edit | Nu mai schimbăm spine-ul decât dacă apar buguri critice. |
| S4 | Polish & Legacy Removal | Empty states, viewer, reopen UX, cleanup final, ștergere legacy după telemetry | Nu adăugăm module noi. |

---

## 3. Matrix — Sprint 0: Spine Integrity

Sprint 0 repară concret ping-pong-ul descoperit live: `Portfolio/Alerte/Client/Dashboard/De rezolvat -> același finding -> cockpit`.

| ID | Decizie IA / Patch | Principii | Source ref | Fișiere afectate estimate | Status | Risc | Depinde de | Validare |
|---|---|---|---|---|---|---|---|---|
| S0.01 | Helper unic `findingCockpitRoute(findingId, opts)` care folosește `dashboardRoutes.resolve` | P3, P12 | Nou din testarea live | `lib/compliscan/dashboard-routes.ts`, call sites CTA | TODO | M | DG-04 | grep: zero hardcode direct către `/resolve/` sau `/actiuni/remediere/` în CTA-uri noi |
| S0.02 | `Portfolio Alerts -> Deschide finding` setează workspace corect și duce direct în cockpit când există `findingId` | P2, P3, P5 | Live agents | `components/compliscan/portfolio-alerts-page.tsx`, `app/api/portfolio/inbox/*`, workspace switch code | TODO | H | S0.01 | Playwright: alertă critică -> click -> cockpit finding, fără dashboard intermediar |
| S0.03 | `Portfolio Client ?finding=X` afișează finding dominant sau CTA direct cockpit, nu dashboard generic | P2, P3 | Live agents + client drill-in pattern | `app/portfolio/client/[orgId]/page.tsx`, `components/compliscan/client-context-panel.tsx` | PARTIAL | H | S0.01 | URL cu `?finding=` vede context finding în primele 100px și CTA `Deschide finding-ul în cockpit` |
| S0.04 | Dashboard `Ce faci acum / Next action` duce direct la finding ID când există un finding concret | P3, P8 | Live ping-pong | `app/dashboard/page.tsx`, `components/compliscan/next-best-action.tsx` | PARTIAL | M | S0.01 | Dashboard CTA nu mai deschide lista dacă are `relatedFindingIds[0]` |
| S0.05 | `De rezolvat` rămâne queue de browsing, nu pas obligatoriu în flow | P3, P4, P5 | Sec. 3.3 route 23 | `components/compliscan/resolve-page.tsx`, dashboard CTA call sites | TODO | M | S0.01-S0.04 | User poate intra manual în queue, dar flow cu finding cunoscut o sare |
| S0.06 | Finding class badge vizibil în queue și cockpit hero: `Document` / `Acțiune` / `Asistat` | P4 | 6.2.6 / original S0.T6 | `ExecutionClassBadge`, `resolve-page.tsx`, `finding-cockpit-shared.tsx` | TODO | S | S0.05 | fiecare row din queue are badge; cockpit hero are badge dominant |
| S0.07 | Success cockpit oferă doar `Vezi dosarul` / `Următorul caz` / `Redeschide cazul` unde se aplică | P3, P6, P8 | original S0.T8 + S0.T10 | `finding-cockpit-shared.tsx`, `app/dashboard/.../[findingId]/page.tsx` | TODO | M | S0.01 | grep success: zero link către reports/documente/generator |
| S0.08 | Lifecycle documentar: attach document -> resolve -> evidence în Dosar -> monitoring -> reopen | P3, P4, P6, P8 | original S0.T10 | `generator-drawer.tsx`, `finding-cockpit-shared.tsx`, `finding-kernel.ts`, `app/api/findings/[id]/route.ts`, `dosar` components | TODO | H | S0.07 | E2E documentar complet: generare, atașare, închidere, Dosar, redeschidere |
| S0.09 | DestructiveConfirmDialog minim pentru close/reopen/approve, fără extindere la toate modulele încă | P2, P5, P15 | original S0.T2 / 6.1.3 | `components/evidence-os/DestructiveConfirmDialog.tsx`, cockpit call sites | TODO | M | S0.08 | API resolve nu e chemat fără confirmare UI |
| S0.10 | Copy de CTA în flow: `Deschide finding-ul în cockpit`, `Deschide cazul`, `Intră în firmă` doar pentru overview | P3, P15 | Design skill + live issue | CTA components în portfolio/client/dashboard | TODO | S | S0.02-S0.05 | review manual: CTA spune rezultatul real, nu pasul intermediar |

**Definition of Done S0**

| Flow | Expect |
|---|---|
| Portfolio Alert -> finding | ajunge în cockpit în max 1 click după alertă |
| Portfolio Client `?finding=X` | finding vizibil sau cockpit direct, fără dashboard generic |
| Dashboard next action | dacă știe findingul, deschide cockpitul acelui finding |
| Queue `De rezolvat` | rămâne accesibilă manual, nu forțată în happy path |
| Documentary close | dovada apare în Dosar și cazul poate fi redeschis |

---

## 4. Matrix — Sprint 1: Shell, Nav, Routing

Sprint 1 face produsul inteligibil la nivel de suprafețe: unde sunt, pentru ce firmă lucrez, ce nav am, ce rute supraviețuiesc.

| ID | Decizie IA / Patch | Principii | Source ref | Fișiere afectate estimate | Status | Risc | Depinde de | Validare |
|---|---|---|---|---|---|---|---|---|
| S1.01 | Workspace banner persistent + toast context switch | P2 | 6.1.4 / original S0.T1 | `dashboard-shell.tsx`, `portfolio-shell.tsx`, `workspace-context-banner.tsx`, `workspace-mode-switcher.tsx` | PARTIAL | M | S0 | banner corect în portfolio/org/solo/compliance |
| S1.02 | Nav multi-mode după rol + plan + workspace | P1, P13 | Sec. 3.2 / original S0.T5 | `lib/compliscan/nav-config.ts`, `components/compliscan/navigation.ts`, tests | PARTIAL | H | S1.01 | snapshot tests pentru 5 moduri |
| S1.03 | Mobile nav folosește aceeași hartă ca sidebar | P13 | original S0.T9 | `mobile-bottom-nav.tsx`, nav config | TODO | M | S1.02 | mobile nav nu mai are hardcoded items |
| S1.04 | Redirect middleware pentru rute redundante/zombie, fără delete inițial | P12 | 5.1, 5.2, A.1-A.4, original S0.T3 | `middleware.ts`, `middleware.test.ts` | PARTIAL | H | DG-06 | toate rutele vechi redirectează; target 200 |
| S1.05 | Decizie finală route naming: `/dashboard/resolve` vs `/dashboard/actiuni/remediere` | P12, P13 | DG-04 conflict | `dashboard-routes.ts`, middleware, tests, docs | TODO | H | S0 data | decizie scrisă; helper unic; compat redirects |
| S1.06 | Onboarding destination elimină `/onboarding/finish` și bridge-uri vechi | P14, P12 | 5.2 + original S0.T3/T4 | `onboarding-destination.ts`, onboarding submit, middleware | PARTIAL | M | S1.04 | partner -> portfolio; solo -> dashboard/next action; compliance -> core |
| S1.07 | Batch execution cross-client interzis; bulk create permis cu confirmare | P5 | original S1.T11 + S1.T12 | `portfolio-tasks-page.tsx`, `batch-executor.ts`, `BulkCreateConfirmDialog.tsx`, API batch | TODO | H | S1.02 | UI nu are close/approve multi-client; API close-bulk returns 400 |
| S1.08 | Specialist modules scoase din nav primary pentru solo/partner | P7, P13 | 3.4 + original S0.T5 | `nav-config.ts`, `navigation.ts` | PARTIAL | M | S1.02 | Fiscal/NIS2/DSAR nu apar ca tool mall în nav primar solo/partner |
| S1.09 | Settings canonic pregătit: `Setări` un singur entry, tabs context-aware | P12, P13 | original S1.T4 | `app/dashboard/settings/page.tsx`, `settings-page.tsx`, redirects | PARTIAL | H | S1.05 | `/account/settings` și `/setari` compat, dar nav are un singur Setări |
| S1.10 | Delete rute zombie din filesystem doar după 7 zile de redirects verzi | P12 | original S0.T4 remapat | app route folders legacy | TODO | H | S1.04 + telemetry | PR separat; grep zero referințe; build pass |

---

## 5. Matrix — Sprint 2: Dosar, Monitoring, Console, Specialist Tools

Sprint 2 mută arhitectura pe modelul propus: Dosar unic, Monitorizare ca spine, specialist modules ca tools/console.

| ID | Decizie IA / Patch | Principii | Source ref | Fișiere afectate estimate | Status | Risc | Depinde de | Validare |
|---|---|---|---|---|---|---|---|---|
| S2.01 | Dosar unificat cu 4 tab-uri: Overview / Dovezi / Pachete / Trasabilitate | P6 | original S1.T1 | `app/dashboard/dosar/page.tsx`, `components/compliscan/dosar/*` | PARTIAL | H | S0.08, S1.04 | toate output-urile vechi accesibile în Dosar |
| S2.02 | Obiect `Dovadă` unificat în UI pentru document/notă/fișier/link/screenshot | P6 | original S1.T6 | `EvidenceGapsTab`, `EvidenceCard`, types | TODO | M | S2.01 | fiecare dovadă are kind badge și link la finding |
| S2.03 | Monitoring suite: overview + alerte + approvals + agents | P8, P12 | 6.1.1 / original S1.T2 | `app/dashboard/monitoring/*`, `components/compliscan/monitoring/*`, routes | TODO | H | S1.02 | Radu Flow B fără rute vechi approvals/review/calendar |
| S2.04 | Obiect `Alertă` unificat: drift/legislative/vendor/review/ANAF | P8 | original S1.T5 | `MonitoringAlerts`, `/api/monitoring/alerts`, types | TODO | H | S2.03 | o singură listă de alerte cu source filter |
| S2.05 | `/dashboard/console` pentru Radu + Diana Studio | P7, P13 | 6.1.2 / original S1.T7 | `app/dashboard/console/page.tsx`, `ConsoleIndex`, `ConsoleCard` | TODO | M | S2.03 | 8 cards specialist, greyed dacă neaplicabil |
| S2.06 | Specialist tools dual-mode: fără `findingId` = console/redirect; cu `findingId` = cockpit tool + returnTo | P3, P7 | original S1.T8 | pages DSAR/Fiscal/Vendor/AI/Pay/DORA/Whistle | TODO | H | S2.05 | solo fără findingId redirect; Radu console; finding tool auto-return |
| S2.07 | NIS2 suite cu shell comun, sub-rute păstrate | P7, P12 | original S1.T3 | `app/dashboard/nis2/layout.tsx`, `Nis2SuiteSidebar`, subroutes | TODO | M | S2.05 | deep links cu `findingId` funcționează |
| S2.08 | `/portfolio/vendors` card dominant în portfolio overview | P5, P12 | original S1.T10 | `portfolio-overview-client.tsx`, portfolio vendors page | TODO | S | S1.02 | ruta are un singur entry point vizibil |
| S2.09 | Bridge partner deprecated -> redirect/delete controlat | P12 | original S1.T9 | middleware, old partner routes | TODO | M | S1.04 | `/dashboard/partner*` nu mai este destinație activă |
| S2.10 | Generator standalone moare ca mental model; generatorul trăiește inline în cockpit | P3 | 3.4 #14 + 5.2 | `generator-drawer.tsx`, routes redirects | PARTIAL | M | S0.08 | `/dashboard/generator` redirect; cockpit generator funcționează |
| S2.11 | RoPA/checklists/policies devin findings/dovezi, nu rute primary | P3, P6, P12 | 3.4 #15/#16 + 5.2 | redirects, Dosar, resolve filters | TODO | M | S2.01 | RoPA dovadă în Dosar; checklist -> resolve filters |

---

## 6. Matrix — Sprint 3: Partner GTM & White-label

Sprint 3 face produsul vandabil pentru Diana: brand, livrabile, share links, auditor extern, plan gating.

| ID | Decizie IA / Patch | Principii | Source ref | Fișiere afectate estimate | Status | Risc | Depinde de | Validare |
|---|---|---|---|---|---|---|---|---|
| S3.01 | Brand capture onboarding partner + tab Brand în Setări | P9 | original S2.T1 | `onboarding-form.tsx`, `partner-workspace-step.tsx`, `settings/BrandTab.tsx`, org profile API | TODO | H | S1.09 | partner poate adăuga/edit brand; preview live |
| S3.02 | Export pipeline brand-aware pentru livrabile client-facing | P9, P10 | original S2.T2 | audit pack, annex lite, response pack, trust profile, renewal, shared | TODO | H | S3.01 | PDF/export conține brand cabinet, nu CompliAI |
| S3.03 | Shared token page brand-uită, single-purpose pentru patron | P10 | original S2.T7 | `app/shared/[token]/page.tsx`, share token API | TODO | M | S3.02 | zero meniu; zero cross-link app; approve/întrebări |
| S3.04 | Guest Auditor: sesiune temporară read-only + watermark + manifest SHA-256 | P10, P15 | original S2.T3 | auth, guest store, TeamTab, exports, middleware | TODO | H | S3.02 | auditor expiră, export are footer + manifest |
| S3.05 | Paywall modal contextual la submit, nu butoane moarte | P11 | original S2.T4 | `PaywallModal`, `plan-gate.tsx`, Stripe checkout, portfolio add | TODO | M | S1.02 | al 6-lea client Growth -> modal -> Stripe -> returnAction |
| S3.06 | Deep-link preservation în emails cu token workspace | P2, P13 | original S2.T5 | share-token store, email templates, cron routes, middleware | TODO | H | S0.01 | email drift -> workspace corect -> cockpit direct |
| S3.07 | Applicability edit retroactiv în Settings cu preview impact | P14 | original S2.T6 | ProfileTab, ApplicabilityEditor, recalculate API, kernel | TODO | H | S1.09 | edit -> preview impact -> create/inactivate findings |
| S3.08 | Patronul rămâne destinatar, nu user: magic links single-purpose | P10 | Sec. P10 | claim/renewal/shared/trust pages | PARTIAL | M | S3.02 | paginile publice nu au dashboard/nav produs |

---

## 7. Matrix — Sprint 4: Polish, Viewer, Legacy Removal

Sprint 4 închide resturile: copy, empty states, viewer, reopen UX, legacy code și QA final.

| ID | Decizie IA / Patch | Principii | Source ref | Fișiere afectate estimate | Status | Risc | Depinde de | Validare |
|---|---|---|---|---|---|---|---|---|
| S4.01 | Reopen cu stepper repoziționat după `reopenReason` | P8 | original S3.T1 | finding types, kernel, cockpit | TODO | M | S0.08 | drift_dovada -> pas relevant în cockpit |
| S4.02 | Reopen cascade UI cu impact vizibil | P8, P15 | original S3.T7 | MonitoringAlerts drawer, confirm dialog | TODO | M | S4.01 | arată câte findings se redeschid înainte de confirm |
| S4.03 | `Ce mi se aplică` card în Acasă | P14 | original S3.T2 | dashboard page, ApplicabilitySummaryCard | TODO | S | S3.07 | card compact + link Settings |
| S4.04 | `Ce ține de monitorizat azi` în Acasă pentru non-monitoring users | P8 | original S3.T3 | dashboard page | TODO | S | S2.03 | solo/Entry vede monitorizare degradată |
| S4.05 | Viewer role complet: nav 4 iteme + mutații disabled + API rejects | P13 | original S3.T6 | nav-config, shell, API auth guards | TODO | M | S1.02 | viewer nu poate muta state prin UI/API |
| S4.06 | Confirm destructive cu nume firmă pe toate acțiunile oficiale | P2, P15 | original S3.T4 | DSAR/NIS2/Fiscal/export UI call sites | TODO | M | S0.09 | zero trimiteri oficiale fără confirm |
| S4.07 | Empty states + copy cleanup: fără emoji, fără celebration, fără marketing în produs | P15 | original S3.T5 | EmptyState, resolve, dosar, portfolio, scan, settings | TODO | M | none | grep termeni interziși; review manual |
| S4.08 | Cleanup final: remove legacy components după redirects + telemetry | P12 | original S3.T8 + original S0.T4 | legacy components/routes, batch executor leftovers | TODO | H | S1.10, S2 complete | grep zero referințe; build pass; bundle redus |
| S4.09 | Full persona QA: Diana, Mihai, Radu, Viewer | P1-P15 | Sec. 4 persona flows | Playwright/manual scripts | TODO | M | S0-S4 | top flows trec cap-coadă live/local |

---

## 8. Coverage — cele 15 principii

| Principiu | Implementare principală | Sprint |
|---|---|---|
| P1 Diana baseline | nav multi-mode, portfolio mode, solo ca Diana-lite | S1 |
| P2 Firmă activă persistentă | workspace banner, toast, token workspace email | S1, S3 |
| P3 Un finding = un cockpit | ping-pong fix, specialist tools, generator inline | S0, S2 |
| P4 Cockpit class-aware | ExecutionClassBadge + class-aware flow | S0 |
| P5 Triaj cross-client, execuție per firmă | portfolio tasks triage, bulk create confirm, batch execute forbidden | S1 |
| P6 Output unificat la Dosar | Dosar 4 tab-uri, success path, route redirects | S0, S2 |
| P7 Specialist modules ca unelte | console + dual-mode specialist tools | S2 |
| P8 Monitorizare spine | monitoring suite, home monitoring, reopen | S2, S4 |
| P9 White-label arhitectural | brand capture + export pipeline | S3 |
| P10 Patron destinatar | shared/renewal/trust magic surfaces | S3 |
| P11 Plan gating topologic | Paywall modal + capability hiding | S3 |
| P12 Rute canonice unice | redirect middleware, route naming decision, legacy cleanup | S1, S4 |
| P13 Nav expune spine-ul | nav multi-mode + mobile nav | S1 |
| P14 Onboarding observabil + applicability edit | onboarding destinations, applicability editor, home card | S1, S3, S4 |
| P15 Orchestrator, nu avocat | destructive confirm, copy cleanup, no auto-submit official | S0, S4 |

---

## 9. Coverage — cele 10 primitive

| Primitivă | Unde se implementează vizibil | Sprint |
|---|---|---|
| Firmă | workspace banner + active org validation | S1 |
| Profil firmă | settings profile + applicability edit | S3 |
| Portofoliu | portfolio nav, alerts/tasks/reports/vendors | S1-S2 |
| Scanare | scan as intake, scan results route kept | S1 |
| Finding | cockpit direct, queue, class badge | S0 |
| Dovadă | lifecycle documentar + Dosar Evidence tab | S0, S2 |
| Dosar | unified 4 tabs, success destination | S0, S2 |
| Livrabil | brand-aware exports + shared token page | S3 |
| Alertă | portfolio alerts + monitoring alerts unified | S0, S2 |
| Monitorizare | monitoring suite, home section, reopen cascade | S2, S4 |

---

## 10. Coverage — cele 5 moduri de nav

| Mod | Implementare | Sprint | Validare |
|---|---|---|---|
| Mihai solo | 5 items: Acasă, Scanează, De rezolvat, Dosar, Setări | S1 | nav snapshot + solo flow |
| Diana portfolio | 5 items: Portofoliu, Monitorizare/Alerte, Remediere, Rapoarte client, Setări | S1 | partner portfolio flow |
| Diana client activ | 6/7 items cu `↩ Portofoliu`, Monitoring doar Pro/Studio | S1 | workspace context flow |
| Radu compliance | 6 items + Console condiționat | S1-S2 | compliance flow |
| Viewer | 4 items read-only | S4 | role tests UI/API |

---

## 11. Coverage — module specialist

| Modul | Decizie finală | Matrix item |
|---|---|---|
| NIS2 | suite shell comun + cockpit tool + Radu console | S2.07 |
| DSAR | cockpit tool + console intake Radu | S2.06 |
| Fiscal | console semnale + cockpit tool SPV | S2.06 |
| Vendor Review | cockpit tool + Radu console + `/portfolio/vendors` | S2.06, S2.08 |
| AI Systems | console AI + cockpit tool; EU DB wizard drawer | S2.06 |
| Pay Transparency | cockpit tool; fără console generică | S2.06 |
| DORA | financial console + cockpit tool | S2.06 |
| Whistleblowing | public intake + internal triage that creates findings | S2.06 |
| Agents | Monitoring Agents sub-route | S2.03 |
| Approvals | absorbit în Monitoring Approvals | S2.03 |
| Review Cycles | absorbit în Monitoring Alerte | S2.03 |
| Calendar | absorbit în Monitoring Overview | S2.03 |
| Audit Log | absorbit în Dosar Trasabilitate | S2.01 |
| Generator standalone | moare; generator inline în cockpit | S2.10 |
| RoPA | moare ca rută; finding/dovadă/filter | S2.11 |
| Checklists | moare ca rută; queue/finding | S2.11 |

---

## 12. Coverage — rute care mor

Nu ștergem direct. Secvența e: redirect -> telemetry -> grep/test -> delete.

| Grup | Exemple | Redirect către | Sprint redirect | Sprint delete |
|---|---|---|---|---|
| RO/EN duplicates | `/dashboard/scanari`, `/dashboard/setari`, `/dashboard/rapoarte` | canonical route | S1 | S4 |
| Output legacy | `/dashboard/reports/*`, `/dashboard/audit-log`, `/dashboard/documente` | `/dashboard/dosar?tab=...` | S1/S2 | S4 |
| Zombie execution | `/dashboard/findings`, `/dashboard/checklists`, `/dashboard/generator`, `/dashboard/ropa` | `/dashboard/resolve` or equivalent helper | S1/S2 | S4 |
| Monitoring legacy | `/dashboard/approvals`, `/dashboard/review`, `/dashboard/calendar` | `/dashboard/monitoring/*` | S2 | S4 |
| Partner bridge | `/dashboard/partner`, `/partner/[orgId]` | `/portfolio` / `/portfolio/client/[orgId]` | S1/S2 | S4 |
| Onboarding finish | `/onboarding/finish` | `resolveOnboardingDestination` | S1 | S4 |

---

## 13. Coverage — cele 37 task-uri originale remapate

| Original | Nume original | Sprint nou | Matrix item |
|---|---|---|---|
| S0.T1 | Workspace banner + toast context switch | S1 | S1.01 |
| S0.T2 | DestructiveConfirmDialog | S0/S4 | S0.09, S4.06 |
| S0.T3 | Middleware redirect rute redundante/zombie | S1 | S1.04 |
| S0.T4 | Delete rute zombie din filesystem | S1/S4 | S1.10, S4.08 |
| S0.T5 | Nav-config refactor multi-mode | S1 | S1.02 |
| S0.T6 | Finding class badge | S0 | S0.06 |
| S0.T7 | Dashboard Home refactor — next action dominant | S0/S4 | S0.04, S4.03, S4.04 |
| S0.T8 | Cockpit success path doar Dosar/next case | S0 | S0.07 |
| S0.T9 | Mobile bottom nav | S1 | S1.03 |
| S0.T10 | Fix flow documentar rupt | S0 | S0.08 |
| S1.T1 | Dosar unified cu 4 tab-uri | S2 | S2.01 |
| S1.T2 | `/dashboard/monitoring` overview + sub-rute | S2 | S2.03 |
| S1.T3 | NIS2 suite shell comun | S2 | S2.07 |
| S1.T4 | `/dashboard/settings` consolidat | S1 | S1.09 |
| S1.T5 | Consolidare Alertă | S2 | S2.04 |
| S1.T6 | Consolidare Dovadă | S2 | S2.02 |
| S1.T7 | `/dashboard/console` | S2 | S2.05 |
| S1.T8 | Console mode module specialist | S2 | S2.06 |
| S1.T9 | Bridge partner deprecated | S2/S4 | S2.09, S4.08 |
| S1.T10 | `/portfolio/vendors` card | S2 | S2.08 |
| S1.T11 | Creare bulk cu dialog scope | S1 | S1.07 |
| S1.T12 | Eliminare batch-execute din `/portfolio/tasks` | S1 | S1.07 |
| S2.T1 | Brand capture + Brand tab | S3 | S3.01 |
| S2.T2 | Export pipeline brand-aware | S3 | S3.02 |
| S2.T3 | Guest Auditor | S3 | S3.04 |
| S2.T4 | Paywall modal contextual | S3 | S3.05 |
| S2.T5 | Deep-link emails | S3 | S3.06 |
| S2.T6 | Applicability edit retroactiv | S3 | S3.07 |
| S2.T7 | Shared token page brand-uit | S3 | S3.03 |
| S3.T1 | Reopen cu stepper repoziționat | S4 | S4.01 |
| S3.T2 | `Ce mi se aplică` în Acasă | S4 | S4.03 |
| S3.T3 | Monitoring status în Acasă | S4 | S4.04 |
| S3.T4 | Confirm destructive oficial | S4 | S4.06 |
| S3.T5 | Empty states + copy cleanup | S4 | S4.07 |
| S3.T6 | Viewer rol | S4 | S4.05 |
| S3.T7 | Reopen cascade UI | S4 | S4.02 |
| S3.T8 | Cleanup final legacy components | S4 | S4.08 |

Task-uri noi adăugate din testarea live, neacoperite explicit în planul original:

| Nou | Nume | Sprint | Motiv |
|---|---|---|---|
| LIVE.T1 | Direct cockpit route from portfolio alerts/client/dashboard | S0 | bug real live: user împins prin 4 ecrane până la același finding |
| LIVE.T2 | Route helper + hardcode cleanup for cockpit links | S0/S1 | conflict live/local între `/resolve` și `/actiuni/remediere` |

---

## 14. Ce NU construim, dar păstrăm ca decizie explicită

| Decizie din propunere | Status | Motiv |
|---|---|---|
| Redesign complet cockpit | PARKED | Cockpitul are logică funcțională. În S0 reparăm rutarea și lifecycle; design refactor vine după stabilitate. |
| Nou generator documente | PARKED | Generatorul existent se montează inline; kernel nou nu e IA work. |
| Nou engine monitoring | PARKED | Engine-uri există; S2 le expune mai bine. |
| Mobile app | REJECTED pentru v1 | Nu ajută lansarea. |
| Analytics dashboard intern CompliAI-side | REJECTED pentru v1 | Zero valoare directă pentru user. |
| Multi-language UI | REJECTED pentru v1 | RO-only. |
| AI chat ca feature primary | PARKED | Endpoint poate rămâne, UI nu devine nav primary. |

---

## 15. Validation matrix globală

| Schimbare | Validare minimă |
|---|---|
| Docs only | nu necesită test runtime; verificare manuală document |
| CTA/routing finding | Playwright/manual browser + lint |
| Middleware/routes | `middleware.test.ts` + smoke target 200 |
| Nav config | unit snapshot pentru 5 moduri + mobile |
| Cockpit/documentary lifecycle | E2E documentar + API tests finding state |
| Dosar/exports | E2E + export smoke |
| Auth/guest/viewer | API tests + middleware tests + E2E |
| Legacy delete | full build + grep zero referințe + redirects verzi |

---

## 16. Prima ordine de execuție reală

Nu pornim cu redirecturi mari. Pornim cu bugul confirmat:

1. `S0.01` — route helper cockpit.
2. `S0.04` — dashboard next action direct cockpit.
3. `S0.03` — client context `?finding=X`.
4. `S0.02` — portfolio alerts direct cockpit + workspace switch.
5. `S0.05` — queue rămâne doar browse.
6. `S0.07` + `S0.08` — lifecycle documentar complet.
7. `S0.06` — class badge pentru claritate.

După aceste 7 patch-uri, verificăm live/local dacă ping-pong-ul a dispărut. Abia apoi intrăm în S1 routing/nav.

---

## 17. Definiția “100% implementat”

Documentul `IA-UX-PROPUNERE (1).md` este considerat implementat 100% când:

- toate principiile P1-P15 sunt `DONE` sau au excepție scrisă;
- toate cele 10 primitive au reprezentare vizibilă coerentă;
- toate cele 5 moduri nav trec snapshot + flow manual;
- toate cele 37 task-uri originale sunt `DONE`, `PARKED` sau `REJECTED` explicit;
- toate rutele legacy au redirect sau au fost șterse după telemetry;
- Flow Diana, Mihai, Radu și Viewer trec cap-coadă;
- nu mai există ping-pong finding între portfolio/client/dashboard/queue/cockpit;
- Dosar este singurul output surface;
- specialist modules nu mai apar ca tool mall pentru solo/partner;
- copy-ul produsului respectă tonul `orchestrator, nu avocat`.

---

## 18. Protocol local-first pentru implementare

Acest protocol este obligatoriu pentru S1-S4 și recomandat pentru orice patch non-hotfix. Motivul: documentul schimbă arhitectura vizibilă a produsului, deci nu se validează direct în live.

| Etapă | Unde lucrăm | Ce livrăm | Cine aprobă | Când mergem mai departe |
|---|---|---|---|---|
| A. Worktree curat | branch `codex/ia-sX-*` pornit din `origin/main` | patch mic, fără amestec cu branch-uri preview | Codex/Claude Code | `git status` curat înainte de start; diff limitat la matrix item |
| B. Runtime local | `localhost` pe port declarat în raport | flow funcțional + screenshoturi locale | Founder + agent care implementează | browser smoke trece; user vede pagina |
| C. PR preview | GitHub PR către `main` | diff reviewabil + raport parity | Founder | doar dacă local bate live-ul curent |
| D. Merge main | `main` stabil | commit atomic | Founder/maintainer | lint/test/build relevante verzi |
| E. Production | proiect Vercel real `compliscanag` | deploy monitorizat | Founder/maintainer | verificare URL live, nu doar status deployment |

**Regulă:** S1-S4 nu se împing în producție doar pentru că build-ul trece. Se împing doar când flow-ul local e vizual și operațional mai bun decât live.

**Excepție:** hotfix-urile P0 pentru buguri dovedite în producție pot merge separat, dar trebuie să fie izolate, mici și reversibile.

---

## 19. Reguli de worktree și branch

Repo-ul principal poate rămâne murdar cu experimente locale, documente și branch-uri preview. Implementarea IA/UX nu se face direct acolo.

| Regulă | Aplicare |
|---|---|
| Worktree nou per sprint major | `git worktree add /tmp/compliai-ia-s1-shell -b codex/ia-s1-shell origin/main` |
| Branch prefix | `codex/ia-s0-*`, `codex/ia-s1-*`, etc. |
| Un patch = un matrix item sau un grup mic inseparabil | ex. `S0.01 + S0.04` acceptabil; `S1.02 + S2.01` interzis |
| Nu edităm cod în `preview/integration-*` pentru IA canon | acel branch poate conține istoric local, nu e baza curată |
| Nu folosim `git add .` | staging explicit pe fișierele atinse |
| Nu rulăm deploy prod din worktree temporar nelegat | deploy doar prin PR/merge sau link explicit la proiectul `compliscanag` |
| Orice schimbare UI are screenshot local | fără screenshot, statusul rămâne `PARTIAL` |

---

## 20. Gate de validare per sprint

| Sprint | Gate minim local | Gate vizual | Gate înainte de PR | Gate live |
|---|---|---|---|---|
| S0 | unit/API tests pe routing + browser smoke flow finding | screenshot cockpit direct din portfolio/client/dashboard | build + lint + smoke local | verificare pe `compliscanag`: alertă/client/dashboard -> cockpit |
| S1 | nav snapshot pentru cele 5 moduri + middleware tests | screenshot sidebar pentru Solo, Diana portfolio, Diana client, Radu | build + route smoke legacy -> canonical | verificare fără link rot pe rute vechi |
| S2 | Dosar + Monitoring E2E local | screenshot Dosar 4 tab-uri + Monitoring suite + Console | build + export smoke | verificare Dosar output unic și specialist handoff |
| S3 | brand/export/shared-token tests | screenshot PDF/export/shared page brand-uit | build + export smoke + auth token tests | verificare white-label pe livrabile reale safe |
| S4 | full persona smoke | screenshot Mihai/Diana/Radu/Viewer | build + grep legacy + E2E critic | verificare finală pre-launch |

Pentru orice sprint, dacă gate-ul vizual e respins, nu se merge în PR. Refacem local.

---

## 21. Cum actualizăm statusul în matrice

Statusul unui item nu se schimbă pe impresie. Se schimbă doar cu dovadă.

| Status nou | Condiție minimă |
|---|---|
| `TODO -> IN_PROGRESS` | branch/worktree creat + fișiere estimate confirmate |
| `IN_PROGRESS -> PARTIAL` | patch funcțional parțial, dar lipsește flow/test/screenshot |
| `IN_PROGRESS -> DONE` | cod + validare + screenshot/flow + raport scurt |
| `PARTIAL -> DONE` | golul explicit a fost închis |
| `TODO/PARTIAL -> PARKED` | decizie scrisă cu motiv și impact |
| `TODO/PARTIAL -> REJECTED` | decizie scrisă că nu intră în produs |

Formatul raportului pe fiecare item implementat:

```markdown
### Matrix item: Sx.yy
Status: DONE/PARTIAL
Branch:
Commit/PR:
Ce s-a schimbat:
Ce nu s-a atins:
Validare:
Screenshot local:
Riscuri rămase:
```

---

## 22. Patch order recomandat după S0

După ce S0 este stabil, nu sărim direct la Dosar sau design polish. Ordinea sănătoasă este:

| Ordine | Matrix item | Motiv |
|---|---|---|
| 1 | S1.01 Workspace banner | fără context firmă clar, orice nav nou rămâne confuz |
| 2 | S1.02 Nav multi-mode | stabilește suprafețele vizibile pe rol/plan |
| 3 | S1.05 Route naming decision | elimină conflictul `/resolve` vs `/actiuni/remediere` înainte de redirecturi masive |
| 4 | S1.04 Redirect middleware | protejează rutele vechi fără să ștergem cod |
| 5 | S1.07 No batch execution cross-client | fixează regula Diana: triaj da, execuție nu |
| 6 | S1.09 Settings canonical | pregătește Brand + applicability edit din S3 |
| 7 | S2.01 Dosar unified | abia după rute/nav stabile mutăm output-ul |
| 8 | S2.03 Monitoring suite | spine post-close și reopen |
| 9 | S2.05 + S2.06 Console + specialist dual-mode | transformă modulele în tools, nu produse paralele |
| 10 | S3.01-S3.03 Brand/export/shared | face produsul vandabil pentru Diana |
| 11 | S4.05 Viewer + S4.07 copy cleanup | polish final, fără să mai schimbe spine-ul |

---

## 23. Contract pentru Claude Design / Claude Web

Dacă folosim Claude Design sau Claude Web pentru mockup-uri, nu îi cerem „fă aplicația mai frumoasă”. Îi dăm contract punctual:

| Ce primește | De ce |
|---|---|
| `docs/IA-UX-PROPUNERE (1).md` | North Star arhitectural |
| `docs/IA-UX-IMPLEMENTATION-MATRIX.md` | ce are voie să schimbe acum și ce sprint vizează |
| `docs/CLAUDE-FULL-SPEC-APP.md` | funcționalități reale, ca să nu inventeze produs |
| `docs/CLAUDE-DESIGN-FASTSTART-2026-04-22.md` | design language și tokens |
| fișierele runtime ale suprafeței vizate | codul câștigă peste screenshot |
| screenshot live/local actual | să compare real, nu imaginar |

Ce nu primește ca libertate:

- nu elimină feature-uri pentru estetică;
- nu redenumește termeni canonici;
- nu mută execuția findings-urilor în afara cockpitului;
- nu introduce nav items noi fără mapping în matrice;
- nu proiectează patronul ca user de aplicație;
- nu transformă modulele specialist în produse paralele.

Output cerut de la design:

```markdown
## Parity report
Kept:
Changed:
Removed accidentally:
Needs implementation:
Questions:
Screens:
```

Fără parity report, mockup-ul nu intră în implementare.

---

## 24. Hotfix vs implementare IA

Ca să nu mai amestecăm live-ul cu redesign-ul:

| Tip lucru | Exemple | Merge/live? |
|---|---|---|
| Hotfix producție | ping-pong finding live, auth leak, export public, crash runtime | poate merge imediat, dacă e izolat și testat |
| IA implementation | nav multi-mode, Dosar unified, Monitoring suite, specialist tools | local-first, apoi PR preview, apoi live doar după review |
| Design iteration | portofoliu v2, alerts v2, cockpit visual polish | local/mockup-first, nu live direct |
| Docs/spec | matrice, full spec, design contract | poate sta local/untracked până e aprobat |

Hotfix-ul nu devine pretext pentru redesign. Redesign-ul nu blochează repararea unui bug critic real.

---

## 25. Blocatoare înainte de Sprint 1

Sprint 1 nu pornește până nu avem aceste răspunsuri scrise sau asumate implicit:

| Blocator | Default pragmatic dacă nu decidem explicit |
|---|---|
| Ruta canonică cockpit | păstrăm helper unic și compat redirect; naming final se decide în S1.05 |
| Target v1 public | Diana / partner contabil CECCAR este baseline |
| Live deploy strategy | PR către `main` + Vercel Git integration; fără deploy manual prod din worktree nelegat |
| Ce se întâmplă cu branch-ul preview murdar | nu e bază de implementare IA; îl tratăm ca istoric/experiment local |
| Când ștergem legacy | după redirects + telemetry + grep + build, nu înainte |

---

## 26. Verdict de execuție

Documentul este bun de implementat **100% ca direcție**, dar nu 100% ca big-bang patch.

Executăm astfel:

1. S0 repară spine-ul și ping-pong-ul.
2. S1 face shell/nav/routing inteligibile.
3. S2 mută output-ul și modulele în modelul corect.
4. S3 face produsul vandabil pentru Diana.
5. S4 curăță legacy și polish.

Dacă în timpul implementării codul real contrazice documentul, nu forțăm documentul orbește. Marcăm itemul `Needs confirmation`, decidem, apoi actualizăm matricea.
