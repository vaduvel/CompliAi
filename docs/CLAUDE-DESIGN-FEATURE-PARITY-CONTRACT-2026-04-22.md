# CLAUDE-DESIGN-FEATURE-PARITY-CONTRACT-2026-04-22.md

Status: `feature parity contract`
Date: `2026-04-22`
Repo snapshot: `preview/integration-2026-04-21`
Audience: `Claude Design / orice model extern care redeseneaza CompliAI si trebuie sa pastreze puterea functionala`

---

## 1. Ce este acest document

Acest document exista pentru o singura problema:

- `master handoff` spune bine produsul
- `page map` spune bine ce pagini exista
- dar paginile dense pot pierde functionalitate daca redesignul se face doar "din directie"

Acesta este contractul care spune:

- ce este non-negotiable pe fiecare pagina importanta
- ce blocuri trebuie sa ramana
- ce actiuni trebuie sa ramana
- ce stari trebuie sa ramana
- unde ai libertate de redesign
- unde NU ai voie sa simplifici prin eliminare

Regula principala:

- `repo-ul` spune ce exista
- `docs/DESTINATION.md` spune unde ducem shell-ul si IA
- `acest document` spune ce nu ai voie sa pierzi in redesign

---

## 2. Cum trebuie folosit

Claude Design trebuie sa foloseasca toate acestea impreuna:

1. `docs/CLAUDE-DESIGN-MASTER-HANDOFF-2026-04-22.md`
2. `docs/CLAUDE-DESIGN-CURRENT-APP-PAGE-MAP.md`
3. `docs/CLAUDE-DESIGN-FEATURE-PARITY-CONTRACT-2026-04-22.md`
4. repo access / GitHub access
5. capturi before din runtime

Ordinea adevarului:

1. codul curent al paginii
2. acest contract de parity
3. master handoff
4. destination / IA target / design brief

La finalul fiecarei pagini redesenate, Claude trebuie sa spuna explicit:

- `Kept`
- `Changed`
- `Remapped`
- `Not included yet`
- `Needs confirmation`

Nu are voie sa lase functii importante sa dispara tacut.

---

## 3. Reguli generale de parity

### 3.1 Nu ai voie sa pierzi

- bulk actions
- filtre si sortari reale
- stari empty / loading / error
- deep-links intre portfolio si org workspace
- actiuni secundare care exista in runtime si sunt folosite operational
- exporturi
- dovezi / evidence
- handoff-uri spre workflow-uri specializate

### 3.2 Ai voie sa schimbi

- ierarhia vizuala
- layout-ul
- gruparea blocurilor
- numele unor zone secundare, daca shell-ul canonic cere asta
- transformarea unui tabel plat intr-o lista mai scanabila
- transformarea unei pagini foarte lungi intr-un layout mai clar

### 3.3 Nu ai voie sa faci

- simplificare prin stergere
- "nice empty cards" in loc de flows reale
- UI nou care ascunde puterea produsului
- inlocuirea paginilor dense cu dashboard-uri decorative
- schimbarea IA canonice fara explicit A/B

---

## 4. Contracte pe pagini

Mai jos sunt paginile pe care redesignul trebuie sa le respecte cel mai strict.

---

## 4.1 `/portfolio`

### Route

- `/portfolio`

### Source files

- `app/portfolio/page.tsx`
- `components/compliscan/portfolio-overview-client.tsx`

### Job-ul paginii

Partner-ul vede rapid tot portofoliul, triage cross-client si intra in firma doar cand trebuie sa execute.

### Must-keep blocks

- page intro cu sumarul portofoliului
- KPI strip / summary metrics
- filter bar
- sort controls
- search
- lista sau tabelul firmelor
- selected state pentru batch
- CTA principal de intrare pe fiecare firma

### Must-keep actions

- import firme
- quick add / adaugare firma
- export
- refresh
- drill-in pe firma
- bulk actions pentru selecții
- delete/remove firma din portofoliu

### Must-keep data per client row/card

- nume firma
- rol / tip membership
- ultim scan sau lipsa scanarii
- scor
- risc
- alerte / taskuri / findings critice
- badge-uri de compliance relevante
- CTA clar de intrare in executie

### Must-keep states

- empty state fara clienti
- loading
- error
- mixed states: firma cu date / firma fara scanare
- selected rows
- filtered state

### Redesign freedom

- tabelul poate deveni lista operabila
- coloanele pot deveni grupuri vizuale
- comparatia intre firme poate fi facuta mai scanabil

### Explicit don’ts

- nu transforma pagina in grid de carduri ca default pentru portofolii mari
- nu pierde scanabilitatea cross-client
- nu ascunde CTA-ul per firma

---

## 4.2 `/portfolio/alerts`

### Route

- `/portfolio/alerts`

### Source files

- `app/portfolio/alerts/page.tsx`
- `components/compliscan/portfolio-alerts-page.tsx`
- `app/api/portfolio/inbox/route.ts`

### Job-ul paginii

Inbox cross-client pentru Diana: triere rapida a semnalelor aparute peste noapte.

### Must-keep blocks

- page intro
- header stats
- top 3 triage / progressive disclosure
- filter controls
- grouped feed pe zile / buckets temporale
- row/item list unificata pentru alert + notification
- bulk action bar

### Must-keep filters

- severity
- source
- firm
- framework

### Must-keep actions

- refresh
- select all visible
- select individual items
- confirm finding
- dismiss finding
- mark notification read
- deep-link spre client context

### Must-keep item content

- severitate
- tip / source
- titlu
- mesaj / detaliu
- firma
- timestamp
- unread state pentru notificari
- linkTo / handoff

### Must-keep states

- loading
- error
- empty
- filtered empty
- selection state
- success / error feedback pentru batch

### Redesign freedom

- feed-ul poate deveni mai clar si mai dens
- top 3 poate fi mai evident
- item rows pot fi redesenate substantial

### Explicit don’ts

- nu elimina top triage
- nu elimina batch actions
- nu scoate userul direct in org workspace fara context intermediar

---

## 4.3 `/portfolio/client/[orgId]`

### Route

- `/portfolio/client/[orgId]`

### Source files

- `app/portfolio/client/[orgId]/page.tsx`
- `components/compliscan/client-context-panel.tsx`
- `app/api/partner/clients/[orgId]/route.ts`

### Job-ul paginii

Partner-ul vede contextul firmei fara sa paraseasca portofoliul. Decide daca deschide cockpit-ul sau intra in workspace-ul firmei.

### Must-keep blocks

- breadcrumb inapoi spre portofoliu
- page intro / context summary
- scor si risk summary
- findings deschise
- snapshot NIS2
- snapshot vendor reviews
- quick actions
- CTA principal:
  - `Intră în firma clientului`
  - sau `Deschide finding-ul în cockpit` daca a venit din inbox cu `finding=...`

### Must-keep actions

- enter workspace
- open finding in cockpit
- batch quick actions prin `/api/portfolio/batch`
- refresh context

### Must-keep states

- firma fara scanare
- firma cu findings
- focused finding din inbox query param
- loading
- error

### Must-keep data

- score
- risk
- open alerts
- red alerts
- documents / scans
- gdpr progress
- ai systems count
- open findings list
- NIS2 status summary
- vendor review summary

### Redesign freedom

- poate deveni mai clar si mai modular
- sumarul poate fi reordonat
- quick actions pot fi grupate mai elegant

### Explicit don’ts

- nu transforma pagina intr-un org dashboard complet
- nu pierde distinctia dintre `context in portfolio` si `executie in firmă`

---

## 4.4 `/dashboard/actiuni/remediere/[findingId]`

### Route

- `/dashboard/actiuni/remediere/[findingId]`

### Source files

- `app/dashboard/actiuni/remediere/[findingId]/page.tsx`
- `components/compliscan/finding-cockpit-shared.tsx`
- `components/compliscan/generator-drawer.tsx`
- `components/compliscan/document-adoption-card.tsx`
- `lib/compliscan/finding-kernel.ts`

### Job-ul paginii

Cockpit complet pentru un finding: context, impact, pasi, documente, dovada, inchidere.

### Must-keep blocks

- hero finding
- status / severity / age / presentation
- narrative / impact
- primary actions on finding
- document generator drawer unde cazul suporta documente
- linked generated document / adoption
- evidence note
- completeness / close gating
- case closed / dossier success states

### Must-keep actions

- confirm
- dismiss
- resolve
- open generator
- generate document draft
- validate / revalidate
- approve as evidence
- send to dossier
- reopen where applicable
- review cycle / next monitoring date where applicable

### Must-keep complex behavior

- page trebuie sa poata primi utilizatorul inapoi din subflows specializate:
  - DSAR
  - RoPA
  - NIS2
  - DNSC
  - vendor review
  - fiscal
  - HR packs
  - contracts pack
- la revenire, trebuie sa existe feedback contextual si gating clar

### Must-keep states

- loading
- error / missing finding
- finding open / confirmed / dismissed / resolved / under_monitoring
- pending approval
- document flow:
  - not_required
  - draft_missing
  - draft_ready
  - attached_as_evidence

### Redesign freedom

- stack-ul poate fi mult mai clar
- layout-ul poate fi regrupat pe coloane sau sectiuni
- generatorul poate fi mai elegant

### Explicit don’ts

- nu transforma cockpit-ul intr-un simplu details page
- nu elimina follow-up states
- nu ascunde close gating
- nu pierde document flow

---

## 4.5 `/dashboard/setari`

### Route

- `/dashboard/setari`

### Source files

- `app/dashboard/setari/page.tsx`
- `components/compliscan/settings-page.tsx`
- `components/compliscan/settings/*`

### Job-ul paginii

Control center operational pentru configurarea org-ului.

### Must-keep tabs / zones

- Workspace
- Integrări
- Acces
- Operațional
- Notificări
- Plan & Facturare
- Autonomie
- Avansat
- Branding (doar partner)

### Must-keep actions

- editare date workspace
- vedere stari integrari si diagnostice
- manage members / roles / ownership / claim invite
- operational readiness / health views
- alert preferences / webhook / email settings
- billing / plan
- autonomy policies per risc si per categorie
- drift overrides
- advanced reset / destructive guarded actions
- white-label save

### Must-keep states

- role-based visibility
- partner-only branding
- loading by tab
- async saving states
- success/error feedback

### Redesign freedom

- tabs pot deveni navigation rail / cards / sections mai clare
- pagina poate fi sparsa vizual mai bine

### Explicit don’ts

- nu reduce setarile la 3-4 carduri superficiale
- nu ascunde zonele avansate sau autonomia
- nu amesteca setari de cont cu setari de firma

---

## 4.6 `/dashboard/vendor-review`

### Route

- `/dashboard/vendor-review`

### Source files

- `app/dashboard/vendor-review/page.tsx`
- `lib/compliance/vendor-review-engine.ts`
- `lib/compliance/vendor-review-lifecycle.ts`

### Job-ul paginii

Pipeline de review pentru furnizori: detectare, context, generare review, validare umana, dovezi, inchidere.

### Must-keep blocks

- page intro
- list / master-detail pentru reviews
- library match badges / detail panel
- context form
- generated assets viewer
- evidence manager
- governance pack / vendor pack areas

### Must-keep actions

- create / start review
- add context answers
- generate review
- approve / reject
- add evidence
- close review
- reopen / revalidate unde exista
- download / brief access unde exista

### Must-keep states

- detected
- needs-context
- review-generated
- awaiting-human-validation
- awaiting-evidence
- closed
- overdue-review

### Redesign freedom

- pipeline-ul poate fi mult mai clar vizual
- detail panel-ul poate fi mai bine organizat

### Explicit don’ts

- nu reduce vendor review la o listă simplă de vendors
- nu pierde lifecycle-ul complet
- nu ascunde evidence management

---

## 4.7 `/dashboard/monitorizare/conformitate`

### Route

- `/dashboard/monitorizare/conformitate`

### Source files

- `app/dashboard/monitorizare/conformitate/page.tsx`
- `lib/compliance/ai-conformity-assessment.ts`
- `lib/compliscan/dashboard-routes.ts`

### Job-ul paginii

Hub de framework selection. AI Act se evalueaza inline; celelalte framework-uri fac handoff spre workspace-uri dedicate.

### Must-keep blocks

- page intro
- framework switcher
- AI inline assessment
- score and gap analysis
- save state
- Annex IV export
- guide panels / handoff cards pentru GDPR, e-Factura, DORA, Pay Transparency

### Must-keep actions

- select framework
- select AI system
- answer questions
- save assessment
- download Annex IV
- follow handoff links spre workflow-uri dedicate

### Must-keep states

- fara AI systems
- AI system selected
- loading saved answers
- save feedback
- gaps result
- non-AI framework selected

### Redesign freedom

- framework switcher-ul poate fi mai elegant
- AI evaluation poate fi mai clar structurata
- handoff cards pot fi mult mai bune

### Explicit don’ts

- nu incerca sa comprimi toate framework-urile in acelasi UI generic
- nu pierde faptul ca doar AI este inline full
- nu sterge handoff-ul spre workflow-urile dedicate

---

## 5. Ce mai trebuie atasat langa acest document

Pe langa acest contract, Claude Design trebuie sa primeasca:

- capturi before pentru paginile-cheie
- daca exista, capturi pentru paginile dense si aglomerate
- eventual note scurte de tip:
  - `aici pastram structura`
  - `aici vrem reorganizare`
  - `aici nu pierdem bulk actions`

Capturile before sunt foarte importante pentru:

- densitate
- ierarhie
- volum de informatie
- realitatea runtime

---

## 6. Verdict de folosire

Pentru redesign corect, combinatia buna este:

- `master handoff` pentru directie
- `page map` pentru acoperire
- `feature parity contract` pentru non-negotiables
- `repo access` pentru adevarul din implementare
- `screenshots before` pentru adevarul vizual/runtime

Doar toate impreuna reduc suficient riscul de:

- parity loss
- simplificare agresiva
- pagini “frumoase” dar goale operational
- redesign drift

