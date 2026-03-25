# CompliScan — Audit Complet Faza 1
**Data:** 2026-03-25  
**Repo:** `/Users/vaduvageorge/Desktop/CompliAI`  
**Scope audit:** am acoperit ambele sensuri active din proiect pentru „Faza 1”

## Clarificare importantă
În repo există două interpretări reale pentru `Faza 1`:

1. `F1 sprint-ready` din `docs/Final Clean/compliscan-faza1-sprint-ready.md`
2. `V6 Faza 1` din `docs/CompliAI_V6_Agentic_Engine.md`

Auditul de mai jos le separă explicit, ca să nu amestecăm:
- pachetul de retenție/perceived value
- fundația agentică V6

## Surse verificate
- `docs/Final Clean/compliscan-faza1-sprint-ready.md`
- `docs/sprint-log-refinements.md`
- `docs/CompliAI_V6_Agentic_Engine.md`
- `origin/main` vs `HEAD` local
- producția live `https://compliscanag.vercel.app`
- demo live prin `/api/demo/imm`
- validare locală prin `npm run build` și teste țintite

## Snapshot de control
- `HEAD` local: `50cd963`
- `origin/main`: `7de6ba5`
- live Vercel expune în HTML `sentry-release=50cd963...`

### Concluzie critică
Producția live nu este aliniată curat cu `origin/main`. Release-ul activ este legat de `HEAD` local / snapshot local, nu de remote `main`.

Acesta este cel mai mare risc operațional din audit:
- nu mai există o sursă unică de adevăr între `origin/main` și Vercel production
- unele funcționalități sunt live fără să fie neapărat reflectate în remote
- unele funcționalități există local, dar nu sunt live

---

## A. Audit — F1 Sprint Ready
Document sursă: `docs/Final Clean/compliscan-faza1-sprint-ready.md`

### Verdict scurt
- Local: pachetul este implementat și validat tehnic
- Live: pachetul NU este complet live
- Deploy total: NU este gata ca „Faza 1 completă live” până nu se normalizează producția și nu se urcă lipsurile

### TASK 0 — Hotfix NIS2 deadline
Status:
- Local: `implementat`
- Testare locală: `verde`
- Live: `neconfirmat complet`

Evidență:
- `lib/server/nis2-store.ts` calculează `deadlineFinalISO` din `deadline72h + 30 zile`
- testele țintite trec

Observație:
- logica este corectă local
- pe live nu am avut un incident demo care să probeze cap-coadă deadline-ul final, deci nu marchez acest task ca „live confirmat” doar din cod

### TASK 1 — Finish Screen Onboarding
Status:
- Local: `implementat`
- Live: `lipsește`

Evidență:
- local există `app/onboarding/finish/page.tsx`
- local build listează `/onboarding/finish`
- live `/onboarding/finish` răspunde `404`

### TASK 2 — Dashboard Accumulation Card
Status:
- Local: `implementat`
- Live: `lipsește`

Evidență:
- local există `components/compliscan/dashboard/accumulation-card.tsx`
- local există `app/api/dashboard/accumulation/route.ts`
- local build listează `/api/dashboard/accumulation`
- live, cu sesiune demo validă, `/api/dashboard/accumulation` răspunde `404`
- în HTML-ul live al `/dashboard` nu apare textul cardului („Ce am construit pentru tine”)

### TASK 3 — Rewrite Email de Reînnoire
Status:
- Local: `implementat`
- Live: `parțial`

Evidență:
- local există `lib/server/renewal-email.ts`
- local există `/api/cron/renewal-reminder`
- local există redirect-ul de tracking `/r/renewal/[orgId]`
- live `POST /api/cron/renewal-reminder` răspunde `401 Unauthorized`, deci route-ul există
- în metadata de producție citită din Vercel, cron-ul `renewal-reminder` nu apare în `vercelConfig.crons`

Concluzie:
- endpoint-ul există în producția curentă
- dar cron scheduling-ul nu este activ în configurația de production confirmată
- CTA tracking pentru email nu este live confirmat; ruta nouă `/r/renewal/[orgId]` este locală

### Ce este validat local pentru F1 sprint-ready
- `npm run build` trece
- teste țintite F1/NIS2 trec: `13 files`, `167 tests`

### Gaps reale înainte de deploy total pentru F1 sprint-ready
1. Producția nu are încă `/onboarding/finish`
2. Producția nu are încă `/register`
3. Producția nu are încă accumulation card + API în mod confirmat live
4. `renewal-reminder` nu este confirmat ca job programat în cron-ul de production
5. metricile cerute în document nu pot fi colectate curat până când flow-ul nu este live complet

---

## B. Audit — V6 Faza 1 Agentic Foundation
Document sursă: `docs/CompliAI_V6_Agentic_Engine.md`

### Scope documentat
V6 Faza 1 =:
1. Agent Orchestrator
2. Compliance Monitor
3. Fiscal Sensor

### Verdict scurt
- Cod: `implementat`
- `origin/main`: `prezent`
- Live Vercel: `prezent tehnic`
- UX / guvernanță: `incomplet aliniate`

### Confirmări
#### 1. Orchestrator
- există `lib/server/agent-orchestrator.ts`
- există `app/api/cron/agent-orchestrator/route.ts`
- live `POST /api/cron/agent-orchestrator` răspunde `401`, ceea ce confirmă route-ul în producție

#### 2. Compliance Monitor
- există `lib/compliance/agent-compliance-monitor.ts`
- există rail dedicat în `lib/compliance/agent-rail-compliance-monitor.ts`
- testele agent rails trec local

#### 3. Fiscal Sensor
- există `lib/compliance/agent-fiscal-sensor.ts`
- există rail dedicat în `lib/compliance/agent-rail-fiscal-sensor.ts`
- testele agent rails trec local

#### 4. Dashboard / UI
- există `app/dashboard/agents/page.tsx`
- live cu demo session: `/dashboard/agents` răspunde `200`

### Gaps reale pentru V6 Faza 1
1. **Documentație stale**
   - `docs/sprint-log-refinements.md` spune încă `V6-F1` = `parcat`
   - runtime-ul și producția arată că suprafețele agentice există deja

2. **Expunere UX slabă**
   - `dashboardRoutes.agents` există
   - dar navigația principală nu expune `/dashboard/agents` ca item vizibil
   - rezultatul: suprafața este live, dar aproape „ascunsă”

3. **Overclaim în API**
   - `app/api/agents/route.ts` marchează toți cei 5 agenți cu `implemented: true`
   - comentariul spune `all 5 agents now implemented (V6-F4)`
   - asta nu mai corespunde cu framing-ul din documentele de fază

4. **Source-of-truth fracturat**
   - documentele istorice spun „parcat pe branch separat”
   - live-ul și codul de pe `main` arată altceva
   - înainte de orice „deploy total”, trebuie decis care document rămâne canonic

### Ce este validat local pentru V6 Faza 1
- teste agent rails + `app/api/agent/commit/route.test.ts` trec: `12 files`, `69 tests`
- build trece

---

## Verdict final de deploy
### Dacă prin „Faza 1” te referi la `F1 sprint-ready`
**Nu este gata pentru deploy total live**.  
Este gata tehnic local, dar nu este complet live și nici normalizat în production config.

### Dacă prin „Faza 1” te referi la `V6 Faza 1`
**Este deja live tehnic în mare parte**, dar nu este bine închis ca produs:
- documentația spune încă altceva
- navigația nu îl promovează
- messaging-ul din API supra-declară maturitatea

---

## Ce trebuie făcut înainte de „deploy total”
1. Normalizează sursa de adevăr:
   - producția trebuie adusă înapoi pe `origin/main` sau `origin/main` trebuie adus la nivelul producției actuale

2. Închide complet `F1 sprint-ready`:
   - urcă `/onboarding/finish`
   - urcă `/register`
   - urcă accumulation card + API
   - urcă `/r/renewal/[orgId]`
   - activează `renewal-reminder` în cron config-ul de production

3. Aliniază documentația pentru V6-F1:
   - scoate statusul „parcat” dacă nu mai este adevărat
   - clarifică faptul că V6-F1 este live tehnic, dar încă slab expus în UX

4. Decide explicit dacă `/dashboard/agents` rămâne:
   - route ascunsă tehnică
   - sau intră în IA oficială a produsului

## Concluzie executivă
Starea curentă nu este „Faza 1 gata de deploy total”.  
Starea reală este:

- `F1 sprint-ready` = aproape gata, dar încă nealiniat live
- `V6-F1` = deja live tehnic, dar nealiniat ca documentație și UX
- cel mai mare risc nu este codul, ci faptul că producția și git-ul nu spun aceeași poveste
