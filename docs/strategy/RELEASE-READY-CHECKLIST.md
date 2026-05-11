# 📋 Release Ready Checklist — CompliScan v1.0

> Singura listă de care ai nevoie pentru a duce v3-unified la production live.
> Bifează în ordinea de mai jos. Tot ce e ✅ e gata, tot ce e ⏳ rămâne pentru founder side.

**Branch**: `v3-unified` · **Worktree**: `.claude/worktrees/v3-unified` · **Commit HEAD**: `6deea54`+

---

## 0 · Status code-side (toate ✅)

| Item | Status | Verificare |
|------|--------|----|
| Build clean | ✅ | `npm run build` → 0 errors |
| Tests verzi | ✅ | `npx vitest run` → 1235 pass, 0 fail, 6 skipped |
| TypeScript strict | ✅ | `npx tsc --noEmit` → 0 errors |
| Sprint 0 + 0.5 (10 bug fixes) | ✅ | commit-uri Sprint 0 + 0.5 |
| 7 cerințe DPO Complet | ✅ | toate cap-coadă (Issue 1-7) |
| Sprint 1 (9 features) | ✅ | S1.1 ... S1.9 livrate |
| Sprint 2A (5 tasks) | ✅ | S2A.1 + S2A.4-7 |
| Sprint 2B (3 tasks) | ✅ | S2B.1 Mistral + S2B.2 dual-write playbook + S2B.3 hash chain |
| Sprint 3 (3 tasks) | ✅ | S3.1 drift cron + S3.2 4 landing pages + S3.3 waitlist |
| S3.4 ICP-aware login | ✅ | bonus: login page schimbă conținut per `?icp=` |

---

## 1 · Founder setup — env vars (înainte de prima rulare production)

Rulează `npm run verify:release-ready` să vezi care lipsesc.

### 🔒 Critical (Vercel va refuza fără ele)

- [ ] `COMPLISCAN_SESSION_SECRET` — generează cu `openssl rand -base64 48`
- [ ] `SHARE_TOKEN_SECRET` — generează cu `openssl rand -base64 32`
- [ ] `NEXT_PUBLIC_APP_URL` — `https://app.compliscan.ro` (fără slash final)

### 🤖 AI Provider (cel puțin unul)

- [ ] `GEMINI_API_KEY` — https://aistudio.google.com/apikey
- [ ] `MISTRAL_API_KEY` — https://console.mistral.ai/api-keys (opțional, pentru EU sovereignty)

### 📌 Recomandat (degraded fără)

- [ ] `RESEND_API_KEY` — https://resend.com/api-keys
- [ ] `CRON_SECRET` — random 32+ char (Vercel îl injectează în cron headers)
- [ ] `ALERT_EMAIL_FROM` — adresă verificată în Resend (ex: `noreply@compliscan.ro`)

### ☁ Supabase (production setup, vezi secțiunea 2)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### 💳 Stripe (vezi secțiunea 3)

- [ ] `STRIPE_SECRET_KEY` — `sk_live_…`
- [ ] `STRIPE_WEBHOOK_SECRET` — `whsec_…` (din Stripe Dashboard > Webhooks)
- [ ] 9 SKU ICP tier IDs (vezi `verify:release-ready` output pentru lista exactă)

---

## 2 · Supabase cutover (S2A.7 + S2B.2)

Playbook-ul oficial pentru zero-downtime cutover de la file-system la Supabase.

### Pas 1 — Schema setup

```bash
# Supabase Dashboard → SQL Editor
# Aplică migration-urile din docs/supabase/migrations/ (dacă există)
# SAU rulează manual create table org_state, organizations, memberships, etc.
```

Verifică:

```bash
npm run verify:supabase:strict
# Trebuie să returneze 0 errors. Dacă apar errors despre RLS lipsă →
npm run verify:supabase:rls
```

### Pas 2 — Migrare date file-system → Supabase

```bash
# Dry-run (audit, NO writes)
npm run migrate:fs-to-supabase

# Apply real (idempotent — re-rulabil safe)
npm run migrate:fs-to-supabase:apply
```

### Pas 3 — Activează dual-write (1 săpt monitor)

În Vercel Dashboard:

```env
COMPLISCAN_DATA_BACKEND=dual-write
```

Re-deploy. **Monitorizează 1 săpt** logs Vercel pentru:

```
[dual-write] discrepancy org=...
```

**Zero discrepancies în 7 zile = OK pentru cutover.**

### Pas 4 — Cutover real

```env
COMPLISCAN_DATA_BACKEND=supabase
```

Re-deploy. Monitorizează 24h pentru spike erori. Dacă OK, **production officially on Supabase**.

### Rollback (dacă apare problemă)

```env
COMPLISCAN_DATA_BACKEND=local       # imediat
COMPLISCAN_ALLOW_LOCAL_FALLBACK=true
```

State-ul rămâne în `.data/` din Vercel ephemeral storage — pierzi modificările făcute pe Supabase între cutover și rollback. Dacă pilot a făcut modificări critice, copiază înapoi prin script invers (TODO post-pilot).

---

## 3 · Stripe setup (14 SKU ICP)

În Stripe Dashboard:

### Pas 1 — Configurează produsele

Pentru fiecare din cele 14 SKU din Doc 06:

| Tier ID | Name | Price (EUR/mo) | Env var |
|---------|------|----------------|---------|
| solo-starter | Solo Starter | 49 | `STRIPE_PRICE_SOLO_STARTER_MONTHLY` |
| solo-pro | Solo Pro | 99 | `STRIPE_PRICE_SOLO_PRO_MONTHLY` |
| imm-internal-solo | IMM Internal Solo | 99 | `STRIPE_PRICE_IMM_INTERNAL_SOLO_MONTHLY` |
| imm-internal-pro | IMM Internal Pro | 299 | `STRIPE_PRICE_IMM_INTERNAL_PRO_MONTHLY` |
| cabinet-solo | Cabinet DPO Solo | 499 | `STRIPE_PRICE_CABINET_SOLO_MONTHLY` |
| cabinet-pro | Cabinet DPO Pro | 999 | `STRIPE_PRICE_CABINET_PRO_MONTHLY` |
| cabinet-studio | Cabinet DPO Studio | 1999 | `STRIPE_PRICE_CABINET_STUDIO_MONTHLY` |
| fiscal-solo | Cabinet Fiscal Solo | 299 | `STRIPE_PRICE_FISCAL_SOLO_MONTHLY` |
| fiscal-pro | Cabinet Fiscal Pro | 699 | `STRIPE_PRICE_FISCAL_PRO_MONTHLY` |
| pro (legacy) | Pro | 99 | `STRIPE_PRICE_PRO_MONTHLY` |
| partner (legacy) | Partner | 999 | `STRIPE_PRICE_PARTNER_MONTHLY` |

(Restul `partner_10/25/50` legacy au fallback automat la `STRIPE_PRICE_PARTNER_MONTHLY` dacă nu sunt configurate.)

### Pas 2 — Webhook endpoint

Stripe Dashboard → Webhooks:
- Endpoint: `https://app.compliscan.ro/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.deleted`,
  `customer.subscription.updated`, `invoice.payment_failed`
- Copiază `whsec_…` în env var `STRIPE_WEBHOOK_SECRET`

### Pas 3 — Test in test mode

```bash
# Local dev — folosește sk_test_ + Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
# În alt terminal: trigger checkout pe http://localhost:3000/dashboard/settings/abonament
```

---

## 4 · Resend setup (S1.8 — magic link emails)

În Resend Dashboard:

- [ ] Verifică domeniul `compliscan.ro` (DNS: SPF + DKIM)
- [ ] Generează API key → `RESEND_API_KEY`
- [ ] Setează "From" verificat: `noreply@compliscan.ro`
- [ ] Pentru cabinete cu domeniu propriu: setează `COMPLISCAN_CABINET_EMAIL_FROM` per env per Vercel preview

Test:
```bash
# Trimite document din /dashboard/generator → magic link patron
# Verifică în Resend Dashboard că email-ul a ajuns
```

---

## 5 · DNS + Vercel setup

- [ ] Custom domain `app.compliscan.ro` → conectat la Vercel project
- [ ] SSL valid (auto via Vercel)
- [ ] Vercel cron schedules verificate (16 cron-uri în `vercel.json`)
- [ ] Robots.txt OK (verifică `https://app.compliscan.ro/robots.txt`)
- [ ] Sitemap OK (verifică `https://app.compliscan.ro/sitemap.xml`)

---

## 6 · Pilot DPO Complet (kickoff joi 7 mai 2026 15:00)

### Pre-pilot prep (4-6 mai, 3 zile)

- [ ] Internal DPO OS gate: `BASE_URL=http://127.0.0.1:3001 npm run verify:dpo-os` → 60/60 PASS (vezi `docs/strategy/pilot/dpo-os-internal-readiness-gate-2026-05-01.md`)
- [ ] Slide deck Diana — 60min kickoff (pulled from `docs/strategy/pilot/dpo-complet-demo-script-2026-05-07.md`)
- [ ] Dry-run demo (founder simulează Diana's flow end-to-end)
- [ ] Pre-pilot email Diana confirm (template în `docs/strategy/pilot/dpo-complet-pre-pilot-email-2026-05-02.md`)

### Pilot week 1 (8-13 mai)

- [ ] Săpt 1 scenariu: setup brand cabinet + first document internal (50 min)
- [ ] Daily check-in pe Slack: ce funcționează, ce nu

### Decision Gate #1 — joi 5 iunie 2026

- [ ] Retro 90 min cu Diana
- [ ] Decision: GO/NO-GO production launch
- [ ] Dacă GO → continuă cu launch 22 iun

---

## 7 · Production launch (luni 22 iunie 2026)

### Pre-launch (vineri 19 iun)

- [ ] `npm run verify:release-ready:strict` → exit 0
- [ ] Smoke test manual: register → onboarding → first scan → first document → magic link → audit pack export
- [ ] Backup state Diana (snapshot Supabase + ZIP `.data/state-{orgId}.json`)
- [ ] Sentry release tag

### Launch day (luni 22 iun)

- [ ] Deploy `v3-unified` → main → Vercel production
- [ ] Verifică post-deploy: `/`, `/dpo`, `/login`, `/dashboard` (înregistrat) răspund 200
- [ ] Anunț LinkedIn / Twitter / Facebook (cu Diana ca first-pilot reference)

### Post-launch monitoring (22-30 iun)

- [ ] Sentry zero unhandled errors
- [ ] Stripe primul checkout real
- [ ] Vercel cron-uri rulează clean (verifică logs)
- [ ] Primul cabinet plătitor altul decât Diana

---

## 8 · Smoke test recommended

Inainte sa accepti production live, fă manual:

```bash
# 1. Pornire dev local pentru DPO gate
COMPLISCAN_DATA_BACKEND=local COMPLISCAN_AUTH_BACKEND=local PORT=3001 npm run dev

# 2. DPO OS gate intern (fără email real accidental)
BASE_URL=http://127.0.0.1:3001 npm run verify:dpo-os

# 3. DPO OS gate cu email live explicit
BASE_URL=http://127.0.0.1:3001 EMAIL_TEST_TO=adresa@exemplu.ro npm run verify:dpo-os:email

# 4. Pornire dev local pentru smoke public clasic, dacă nu rulează deja pe 3000
npm run dev

# 5. Smoke flow public
curl -sI http://localhost:3000/                    # 200
curl -sI http://localhost:3000/dpo                 # 200 (landing DPO)
curl -sI http://localhost:3000/fiscal              # 200
curl -sI http://localhost:3000/imm                 # 200
curl -sI http://localhost:3000/nis2                # 200
curl -sI http://localhost:3000/pricing             # 200
curl -sI http://localhost:3000/waitlist            # 200
curl -sI "http://localhost:3000/login?icp=cabinet-dpo" # 200 + violet pane

# 6. Smoke flow API public (fără auth)
curl -X POST http://localhost:3000/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-test@example.com","icpSegment":"cabinet-dpo"}'
# {"ok":true,"alreadyOnList":false,"message":"Te-am adăugat..."}

# 7. Stripe checkout (în demo mode, fără STRIPE_SECRET_KEY)
# Browser: /dashboard/settings/abonament → click "Activează cu Stripe" → demo URL

# 8. Cron drift-sweep (dacă CRON_SECRET=test)
curl -H "Authorization: Bearer test" http://localhost:3000/api/cron/drift-sweep

# 9. Hash chain verification (din DevTools console după login)
# fetch("/api/dashboard").then(r=>r.json()).then(d=>console.log(d.state.events?.[0]))
# trebuie să apară selfHash + prevHash
```

---

## 9 · Rollback plan (dacă launch eșuează)

Dacă post-launch apar erori critice (>2% error rate / >5s p95 latency / Stripe webhook fail):

1. **Vercel**: revert deploy → click previous deploy → Promote to production (~30 sec)
2. **Stripe**: dezactivează webhook endpoint în Stripe Dashboard
3. **Supabase**: păstrează state intact, NU șterge nimic
4. **Comunicare**: 1 tweet + 1 email Diana cu ETA fix
5. **Debug**: Sentry + Vercel logs → root-cause → patch + re-deploy

---

## ✅ Final OK to launch

Doar după:
- [ ] Diana semnează "GO" la retro 5 iun
- [ ] Toate ✅ din secțiunile 1-5 bifate
- [ ] Smoke test manual trecut
- [ ] Backup pre-launch executat

Atunci → **production live**.
