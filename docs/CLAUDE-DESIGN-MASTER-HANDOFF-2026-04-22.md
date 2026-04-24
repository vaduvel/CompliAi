# CLAUDE-DESIGN-MASTER-HANDOFF-2026-04-22.md

Status: `single-file master handoff`
Date: `2026-04-22`
Repo snapshot: `preview/integration-2026-04-21`
GitHub repo: `https://github.com/vaduvel/CompliAi.git`
Primary audience: `Claude Design`
Secondary audience: `orice model extern care trebuie sa redeseneze CompliAI fara sa piarda functionalitate`

> Daca dai un singur document lui Claude Design, da-l pe acesta.
> Nu mai are nevoie de alte 4-5 documente ca sa inteleaga produsul la nivel suficient pentru redesign.

---

## 1. Ce este acest document

Acesta este documentul unic care combina:

- contextul de produs
- noua IA tinta
- adevarul rece despre paginile reale folosite azi
- functionalitatile care trebuie pastrate
- guardrails de design
- promptul final gata de lipit

Scopul documentului:

- Claude Design sa poata redesena CompliAI pe noua IA
- fara sa piarda page parity
- fara sa taie flows reale
- fara sa confunde live-ul vechi cu directia canonica

Acest document este construit din:

- codul curent din repo
- `docs/DESTINATION.md`
- `docs/IA-TARGET-DIAGRAM.md`
- `docs/DESIGN-BRIEF.md`
- `docs/STATE-NOW.md`
- maparea curenta din `docs/CLAUDE-DESIGN-CURRENT-APP-PAGE-MAP.md`
- contractul de non-negotiables din `docs/CLAUDE-DESIGN-FEATURE-PARITY-CONTRACT-2026-04-22.md`

Regula mare:

- pentru **feature parity**, castiga codul curent
- pentru **ce nu ai voie sa pierzi pe paginile dense**, castiga `CLAUDE-DESIGN-FEATURE-PARITY-CONTRACT-2026-04-22.md`
- pentru **directie de IA si shell**, castiga `DESTINATION`
- pentru **limbaj vizual si nivel de ambitie**, castiga `DESIGN-BRIEF`

---

## 2. Ce este CompliAI, pe scurt

CompliAI este un workspace operational de conformitate pentru Romania, construit pentru:

- consultanti / contabili / auditori care gestioneaza mai multe firme
- responsabili compliance interni
- IMM-uri / solo users care vor ghidaj clar si actiune simpla

Regimurile principale:

- GDPR
- e-Factura / ANAF / fiscal
- NIS2
- AI Act
- DORA
- Pay Transparency
- Whistleblowing
- vendor review / evidence / audit packs

Promisiunea produsului:

- afli ce ti se aplica
- scanezi ce ai
- vezi ce lipseste sau ce este gresit
- rezolvi in flux operational
- atasezi dovezi
- exporti livrabile reale pentru client / control / audit

Produsul NU promite:

- verdict juridic final automat
- “100% compliant”
- semnare oficiala automata

Produsul ofera:

- structura
- semnale
- prioritizare
- drafturi
- exporturi
- dovada audit-shaped

---

## 3. Cine este persona principala

### 3.1 Diana — partner consultant

Acesta este userul principal pentru redesign.

Profil:

- consultant roman
- 10-30 clienti SRL
- intra zilnic 10 minute in produs
- vrea vedere cross-client
- vrea batch actions
- vrea rapoarte si pachete livrabile clientilor

De aici decurge:

- portfolio-first conteaza
- densitatea conteaza
- triage rapid conteaza
- bulk actions conteaza
- shell-ul nu trebuie sa fie “pretty but shallow”

### 3.2 Radu — compliance intern

Vrea profunzime in:

- NIS2
- vendor review
- exporturi
- audit
- settings
- flows mai serioase pe framework-uri

### 3.3 Mihai — solo / owner

Vrea:

- claritate
- simplificare
- documente
- de rezolvat
- nu vrea un UI copleșitor

---

## 4. Noua IA tinta

Noua IA dorita este:

### Partner mode

Landing default:

- `/portfolio`

Zone:

- `Portofoliu`
  - overview
  - alerts
  - remediere/tasks
  - vendors
  - reports
- `Firma selectata`
  - Acasa
  - Scaneaza
  - Monitorizare
  - Actiuni
  - Rapoarte
  - Setari

### Compliance mode

Fara portfolio, doar zona per-firma:

- Acasa
- Scaneaza
- Monitorizare
- Actiuni
- Rapoarte
- Setari

### Solo mode

Simplificat:

- Acasa
- Scaneaza
- De rezolvat
- Documente
- Rapoarte
- Setari

### Viewer mode

Doar:

- Acasa
- Task-urile mele / read-only work
- Documente
- Setari cont

Important:

- IA tinta este noua structura de shell
- dar flows reale existente azi trebuie pastrate chiar daca se remapeaza pe alta pagina sau alta ierarhie

---

## 5. Ce trebuie sa inteleaga Claude Design despre realitatea curenta

Aplicatia curenta are:

- `68` pagini `page.tsx`
- `198` fisiere API `route.ts`
- `93` fisiere top-level in `components/compliscan/*`
- `11` primitive DS in `components/ui/ds/*`

Realitatea importanta:

- live-ul vechi si candidate-ul local nu sunt identice
- shell-ul si nav-ul sunt in tranzitie
- exista si rute canonice noi, si rute bridge / legacy
- design system-ul nou exista partial, dar runtime-ul vizual inca foloseste mult `components/evidence-os/*`

Redesignul corect:

- NU porneste de la live ca adevar final
- NU porneste doar din docs ca si cum produsul n-ar exista
- porneste din combinatie:
  - codul curent
  - IA tinta
  - page parity

---

## 6. Non-negotiables pentru redesign

Claude Design NU are voie:

- sa elimine pagini reale doar pentru ca par vechi
- sa elimine flows profunde doar pentru ca sunt multe
- sa transforme pagini operationale in landing screens decorative
- sa ascunda batch actions
- sa rupa legatura intre portfolio si org workspace
- sa piarda exporturile si actiunile de dovada
- sa ignore paginile secundare doar pentru ca nu sunt in nav primar

Claude Design TREBUIE:

- sa redeseneze shell-ul
- sa redeseneze paginile principale
- sa remapeze paginile secundare in mod explicit
- sa spuna unde ramane fiecare flow real
- sa mentina sau sa imbunatateasca feature parity

---

## 7. Design direction dorita

Visual direction dorita:

- calm authority
- operational SaaS, nu startup glossy
- mai putin “cute cards”
- mai multa densitate controlata
- typography serioasa
- information hierarchy clara
- page sections cu intentie dominanta
- state-uri shared curate

Trebuie evitate:

- UI prea aerisit pentru un produs operational
- nav prea jucausa
- supra-simplificare de tip “dashboard cu 6 carduri goale”
- design care arata bine in Figma dar nu respecta complexitatea reala

---

## 8. Cele 3 suprafete care vand produsul

Acestea sunt cele mai importante in redesign:

### 8.1 Inbox cross-portfolio

Ruta:

- `/portfolio/alerts`

JTBD:

- Diana intra dimineata
- vede ce a aparut peste noapte
- triaza rapid
- face batch actions
- deschide doar cazurile care merita

### 8.2 Client drill-in

Ruta:

- `/portfolio/client/[orgId]`

JTBD:

- vede starea unei firme
- decide daca intra in workspace per-firma
- vede findings focusate, NIS2 context, vendor review context

### 8.3 Cockpit / remediere / dovada

Rute:

- `/dashboard/actiuni/remediere`
- `/dashboard/actiuni/remediere/[findingId]`

JTBD:

- rezolva problema
- ataseaza dovada
- genereaza documente
- programeaza review daca trebuie
- inchide cazul corect

---

## 9. Mapa exacta a paginilor reale

Mai jos este mapa paginilor reale din aplicatie. Aceasta este partea cea mai importanta pentru feature parity.

## 9A. Public / auth / legal

| Route | File | Ce contine azi | Ce trebuie pastrat |
|---|---|---|---|
| `/` | `app/page.tsx` | landing page, hero, explicarea fluxului, CTA-uri | narativul de produs si CTA-urile |
| `/login` | `app/login/page.tsx` | login/register mode, erori, reset handoff | flow auth complet |
| `/register` | `app/register/page.tsx` | redirect la login register mode | compatibilitate |
| `/reset-password` | `app/reset-password/page.tsx` | reset password form + states | flow complet reset |
| `/pricing` | `app/pricing/page.tsx` | pricing pe personas | planuri si CTA comerciale |
| `/privacy` | `app/privacy/page.tsx` | legal page | continut legal |
| `/terms` | `app/terms/page.tsx` | legal page | continut legal |
| `/dpa` | `app/dpa/page.tsx` | DPA public | continut legal |
| `/claim` | `app/claim/page.tsx` | ownership claim flow | claim intact |
| `/onboarding` | `app/onboarding/page.tsx` | onboarding si redirect inteligent | intrare in produs |
| `/onboarding/finish` | `app/onboarding/finish/page.tsx` | final onboarding redirect | inchidere onboarding |
| `/demo/[scenario]` | `app/demo/[scenario]/page.tsx` | demo scenarios | demo support |
| `/shared/[token]` | `app/shared/[token]/page.tsx` | public shared dossier | share flow extern |
| `/trust` | `app/trust/page.tsx` | trust landing | trust center public |
| `/trust/[orgId]` | `app/trust/[orgId]/page.tsx` | public trust profile | trust per client |
| `/whistleblowing/[token]` | `app/whistleblowing/[token]/page.tsx` | public whistleblowing submit | submit public complet |
| `/genereaza-dpa` | `app/genereaza-dpa/page.tsx` | free DPA generator | lead magnet intact |
| `/genereaza-politica-gdpr` | `app/genereaza-politica-gdpr/page.tsx` | free GDPR policy generator | lead magnet intact |

## 9B. Partner portfolio pages

| Route | File / Surface | Ce contine azi | Actiuni cheie care trebuie pastrate |
|---|---|---|---|
| `/portfolio` | `app/portfolio/page.tsx` -> `components/compliscan/portfolio-overview-client.tsx` | KPI-uri cross-client, lista firme, search, sort, bulk selection, quick add, import CSV, diagnostic export, trust link, delete client | add client, import, bulk actions, diagnostic export, open trust, open client |
| `/portfolio/alerts` | `app/portfolio/alerts/page.tsx` -> `components/compliscan/portfolio-alerts-page.tsx` | inbox cross-client, top priorities, grouped by day, selection, sticky bulk bar, filters | triage, batch actions, open client drill-in |
| `/portfolio/client/[orgId]` | `app/portfolio/client/[orgId]/page.tsx` -> `components/compliscan/client-context-panel.tsx` | client context, score, focused finding, NIS2 snapshot, vendor review snapshot, quick actions, diagnostic export, trust profile, enter workspace | open cockpit, enter org workspace, quick actions, preserve context from inbox |
| `/portfolio/tasks` | `app/portfolio/tasks/page.tsx` -> `components/compliscan/portfolio-tasks-page.tsx` | cross-client tasks, grouping, selection, batch modal | batch draft / generate / filter |
| `/portfolio/vendors` | `app/portfolio/vendors/page.tsx` -> `components/compliscan/portfolio-vendors-page.tsx` | aggregated vendor registry | browse and inspect vendors |
| `/portfolio/reports` | `app/portfolio/reports/page.tsx` -> `components/compliscan/portfolio-reports-page.tsx` | portfolio reports, scheduled reports, white-label config | branding, schedules, portfolio exports |

## 9C. Org primary pages

| Route | File / Surface | Ce contine azi | Ce trebuie pastrat obligatoriu |
|---|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | per-org home, score, activity, next best actions | dashboard summary si continuation |
| `/dashboard/scan` | `app/dashboard/scan/page.tsx` -> `components/compliscan/scan-page.tsx` | upload document/text/manifest/yaml, site scan, autodiscovery, findings nudge | toate sursele de scanare + continuation spre remediere |
| `/dashboard/scan/history` | `app/dashboard/scan/history/page.tsx` -> `components/compliscan/scan-history-page.tsx` | scan history | history si reopen |
| `/dashboard/scan/results/[scanId]` | `app/dashboard/scan/results/[scanId]/page.tsx` | results detail, findings, severity grouping, recent scans | results detail complet |
| `/dashboard/actiuni/remediere` | `app/dashboard/actiuni/remediere/page.tsx` -> `components/compliscan/resolve-page.tsx` | finding queue, urgency queue, filters, tabs, quick-nav to other workspaces | full finding inbox |
| `/dashboard/actiuni/remediere/[findingId]` | `app/dashboard/actiuni/remediere/[findingId]/page.tsx` | finding cockpit complet, evidence, generator hooks, review cycles, state transitions, many return flows | cockpitul complet; nu ai voie sa pierzi nimic |
| `/dashboard/monitorizare/conformitate` | `app/dashboard/monitorizare/conformitate/page.tsx` | hub per framework, AI inline, handoff clar spre alte workspaces | framework hub + handoff |
| `/dashboard/monitorizare/alerte` | `app/dashboard/monitorizare/alerte/page.tsx` | drifts, alerts, links catre resolve / reports | monitoring si drift workflow |
| `/dashboard/monitorizare/sisteme-ai` | `app/dashboard/monitorizare/sisteme-ai/page.tsx` | AI systems workspace: overview, inventory, discovery, drift, review, shadow AI | discovery + inventory + drift + review |
| `/dashboard/monitorizare/sisteme-ai/eu-db-wizard` | `app/dashboard/monitorizare/sisteme-ai/eu-db-wizard/page.tsx` | EU database wizard | wizard dedicat |
| `/dashboard/monitorizare/nis2` | `app/dashboard/monitorizare/nis2/page.tsx` | NIS2 workspace: assessment, incidents, vendors, maturity card, rescue banner | NIS2 ca workspace complet |
| `/dashboard/monitorizare/nis2/eligibility` | `app/dashboard/monitorizare/nis2/eligibility/page.tsx` | eligibility wizard | wizard dedicat |
| `/dashboard/monitorizare/nis2/governance` | `app/dashboard/monitorizare/nis2/governance/page.tsx` | governance members, training/certification | governance flow |
| `/dashboard/monitorizare/nis2/inregistrare-dnsc` | `app/dashboard/monitorizare/nis2/inregistrare-dnsc/page.tsx` | DNSC registration, correspondence log, export | registration workflow |
| `/dashboard/monitorizare/nis2/maturitate` | `app/dashboard/monitorizare/nis2/maturitate/page.tsx` | maturity scores detail | maturity view |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` -> `components/compliscan/reports-page.tsx` | export center, share token, counsel brief, generated docs, snapshot status | report center real |
| `/dashboard/reports/policies` | `app/dashboard/reports/policies/page.tsx` -> `components/compliscan/reports-policies-page.tsx` | policies workspace | policies intact |
| `/dashboard/reports/vault` | `app/dashboard/reports/vault/page.tsx` -> `components/compliscan/reports-vault-page.tsx` | vault, traceability, audit packs, ANSPDCP, bundle exports | audit/export readiness intact |
| `/dashboard/reports/trust-center` | `app/dashboard/reports/trust-center/page.tsx` -> `components/compliscan/reports-trust-center-page.tsx` | trust center intern | trust management |
| `/dashboard/reports/audit-log` | `app/dashboard/reports/audit-log/page.tsx` -> `components/compliscan/reports-audit-log-page.tsx` | audit trail | audit log vizibil |
| `/dashboard/documente` | `app/dashboard/documente/page.tsx` -> `components/compliscan/documents-page.tsx` | generated docs, scanned archive, prepared packs | document hub |
| `/dashboard/setari` | `app/dashboard/setari/page.tsx` -> `components/compliscan/settings-page.tsx` | settings summary, members, white-label, autonomy, alerts prefs, health/readiness, repo sync | settings dens, nu simplificat excesiv |
| `/dashboard/setari/abonament` | `app/dashboard/setari/abonament/page.tsx` -> `components/compliscan/settings-billing-page.tsx` | billing | billing page |
| `/dashboard/setari/scheduled-reports` | `app/dashboard/setari/scheduled-reports/page.tsx` -> `components/compliscan/scheduled-reports-manager.tsx` | scheduled reports manager | scheduled reports intact |

## 9D. Org secondary and specialist pages

Aceste pagini nu trebuie omise. Poate nu sunt toate top-level in shell, dar sunt reale si utile.

| Route | File / Surface | Ce contine azi |
|---|---|---|
| `/dashboard/approvals` | `app/dashboard/approvals/page.tsx` -> `components/compliscan/approvals-page.tsx` | approval queue si detail panel |
| `/dashboard/calendar` | `app/dashboard/calendar/page.tsx` | calendar grouped events si deep links |
| `/dashboard/checklists` | `app/dashboard/checklists/page.tsx` | remediation board si checklist workflow |
| `/dashboard/dora` | `app/dashboard/dora/page.tsx` | DORA incident + TPRM workspace |
| `/dashboard/dosar` | `app/dashboard/dosar/page.tsx` -> `components/compliscan/dosar-page.tsx` | dossier surface |
| `/dashboard/dsar` | `app/dashboard/dsar/page.tsx` | DSAR CRUD si draft flow |
| `/dashboard/fiscal` | `app/dashboard/fiscal/page.tsx` | fiscal workspace complet: validator, repair, signals, discrepancies, SPV |
| `/dashboard/generator` | `app/dashboard/generator/page.tsx` | long-form generator workspace |
| `/dashboard/pay-transparency` | `app/dashboard/pay-transparency/page.tsx` -> `components/compliscan/pay-transparency-page.tsx` | pay transparency flow |
| `/dashboard/review` | `app/dashboard/review/page.tsx` -> `components/compliscan/review-cycles-page.tsx` | review cycles |
| `/dashboard/ropa` | `app/dashboard/ropa/page.tsx` | ROPA generator/editor |
| `/dashboard/vendor-review` | `app/dashboard/vendor-review/page.tsx` | vendor review workspace |
| `/dashboard/whistleblowing` | `app/dashboard/whistleblowing/page.tsx` | whistleblowing admin workspace |
| `/dashboard/agents` | `app/dashboard/agents/page.tsx` | agent / automation workspace |
| `/dashboard/actiuni/remediere/support` | `app/dashboard/actiuni/remediere/support/page.tsx` -> `components/compliscan/resolve-page.tsx` | support view asociata remediere |

## 9E. Bridge / redirect / compatibility pages

Acestea nu trebuie desenate ca suprafete noi de produs:

| Route | Ce face |
|---|---|
| `/dashboard/actiuni/politici` | redirect la `/dashboard/reports/policies` |
| `/dashboard/findings/[id]` | redirect la `/dashboard/actiuni/remediere/[findingId]` |
| `/dashboard/partner` | bridge legacy |
| `/dashboard/partner/[orgId]` | bridge legacy |

---

## 10. API domains pe care designul trebuie sa le respecte

Designul nu trebuie sa inventeze UI incompatibil cu API-ul actual.

Familii importante:

- `auth/*`
- `portfolio/*`
- `partner/*`
- `dashboard/*`
- `findings/*`
- `reports/*`
- `exports/*`
- `documents/*`
- `nis2/*`
- `ai-systems/*`
- `ai-conformity`
- `fiscal/*`
- `efactura/*`
- `vendor-review/*`
- `dsar/*`
- `whistleblowing/*`
- `settings/*`
- `review-cycles/*`
- `approvals/*`

Tipuri de actiuni reale deja existente:

- fetch state
- batch actions
- create / edit / delete
- evidence attachment
- export PDF / JSON / bundle
- trust/share links
- white-label config
- scheduled reports
- quick-add
- import CSV
- select workspace / switch org

---

## 10B. Claude Design trebuie sa inspecteze codul local

Da, acest handoff presupune ca modelul poate citi local repo-ul.

Regula corecta este:

- foloseste acest document pentru orientare
- apoi deschide local fisierele reale mentionate aici
- trateaza codul din acele fisiere ca sursa finala pentru feature parity

Nu redesign-uiesti doar din textul acestui document.
Il folosesti ca harta, apoi cobori in fisierele reale.

### Fisiere pe care trebuie sa le inspectezi direct

Metoda preferata de acces la cod:

- importa repo-ul din GitHub: `https://github.com/vaduvel/CompliAi.git`
- daca asta nu este posibil, foloseste zip / fisiere locale
- dupa import, inspecteaza direct path-urile de mai jos

Shell / nav / frame:

- `components/compliscan/dashboard-shell.tsx`
- `components/compliscan/navigation.ts`
- `lib/compliscan/nav-config.ts`
- `lib/compliscan/dashboard-routes.ts`

Suprafete P1 partner:

- `app/portfolio/page.tsx`
- `components/compliscan/portfolio-overview-client.tsx`
- `app/portfolio/alerts/page.tsx`
- `components/compliscan/portfolio-alerts-page.tsx`
- `app/portfolio/client/[orgId]/page.tsx`
- `components/compliscan/client-context-panel.tsx`

Suprafete P1 org:

- `app/dashboard/page.tsx`
- `app/dashboard/scan/page.tsx`
- `components/compliscan/scan-page.tsx`
- `app/dashboard/actiuni/remediere/page.tsx`
- `components/compliscan/resolve-page.tsx`
- `app/dashboard/actiuni/remediere/[findingId]/page.tsx`
- `app/dashboard/monitorizare/conformitate/page.tsx`
- `app/dashboard/monitorizare/sisteme-ai/page.tsx`
- `app/dashboard/monitorizare/nis2/page.tsx`
- `app/dashboard/reports/page.tsx`
- `components/compliscan/reports-page.tsx`
- `app/dashboard/reports/vault/page.tsx`
- `components/compliscan/reports-vault-page.tsx`
- `app/dashboard/documente/page.tsx`
- `components/compliscan/documents-page.tsx`
- `app/dashboard/setari/page.tsx`
- `components/compliscan/settings-page.tsx`

Suprafete secundare importante:

- `app/dashboard/fiscal/page.tsx`
- `app/dashboard/vendor-review/page.tsx`
- `app/dashboard/dsar/page.tsx`
- `app/dashboard/ropa/page.tsx`
- `app/dashboard/dora/page.tsx`
- `app/dashboard/whistleblowing/page.tsx`
- `app/dashboard/calendar/page.tsx`
- `app/dashboard/approvals/page.tsx`
- `app/dashboard/checklists/page.tsx`
- `app/dashboard/review/page.tsx`
- `app/dashboard/scan/results/[scanId]/page.tsx`
- `app/dashboard/monitorizare/nis2/eligibility/page.tsx`
- `app/dashboard/monitorizare/nis2/governance/page.tsx`
- `app/dashboard/monitorizare/nis2/inregistrare-dnsc/page.tsx`
- `app/dashboard/monitorizare/nis2/maturitate/page.tsx`
- `app/dashboard/monitorizare/sisteme-ai/eu-db-wizard/page.tsx`

API / flows de produs care sustin UI-ul:

- `app/api/portfolio/overview/route.ts`
- `app/api/portfolio/inbox/route.ts`
- `app/api/portfolio/tasks/route.ts`
- `app/api/portfolio/vendors/route.ts`
- `app/api/portfolio/reports/route.ts`
- `app/api/partner/clients/[orgId]/route.ts`
- `app/api/partner/clients/quick-add/route.ts`
- `app/api/partner/import/preview/route.ts`
- `app/api/partner/import/execute/route.ts`
- `app/api/portfolio/findings/batch/route.ts`
- `app/api/dashboard/urgency/route.ts`
- `app/api/findings/[id]/route.ts`
- `app/api/reports/share-token/route.ts`
- `app/api/exports/audit-pack/route.ts`
- `app/api/exports/anspdcp-pack/[orgId]/route.ts`
- `app/api/documents/generate/route.ts`
- `app/api/settings/summary/route.ts`

Pattern-uri shared:

- `components/compliscan/route-sections.tsx`
- `components/evidence-os/PageIntro.tsx`
- `components/evidence-os/EmptyState.tsx`
- `components/ui/ds/index.ts`
- `components/ui/ds/Button.tsx`
- `components/ui/ds/PageIntro.tsx`
- `components/ui/ds/BulkActionBar.tsx`

### Cum sa folosesti aceste paths

Pentru fiecare pagina importanta:

1. citeste fisierul `app/.../page.tsx`
2. identifica surface component-ul sau structura inline
3. deschide componenta principala din `components/compliscan/...`
4. extrage:
   - ce sections are
   - ce liste / filtre / tabs are
   - ce CTA principal are
   - ce API-uri apeleaza
   - ce flows secundare deschide
5. abia apoi redesenezi

Nu presupune ca textul din acest document substituie citirea fisierelor.

---

## 11. Cross-page patterns care trebuie pastrate

### 11.1 Workspace switching

- partner intra din portfolio in org
- org context trebuie pastrat
- client drill-in nu trebuie sa scoata userul din context accidental

### 11.2 Bulk actions

Exista deja in:

- `/portfolio`
- `/portfolio/alerts`
- `/portfolio/tasks`

Trebuie facute mai bune, nu eliminate.

### 11.3 Evidence / exports / dossier

Produsul are deja:

- audit pack
- audit pack bundle
- ANSPDCP pack
- diagnostic export
- vendor trust pack
- response pack
- annex lite
- trust center
- share token
- generated documents

Acestea sunt nucleu de produs, nu extrasuri decorative.

### 11.4 Empty / loading / error states

Multe pagini au deja:

- `PageIntro`
- `LoadingScreen`
- `ErrorScreen`
- `EmptyState`

Claude Design trebuie sa le unifice si sa le faca mai bune.

### 11.5 Specialist workspaces

Aceste workspaces trebuie tratate ca serioase:

- fiscal
- NIS2
- vendor review
- DSAR
- ROPA
- DORA
- whistleblowing

Nu sunt “misc pages”.

---

## 12. Ce vrem efectiv de la Claude Design

Vrem:

1. **Noul shell complet**
   - sidebar
   - header/topbar
   - content frame
   - section rails
   - shared states

2. **Page designs pentru suprafetele P1**
   - `/portfolio`
   - `/portfolio/alerts`
   - `/portfolio/client/[orgId]`
   - `/dashboard`
   - `/dashboard/scan`
   - `/dashboard/actiuni/remediere`
   - `/dashboard/actiuni/remediere/[findingId]`
   - `/dashboard/monitorizare/conformitate`
   - `/dashboard/monitorizare/sisteme-ai`
   - `/dashboard/monitorizare/nis2`
   - `/dashboard/reports`
   - `/dashboard/reports/vault`
   - `/dashboard/documente`
   - `/dashboard/setari`

3. **Direction si page mapping pentru suprafetele secundare**
   - fiscal
   - vendor review
   - DSAR
   - ROPA
   - DORA
   - whistleblowing
   - calendar
   - approvals
   - review
   - generator
   - scan results
   - nis2 subpages
   - eu-db wizard

4. **Component / state system**
   - page intro
   - filters
   - tabs
   - list rows
   - bulk action bar
   - detail panels
   - evidence cards
   - export cards
   - empty/loading/error

5. **Migration mapping**
   - ce ramane 1:1
   - ce se muta in alt shell bucket
   - ce devine subflow
   - ce este bridge / compat only

---

## 13. Ce NU trebuie sa faca Claude Design

- sa simplifice produsul prin amputare
- sa ignore paginile secundare
- sa trateze cockpit-ul ca o simpla pagina de “details”
- sa piarda batch actions
- sa rupa exporturile si vault-ul
- sa rupa relatia portfolio -> client drill-in -> org cockpit
- sa faca un shell frumos care nu suporta densitatea operationala reala

---

## 14. Prompt final gata de dat la Claude Design

Copiezi exact textul de mai jos si il dai lui Claude Design, impreuna cu acest document.

```text
Vreau sa redesenezi CompliAI complet, dar fara sa pierzi functionalitatile reale existente azi.

Foloseste acest document ca sursa principala de adevar:
`docs/CLAUDE-DESIGN-MASTER-HANDOFF-2026-04-22.md`

Ce trebuie sa stii:

- produsul actual exista deja si are multe pagini reale, nu este doar un concept
- vrem noua IA canonica si un UI nou
- DAR vrem zero feature-parity loss
- daca o functie exista azi, nu o elimini doar pentru ca pare secundara
- daca o pagina este secundara, o remapezi explicit, nu o ignori

Contextul de produs:

- persona principala este Diana, consultant/partener cu 10-30 clienti
- produsul are doua contexte reale:
  - portfolio (cross-client)
  - org workspace (per-firma)
- cele 3 suprafete care vand produsul sunt:
  1. inbox cross-portfolio
  2. client drill-in
  3. cockpit / remediere / dovada / export

Vreau ca redesignul sa respecte noua IA:

- Partner:
  - Portofoliu
  - Alerts
  - Tasks
  - Vendors
  - Reports
  - apoi per-firma:
    - Acasa
    - Scaneaza
    - Monitorizare
    - Actiuni
    - Rapoarte
    - Setari

- Compliance:
  - Acasa
  - Scaneaza
  - Monitorizare
  - Actiuni
  - Rapoarte
  - Setari

- Solo:
  - Acasa
  - Scaneaza
  - De rezolvat
  - Documente
  - Rapoarte
  - Setari

Dar trebuie sa pastrezi functionalitatea reala din paginile existente azi, mapate in document.

Ce vreau de la tine:

1. Un shell nou complet:
   - sidebar
   - topbar
   - content frame
   - patterns shared pentru loading / empty / error / bulk actions

2. Design-uri detaliate pentru paginile critice:
   - /portfolio
   - /portfolio/alerts
   - /portfolio/client/[orgId]
   - /dashboard
   - /dashboard/scan
   - /dashboard/actiuni/remediere
   - /dashboard/actiuni/remediere/[findingId]
   - /dashboard/monitorizare/conformitate
   - /dashboard/monitorizare/sisteme-ai
   - /dashboard/monitorizare/nis2
   - /dashboard/reports
   - /dashboard/reports/vault
   - /dashboard/documente
   - /dashboard/setari

3. Mapping pentru paginile secundare, ca sa stim unde merg si cum arata:
   - fiscal
   - vendor-review
   - dsar
   - ropa
   - dora
   - whistleblowing
   - calendar
   - approvals
   - review
   - generator
   - scan results
   - nis2 subpages
   - eu-db wizard

4. Pentru fiecare pagina importanta, spune explicit:
   - scopul dominant al paginii
   - CTA principal
   - care sunt actiunile secundare
   - ce informatii trebuie sa stea in summary vs detail
   - ce features reale din pagina actuala pastrezi
   - daca muti ceva, unde il muti exact

5. Pentru orice pagina sau flow pe care il simplifici, spune clar:
   - ce ai scos din suprafata principala
   - unde traieste acum acel lucru
   - de ce nu s-a pierdut feature parity

6. Nu vreau un redesign generic.
   Nu vreau dashboard-uri frumoase dar goale.
   Nu vreau sa ignori paginile dense sau specialist workflows.

Vreau un redesign care:

- arata mai bine
- e mai coerent
- respecta noua IA
- e mai dens si mai operational
- bate live-ul actual
- dar pastreaza puterea reala a aplicatiei

Important:

- ai acces la codul local
- metoda preferata este importul repo-ului din GitHub `https://github.com/vaduvel/CompliAi.git`
- foloseste explicit path-urile mentionate in document
- pentru paginile mari sau dense, inspecteaza direct fisierele locale inainte sa propui redesignul
- daca descoperi features reale in cod care nu sunt enumerate perfect in handoff, le pastrezi si le mentionezi

Outputul tau trebuie sa fie structurat in:

1. Principii de redesign
2. Noul shell
3. Page-by-page redesign pentru suprafetele critice
4. Mapping pentru suprafetele secundare
5. Component/state system
6. Lista de riscuri sau gaps unde ai nevoie de clarificare

Cand exista dubiu, prioritizeaza:

- functionalitatea reala
- fluxurile operationale
- relationarea portfolio -> client -> cockpit
- exporturile, dovezile si batch actions

Nu elimina nimic important fara remapare explicita.
```

---

## 15. Verdict

Daca dai un singur document lui Claude Design, da-l pe acesta.

Este suficient de complet incat:

- sa inteleaga produsul
- sa inteleaga noua IA
- sa inteleaga paginile reale
- sa stie ce trebuie pastrat
- sa stie exact ce output vrem de la el
