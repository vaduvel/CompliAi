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
```

2. În Supabase -> SQL Editor rulează scriptul:

`supabase/init.sql`

3. Repornește serverul:

```bash
npm run dev
```

Notă: dacă schema nu este încă inițializată, aplicația folosește fallback local în `.data/compliance-state.json`.
În producție, `POST /api/state/reset` trebuie apelat doar cu header-ul `x-compliscan-reset-key`.

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
