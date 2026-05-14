# FiscCopilot — Status (sesiunea overnight 2026-05-14 → 15)

## TL;DR pentru dimineață

**Branch:** `feat/fiscal-copilot-2026-05-14` (creată din `killer-features-fiscal-layer`).

**Status:** **MERGE — testabil end-to-end, dev server live pe `:3210`.**

**Verifică în 60 secunde:**
1. Asigură-te că Ollama rulează: `ollama list` (gemma4:e2b trebuie să apară)
2. Dacă dev server e jos: `cd /Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/fiscal-mature && PORT=3210 npx next dev -p 3210`
3. Deschide: <http://localhost:3210/demo/fiscal-copilot>

---

## Ce funcționează (toate testate)

### Backend
- **Gemma local prin Ollama**: răspunde în RO, fără thinking mode, ~30-50s/răspuns după cold start (~90s primul request)
- **Corpus fiscal RO seed**: 15 entries verificate la 2026-05-14 (D100, D205, D300, D394, D406, D112, e-Factura, e-TVA, dividende, micro, casa marcat, TVA la încasare, dobânzi, Regula 98, calendar)
- **RAG retrieval**: keyword + tag scoring, 9.6-15.6 score pe întrebări test (fără false negatives)
- **AI Expert pipeline**: Q → RAG → Gemma cu context → răspuns grounded + citation
- **Match Path Engine — 5 paths deterministice:**
  - D205 dividende — alertă escaladantă 14/7/3/1 zile + întârziat
  - Diurnă → D112 — propagare alertă cu deadline 25 ale lunii
  - Casa de marcat — prag 500K RON cumulat (severitate cu ratio)
  - Microîntreprindere — prag 500K EUR (2.5M RON) cu severitate cu ratio
  - SAF-T D406 — deadline 25 ale lunii + check upload anterior
- **Daily Briefing generator**: agregare alerts + LLM headline + top 5 actions + stats portfolio

### API Endpoints (Next.js App Router)
- `GET  /api/fiscal-copilot/health` — Ollama + corpus status (fast, ~10ms)
- `POST /api/fiscal-copilot/ask` — chat LLM cu RAG (~30-60s)
- `GET  /api/fiscal-copilot/briefing` — daily briefing demo (~30-60s)
- `GET  /api/fiscal-copilot/alerts` — alerts live, fără LLM (~50ms)

Middleware: `/api/fiscal-copilot/*` exempt din auth (acces direct fără login).

### UI Dashboard
- `/demo/fiscal-copilot` — PUBLIC (fără auth, demo portfolio)
- `/dashboard/fiscal-copilot` — în cabinet (cu auth, viitor: portfolio real)
- 3 tabs: **Briefing | Alerte (6 active) | Chat**
- Componente: FiscalCopilotDashboard, BriefingCard, AlertsList (cu expand pași), ChatPanel (cu 6 example questions one-click)
- Privacy banner permanent: "Datele NU pleacă din EU"

### Demo Portfolio (5 clienți, 6 alerts)
| Client | Type | Alerte detectate |
|--------|------|------------------|
| Marcel Construct SRL | SRL | SAF-T medium + Diurnă low |
| Andreea Popescu PFA | PFA | (clean) |
| Cristina Trade SRL | SRL_MICRO | Micro prag 77% medium + SAF-T medium |
| Florin Mobilă II | II | **Casa marcat 90% HIGH** |
| Mihai Logistics SRL | SRL | SAF-T medium |

---

## Demo flow recomandat (pentru tine, la trezire)

1. **Health check**: <http://localhost:3210/api/fiscal-copilot/health> → ar trebui să vezi `{"ok": true, "corpus": 15, "model": "gemma4:e2b"}`
2. **Alerts**: <http://localhost:3210/api/fiscal-copilot/alerts> → 6 alerte JSON
3. **UI Demo**: <http://localhost:3210/demo/fiscal-copilot>
   - Tab **Alerte** se încarcă instant (6 alerte)
   - Tab **Briefing** → click "Generează briefing" (durează 30-60s)
   - Tab **Chat** → click pe oricare din 6 exemple sau scrie întrebarea ta
4. **Direct LLM test**:
   ```bash
   curl -X POST http://localhost:3210/api/fiscal-copilot/ask \
     -H "Content-Type: application/json" \
     -d '{"question":"Care e termenul pentru SAF-T D406?"}'
   ```
   Răspunsul probat: grounded, în RO, cu surse OPANAF 1783/2021 + Cod Procedură Fiscală art. 336.

---

## Arhitectura — pluggable, multi-vertical ready

```
lib/fiscal-copilot/
├── gemma-client.ts          # Ollama HTTP wrapper (local-first, GDPR-safe)
├── corpus/
│   └── seed-fiscal-ro.ts    # 15 entries fiscal RO (PLUGGABLE: ușor de înlocuit cu Qdrant)
├── rag.ts                   # Retrieval cu scoring (PLUGGABLE: viitor vector embedding)
├── ai-expert.ts             # Orchestrator Q → RAG → Gemma → răspuns
├── match-paths/
│   ├── types.ts             # ClientProfile, FiscalEvent, MatchPathAlert
│   └── paths.ts             # 5 paths deterministice (testable, no LLM dependency)
├── daily-briefing.ts        # Agregare alerts + LLM headline
└── demo-portfolio.ts        # 5 demo clients + events (seed pentru test)
```

**Architectural decisions importante:**
- **Knowledge base = pluggable** — corpus e doar un array TS; mâine poți înlocui cu Qdrant fără rescriere expert/RAG
- **Match Paths = deterministice** — pure functions, fără LLM, testabile cu vitest
- **LLM doar pentru HEADLINE și CHAT** — alertele și acțiunile sunt 100% deterministe
- **Privacy by design** — Gemma local (Ollama HTTP). Datele NU pleacă din serverul tău
- **Multi-vertical ready** — schimbi corpus + match paths și ai LegalCopilot / MedCopilot

---

## Ce NU e gata (V2 / next session)

### Tehnic
- [ ] Pre-warm Gemma la pornire (azi: cold start 90s, după 30-50s)
- [ ] Streaming responses (Gemma → token-by-token, UX mai bun la 30s+ latency)
- [ ] Vector DB Qdrant (înlocuiește RAG keyword cu embeddings)
- [ ] Pre-submission ANAF reconciler (compare D300 vs jurnal vs SPV)
- [ ] Cron daily briefing email (cu Vercel cron)
- [ ] Audit log per query (cine, când, ce a întrebat — GDPR audit trail)
- [ ] Per-cabinet portfolio real (înlocuiește DEMO_CLIENTS cu DB lookup pe orgId)
- [ ] Memorie longitudinală per client (învățare din history — Marcel uită mereu D205 → alarmă cu 14 zile, nu 7)

### Product
- [ ] Pricing tiered + Stripe (€39/€89/€199)
- [ ] Brand FiscCopilot complet (logo, copy, landing)
- [ ] Onboarding flow (3 clienți gratuit primul login)
- [ ] Documentation pentru cabinete (cum se integrează cu Saga/SmartBill)
- [ ] Beta program: invitați Carmen Tigău + Cristina Țicleanu + Mihaela Ionescu

### Corpus extension
- [ ] Cod Fiscal complet (parsare automată de pe legislatie.just.ro)
- [ ] OUG-uri active + alert pe modificări (RSS Monitorul Oficial)
- [ ] CECCAR Business Review (PDF parse)
- [ ] Cazuri reale anonimizate (pentru few-shot learning în LLM)

---

## Lecții învățate noaptea asta

1. **Gemma 4 e2b funcționează pentru fiscal RO** — dar e mort fără RAG. Cu RAG: răspunsuri grounded și citabile.
2. **Latency Gemma = problem real** — 30-60s/răspuns nu e acceptabil pentru chat real-time. Solutions: streaming, smaller model (Gemma 2 2B?), sau hybrid cu Claude Sonnet pentru urgente.
3. **Match Paths deterministice = câștigătoare** — alertele sunt corecte, repetabile, testabile, fără halucinație LLM. LLM e doar pentru EXPLICAȚIE, nu pentru DECIZIE.
4. **Demo portfolio rich = critical pentru sales** — fără seed data care triggers, demo-ul arată gol. Acum 6 alerte vizibile, 4 severities reprezentate.
5. **TypeScript strict mode = ZERO erori** pe noul cod — toate erorile build-ului sunt în test files pre-existente.

---

## Comenzi utile

```bash
# Working directory
cd /Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/fiscal-mature

# Branch
git checkout feat/fiscal-copilot-2026-05-14

# Dev server
PORT=3210 npx next dev -p 3210

# Smoke tests directe (no UI)
npx tsx lib/fiscal-copilot/__smoke-test__.ts        # AI Expert full pipeline (slow)
npx tsx lib/fiscal-copilot/__test-match-paths__.ts  # Match Paths (fast)
npx tsx lib/fiscal-copilot/__test-briefing__.ts     # Daily Briefing (slow)

# Verify Ollama
ollama list
ollama run gemma4:e2b "Test"

# TypeScript check
npx tsc --noEmit --project tsconfig.json 2>&1 | grep fiscal-copilot
# (no output = no errors)
```

---

## Comparativ cu plan inițial (14 zile MVP)

| Component | Plan 14 zile | Status realizat în noapte |
|-----------|--------------|---------------------------|
| Branch + scaffolding | Ziua 1 | ✅ Done |
| LLM + RAG layer | Zilele 3-7 | ✅ Done (seed corpus) |
| AI Expert pipeline | Zilele 3-7 | ✅ Done |
| Match Paths top 5 | Zilele 8-10 | ✅ Done |
| Daily Briefing | Zilele 8-10 | ✅ Done |
| API endpoints | (planificat) | ✅ Done (4 endpoints) |
| UI Dashboard | Zilele 11-12 | ✅ Done (3 tabs, 4 components) |
| Demo portfolio | (planificat) | ✅ Done (5 clients, 6 alerts) |
| Branding FiscCopilot | Zilele 11-12 | ⏳ Branding visual NU e gata |
| Pricing + Stripe | Zilele 11-12 | ⏳ Nu e gata |
| Beta cabinete | Zilele 13-14 | ⏳ Nu e gata |

**Ratio: ~70% din MVP livrat într-o noapte**. Restul = brand + pricing + sales = trebuie făcut cu tine.

---

## Următorul pas când te trezești

1. Pornește Ollama dacă nu rulează: `ollama serve &`
2. Deschide <http://localhost:3210/demo/fiscal-copilot>
3. Joacă-te 15 minute: chat, briefing, alerts
4. Spune-mi cum simți produsul:
   - **GO** → continui cu branding + pricing + beta
   - **PIVOT** → ajustăm direcția (ex: dacă LLM e prea slow → switch la Claude API)
   - **STOP** → mai discutăm

Dimi te aștept cu feedback.

— Claude (sesiune overnight 2026-05-14 → 15)
