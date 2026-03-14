# CompliScan MVP

CompliScan.ro MVP pentru România:
- EU AI Act risk scanner
- GDPR checklist
- e-Factura sync status
- AI assistant chat
- raport de risc (print/export)

Principii de produs:
- nu afirmă niciodată "100% compliant"
- folosește "scor de risc"
- oferă "recomandare AI"
- cere "verifică uman" înainte de raport oficial

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- lucide-react

## Run

```bash
npm install
npm run dev
```

Deschide:
- `http://localhost:3000/`
- dashboard: `http://localhost:3000/dashboard`

## Ce e implementat acum

- Dashboard complet dark-mode only
- API backend în App Router:
  - `GET /api/dashboard`
  - `POST /api/scan`
  - `POST /api/integrations/efactura/sync`
  - `PATCH /api/alerts/:id/resolve`
  - `PATCH /api/tasks/:id`
  - `POST /api/reports`
  - `POST /api/chat`
- Persitență pe fișier local: `.data/compliance-state.json`
- Simulare scanare document + findings + alerte
- Persistență pentru status task (`done`) + dovadă atașată
- Chat "inteligent" contextual (rule-based) legat la datele curente

## Setup Supabase (MVP)

1. Completează `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GOOGLE_CLOUD_VISION_API_KEY=...
GOOGLE_CLOUD_PROJECT_ID=...
GOOGLE_CLOUD_VISION_LOCATION=eu
COMPLISCAN_RESET_KEY=...
COMPLISCAN_AUTH_BACKEND=local
COMPLISCAN_DATA_BACKEND=local
COMPLISCAN_EVIDENCE_SIGNED_URL_TTL_SECONDS=90
```

2. În Supabase -> SQL Editor rulează scriptul:

`supabase/init.sql`

Pentru fundația de Sprint 5 (`Supabase Auth`, `memberships`, `org_state`, `evidence_objects`, bucket privat și RLS minim), rulează și:

`supabase/sprint5-foundation.sql`

2b. În Supabase API settings, expune schema `compliscan` în PostgREST dacă vrei ca `app_state` să scrie direct în cloud.

Notă importantă: în starea curentă a proiectului, `public.org_state` este traseul nou pentru state-ul de organizație, iar `compliscan.app_state` rămâne fallback legacy. Dacă schema `compliscan` nu este expusă, aplicația continuă corect prin `public.org_state` și/sau fallback local în `.data/state-*.json`, în funcție de backend-ul de date configurat.

Pentru backend-ul de identitate:

- `COMPLISCAN_AUTH_BACKEND=local` -> auth local clasic
- `COMPLISCAN_AUTH_BACKEND=supabase` -> login/register prin `Supabase Auth`
- `COMPLISCAN_AUTH_BACKEND=hybrid` -> preferă `Supabase Auth`, dar permite coexistență în faza de migrare

Notă practică:

- dacă rulezi în `COMPLISCAN_AUTH_BACKEND=supabase`, utilizatorul trebuie să existe și în `Supabase Auth`, nu doar în `.data/users.json`
- login-ul local vechi nu mai este suficient ca sursă de identitate

Pentru backend-ul de date / tenancy:

- `COMPLISCAN_DATA_BACKEND=local` -> local-first pentru state și tenancy
- `COMPLISCAN_DATA_BACKEND=supabase` -> cloud-first pe `public.org_state`, cu fallback legacy/local controlat
- `COMPLISCAN_DATA_BACKEND=hybrid` -> local-first, dar oglindește tenancy și `org_state` în Supabase
- `COMPLISCAN_ALLOW_LOCAL_FALLBACK=true|false` -> controleaza daca backend-ul `supabase` poate cadea pe local cand cloud-ul nu este disponibil
- `npm run verify:supabase:sprint5` -> verifica direct proiectul Supabase real pentru tabelele si bucket-ul critice din Sprint 5
- `npm run verify:supabase:strict` -> verifica daca mediul curent este configurat strict pentru `supabase`:
  - `COMPLISCAN_AUTH_BACKEND=supabase`
  - `COMPLISCAN_DATA_BACKEND=supabase`
  - `COMPLISCAN_ALLOW_LOCAL_FALLBACK=false`
  - plus infrastructura live (`public.*` + bucket) raspunde corect
- `npm run verify:supabase:rls` -> verifica live izolarea multi-org pentru:
  - `organizations`
  - `memberships`
  - `org_state`
  - `evidence_objects`
  - si confirma ca un `viewer` nu poate modifica `org_state`
- pentru aplicarea SQL intr-un singur pas in Supabase SQL Editor:
  - `supabase/apply-sprint5-complete.sql`
  - implicit:
    - permis in development / test
    - blocat in productie

Pentru acces controlat la dovezi cloud:

- `COMPLISCAN_EVIDENCE_SIGNED_URL_TTL_SECONDS` -> TTL pentru redirect-urile semnate către Supabase Storage
  - minim `15`
  - maxim `900`
  - implicit `90`

3. Repornește serverul:

```bash
npm run dev
```

Notă: dacă schema nu este încă inițializată, aplicația folosește fallback local în `.data/state-*.json`.
În producție, `POST /api/state/reset` trebuie apelat doar cu header-ul `x-compliscan-reset-key`.

## Evidence access control

- Dovezile noi nu mai sunt servite ca fișiere publice directe.
- Accesul standard trece prin:
  - `GET /api/tasks/[id]/evidence/[evidenceId]`
- Pentru storage cloud (`supabase_private`), route-ul poate emite redirect controlat către URL semnat:
  - `GET /api/tasks/[id]/evidence/[evidenceId]?delivery=redirect`
- Pentru descărcare explicită:
  - `GET /api/tasks/[id]/evidence/[evidenceId]?download=1`

Semantica recomandată:
- UI intern -> route controlat normal
- acces cloud performant -> `delivery=redirect`
- distribuire externă -> doar prin `Audit Pack` / bundle, nu prin link direct brut

În backend-urile `supabase` / `hybrid`, metadata-ul dovezii este sincronizat și în:
- `public.evidence_objects`

În backend-ul `supabase`, registrul `public.evidence_objects` este folosit și pe traseul de acces:
- route-ul de evidence poate hidrata metadata din DB înainte de stream sau redirect semnat
- `Audit Pack` bundle folosește același registru pentru copierea dovezilor
- `DashboardPayload` hidratează `taskState.attachedEvidenceMeta` din registrul cloud pentru UI și exporturile server-side

În backend-ul `supabase`, tenancy-ul poate fi inițializat incremental:
- dacă graful cloud este gol, aplicația poate seed-ui `organizations`, `profiles` și `memberships` din local
- după seed, citirea revine pe cloud-first

## Supabase keepalive

- Endpoint: `GET` sau `POST /api/integrations/supabase/keepalive`
- Scop: scrie un heartbeat mic în Supabase Storage, ca să existe activitate reală pe proiect.
- Header necesar: `x-compliscan-keepalive-key`
- Cheie folosită:
  - `COMPLISCAN_KEEPALIVE_KEY`
  - fallback: `COMPLISCAN_RESET_KEY`

Exemplu:

```bash
curl -X POST http://localhost:3000/api/integrations/supabase/keepalive \
  -H "x-compliscan-keepalive-key: $COMPLISCAN_KEEPALIVE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"cron","note":"keepalive zilnic"}'
```

## Supabase operational status

- Endpoint intern: `GET /api/integrations/supabase/status`
- Roluri permise:
  - `owner`
  - `compliance`
- Scop:
  - verifică rapid dacă traseul `auth / data / storage` este pregătit operațional
  - verifică tabelele critice:
    - `organizations`
    - `memberships`
    - `profiles`
    - `org_state`
    - `evidence_objects`
- UI:
  - pagina `Setari` afișează acum acest status direct, pentru verificarea Sprintului 5
- runbook manual:
  - `public/supabase-rls-verification-runbook.md`

## Application health

- Endpoint intern: `GET /api/health`
- UI:
  - pagina `Setari` afiseaza acum health check-ul aplicatiei separat de statusul Supabase
- scop:
  - sumar rapid pentru sesiune, backend-uri, fallback local si traseul cloud principal

## Release readiness

- Endpoint intern: `GET /api/release-readiness`
- scop:
  - verdict agregat pentru blocajele operationale
  - combina:
    - `app health`
    - `strict supabase preflight`
    - configuratia backend-urilor
    - politica de fallback local

## Release preflight (local)

- Comanda locala pentru preflight complet:
  - `npm run preflight:release`
- preflight-ul ruleaza acum:
  - `lint`
  - `test`
  - `build`
  - `verify:supabase:strict`
  - `verify:supabase:rls`
- `release readiness` foloseste si marker-ul ultimei verificari RLS locale:
  - `.data/ops/last-rls-verification.json`
  - este regenerat de `npm run verify:supabase:rls`

## Timeouts si retry operational

- helper comun:
  - `lib/server/http-client.ts`
- aplicat pe:
  - Google Vision
  - Supabase REST
  - Supabase Storage
  - Supabase Auth
- scop:
  - evitam request-uri agatate
  - avem comportament mai uniform pe integrările externe critice

## Request tracing minimal

- rutele critice expun acum header-ul `x-request-id`
- raspunsurile JSON de eroare includ si `requestId` in payload
- scop:
  - debugging mai rapid
  - corelare intre eroarea vazuta de user si logurile server-side
  - baza minima pentru operational logging in Sprint 7

## Chat AI (Gemini Free Tier)

- Endpoint: `POST /api/chat`
- Folosește modelul din `GEMINI_MODEL` (implicit `gemini-2.5-flash-lite`)
- Dacă Gemini nu răspunde, endpoint-ul cade automat pe fallback rule-based.

## OCR real (Google Vision API)

- Endpoint scan: `POST /api/scan`
- Dacă trimiți `imageBase64` și ai `GOOGLE_CLOUD_VISION_API_KEY`, aplicația extrage text real cu Vision API (`TEXT_DETECTION`).
- Dacă cheia lipsește sau OCR eșuează, scanarea continuă pe textul introdus manual.
- În UI (`/dashboard` -> `Scanări`) poți încărca imagine (`PNG/JPG/WEBP`) pentru OCR.

## MVP scope și next step

Implementarea actuală este MVP funcțional single-tenant. Pentru producție:
1. Auth + organizații multiple
2. DB managed (ex: Supabase Postgres + RLS)
3. Job queue real pentru OCR/scan pipeline
4. LLM provider real + audit log conversații
5. Storage pentru documente + trasabilitate surse în raport

## Documente de control utile

- `public/raport-maturitate-compliscan.md`
- `public/sprinturi-maturizare-compliscan.md`
- `public/status-arhitectura.md`
- `public/target-state-100-compliscan.md`
- `public/sprint-5-supabase-foundation.md`
