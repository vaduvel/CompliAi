# Bundle D — Fiscal Cabinet Launch — Plan de execuție + coordonare cu Codex

**Data:** 2026-05-09
**Author:** Claude (Sonnet 4.5)
**Branch:** `feat/bundle-d-fiscal-launch`
**Branched de la:** `v3-unified` (commit `5e2d135 fix(dpo-os): close pre-commit blocker wave`)
**Worktree:** `.claude/worktrees/v3-unified` (worktree existent reutilizat — branch v3-unified neatins)
**Coordonare cu:** Codex (lucrează pe `dpo-os-claude-polish`)
**Status:** Document execuție activ — actualizat pe măsură ce avansez

---

## 0. Context strategic

Per **CompliScan-Raport-Final-Validare-Piata-2026-05-07.md** (validare empirică 10 cercetări paralele):
> "🔒 DECIZIE LOCK: lansare SECVENȚIALĂ (Bundle D wedge) confirmată empiric. NU pivotă la 4 bundle-uri paralel fără capital + echipă."

**Ordinea lansării (decisă):**
1. **Bundle D — Fiscal Cabinet Layer** (Mai-Iul 2026) ← AICI suntem
2. AI Governance build (Iul-Aug 2026)
3. Bundle A DPO Cabinet public launch (Sep-Oct 2026)
4. Bundle B HR Pay Transparency (Q1 2027)
5. Bundle C Banking/IFN DORA (Q2-Q3 2027)

**Bundle D = wedge product** pentru contabili CECCAR (audiența caldă FB 65K + Adrian Bența + CECCAR 45K membri).

---

## 1. Cine face ce

| Rol | Branch | Scope | Fișiere principale |
|-----|--------|-------|--------------------|
| **Claude** (eu) | `feat/bundle-d-fiscal-launch` | Bundle D Fiscal end-to-end pentru contabili | `lib/compliance/efactura-*`, `lib/compliance/saft-*`, `lib/compliance/etva-*`, `app/api/fiscal/*`, `app/api/efactura/*`, `app/api/cron/efactura-*` |
| **Codex** | `dpo-os-claude-polish` | DPO OS polish + pilot DPO Complet | `lib/compliance/dpo-*`, `app/api/dpo/*`, `app/api/cabinet/templates/*`, `app/portfolio/*`, `app/dashboard/cabinet/*`, `components/compliscan/dpo-*.tsx`, `partner-*.tsx`, `portfolio-*.tsx` |

**Lucrăm pe branch-uri SEPARATE, NU ne intersectăm pe scope.**

---

## 2. Strategia de cod — branch real doar fiscal, peste motorul v3-unified

```
main                                ← legacy, cleanest production
  │
  └─ v3-unified                      ← motorul mature: cabinet OS + white-label + fiscal engine + DPO + everything
       │
       ├─ feat/bundle-d-fiscal-launch   ← Claude — DOAR fiscal additions
       │   • module visibility filter per icpSegment
       │   • auto-repair UX disclaimer + audit log
       │   • cron SPV real (mock → live)
       │   • D406 upload + verify
       │   • P300 vs D300 comparator
       │   • bulk ZIP import facturi
       │
       └─ dpo-os-claude-polish          ← Codex — DPO polish
```

**Rezultat:** diff `v3-unified..feat/bundle-d-fiscal-launch` conține EXCLUSIV fiscal additions. La merge, putem:

- **Opțiunea A:** merge `v3-unified → main` ca release mare (DPO + tot) → apoi merge `feat/bundle-d-fiscal-launch → main` (doar fiscal additions)
- **Opțiunea B:** merge direct `feat/bundle-d-fiscal-launch → main` (aduce v3-unified + fiscal într-un go)

Decizia se ia la momentul shipping — nu blocant acum.

---

## 3. Cele 6 GAP-uri identificate cap-coadă

### GAP #1 — Module visibility per icpSegment (BLOCKER UX)

**Problemă verificată în cod:**
Sidebar-ul actual afișează aceleași items pentru toți userii. Filter-ul existent e doar pe `workspaceMode` (org vs portfolio), NU pe `icpSegment`. Contabilul (`cabinet-fiscal`) vede DSAR/RoPA/DPIA/AI Systems/Breach/NIS2 — irelevant pentru el.

**Soluție:**
- Creez `lib/compliscan/icp-modules.ts` cu tabel central `MODULES_PER_ICP`
- Pentru `cabinet-fiscal` → expune DOAR: home, scan, resolve, dosar, fiscal, calendar, settings
- Pentru `cabinet-dpo` → home, scan, resolve, dosar, ropa, dsar, dpia, breach, training, magic-links, cabinet-templates, approvals, settings
- Pentru `cabinet-hr` → home, scan, resolve, dosar, pay-transparency, settings
- Pentru `imm-internal` → TOT (compliance officer vrea tot)
- Pentru `enterprise` → TOT + DORA + NIS2 maturity
- Pentru `solo` → simplificat
- Adaug `filterNavByIcp(sections, icpSegment)` în `components/compliscan/navigation.ts`
- 5-10 linii apel în `components/compliscan/dashboard-shell.tsx`

**Effort:** ~80 linii. **Atac PRIMUL — blocker UX.**

### GAP #2 — Auto-repair UX disclaimer + audit log (BLOCKER LEGAL CECCAR)

**Problemă:** `components/compliscan/efactura-validator-card.tsx` are buton auto-repair fără disclaimer. Contabilul e responsabil profesional CECCAR — fără "sugestie + click apply" + audit log per fix, primul caz de malpraxis închide produsul.

**Soluție:**
- Modific UI în `efactura-validator-card.tsx` (NU lib/, doar componenta)
- Banner disclaimer + checkbox "Am revizuit și aprob fiecare modificare conform Codului Deontologic CECCAR"
- Audit log per `applyFix` apel la `appendComplianceEvents` (există deja)
- Engine-ul `lib/compliance/efactura-xml-repair.ts` rămâne neatins

**Effort:** ~70 linii (50 UI + 20 audit log).

### GAP #3 — Cron SPV mock → real (autonomy)

**Problemă verificată:** `app/api/cron/efactura-spv-monthly/route.ts:42` folosește `buildMockEFacturaSignals()`. Comentariu zice: *"In production: fetch real signals from ANAF SPV per org CUI. For now: use mock signals as demo baseline"*. Contabilul TREBUIE să apese manual "Verifică SPV" pentru fiecare client.

**Soluție:**
- Modific `app/api/cron/efactura-spv-monthly/route.ts`
- Înlocuiesc mock cu loop pe orgs cu token ANAF + apel `fetchSpvMessages(token, cui, 30)` (există deja în `/api/fiscal/spv-check/route.ts:105`)
- Reutilizez `spvMessageToFinding()` deja existent
- Fallback la mock signals dacă orgul NU are token ANAF connected

**Effort:** ~80 linii backend.

### GAP #4 — D406 SAF-T upload + verify

**Problemă:** `/api/fiscal/d406-evidence` doar bifează "depus". Engine-ul `lib/compliance/saft-hygiene.ts` (369 linii, deja există) nu poate fi folosit — nu există endpoint upload.

**Soluție:**
- Creez `app/api/fiscal/d406-upload/route.ts` (~150 linii)
- Parser XML SAF-T
- Apel engine `computeSAFTHygieneScore()` existent
- Generate findings pentru rectificări multiple, gap-uri perioadă, missing data
- UI: nou tab "SAF-T Hygiene" în `/dashboard/fiscal` (modific `app/dashboard/fiscal/page.tsx` + adaug `components/compliscan/fiscal/SaftHygieneTab.tsx`)

**Effort:** ~200 linii (150 backend + 50 UI).

### GAP #5 — P300 vs D300 calculator (diferențiator unic)

**Problemă:** `lib/compliance/etva-discrepancy.ts` are state machine pentru notificări **primite** de la ANAF. Nu calculează preventiv diferența D300 ↔ P300 pre-completat. Contabilul reacționează când vine notificarea — nu poate PREVENI.

**Soluție:**
- Creez `lib/compliance/d300-p300-comparator.ts` (~80 linii)
- Endpoint `app/api/fiscal/p300-check/route.ts` (~50 linii) — apel ANAF SPV pentru pre-completata
- Generate finding cu countdown 20 zile dacă diferența >20% și ≥5K lei (per OUG 70/2024 modif. 89/2025)

**Effort:** ~150 linii.

### GAP #6 — Bulk import facturi ZIP (quick win UX)

**Problemă:** contabilul cu 50 clienți × 100 facturi/lună = 5.000 drag-drops/lună inacceptabil.

**Soluție:**
- Endpoint `app/api/efactura/bulk-upload/route.ts` (~30 linii)
- Parse ZIP cu multiple XML-uri, rulare validator V001-V011 pe fiecare în paralel
- UI: drag-drop area pentru ZIP în `efactura-validator-card.tsx`

**Effort:** ~50 linii.

---

## 4. Fișiere pe care le ating eu (Claude) — Codex NU lucra paralel pe ele

### Lib (compliance fiscal):
- `lib/compliscan/icp-modules.ts` (NOU — module per ICP)
- `lib/compliance/d300-p300-comparator.ts` (NOU)

### App routes (fiscal):
- `app/api/cron/efactura-spv-monthly/route.ts` (modify mock → real)
- `app/api/fiscal/d406-upload/route.ts` (NOU)
- `app/api/fiscal/p300-check/route.ts` (NOU)
- `app/api/efactura/bulk-upload/route.ts` (NOU)

### Components (UI fiscal):
- `components/compliscan/efactura-validator-card.tsx` (disclaimer + audit log + bulk upload)
- `components/compliscan/fiscal/SaftHygieneTab.tsx` (NOU)
- `app/dashboard/fiscal/page.tsx` (adăugare tab nou)

### Navigation (PARTAJAT — protocol sync cu Codex):
- `components/compliscan/navigation.ts` (adaug funcție `filterNavByIcp`, NU șterg items existenti)
- `components/compliscan/dashboard-shell.tsx` (5-10 linii apel filter, fără să strici flow-ul DPO)

---

## 5. Fișiere pe care NU le ating (sunt ale lui Codex / DPO OS)

- `lib/compliance/dpo-*.ts`, `lib/server/dpo-*.ts`
- `lib/server/cabinet-templates-store.ts`
- `lib/server/white-label.ts` (DOAR icpSegment-ul îl extind dacă e cazul, additive only)
- `app/api/dpo/**`
- `app/api/partner/**` (cu excepția dacă adaug rute pentru cabinet-fiscal portfolio — anunț Codex înainte)
- `app/api/cabinet/templates/**`
- `app/dashboard/cabinet/**`, `app/portfolio/**`, `app/dpo/**`
- `app/api/breach-notification/**`, `app/api/dsar/**`, `app/api/dpia/**`, `app/api/ropa/**`
- `components/compliscan/dpo-*.tsx`, `partner-*.tsx`, `portfolio-*.tsx`
- `app/employee-portal/**` (Pay Transparency portal — Q1 2027 work)

---

## 6. Zone partajate — sincronizare obligatorie înainte de merge

| Fișier | Eu modific | Codex modifică (probabil) | Risc conflict |
|--------|-----------|---------------------------|---------------|
| `lib/server/white-label.ts` | DOAR icpSegment additive | Configs cabinet-dpo | LOW (additive only) |
| `lib/server/stripe-tier-config.ts` | Adaug 5 SKU Bundle D + revizuiesc fiscal-solo/pro pricing | DPO tier-uri | LOW (additive) |
| `components/compliscan/navigation.ts` | Adaug funcție `filterNavByIcp`, NU șterg | Adaugi nav items DPO noi? | MEDIUM — coordonăm |
| `components/compliscan/dashboard-shell.tsx` | Adaug 5-10 linii filter call | Modificări UX DPO sidebar | MEDIUM — coordonăm |
| `app/dashboard/fiscal/page.tsx` | Adăugare tab SAF-T Hygiene | NU ar trebui să atingi | LOW |

**Protocol:** dacă Codex atinge `navigation.ts` sau `dashboard-shell.tsx`, să lase comment în PR/Slack. Eu fac merge cu rebase pe `v3-unified` și rezolv.

---

## 7. Ordinea atac (secvențial — sanity)

| Pas | Gap | Effort | Status |
|-----|-----|--------|--------|
| 1 | GAP #1 — module visibility per icpSegment | ~80 linii | 🔵 NEXT |
| 2 | GAP #2 — auto-repair disclaimer + audit log | ~70 linii | ⏳ Pending |
| 3 | GAP #3 — cron SPV real | ~80 linii | ⏳ Pending |
| 4 | GAP #4 — D406 SAF-T upload + verify | ~200 linii | ⏳ Pending |
| 5 | GAP #5 — P300 vs D300 comparator | ~150 linii | ⏳ Pending |
| 6 | GAP #6 — bulk ZIP upload | ~50 linii | ⏳ Pending |
| **TOTAL** | | **~630 linii** | **5-8 zile lucrătoare** |

---

## 8. Întrebări pentru Codex (răspuns 24h preferat)

1. **Cabinet templates store** (`lib/server/cabinet-templates-store.ts`) — adaugi `fiscal-validator-report` ca template type? Dacă da, anunță-mă să nu-l adaug eu duplicate.
2. **Stripe tier `fiscal-solo` €299 / `fiscal-pro` €699** — eu vreau să le ajustez per validation report la €49/199/499. OK pentru tine sau ai constraints?
3. **Cron arch** — mergem pe Vercel Cron / Supabase pg_cron / alt mecanism? Vreau să adaug `efactura-spv-real` lângă `dpo-monthly-digest`.

Dacă răspunde în 24h, perfect. Altfel atac autonom cu defaults rezonabile (tier pricing aliniat raport, template nou independent, cron Vercel).

---

## 9. Definition of Done pentru Bundle D launch

- [ ] Toate 6 GAP-uri rezolvate, testate
- [ ] `npm run build` exit 0 (production build verde)
- [ ] `npx vitest run` toate testele PASS (existing 1294/1300 + cele noi pentru fiscal)
- [ ] Smoke test cap-coadă pe `/dashboard/fiscal` cu user `cabinet-fiscal`:
  - Login → redirect /dashboard
  - Sidebar arată DOAR fiscal items
  - Upload XML factură invalidă → vede V003 eroare
  - Click "Sugestie + Apply fix" cu disclaimer + audit log
  - Submit la ANAF SPV (mock environment)
  - Cron SPV detectează factură respinsă → finding generat
  - Resolve flow + retransmit
  - Upload D406 SAF-T → vezi hygiene score
  - Compară D300 vs P300 → vezi gap
  - Bulk upload ZIP cu 5 facturi → toate validate
- [ ] Documentație tehnică scrisă: `docs/fiscal-bundle-d-architecture.md`
- [ ] PR descriptiv către `v3-unified` (sau `main` direct, decide user)

---

## 10. Roadmap GTM după code-ready (referință — NU code work)

Per validation report, după Bundle D code ready:
- Stripe SKU-uri Bundle D (Solo €49 / Pro €199 / Studio €499 / Enterprise + Patron €39)
- Onboarding "Ce rol ai?" Contabil primary
- Landing `/pentru/contabil` (NU se duplică cu `/fiscal` existing — e variantă lead-magnet)
- Calculator amenzi e-Factura B2C (lead magnet)
- SAF-T Hygiene Calculator (lead magnet)
- Demo video Loom 5 min
- Outreach Adrian Bența + Universul Fiscal + Nicoleta Banciu (admin grup FB 65K)
- CECCAR sponsorship regional

Asta e GTM, nu code. Eu mă opresc la code-ready.

---

## 11. Update log (live)

| Data | Acțiune | Ce s-a făcut |
|------|---------|--------------|
| 2026-05-09 | Branch creat | `feat/bundle-d-fiscal-launch` din `v3-unified` (commit `5e2d135`) |
| 2026-05-09 | GAP report scris | 6 gap-uri identificate cap-coadă, ordine atac stabilită |
| 2026-05-09 | Document execuție creat | Acest fișier salvat ca artefact tracked în git |
| (TBD) | GAP #1 atacat | Module visibility per icpSegment |
| ... | ... | ... |

---

🔒 **LOCK:** branch `feat/bundle-d-fiscal-launch` e branch-ul real fiscal. Nu fac modificări în alte branch-uri. Toate Sprint-urile Bundle D se commit-uiesc aici. Codex pe `dpo-os-claude-polish`. Merge-urile decid user-ul la momentul shipping.
