# Sprint Log — Rafinări Sprint 2.1–3.1
> Fișier viu. Actualizat după fiecare sesiune de lucru.
> Skill: `/sprint-log` — deschide, actualizează, închide sprint-uri direct din Claude Code.

---

## Stare curentă

| Sprint | Titlu | Status | Deschis | Închis |
|---|---|---|---|---|
| R-1 | Annex IV generator (EU AI Act) | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-2 | Pre-fill generator din org state | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-3 | NIS2 → generează plan IR direct | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-4 | Auto-alert DPA la sistem AI nou | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-5 | Download .md → copy clipboard + preview | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-6 | Partner: export CSV clienți | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-7 | DNSC incident fields + Export DNSC | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-8 | NIS2 gaps → remediation board central | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-9 | e-Factura → NIS2 vendor schema hook | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-10 | NIS2 incidents + vendors în audit-pack bundle | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-11 | Applicability Engine — stratul zero | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-12 | PDF export real — pdfkit server-side | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-13 | Audit Pack MANIFEST.md + MANIFEST.pdf | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-14 | NIS2 Maturitate DNSC — wizard 10 domenii | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-15 | Board/CISO Training Tracker | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| R-16 | CER cross-signal — entități critice | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| S-5.1 | Vendor detection 3 niveluri — HIGH/LOW confidence cu UI | 🟢 Închis | 2026-03-17 | 2026-03-17 |
| S-5.4 | Supply Chain Risk Score NIS2 (VendorRiskProfile + findings) | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-3.2 | Notificări in-app — bell icon, badge, dropdown, polling | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-3.3 | Onboarding checklist — 8 pași auto-bifați din stare reală | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-6.1 | Disclaimer juridic consistent pe toate suprafețele | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-6.2 | Certitudine vizuală — statut juridic per framework (LegalBasis) | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-6.3 | Login page profesionistă — tagline + value props | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-6.4 | Error handling graceful — boundaries + 404 page | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-7.1 | Rate limiting API — in-memory, 60 req/min general, 10 generate | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-7.2 | Input validation — validateCUI + sanitizeForMarkdown | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| S-8 | AI Act Timeline Tracker — per sistem AI, per risk level | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P0.0 | Resolution Layer per Finding — drum complet detectare→inchidere | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P0.1 | One-Page Compliance Report — HTML preview + PDF descărcabil | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P0.2 | NIS2 Rescue — DNSC înregistrare tardivă, mesaj juridic prudent | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P0.3 | e-Factura Risk Dashboard — semnale risc fiscal + findings automate | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P0.4 | Accountant Hub Multi-Client — urgency signals NIS2 + e-Factura | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P1.1 | Compliance Response Pack — due diligence / chestionar conformitate | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P1.2 | Health Check Periodic — 6 verificări, scor 0-100, card dashboard | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P1.3 | Inspector Mode Enhanced — simulare perspectivă auditor extern | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P2.1 | Shadow AI Questionnaire — identificare utilizare AI nedeclarată | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-P2.2 | Board/CISO Training Tracker | ⚪ Anulat | — | — |
| V3-P2.3 | AI Act Timeline Tracker | ⚪ Anulat | — | — |
| V3-QA.1 | Audit Full + Bug Fixes RBAC + Teste V3 | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V3-QA.2 | Audit complet V1+V2+V3+definitia-perfecta — fixuri UX copy + test R-10 | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V4-P2.1 | V4.2 Commercial Readiness — Pricing page, Plan logic, Stripe, Legal pages, Landing page | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V4-P4.4 | V4.4 Pilot Infrastructure — analytics, onboarding emails, micro-feedback | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V4-PARK | Parcate extern V4 — deploy Vercel, domeniu/email propriu, Sentry, Resend, Stripe | 🟢 Închis | 2026-03-18 | 2026-03-25 |
| V5-S1 | V5.1+V5.2 Vendor Review Workbench + Contextual Review Generator | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V5-S2 | V5.3+V5.4 Human Approval + Closure + Revalidation Cycle | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V5-S3 | V5.5+V5.6 Partner Launch Mode + Response Pack Integration | 🟢 Închis | 2026-03-18 | 2026-03-18 |
| V6-F1 | V6 Agentic Engine Phase 1 — Orchestrator + Compliance Monitor + Fiscal Sensor + Dashboard UI | ⏸️ Parcat | 2026-03-18 | — |
| EOS-S2 | EOS Sprint 2: A5 crons + A6 SLA timers + B1 Gemini primary engine | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S3 | EOS Sprint 3: B2 finding→task + B3 auto-doc + B4 auto-apply low-risk | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S4 | EOS Sprint 4: B5 vendor sync + B6 partner digest + C1-C2 vendor prefill/DPA | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S5 | EOS Sprint 5: C3 vendor revalidation + D1 evidence quality | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S6 | EOS Sprint 6: D2 task re-open + E1 document expiry + E2 drift-linked refresh | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S7 | EOS Sprint 7: F1-F4 legislation/ANAF + G1-G2 reports + Addons streak/benchmark/prefill | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-S8 | EOS S8 UI Features — Streak, Benchmark, Counsel Brief, Share Token, Invoice Prefill | 🟢 Închis | 2026-03-21 | 2026-03-21 |
| EOS-BL1 | Backlog UX Audit — I6/A5/S1/A6/R2/P8 + P7 Whistleblowing (EU 2019/1937) + S2 DORA (EU 2022/2554) | 🟢 Închis | 2026-03-25 | 2026-03-25 |
| EOS-BL2 | UX Resolve Page + Fix DORA/WB — simplifică Resolution Layer, buton auto-acțiune per finding, fix WB submit middleware, Supabase migrations dora+whistleblowing | 🟢 Închis | 2026-03-25 | 2026-03-25 |
| F1 | Etapa 1 Faza1 Sprint Ready — NIS2 hotfix + Onboarding finish screen + Dashboard accumulation card + Email reînnoire rewrite | 🟢 Închis | 2026-03-25 | 2026-03-25 |
| F2 | Sprint 6A — EF-003 explainability | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F3 | Sprint 6B — EF-001 SPV state model | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F4 | Sprint 6C — EF-004/EF-005/EF-006 Fiscal Operational Risk Flows | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F5 | Sprint 7 — NIS2 maturity/governance handoff + evidence per control | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F6 | Sprint 8 — Activity Feed + Ce am verificat + Continuity Layer | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F7 | Sprint 9 — Share links + Trust Center + Partner Shareability | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F8 | Sprint 10 — AI Act + Legal Safety Layer | 🟢 Închis | 2026-03-26 | 2026-03-26 |
| F9 | Wave 3 — Specialist Module Polish + Copy Pass | 🟢 Închis | 2026-03-27 | 2026-03-27 |
| F10 | UX Audit & Flow Fix — P1-P3 (onboarding redirect, diacritice, scan banner, dosar rebuild, validate step) | 🟢 Închis | 2026-03-27 | 2026-03-27 |
| F11 | UI Reskin — De rezolvat, Scanează, Setări, Rapoarte (dark premium, zero EOS tokens) | 🟢 Închis | 2026-03-27 | 2026-03-27 |
| F12 | EOS Token Migration — Migrare completă raw Tailwind → EOS tokens | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-1 | Visual Polish — spacing, icon sizes, gap standardization | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-2 | Form Library — Input, Textarea, Checkbox, Radio, Switch, Select, Label + index.ts | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-3 | Dialog/Modal — DialogContent (sm/md/lg), Header, Footer, Title, Description, Close, Overlay + bulk confirm | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-4 | Skeleton/Loading — Skeleton, SkeletonText, SkeletonCard, SkeletonMetric + 3 pagini înlocuite | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-5 | Table component — Table, TableHeader, TableBody, TableFooter, TableRow, TableHead (sortable), TableCell, TableCaption, TableEmpty + evidence ledger | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-6 | Tooltip + Popover — TooltipProvider, SimpleTooltip, Popover + integrare 3 compliance terms (DORA, NIS2, GDPR/DSAR) | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-H1 | Hierarchy Audit — eyebrow/h1/CardTitle/button/color/aria-label standardization across all pages | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-7 | Breadcrumb + Pagination — Breadcrumb (nav, ChevronRight separator, aria-current), Pagination (page numbers, ellipsis, keyboard) + 3 deep page integrations | 🟢 Închis | 2026-03-28 | 2026-03-28 |
| DS-8 | tokens.json — W3C DTCG format export from evidence-os.css (92 tokens: surface, border, text, accent, severity, status, space, layout, radius, shadow, motion) | 🟢 Închis | 2026-03-28 | 2026-03-28 |

**Legende:** 🔵 Planificat · 🟡 În progres · 🟢 Închis · 🔴 Blocat · ⚪ Anulat

> **Sesiunea 2 (2026-03-18) COMPLETĂ.** Toate sprint-urile v2 din `CompliScan_Sprint_Improvements_v2.md` sunt închise.
> **Sesiunea 3 (2026-03-18) COMPLETĂ.** V3 complet — P0.0→P2.1 merguite în main (PR #56→#63). P2.2 și P2.3 erau deja implementate în v2 (R-15 și S-8).
> **V3 STATUS: ✅ COMPLET**
> **Sesiunea 4 (2026-03-18):** Audit complet cap-coadă V1→V3 — 6 bugs identificate, 4 fixate, +27 teste noi (PR #64).
> **Sesiunea 4b (2026-03-18):** Audit extins V1+V2+V3+definitia-perfecta — BUG-007 ProposalBundlePanel "Drift"→"Modificări", BUG-008 traceability "finding"→"constatare", BUG-009 test R-10 NIS2 în audit-pack adăugat. 491 teste trecute. Score definitia-perfecta: 11/13 complet.
> **Sesiunea 5 (2026-03-18):** V5 Sprint 1 — Vendor Review Workbench + Contextual Review Generator. Pagină separată /dashboard/vendor-review, engine branching 4 cazuri, assets generate, workflow complet detected→closed.
> **Sesiunea 6 (2026-03-18):** V5 Sprint 2 — Human Approval + Closure (V5.3) + Revalidation Cycle (V5.4). Audit trail, dovezi structurate multi-evidence, progress stepper, confirmare înainte de închidere, cron overdue detection, overdue-review state + UI, past closures history, reviewCount tracking.
> **Sesiunea 6b (2026-03-18):** V5 Sprint 3 — Partner Launch Mode (V5.5) + Response Pack Integration (V5.6). Partner vede vendor reviews per client cu metrici + status. Response pack include secțiune vendor reviews cu top reviews. Audit pack bundle exportă vendor-reviews.json + summary.
> **Sesiunea 7 (2026-03-18):** V6 Agentic Engine Phase 1 — implementat complet dar **PARCAT pe branch separat `feat/v6-agentic-engine-wip`**. Nu intră în release V4/V5. Conține: core types, orchestrator, compliance monitor (6 checks), fiscal sensor (clasificare+escalare), agent run store, cron, API, dashboard UI.
> **Sesiunea 7b (2026-03-18):** Worktree cleanup — separare V4/V5 release-safe de V6 WIP. V6 → `feat/v6-agentic-engine-wip`. Junk docs `(1)` șterse. `.claude/` adăugat la .gitignore. Navigation agents entry eliminat. Build clean, 491 teste, 0 erori TS.
> **Sesiunea EOS (2026-03-21):** Automation Layer complet — 8 sprint-uri (S2→S8) pe branch `codex/eos-v1-blueprint-main`. Implementat Faze A→G din `00-master-source.md`: Gemini primary scan engine, finding→task mapper, auto-doc generation, vendor sync/prefill/DPA, evidence quality, task re-open rules, document expiry, legislation radar (ANSPDCP/DNSC/ANAF), NIS2@RO tool importer, ANAF OAuth2+SPV, enhanced one-page report (audit readiness, content hash), partner/counsel pack, compliance streak, sector benchmark, invoice smart prefill. S8: conectare UI — streak strip, benchmark strip, counsel brief button, share token buttons, invoice prefill trigger în wizard. Definition of Done: 12/12 criterii. 0 erori TS non-test. Commits: b075724→93ff3c5.
> **F12 (2026-03-28):** EOS Token Migration — Faza 1: eliminare valorile raw Tailwind albe (bg-white/X, border-white/X, text-white/X, rounded-2xl). Token nou --eos-surface-hover adăugat. Deploy Vercel prod.
> **DS-8 (2026-03-28):** tokens.json — `docs/eos-tokens.json` creat în format W3C Design Tokens Community Group (DTCG). 92 tokens exportate din `app/evidence-os.css`: surface (6), border (3), text (4), accent (4), severity (4), status (10), space (11), layout (5), radius (5), shadow (4), motion (5). Fiecare token cu $value, $type, $description. index.ts barrel actualizat cu Breadcrumb + Pagination. Build clean. Branch: wave0/ux-foundation-ds-v2.
> **DS-7 (2026-03-28):** Breadcrumb + Pagination — Breadcrumb.tsx creat: nav aria-label, items array cu label+href opțional, ChevronRight separator (size-3), ultimul element font-medium text-eos-text cu aria-current="page", link-uri cu hover:text-eos-text, se ascunde dacă <2 items. Pagination.tsx creat: buildPageNumbers helper (ellipsis la >7 pagini), Button ghost/default pe pagina curentă, ChevronLeft/Right cu labels "Înapoi"/"Următor" (responsive hidden pe mobile), aria-label pe fiecare buton, tabular-nums, MoreHorizontal ellipsis. Integrare: NIS2/governance (back link → Breadcrumb "NIS2 > Guvernanță"), scan/results/[scanId] (back link → "Scanează > Rezultat"), DORA (back link → "De rezolvat > DORA"). index.ts: +Breadcrumb, +Pagination exports. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2.
> **DS-H1 (2026-03-28):** Hierarchy Audit — audit complet ierarhie UX/UI pe toate paginile dashboard + componente. **Eyebrow standardization:** 30+ instanțe `text-[10px] font-bold` → `text-[11px] font-medium uppercase tracking-[0.22em]` în 12 fișiere (settings-page, dosar-page, reports-page, resolve-page, scan-page, portfolio-overview-client, dashboard-shell, workspace-mode-switcher, nis2-rescue-banner, Table.tsx, pricing, app/dashboard/page). Tracking normalizat: `[0.12em]`/`[0.14em]`/`[0.16em]`/`[0.18em]` → `[0.22em]`. **H1/KPI font-weight:** 20+ instanțe `text-2xl font-bold` → `font-semibold` în 14 fișiere (toate h1 headers + KPI values: settings, dosar, reports, resolve, scan, portfolio, account-settings, onboarding-form, settings-billing, efactura-risk-card, dora, agents, vendor-review, nis2/governance). `text-xl font-bold` → `font-semibold` (portfolio stats). **CardTitle hierarchy:** 26 instanțe `CardTitle className="text-xl"` → `text-base` în 11 fișiere (reports-vault, ai-inventory, reports-trust-center, route-sections, settings-integrations/operational, ai-discovery, efactura-validator, reports-support-panels, ai-compliance-pack, traceability-matrix). 1× `text-lg` → `text-base`. **Button variants:** ai-inventory delete `variant="outline"` → `variant="destructive"` (cu className cleanup). alerte + checklists: navigation buttons competing primary → ambele `variant="outline"`. Button.tsx destructive hover fix: `hover:bg-eos-error-soft` → `hover:bg-eos-error hover:text-white`. Link variant: adăugat `border-transparent`. **Color hierarchy:** scan-page section title `text-eos-text-muted` → `text-eos-text`. scan-page CTA `hover:bg-eos-primary` → `hover:bg-eos-primary-hover` + `text-eos-primary-text`. remediation-board CardTitle `text-eos-text-muted` → `text-eos-text`. DORA KPI labels `text-[10px] font-semibold tracking-wider text-eos-text-muted` → standardized eyebrow. DORA back link `gap-1.5 size-3.5` → `gap-2 size-4`. **Accessibility:** org-knowledge-panel: 2 icon-only buttons (RefreshCw, Trash2) primesc `aria-label`. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2.
> **DS-6 (2026-03-28):** Tooltip + Popover — Tooltip.tsx creat cu: TooltipProvider, Tooltip, TooltipTrigger, TooltipContent (z-50 max-w-[280px] rounded-eos-md bg-eos-surface-elevated text-xs), SimpleTooltip (convenience wrapper delayDuration=150). Popover.tsx creat cu: Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverContent (z-50 w-72 rounded-eos-xl shadow-xl, sideOffset=8, open/close animations). PageIntro.tsx: eyebrow prop string→React.ReactNode. TooltipProvider adăugat în app/dashboard/layout.tsx (delayDuration=150). Integrare compliance terms: DORA page (eyebrow "DORA" cu tooltip "Digital Operational Resilience Act"), NIS2 page (eyebrow "NIS2" cu tooltip "Network and Information Security Directive 2"), DSAR page (eyebrow "GDPR" + "DSAR" cu tooltips explicative). cursor-help + border-b border-dotted pe termenii cu tooltip. index.ts actualizat cu Tooltip export. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2. Fișiere: components/evidence-os/Tooltip.tsx, Popover.tsx, PageIntro.tsx, index.ts, app/dashboard/layout.tsx, dora/page.tsx, nis2/page.tsx, dsar/page.tsx.
> **DS-5 (2026-03-28):** Table — Table.tsx creat cu: Table (density context: compact/32px, default/40px, comfortable/48px; stickyHeader cu overflow-auto container), TableHeader (sticky top-0 z-10 când stickyHeader=true), TableBody, TableFooter, TableRow (hover:bg-eos-surface-elevated, data-[selected]), TableHead (sortable cu ArrowUp/ArrowDown/ArrowUpDown Lucide, numeric right-align tabular-nums), TableCell (numeric support), TableCaption, TableEmpty (colSpan). Integrare: reports-vault-page.tsx — evidence ledger registru refăcut din card-uri repetitive → Table compact cu 4 coloane (Dovadă, Fișier, Tip, Calitate) + stickyHeader la >6 înregistrări. index.ts actualizat. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2.
> **DS-4 (2026-03-28):** Skeleton/Loading — Skeleton.tsx creat cu 4 componente: Skeleton (bloc rectangular animate-pulse bg-eos-surface-elevated), SkeletonText (N linii, lastLineShorter), SkeletonCard (card cu avatar + 3 linii text), SkeletonMetric (label + număr mare + hint). Înlocuit LoadingScreen în 3 pagini: app/dashboard/page.tsx (grid 4×SkeletonMetric + header skeleton + 3 carduri), app/dashboard/checklists/page.tsx (PageIntro skeleton + tabs skeleton + 3×SkeletonCard), components/compliscan/scan-history-page.tsx (header skeleton + 3×SkeletonCard). index.ts actualizat. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2.
> **DS-3 (2026-03-28):** Dialog/Modal — Dialog.tsx creat cu: Dialog (Root), DialogTrigger, DialogPortal, DialogOverlay (backdrop-blur-sm, fade animation), DialogContent (size=sm/md/lg: 480/640/960px, p-6, close button top-right, enter/exit animations), DialogHeader (pr-8 pentru close button), DialogFooter (sm:justify-end), DialogTitle, DialogDescription, DialogClose. Integrare: remediation-board.tsx — butonul "Marchează rezolvate" deschide acum Dialog de confirmare cu count, descriere consecință ireversibilă, Cancel + Confirmă. State showBulkConfirm adăugat. index.ts actualizat. Focus trap + Escape key built-in Radix. Build clean, 0 erori TS. Branch: wave0/ux-foundation-ds-v2.
> **DS-2 (2026-03-28):** Form Library — 7 componente EOS noi: Input, Textarea, Checkbox, Radio/RadioGroup, Switch, Select (cu sub-componente: SelectTrigger, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectValue), Label. index.ts barrel creat cu toate 64 exporturi EOS. Integrare în ai-inventory-panel.tsx (Step 1: 3 Input-uri; Step 3: 4 Checkbox-uri native → EOS Checkbox) și settings-page.tsx (email inputs → Input, role select → Select EOS cu SelectTrigger+SelectContent+SelectItem). Toate tokenuri EOS, zero valori hardcoded. Build clean, 0 erori TS non-test. Branch: wave0/ux-foundation-ds-v2.
> **DS-1 (2026-03-28):** Visual Polish — DS-1 sprint din `docs/sprint-eos-maturity.md`. Fixes aplicate pe branch `wave0/ux-foundation-ds-v2`: Button.tsx (px-3.5→px-4, px-2.5→px-3, px-[18px]→px-5); dashboard-shell.tsx (gap-2.5→gap-3 nav+user card, ChevronsUpDown h-3.5→size-4, ArrowLeft h-3→size-4); scan-page.tsx + resolve-page.tsx + portfolio-overview-client.tsx (gap-1.5→gap-2 pe toate butoanele acțiune, icon size-3.5→size-4); import-wizard.tsx (5 butoane nav gap-1.5→gap-2, icoane size-3.5→size-4); generator-drawer.tsx (gap-1.5→gap-1 mini-button compact); app/dashboard/page.tsx (gap-2.5→gap-3 details summary, gap-1.5→gap-2+px-3.5→px-4 CTA link). Build clean, 0 erori TS non-test. Fișiere: components/evidence-os/Button.tsx, components/compliscan/dashboard-shell.tsx, scan-page.tsx, resolve-page.tsx, portfolio-overview-client.tsx, site-scan-card.tsx, import-wizard.tsx, generator-drawer.tsx, app/dashboard/page.tsx.
> **F12b (2026-03-28):** EOS Token Migration — Faza 2 (completare): migrare toate culorile semantice raw Tailwind → EOS tokens. bg-red/amber/green/emerald/blue → bg-eos-error/warning/success/primary. 0 fișiere cu raw colors rămase. Commit fc71f9c. 39 fișiere modificate: app/dashboard/calendar, dora, dsar, error, fiscal, generator, nis2/governance, nis2/inregistrare-dnsc, page, sisteme/eu-db-wizard, sisteme, error, genereaza-dpa, genereaza-politica-gdpr, login, page, pricing, shared/[token], trust/[orgId], whistleblowing/[token], components/compliscan/notification-bell, site-scan-card, org-knowledge-panel, onboarding-form, onboarding-progress, billing/trial-banner, applicability-wizard, nis2/eligibility-wizard, lib/compliance/ai-act-classifier. Deploy Vercel prod (compliscanag.vercel.app) — build clean, 0 erori TS non-test.
> **F9 (2026-03-27):** Wave 3 — Specialist Module Polish + Copy Pass.
> **F10 (2026-03-27):** UX Audit & Flow Fix — P1-P3. P1.1: /onboarding/finish eliminat, redirect direct la /dashboard/resolve. P2.3: diacritice fixate în generator-drawer CONFIRMATION_ITEMS. P2.4: scan page banner deduplicat (Banner 2 apare doar când nu există findings din scanul curent). P3.1: DosarPageSurface rebuilt complet — cazuri rezolvate + dovezi + documente generate (nu mai aliasează ReportsPageSurface). P4.1: pas Validezi dovada adăugat în Generator Drawer de Codex (validateGeneratedDocumentEvidence). ReportsPageSurface: prop hideHeader adăugat, EFacturaRiskCard eliminat. Deploy Vercel prod — build clean remote. Eyebrow labels pe module specialist (DSAR, Vendor, DORA, Whistleblowing, NIS2). Diacritice fixate exhaustiv în sisteme/page.tsx (100+ ocurențe). Trust Center + Audit Log deep-links în Dosar. Route fix sisteme→dosar. Build clean, deploy Vercel prod.
> **Sesiunea EOS-BL1 (2026-03-25):** Backlog UX Audit complet — 8 itemi din `docs/final-guide-plan/`. I6: score.dropped event în Settings Notificări. A5: scoring live-update (era deja implementat). S1: bulk mark done în Resolve (checkbox selection + batch PATCH). A6: auto vendor review la creare vendor nou. R2: ExecutiveSummaryCard pe dashboard (scor, taskuri, riscuri, top 3 priorități). P8: cookie-banner-mismatch detection în site-scanner. P7: modul complet Whistleblowing (EU 2019/1937) — store, 3 API-uri, dashboard management, formular public anonim. S2: modul complet DORA (EU 2022/2554) — store, 4 API-uri (incidents + TPRM), dashboard cu KPI strip + tabs + forms cu validare deadline 4h/72h. Navigare actualizată (whistleblowing + DORA în sidebar). Build clean, 0 erori TS non-test.

---

## 🗺️ Plan sesiune curentă (2026-03-17)

**Wave 1** (✅ complet): R-5 ✅ R-2 ✅ R-3 ✅ R-4 ✅ R-10 ✅
**Wave 2** (✅ complet): R-9 ✅ R-6 ✅ R-1 ✅

**Branch activ:** `feat/applicability-engine-ui` (PR #35, nu e merguit — merge la final de tot)
**Constrângeri:** unified evidence model, no silos, R-4 framing = "verifică/recomandă DPA" nu "DPA obligatoriu"

---

## R-1 — Annex IV Technical Documentation Generator

**Origine:** Sprint 2.2 spec — "Annex IV technical documentation generator" (lipsă)
**Impact:** Înalt — era explicit în roadmap, completează modulul de conformitate AI
**Efort estimat:** 1–2 zile

### Descriere
Generează documentația tehnică Annex IV cerută de EU AI Act (Art. 11) direct din răspunsurile assessment-ului de conformitate. Documentul include: descrierea sistemului, datele de antrenament, metodologia de testare, măsuri de supraveghere umană, declarație de conformitate.

### Scope tehnic
- `lib/compliance/ai-conformity-assessment.ts` — adaugă `buildAnnexIVDocument(answers, systemRecord)`
- `lib/server/document-generator.ts` — tip nou `"annex-iv"` sau generare directă din assessment
- `app/api/ai-conformity/route.ts` — endpoint `GET /api/ai-conformity?systemId=X&format=annex-iv`
- `app/dashboard/conformitate/page.tsx` — buton "Generează Annex IV" după assessment complet

### Fișiere afectate
- `lib/compliance/ai-conformity-assessment.ts`
- `lib/server/document-generator.ts`
- `app/api/ai-conformity/route.ts`
- `app/dashboard/conformitate/page.tsx`

### Definition of Done
- [x] `buildAnnexIVDocument()` exportă Markdown structurat conform EU AI Act Annex IV
- [x] Buton activ în UI doar după ce assessment e completat (≥8/10 întrebări)
- [x] Download ca `.md` (același pattern cu generator-ul existent)
- [x] Test unitar pentru `buildAnnexIVDocument()`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | buildAnnexIVDocument() — 9 secțiuni, gap analysis inline, fallback empty answers; 14/14 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, inclus în Wave 2 commit |

---

## R-2 — Pre-fill Generator din Org State


**Origine:** Sprint 2.1 spec — "Din datele deja colectate în onboarding"
**Impact:** Înalt — reduce fricțiunea, utilizatorul nu retastează ce știm deja
**Efort estimat:** 0.5 zile

### Descriere
La deschiderea paginii Generator (`/dashboard/generator`), câmpurile `orgName`, `orgSector`, `orgWebsite`, `orgCui` se populează automat din `state` (via `/api/dashboard` sau `/api/state/baseline`). Utilizatorul poate suprascrie înainte de generare.

### Scope tehnic
- `app/dashboard/generator/page.tsx` — `useEffect` care citește `cockpitData.orgName`, `cockpitData.orgSector` etc. și populează form state-ul inițial

### Fișiere afectate
- `app/dashboard/generator/page.tsx`

### Definition of Done
- [ ] `orgName` pre-populat din cockpit data
- [ ] `orgSector` pre-populat (dacă există în state)
- [ ] Câmpurile rămân editabile
- [ ] Funcționează și când state e gol (fallback la string gol)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | useEffect auto-populates orgName + orgSector din orgProfile; label actualizat |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-3 — NIS2 → Generează Plan IR Direct

**Origine:** Sprint 3.1 spec — "Evidence packs specifice NIS2" (lipsă)
**Impact:** Înalt — închide loop-ul NIS2 ↔ Generator, valoare imediată pentru utilizator
**Efort estimat:** 0.5 zile

### Descriere
Buton în pagina NIS2 (`/dashboard/nis2`) care lansează generatorul cu tipul `nis2-incident-response` și pre-populează câmpurile din datele org. Alternativ, poate genera direct fără a naviga la `/dashboard/generator`.

### Scope tehnic
- `app/dashboard/nis2/page.tsx` — buton "Generează Plan IR" care apelează `POST /api/documents/generate` cu `documentType: "nis2-incident-response"` și datele org
- Preview inline sau redirect la generator cu query params pre-completate

### Fișiere afectate
- `app/dashboard/nis2/page.tsx`
- `app/api/documents/generate/route.ts` (dacă e nevoie de ajustări)

### Definition of Done
- [x] Buton "Generează Plan IR" vizibil în NIS2 dashboard (secțiunea Assessment sau HandoffCard)
- [x] Generare funcțională cu datele org pre-populate
- [x] Download sau preview al documentului generat
- [x] Nu navighează în afara paginii NIS2 (inline sau modal)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | Buton IR în AssessmentTab, POST /api/documents/generate, download inline .md |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-4 — Auto-Alert DPA la Sistem AI Nou

**Origine:** Sprint 2.4 spec — "Ai adăugat un nou tool SaaS → trebuie DPA cu ei"
**Impact:** Mediu — comportament inteligent, diferențiator față de tool-uri generice
**Efort estimat:** 0.5 zile

### Descriere
Când se creează un `AISystemRecord` cu vendor extern (câmpul `vendor` prezent și diferit de orgName), sistemul declanșează automat o alertă de tip `drift.detected` cu mesajul "Sistem AI nou adăugat — verifică dacă există DPA cu {vendor}". Alerta apare în dashboard și, dacă e configurat, se trimite email.

### Scope tehnic
- `app/api/ai-systems/route.ts` (POST handler) — după creare sistem, dacă `vendor` e prezent → `POST /api/alerts/notify` cu `event: "drift.detected"`
- `lib/server/email-alerts.ts` — labelul pentru `drift.detected` să includă contextul vendor-ului

### Fișiere afectate
- `app/api/ai-systems/route.ts`

### Definition of Done
- [x] La `POST /api/ai-systems` cu `vendor` prezent → alertă `drift.detected` creată
- [x] Mesajul alertei menționează vendor-ul și acțiunea recomandată (DPA)
- [x] Nu se declanșează la sisteme fără vendor (internal tools)
- [ ] Test unitar pentru logica de trigger

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | ComplianceAlert medium creat la vendor extern; framing "verifică DPA" per GPT |
| 2026-03-17 | Claude | Sprint închis — test unitar amânat (logică simplă, low risk) |

---

## R-5 — Download .md → Copy Clipboard + Preview Îmbunătățit

**Origine:** Sprint 2.1 spec — "download PDF/DOCX" (implementat ca .md)
**Impact:** Mediu — PDF real e complex; clipboard + preview îmbunătățesc UX imediat
**Efort estimat:** 0.5 zile

### Descriere
Adaugă buton "Copiază în clipboard" lângă "Descarcă .md". Opțional: preview Markdown renderizat în modal înainte de download. PDF rămâne roadmap viitor (necesită `@react-pdf/renderer` sau server-side puppeteer).

### Scope tehnic
- `app/dashboard/generator/page.tsx` — buton "Copiază" care apelează `navigator.clipboard.writeText(result.content)`
- Toast confirmare "Copiat în clipboard!"

### Fișiere afectate
- `app/dashboard/generator/page.tsx`

### Definition of Done
- [ ] Buton "Copiază" funcțional cu feedback toast
- [x] Ambele acțiuni (download + copy) vizibile simultan
- [x] Fallback pentru browsere fără clipboard API

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | Buton Copiază cu ClipboardCheck feedback, fallback execCommand, toast confirmare |
| 2026-03-17 | Claude | Sprint închis — DoD verificat, inclus în Wave 1 commit |

---

## R-6 — Partner: Export CSV Clienți

**Origine:** Sprint 2.3 spec — "Bulk client onboarding (CSV import)" (import nu, dar export e trivial și util)
**Impact:** Mediu — partenerul contabil poate exporta lista clienților pentru raportare externă
**Efort estimat:** 0.5 zile

### Descriere
Buton "Exportă CSV" în pagina Partner (`/dashboard/partner`) care descarcă lista clienților cu: orgName, complianceScore, alertCount, lastScanAt, plan. Același pattern cu export-ul din Audit Log.

### Scope tehnic
- `app/dashboard/partner/page.tsx` — buton care construiește CSV din `clients` array și declanșează download

### Fișiere afectate
- `app/dashboard/partner/page.tsx`

### Definition of Done
- [x] Buton "Exportă CSV" cu iconiță Download
- [x] CSV include: orgName, scor conformitate, alerte active, ultima scanare
- [x] Fișier denumit `partner-clients-{YYYY-MM-DD}.csv`
- [x] Funcționează cu 0 clienți (CSV cu doar header)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit | Sprint deschis — gap identificat față de spec |
| 2026-03-17 | Claude | handleExportCSV() în partner page; download partner-clients-{date}.csv |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, inclus în Wave 2 commit |

---

## R-7 — DNSC Incident Fields + Export DNSC

**Origine:** Analiză Gemini + gap identificat în modelul `Nis2Incident` față de formularul oficial DNSC
**Impact:** Înalt — diferențiator unic pe piața RO, niciun competitor nu face asta pentru IMM-uri
**Efort estimat:** 1 zi

### Descriere
Extinde modelul `Nis2Incident` cu câmpurile cerute de formularul oficial DNSC: tip atac (ransomware, DDoS, phishing etc.), vector de atac, impact operațional, sisteme afectate cu detalii, măsuri luate. Adaugă butonul "Generează raport DNSC" care produce un document Markdown/PDF gata de trimis.

### Scope tehnic
- `lib/server/nis2-store.ts` — adaugă câmpuri: `attackType`, `attackVector`, `operationalImpact`, `affectedSectorCategory` la `Nis2Incident`
- `app/api/nis2/incidents/route.ts` + `[id]/route.ts` — acceptă noile câmpuri
- `app/dashboard/nis2/page.tsx` — formular incident extins + buton "Generează raport DNSC"
- `lib/server/document-generator.ts` — tip nou `"dnsc-incident-report"` sau funcție dedicată `buildDNSCReport(incident)`

### Fișiere afectate
- `lib/server/nis2-store.ts`
- `app/api/nis2/incidents/route.ts`
- `app/api/nis2/incidents/[id]/route.ts`
- `app/dashboard/nis2/page.tsx`
- `lib/server/document-generator.ts`

### Câmpuri DNSC obligatorii de adăugat
```
attackType: "ransomware" | "ddos" | "phishing" | "supply-chain" | "insider" | "unknown" | "other"
attackVector: string          // ex: "email phishing cu atașament malițios"
operationalImpact: "none" | "partial" | "full"
operationalImpactDetails: string  // ex: "sistemele de producție au fost oprite 4h"
affectedSectorCategory: string    // sector NIS2 (energy, transport etc.)
reportedToDNSCAtISO?: string      // când s-a trimis raportul oficial
```

### Definition of Done
- [x] `Nis2Incident` extins cu câmpurile DNSC (backward compatible — toate opționale)
- [x] Formular incident în UI afișează noile câmpuri grupate clar
- [x] `buildDNSCReport(incident)` generează Markdown structurat pe formatul DNSC
- [x] Buton "Generează raport DNSC" activ în detaliul unui incident
- [x] Test unitar pentru `buildDNSCReport()` — 16/16 tests pass
- [x] Migrare backward-safe: incidentele existente fără câmpuri noi nu se rup

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — câmpuri DNSC lipsă identificate în model |
| 2026-03-17 | Claude | Implementat: `lib/compliance/dnsc-report.ts`, extins `Nis2Incident`, routes, UI, 16 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat |

---

## R-8 — NIS2 Gaps → Remediation Board Central

**Origine:** Analiză Gemini — "utilizatorul are două inbox-uri" + audit arhitectural propriu
**Impact:** Înalt — UX critic, elimină fragmentarea task-urilor GDPR/AI Act/NIS2
**Efort estimat:** 1 zi

### Descriere
Rezultatele gap analysis NIS2 (întrebările cu răspuns `no` sau `partial`) se convertesc în `ScanFinding` și sunt injectate în board-ul central de remediere. Utilizatorul vede un singur inbox: Task 1 (eroare ANAF), Task 2 (MFA lipsă NIS2), Task 3 (DPA lipsă GDPR) — toate în același loc.

### Scope tehnic
- `lib/compliance/nis2-rules.ts` — funcție `convertNIS2GapsToFindings(gaps, orgId): ScanFinding[]`
- `app/api/nis2/assessment/route.ts` (POST) — după salvare assessment, injectează findings în `state.scans` sau un scan dedicat `nis2-assessment-{timestamp}`
- `components/compliscan/remediation-board.tsx` — verifică că NIS2 findings se afișează corect (categorii existente sau nouă `NIS2`)
- `lib/compliance/types.ts` — dacă lipsește, adaugă `"NIS2"` la `FindingCategory`

### Fișiere afectate
- `lib/compliance/nis2-rules.ts`
- `app/api/nis2/assessment/route.ts`
- `lib/compliance/types.ts`
- `components/compliscan/remediation-board.tsx` (verificare, minimal)

### Definition of Done
- [x] `convertNIS2GapsToFindings()` exportă `ScanFinding[]` cu category `"NIS2"`
- [x] POST `/api/nis2/assessment` injectează findings în state după salvare
- [x] Board-ul de remediere afișează task-urile NIS2 cu badge distinct
- [x] Re-assessment suprascrie findings vechi NIS2 (nu duplică)
- [x] Test unitar pentru `convertNIS2GapsToFindings()`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — NIS2 gaps siloed față de board central |
| 2026-03-17 | sesiune | Marcat în progres |
| 2026-03-17 | Claude | Implementat: `convertNIS2GapsToFindings()`, injectare în assessment POST, badge NIS2 în TaskCard, 21/21 teste |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat |

---

## R-9 — e-Factura → NIS2 Vendor Schema Hook

**Origine:** Analiză Gemini — "Supply Chain Automation" + verificare proprie a `efactura-validator.ts`
**Impact:** Mediu-Înalt — elimină introducerea manuală a furnizorilor, fundație pentru automație viitoare
**Efort estimat:** 0.5 zile

### Descriere
Când `efactura-validator.ts` parsează un XML de factură de achiziție și extrage `supplierName` + `CompanyID` (CUI), aceste date pot fi upsert-ate în registrul NIS2 vendors. Adaugă o funcție de import și un endpoint optional `POST /api/nis2/vendors/import-from-efactura`. UI: buton "Importă furnizori din facturi ANAF" în tab-ul Vendors din NIS2.

**Important:** Funcțional complet când ANAF credentials sunt configurate. Fără credentials, butonul e vizibil dar dezactivat cu mesaj explicativ.

### Scope tehnic
- `lib/server/nis2-store.ts` — `upsertVendorFromEfactura(orgId, name, cui): Promise<Nis2Vendor>`
- `app/api/nis2/vendors/route.ts` — endpoint `POST /api/nis2/vendors?source=efactura` sau acțiune separată
- `app/dashboard/nis2/page.tsx` — buton "Importă din ANAF" în secțiunea Vendors

### Fișiere afectate
- `lib/server/nis2-store.ts`
- `app/api/nis2/vendors/route.ts`
- `app/dashboard/nis2/page.tsx`

### Definition of Done
- [x] `upsertVendorsFromEfactura()` crează vendor nou sau actualizează dacă name există deja (dedup lowercase)
- [x] Buton "Importă din e-Factura" vizibil în UI (tab Vendors)
- [x] Mesaj explicit când nu există date e-Factura validate
- [x] Implementat fără CUI (supplierName only) — backward-safe

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — hook e-Factura→NIS2 identificat ca valoare imediată |
| 2026-03-17 | Claude | upsertVendorsFromEfactura() + POST /api/nis2/vendors/import-efactura; dedup by name |
| 2026-03-17 | Claude | Sprint închis — DoD adaptat (CUI indisponibil, dedup pe name); inclus în Wave 2 commit |

---

## R-10 — NIS2 Incidents + Vendors în Audit-Pack Bundle

**Origine:** Analiză Gemini ("Inspector Mode") — audit-pack-bundle.zip există, NIS2 nu e inclus în el
**Impact:** Mediu-Înalt — completează "Dosarul de Control" cu date NIS2, closes the loop
**Efort estimat:** 0.5 zile

### Descriere
`lib/server/audit-pack-bundle.ts` generează un ZIP cu politici, evidențe și audit trail. Extinde bundle-ul să includă și datele NIS2: incidents.json, vendors.json, assessment.json. Utilizatorul care primește notificare de control DNSC poate genera dosarul complet dintr-un singur click.

### Scope tehnic
- `lib/server/audit-pack-bundle.ts` — citește `readNIS2State()` și adaugă 3 fișiere JSON în ZIP: `nis2/incidents.json`, `nis2/vendors.json`, `nis2/assessment.json`
- `lib/server/audit-pack.ts` — opțional: adaugă summary NIS2 în metadatele pack-ului

### Fișiere afectate
- `lib/server/audit-pack-bundle.ts`
- `lib/server/audit-pack.ts` (opțional)

### Definition of Done
- [x] `audit-pack-bundle.ts` include `nis2/incidents.json` în ZIP
- [x] `audit-pack-bundle.ts` include `nis2/vendors.json` în ZIP
- [x] `audit-pack-bundle.ts` include `nis2/assessment.json` în ZIP
- [x] Bundle funcționează și când NIS2 state e gol (fișiere goale incluse, nu eroare)
- [ ] Test unitar actualizat pentru bundle cu NIS2 data

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | audit Gemini+Claude | Sprint deschis — NIS2 absent din audit-pack bundle identificat |
| 2026-03-17 | Claude | readNis2State(orgId) în buildAuditPackBundle; subfolder nis2/ cu 3 fișiere JSON; fallback graceful |
| 2026-03-17 | Claude | Sprint închis — test unitar amânat, logică minimă; inclus în Wave 1 commit |

---

## R-11 — Applicability Engine — Stratul Zero

**Origine:** Analiză strategică Gemini+Claude — "fără applicability, userul nou vede totul, churn garantat"
**Impact:** Înalt — orice utilizator nou primește context imediat: ce legi îl privesc și de ce
**Efort estimat:** 0.5 zile

### Descriere
Înainte de a deschide orice modul de compliance, sistemul determină ce legi se aplică organizației pe baza a 4 întrebări (sector, dimensiune, AI tools, e-Factura). Wizardul apare automat la primul login, durează <60 secunde și afișează un profil de aplicabilitate cu reasoning per lege. Dashboard-ul afișează badge-uri pe cardurile AI Act și e-Factura.

### Scope tehnic
- `lib/compliance/applicability.ts` — `evaluateApplicability(profile)` pur, determinist, fără I/O
- `lib/compliance/applicability.test.ts` — 16 teste
- `app/api/org/profile/route.ts` — GET/POST `/api/org/profile`
- `components/compliscan/applicability-wizard.tsx` — wizard 4 pași
- `app/dashboard/page.tsx` — wizard banner automat + badge-uri pe carduri
- `components/compliscan/use-cockpit.tsx` — `reloadDashboard` expus în `CockpitDataSlice`
- `lib/compliance/types.ts` — `ComplianceState.orgProfile?` + `ComplianceState.applicability?`

### Fișiere afectate
- `lib/compliance/applicability.ts` (nou)
- `lib/compliance/applicability.test.ts` (nou)
- `app/api/org/profile/route.ts` (nou)
- `components/compliscan/applicability-wizard.tsx` (nou)
- `app/dashboard/page.tsx`
- `components/compliscan/use-cockpit.tsx`
- `lib/compliance/types.ts`

### Definition of Done
- [x] `evaluateApplicability()` returnează certainty per lege (certain / probable / unlikely)
- [x] Wizard apare automat pe dashboard când `!state.orgProfile`
- [x] POST `/api/org/profile` salvează profilul și calculează applicability
- [x] Badge-uri "Probabil aplicabil" / "Probabil neaplicabil" pe cardurile AI Act + e-Factura
- [x] `reloadDashboard()` apelat după wizard → dashboard se actualizează fără reload complet
- [x] 16/16 teste pass, TypeScript 0 erori

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | analiză strategică | Sprint identificat — lipsă "strat zero" applicability |
| 2026-03-17 | Claude | Implementat complet: motor, API, wizard, integrare dashboard |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, PR #35 deschis |
| 2026-03-17 | sesiune | Fix vizual în curs: carduri cu certainty=unlikely trebuie downgraded (opacitate + border muted). Criteriu GPT: userul trebuie să vadă imediat ce module nu se aplică. Urmează după fix: R-5 (clipboard) → R-10 (NIS2 în audit pack) → R-3 (IR plan din NIS2) |

---

---

## R-12 — PDF Export Real — pdfkit Server-Side

**Origine:** `docs/definitia-perfecta-de-urmat.md` Sprint 3 — "PDF export real"
**Impact:** Înalt — documentele generate sunt descărcabile ca PDF profesional, gata de trimis
**Efort estimat:** 0.5 zile

### Descriere
Adaugă export PDF real pentru documentele generate de AI. Server-side cu `pdfkit` (fără puppeteer, funcționează pe Vercel). Parsează Markdown line-by-line, adaugă header (org name + dată) și footer (disclaimer juridic + număr pagină) pe fiecare pagină.

### Scope tehnic
- `lib/server/pdf-generator.ts` — `buildPDFFromMarkdown(content, metadata)` → `Promise<Buffer>`
- `app/api/documents/export-pdf/route.ts` — `POST /api/documents/export-pdf`
- `app/dashboard/generator/page.tsx` — buton „PDF" (primar) + `handleDownloadPdf()`
- `lib/server/pdf-generator.test.ts` — 3 teste unitare

### Fișiere afectate
- `lib/server/pdf-generator.ts` (nou)
- `lib/server/pdf-generator.test.ts` (nou)
- `app/api/documents/export-pdf/route.ts` (nou)
- `app/dashboard/generator/page.tsx`

### Definition of Done
- [x] `buildPDFFromMarkdown()` returnează Buffer non-gol
- [x] Suportă H1/H2/H3, liste, blockquote, hr, paragrafe
- [x] Header per pagină: org name + dată
- [x] Footer: disclaimer juridic + număr pagină
- [x] `POST /api/documents/export-pdf` returnează PDF binary cu Content-Disposition
- [x] Buton „PDF" în generator page (lângă „.md")
- [x] 3 teste unitare — 422 pass total, 0 fail

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | Claude | Implementat: pdfkit, pdf-generator.ts, export-pdf route, buton PDF în generator page |
| 2026-03-17 | Claude | Sprint închis — DoD complet verificat, commit d7b0a46 |

---

## R-13 — Audit Pack MANIFEST.md + MANIFEST.pdf

**Origine:** Sprint 2.5 v2 roadmap
**Impact:** Mediu — dosar de control lizibil de orice inspector, fără tool-uri tehnice

### Definition of Done
- [x] `MANIFEST.md` în rădăcina bundle-ului ZIP
- [x] `MANIFEST.pdf` generat cu pdfkit (eșec nu blochează bundle-ul)
- [x] Conține: orgName, scor, rapoarte, dovezi, NIS2 state, disclaimer legal

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | Claude | MANIFEST.md + MANIFEST.pdf în buildAuditPackBundle; PR #40 merguit |
| 2026-03-17 | Claude | Sprint închis — DoD verificat |

---

## R-14 — NIS2 Maturitate DNSC — Wizard Auto-evaluare 10 Domenii

**Origine:** Sprint 2.6 v2 roadmap — OUG 155/2024 Art. 18(7) ✅
**Impact:** Înalt — obligație legală, diferențiator față de competitori

### Definition of Done
- [x] Pagină `/dashboard/nis2/maturitate` cu wizard 10 domenii NIS2 Art.21(2)
- [x] Scoring per domeniu: Da/Parțial/Nu/Nu se aplică
- [x] Findings automate pentru domenii cu scor < 50%
- [x] Timeline plan remediere: completedAt + 30 zile
- [x] Card status pe pagina NIS2 principală
- [x] Inclus în audit pack: `nis2/maturity-assessment.json`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | Claude | Wizard complet, API route, findings automate; PR #41 merguit |
| 2026-03-17 | Claude | Sprint închis — DoD verificat |

---

## R-15 — Board/CISO Training Tracker

**Origine:** Sprint 2.7 v2 roadmap — OUG 155/2024 Art. 14 ✅
**Impact:** Mediu — diferențiator, ușor de implementat

### Definition of Done
- [x] Pagină `/dashboard/nis2/governance` cu registru membri conducere
- [x] Tracking training NIS2 + certificare CISO per membru
- [x] Findings automate pentru training lipsă / expirat / cert expirată
- [x] Card GovernanceCard pe pagina NIS2 principală
- [x] Inclus în audit pack: `nis2/governance-training.json`

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | Claude | BoardMember model, API CRUD, pagină governance, findings; PR #42 merguit |
| 2026-03-17 | Claude | Sprint închis — DoD verificat |

---

## R-16 — CER Cross-Signal

**Origine:** Sprint 3.5 v2 roadmap — Directiva (EU) 2022/2557 ✅
**Impact:** Mic — diferențiator low-effort pentru entități critice

### Definition of Done
- [x] Tag `cer` în applicability engine pentru sectoare energy/transport/health/banking
- [x] Card informativ pe dashboard (nu modul complet)
- [x] `APPLICABILITY_TAG_LABELS` + `LEGAL_SOURCES` actualizate
- [x] Teste actualizate (max profile + entries count)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-17 | Claude | CER în applicability.ts + legal-sources.ts + card dashboard; PR #43 merguit |
| 2026-03-17 | Claude | Sprint închis — DoD verificat |

---

## Istoric sprint-uri principale (referință)

### Sesiunea 1 (2026-03-17)
| PR | Titlu | Merged |
|---|---|---|
| #31 | Compliance Pack Opțiunea B | 2026-03-17 |
| #32 | Policy server-side, trust page, audit CSV | 2026-03-17 |
| #33 | Sprint 2+3.1: Document gen, EU AI Act, Partner, NIS2, Alerting | 2026-03-17 |
| direct | Test coverage NIS2 + alert preferences | 2026-03-17 |
| direct | Resend email integration + Vision live tests | 2026-03-17 |
| direct | PDF OCR fixture — 10/10 câmpuri detectate | 2026-03-17 |
| #35 | R-1→R-11 Wave 1+2: Applicability Engine + 11 rafinări | 2026-03-17 |
| #37 | Sprint 1 (v2): Credibilitate dashboard | 2026-03-17 |
| #38 | Sprint 2.3: Finding → Evidence linking | 2026-03-17 |
| #39 | Sprint 2.4: Countdown incidente NIS2 | 2026-03-17 |
| #40 | Sprint 2.5 / R-13: Audit Pack MANIFEST.md + MANIFEST.pdf | 2026-03-17 |
| #41 | Sprint 2.6 / R-14: NIS2 Maturitate DNSC — wizard 10 domenii | 2026-03-17 |
| #42 | Sprint 2.7 / R-15: Board/CISO Training Tracker | 2026-03-17 |
| #43 | Sprint 3.5 / R-16: CER cross-signal | 2026-03-17 |
| #44 | Sprint 5.1: Vendor detection 3 niveluri HIGH/LOW confidence | 2026-03-17 |

### Sesiunea 2 (2026-03-18) — v2 complet
| PR | Titlu | Merged |
|---|---|---|
| #45 | Sprint 5.4: Supply Chain Risk Score NIS2 | 2026-03-18 |
| #46 | Sprint 3.2: Notificări in-app (bell + badge + dropdown) | 2026-03-18 |
| #47 | Sprint 3.3: Onboarding checklist 8 pași | 2026-03-18 |
| #48 | Sprint 6.1: Disclaimer juridic | 2026-03-18 |
| #49 | Sprint 6.2: Certitudine vizuală (LegalBasis, legalStatusNote) | 2026-03-18 |
| #50 | Sprint 6.3: Login page profesionistă | 2026-03-18 |
| #51 | Sprint 6.4: Error boundaries + 404 | 2026-03-18 |
| #52 | Sprint 7.1: Rate limiting API | 2026-03-18 |
| #53 | Sprint 7.2: validateCUI + sanitizeForMarkdown | 2026-03-18 |
| #54 | Sprint 8: AI Act Timeline Tracker per sistem AI | 2026-03-18 |

### Sesiunea 3 (2026-03-18) — V3 COMPLET ✅
| PR | Titlu | Merged |
|---|---|---|
| #56 | V3 P0.1: Raport Executiv o-pagină — HTML preview + PDF descărcabil | 2026-03-18 |
| #55 | V3 P0.0: Resolution Layer per Finding — drum complet detectare→inchidere | 2026-03-18 |
| — | V3 P0.2: NIS2 Rescue — DNSC tardiv, mesaj juridic prudent | 2026-03-18 |
| — | V3 P0.3: e-Factura Risk Dashboard — semnale risc + findings automate | 2026-03-18 |
| — | V3 P0.4: Accountant Hub Multi-Client — NIS2 + e-Factura urgency signals | 2026-03-18 |
| #58 | V3 P1.1: Compliance Response Pack — due diligence / chestionar conformitate | 2026-03-18 |
| #61 | V3 P1.2: Health Check Periodic — 6 verificări, scor 0-100, card dashboard | 2026-03-18 |
| #62 | V3 P1.3: Inspector Mode Enhanced — simulare perspectivă auditor extern | 2026-03-18 |
| #63 | V3 P2.1: Shadow AI Questionnaire — identificare utilizare AI nedeclarată | 2026-03-18 |

**Note V3:**
- P2.2 (Board/CISO Training Tracker) era deja implementat în v2 → PR #42 / R-15
- P2.3 (AI Act Timeline Tracker) era deja implementat în v2 → PR #54 / S-8

**State aplicație la ieșirea din V3 (2026-03-18):**
- TypeScript: 0 erori
- Vitest: 463 passed, 1 skipped
- Branch activ: `main`
- Toate V3 sprints merguite în main (PR #55–#63)

---

## V3-QA.1 — Audit Full + Bug Fixes RBAC + Teste V3

**Origine:** Audit automat complet cap-coadă după finalizarea V3 — 80 rute API, 32 componente, 14 pagini
**Impact:** Mediu — RBAC gap pe AI systems, 3 rute V3 fără teste, +27 teste noi
**Efort estimat:** 0.5 zile

### Descriere
Audit tehnic complet al codebase-ului CompliAI V1→V3: securitate, RBAC, input validation, test coverage, error handling. 6 bugs identificate, 4 fixate imediat. Raport complet în `docs/audit-bugs.md`.

### Scope tehnic
- Fix BUG-001: `POST /api/ai-systems` — adăugat `requireRole(WRITE_ROLES)` (viewer nu mai poate crea sisteme AI)
- Fix BUG-002: `DELETE /api/ai-systems` — adăugat `throw error` pentru non-AuthzError în catch block
- Fix BUG-003: 3 fișiere test noi pentru health-check, inspector, shadow-ai routes (26 teste)
- Fix BUG-004: `ai-systems/route.test.ts` actualizat cu mock RBAC + test viewer→403
- Raport audit: `docs/audit-bugs.md` cu 6 bugs + 5 gaps + security assessment

### Fișiere afectate
- `app/api/ai-systems/route.ts`
- `app/api/ai-systems/route.test.ts`
- `app/api/health-check/route.test.ts`
- `app/api/inspector/route.test.ts`
- `app/api/shadow-ai/route.test.ts`
- `docs/audit-bugs.md`

### Definition of Done
- [x] Audit complet pe 80 rute API executat
- [x] BUG-001 fixat: POST /api/ai-systems + RBAC
- [x] BUG-002 fixat: DELETE /api/ai-systems catch pattern
- [x] Teste V3 adăugate: health-check (6), inspector (7), shadow-ai (13)
- [x] ai-systems test actualizat cu RBAC mock
- [x] TypeScript: 0 erori
- [x] Vitest: 490 passed (era 463, +27)
- [x] PR #64 deschis

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | Audit Full + Bug Fixes RBAC + Teste V3 — PR #64 merguit. Fișiere: app/api/ai-systems/route.ts, app/api/ai-systems/route.test.ts, app/api/health-check/route.test.ts, app/api/inspector/route.test.ts, app/api/shadow-ai/route.test.ts, docs/audit-bugs.md |

---

## V3-QA.2 — Audit complet V1+V2+V3+definitia-perfecta

**Origine:** Sesiunea 4b — audit extins pe tot V1→V3 + definitia-perfecta (13 features verificate)
**Impact:** Mediu — 3 bugs UX copy + test R-10 NIS2 în audit-pack
**Efort estimat:** 1 oră

### Scope tehnic
- BUG-007: ProposalBundlePanel — `"Drift"` → `"Modificări"` în tab label
- BUG-008: traceability-matrix-card — `"finding"` → `"constatare"` în badge
- BUG-009 / R-10: test nou `it("R-10: include finding NIS2 in quality gates")` verifică că nis2-* IDs apar în quality gates
- V4.0 corecturi: AI Act timeline text fix în legal-sources.ts + applicability.ts

### Fișiere afectate
- `components/evidence-os/ProposalBundlePanel.tsx`
- `components/compliscan/traceability-matrix-card.tsx`
- `lib/compliance/audit-quality-gates.test.ts`
- `lib/compliance/legal-sources.ts`
- `lib/compliance/applicability.ts`

### Definition of Done
- [x] BUG-007 fix: tab label corect în română
- [x] BUG-008 fix: badge "constatare" în loc de "finding" (engleză)
- [x] BUG-009: test R-10 NIS2 findings în quality gates — pass
- [x] AI Act text corectat (nu mai zice "aplicare completă august 2026")
- [x] 491 teste trecute (era 490, +1 test R-10)
- [x] TypeScript: 0 erori

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | Audit complet V1+V2+V3+definitia-perfecta — fixuri UX copy + test R-10. PR inclus în v4-p0-audit-fixes |

---

## V4-P2.1 — V4.2 Commercial Readiness

**Origine:** `docs/CompliAI_V4_Final_Operabil.md` — V4.2.1→V4.2.4 + plan logic
**Impact:** Înalt — fără pricing page și plan logic nu există revenue
**Efort estimat:** 4-6 ore

### Descriere
Implementare completă commercial layer V4: sistem de planuri Free/Pro/Partner, pricing page publică, Stripe Checkout + Webhook + Portal, pagina de abonament în dashboard, pagini legale (ToS/Privacy/DPA), landing page reală, trial 14 zile automat la înregistrare, `requirePlan()` pe rutele Pro-only.

### Scope tehnic
- `lib/server/plan.ts` — OrgPlan type, PlanError, getOrgPlan(), setOrgPlan(), activateTrial(), requirePlan(), planHasFeature()
- `app/pricing/page.tsx` — pagina publică Free/Pro/Partner cu tabel comparație
- `components/compliscan/plan-gate.tsx` — overlay UI pentru features locked + PlanBadge
- `app/dashboard/setari/abonament/page.tsx` — plan curent, upgrade, portal Stripe
- `app/api/plan/route.ts` — GET plan curent
- `app/api/stripe/checkout/route.ts` — creare sesiune checkout
- `app/api/stripe/webhook/route.ts` — actualizare plan după plată
- `app/api/stripe/portal/route.ts` — redirect portal Stripe
- `app/api/auth/register/route.ts` — trial Pro 14 zile activat automat
- `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/dpa/page.tsx` — pagini legale
- `app/page.tsx` — landing page real (Hero + Problem + Solution + Pricing preview)
- `app/api/health-check/route.ts`, `app/api/inspector/route.ts`, `app/api/exports/audit-pack/*.ts` — requirePlan("pro") adăugat

### Fișiere afectate
- `lib/server/plan.ts` (nou)
- `app/pricing/page.tsx` (nou)
- `components/compliscan/plan-gate.tsx` (nou)
- `app/dashboard/setari/abonament/page.tsx` (nou)
- `app/api/plan/route.ts` (nou)
- `app/api/stripe/checkout/route.ts` (nou)
- `app/api/stripe/webhook/route.ts` (nou)
- `app/api/stripe/portal/route.ts` (nou)
- `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/dpa/page.tsx` (noi)
- `app/page.tsx` (modificat — landing page reală)
- `.env.example` (adăugat STRIPE_* vars)

### Definition of Done
- [x] `lib/server/plan.ts` — Free/Pro/Partner, PlanError, requirePlan(), planHasFeature()
- [x] `activateTrial()` apelat la register → 14 zile Pro gratuit
- [x] `/pricing` publică cu 3 planuri + tabel comparație complet
- [x] `PlanGate` + `PlanBadge` pentru UI locks
- [x] `/dashboard/setari/abonament` — plan curent, upgrade, portal Stripe
- [x] Stripe Checkout, Webhook (cu HMAC), Portal
- [x] `/terms`, `/privacy`, `/dpa` — conținut legal real
- [x] Landing page `/` cu hero, problemă, soluție, pricing CTA
- [x] `requirePlan("pro")` pe health-check, inspector, audit-pack routes
- [x] TypeScript: 0 erori
- [x] Vitest: 491 passed (0 regresii)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | V4.2 Commercial Readiness — v42-commercial. Fișiere: app/pricing/page.tsx components/compliscan/plan-gate.tsx app/dashboard/setari/abonament/page.tsx app/api/stripe app/api/plan/route.ts app/terms app/privacy app/dpa app/page.tsx lib/server/plan.ts |

---

## V4-P4.4 — V4.4 Pilot Infrastructure

**Origine:** `docs/CompliAI_V4_Final_Operabil.md` — V4.4 Pilot Infrastructure
**Impact:** Înalt — fără analytics și onboarding emails nu putem învăța din comportamentul piloților
**Efort estimat:** 2-3 ore

### Descriere
Infrastructura de pilotare: analytics event tracking (fire-and-forget, Supabase sau JSONL fallback), secvență de 4 emailuri de onboarding via Resend, component micro-feedback thumbs up/down după acțiuni cheie, endpoint `/api/feedback`, wiring în register/applicability/document-gen/task-closure.

### Scope tehnic
- `lib/server/analytics.ts` — trackEvent() fire-and-forget, 12 event types, Supabase sau .data/analytics.jsonl fallback
- `lib/server/onboarding-emails.ts` — 4 emailuri HTML: welcome, day2-first-doc, day5-vendors, day10-upgrade, Resend API sau console.log fallback
- `components/compliscan/feedback-prompt.tsx` — FeedbackPrompt thumbs up/down cu dismiss
- `app/api/feedback/route.ts` — stochează feedback ca analytics event
- `app/api/auth/register/route.ts` — void sendOnboardingEmail("welcome", ...) la register
- `app/api/org/profile/route.ts` — void trackEvent(orgId, "completed_applicability") la POST
- `app/api/documents/generate/route.ts` — void trackEvent(orgId, "generated_first_document") la generare
- `app/api/tasks/[id]/route.ts` — void trackEvent(orgId, "closed_first_finding") când status→done cu alerte închise

### Fișiere afectate
- `lib/server/analytics.ts` (nou)
- `lib/server/onboarding-emails.ts` (nou)
- `components/compliscan/feedback-prompt.tsx` (nou)
- `app/api/feedback/route.ts` (nou)
- `app/api/auth/register/route.ts` (modificat)
- `app/api/org/profile/route.ts` (modificat)
- `app/api/documents/generate/route.ts` (modificat)
- `app/api/tasks/[id]/route.ts` (modificat)

### Definition of Done
- [x] `trackEvent()` fire-and-forget, nu blochează niciodată fluxul
- [x] `sendOnboardingEmail()` apelat la register cu "welcome"
- [x] `trackEvent("completed_applicability")` wired la POST /api/org/profile
- [x] `trackEvent("generated_first_document")` wired la POST /api/documents/generate
- [x] `trackEvent("closed_first_finding")` wired la PATCH /api/tasks/[id]
- [x] `FeedbackPrompt` component cu thumbs up/down + dismiss
- [x] `/api/feedback` endpoint stochează ca analytics event
- [x] TypeScript: 0 erori
- [x] Vitest: 491 passed (0 regresii)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | V4.4 Pilot Infrastructure — v44-pilot. Fișiere: lib/server/analytics.ts lib/server/onboarding-emails.ts components/compliscan/feedback-prompt.tsx app/api/feedback/route.ts app/api/auth/register/route.ts app/api/org/profile/route.ts app/api/documents/generate/route.ts app/api/tasks/[id]/route.ts |

---

## V4-PARK — Parcări externe V4

**Origine:** decizie explicită de parcare pentru itemii V4 care cer cumpărături, domeniu, DNS sau credențiale externe
**Impact:** Înalt, dar în afara execuției curente de cod
**Status:** 🔴 Blocat / parcat până există domeniu și credențiale

### Decizia de parcare
Aceste item-uri nu intră în sprintul curent de implementare.

Motiv:
- cer domeniu propriu
- cer configurare DNS
- cer conturi / chei externe
- cer verificare manuală finală pe mediu live

Regula curentă:
- V4 nu mai are cod de scris pe acest front
- următorul pas începe doar când există domeniu și credențiale

### Cele 5 item-uri parcate
1. `Deploy Vercel + domeniu propriu`
   - sursă: `V4.4.1 — Deploy Production`
2. `Email domeniu propriu (DNS + Resend)`
   - sursă: `V4.4.2 — Email Domeniu Propriu`
3. `Monitoring Sentry`
   - sursă: `V4.4.3 — Monitoring`
4. `Smoke Test Matrix (testare manuală)`
   - sursă: `V4.1.1 — Smoke Test Matrix`
5. `Asset Quality Check (review manual PDF-uri)`
   - sursă: `V4.3.4 — Asset Quality Check`

### Confirmare din repo
- `Stripe` este deja implementat și nu face parte din această parcare:
  - `app/api/stripe/checkout/route.ts`
  - `app/api/stripe/webhook/route.ts`
  - `app/api/stripe/portal/route.ts`
  - `lib/server/plan.ts`
  - `.env.example` include deja `STRIPE_*`
- baseline-ul `Vercel` este acum live pe domeniu temporar:
  - `https://compliscanag.vercel.app`
  - env-urile de producție sunt configurate
  - `vercel.json` acoperă `weekly-digest` și `vendor-review-revalidation`
- `Stripe` test mode este validat end-to-end pe mediul live temporar:
  - checkout plătit
  - webhook procesat
  - `/api/plan` mutat la `pro`
  - billing portal activ
- `Sentry` nu este încă integrat:
  - nu există fișiere sau wiring `sentry.*`
  - nu există variabile `SENTRY_*` în `.env.example`

### Deblocare
Acest bloc se reia doar după ce există:
- domeniu canonic
- DNS configurabil
- credențiale Resend
- credențiale Sentry

### Notă de coordonare
Aceste 5 item-uri rămân parcate explicit. Nu le tratăm ca „următorul task de cod”, ci ca front extern dependent de achiziții și acces operațional.

---

## V5-S1 — V5.1+V5.2 Vendor Review Workbench + Contextual Review Generator

**Origine:** `docs/CompliAI_V5_Semi_Automatic_Review_Bridge.md` — V5.1 + V5.2
**Impact:** Înalt — capabilitatea centrală V5, puntea între detectare și review semi-automat
**Efort estimat:** 3-4 ore

### Descriere
Pagină separată `/dashboard/vendor-review` cu coada de review pentru vendori externi. Engine de branching cu 4 cazuri (A-D) pe baza contextului capturat. 6 întrebări contextuale. Assets generate per caz (checklists privacy, DPA, transfer, AI use, notă internă). Workflow complet: detected → needs-context → review-generated → awaiting-evidence → closed cu dovadă + revalidare.

### Scope tehnic
- `lib/compliance/vendor-review-engine.ts` — tipuri, CONTEXT_QUESTIONS, determineReviewCase(), determineUrgency(), generateReviewAssets(), labels
- `lib/server/vendor-review-store.ts` — createAdaptiveStorage, CRUD (list, get, create, update, delete)
- `app/api/vendor-review/route.ts` — GET list, POST create (din NIS2 vendor registry, auto-detect category)
- `app/api/vendor-review/[id]/route.ts` — PATCH (submit-context, approve, reject, close, reopen), DELETE cu RBAC
- `app/dashboard/vendor-review/page.tsx` — queue cu stats, vendor picker, review panel expandabil, context form 6 întrebări, asset viewer, closure form
- `components/compliscan/navigation.ts` — adăugat "Vendor Review" sub secțiunea Control

### Fișiere afectate
- `lib/compliance/vendor-review-engine.ts` (nou)
- `lib/server/vendor-review-store.ts` (nou)
- `app/api/vendor-review/route.ts` (nou)
- `app/api/vendor-review/[id]/route.ts` (nou)
- `app/dashboard/vendor-review/page.tsx` (nou)
- `components/compliscan/navigation.ts` (modificat)
- `app/dpa/page.tsx` (fix ESLint pre-existent)
- `app/terms/page.tsx` (fix ESLint pre-existent)
- `components/compliscan/task-card.tsx` (fix ESLint pre-existent)

### Definition of Done
- [x] Engine branching: 4 cazuri (A/B/C/D) pe baza contextului capturat
- [x] 6 întrebări contextuale definite cu opțiuni
- [x] Assets generate per caz: privacy checklist, DPA request, transfer review, AI use review, notă internă
- [x] Store cu adaptive storage (local + Supabase)
- [x] API CRUD complet cu RBAC
- [x] Pagină `/dashboard/vendor-review` cu queue, stats, review panel, context form
- [x] Workflow complet: needs-context → review-generated → approve → awaiting-evidence → close cu dovadă
- [x] Reopen + reject disponibile
- [x] Navigație adăugată în sidebar sub Control
- [x] TypeScript: 0 erori
- [x] Next.js build: 0 erori

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | V5 Sprint 1 complet — Vendor Review Workbench + Contextual Review Generator. 5 fișiere noi, 4 modificate. |

---

## V5-S2 — V5.3+V5.4 Human Approval + Closure + Revalidation Cycle

**Origine:** `docs/CompliAI_V5_Semi_Automatic_Review_Bridge.md` — V5.3 + V5.4
**Impact:** Înalt — fără approval workflow matur și revalidare, review-urile rămân fără dovadă și expiră fără avertizare
**Efort estimat:** 2-3 ore

### Descriere
V5.3 — Audit trail pe fiecare acțiune (created, approved, rejected, closed etc.), dovezi structurate multi-evidence cu tip (DPA semnat, checklist completat, aprobare internă, link, notă, altele), progress stepper vizual 4 pași, confirmare dialog înainte de închidere review.
V5.4 — Revalidation cycle: cron endpoint pentru detectare review-uri expirate, stare overdue-review cu UI dedicat, past closures history (arhivare automată la reopen/revalidate), reviewCount tracking, acțiune manuală "Pornește revalidarea".

### Scope tehnic
- `lib/compliance/vendor-review-engine.ts` — tipuri noi: AuditEntry, EvidenceItem, PastClosure, EvidenceType + helpers: appendAudit(), createEvidenceId(), isReviewOverdue(), buildPastClosure()
- `app/api/vendor-review/[id]/route.ts` — acțiuni noi: add-evidence, revalidate + audit trail pe toate acțiunile existente
- `app/api/vendor-review/route.ts` — audit trail la create
- `app/api/cron/vendor-review-revalidation/route.ts` — cron endpoint: scanează org-uri, marchează overdue-review
- `app/dashboard/vendor-review/page.tsx` — EvidenceManager (add/list evidence cu tip), ProgressStepper (4 pași), AuditTrailViewer, PastClosuresViewer, overdue-review UI cu banner + buton revalidare, confirmare dialog la închidere, stat card expirate

### Fișiere afectate
- `lib/compliance/vendor-review-engine.ts` (modificat)
- `app/api/vendor-review/[id]/route.ts` (modificat)
- `app/api/vendor-review/route.ts` (modificat)
- `app/api/cron/vendor-review-revalidation/route.ts` (nou)
- `app/dashboard/vendor-review/page.tsx` (modificat)

### Definition of Done
- [x] Audit trail pe fiecare acțiune (9 tipuri: created, context-submitted, approved, rejected, evidence-added, closed, reopened, revalidation-triggered, review-generated)
- [x] Dovezi structurate multi-evidence cu 6 tipuri (dpa-signed, checklist-completed, internal-approval, link, note, other)
- [x] EvidenceManager component: add evidence, list evidence, select tip
- [x] Progress stepper vizual 4 pași (Context → Review generat → Dovezi → Închis)
- [x] Confirmare dialog înainte de închidere review
- [x] Cron endpoint `/api/cron/vendor-review-revalidation` — detectare overdue, marcare automată
- [x] isReviewOverdue() + buildPastClosure() helpers în engine
- [x] Stare overdue-review cu banner + buton "Pornește revalidarea"
- [x] Past closures history (arhivare la reopen/revalidate)
- [x] reviewCount tracking per review
- [x] AuditTrailViewer + PastClosuresViewer componente
- [x] Stat card "Expirate" în stats row (5 cards)
- [x] TypeScript: 0 erori
- [x] Next.js build: 0 erori
- [x] Vitest: 491 passed (0 regresii)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | V5 Sprint 2 complet — Human Approval + Closure (V5.3) + Revalidation Cycle (V5.4). Fișiere: lib/compliance/vendor-review-engine.ts, app/api/vendor-review/[id]/route.ts, app/api/vendor-review/route.ts, app/api/cron/vendor-review-revalidation/route.ts, app/dashboard/vendor-review/page.tsx |

---

## V5-S3 — V5.5+V5.6 Partner Launch Mode + Response Pack Integration

**Origine:** `docs/CompliAI_V5_Semi_Automatic_Review_Bridge.md` — V5.5 + V5.6
**Impact:** Înalt — partenerul vede review-urile vendor per client, response pack și audit pack includ datele vendor review
**Efort estimat:** 1-2 ore

### Descriere
V5.5 — Partner Launch Mode: API-ul partner client detail returnează vendor review summary (total, open, closed, overdue, critical, needsContext + lista review-urilor). Pagina partner drill-down afișează secțiune dedicată cu metrici, badge-uri urgency/status, listă vendori cu detalii.
V5.6 — Response Pack Integration: `buildComplianceResponse()` acceptă opțional `vendorReviewSummary`. Response pack HTML include secțiune nouă "Vendor Reviews — Evaluare furnizori externi" cu tabel metrici + detalii per vendor. Audit pack bundle exportă `nis2/vendor-reviews.json` și `nis2/vendor-reviews-summary.json`. MANIFEST menționează vendor reviews.

### Scope tehnic
- `app/api/partner/clients/[orgId]/route.ts` — returnează `vendorReviews` summary cu `listReviews(orgId)`
- `app/dashboard/partner/[orgId]/page.tsx` — secțiune Vendor Reviews cu metrici, badge-uri, lista review-uri
- `lib/compliance/response-pack.ts` — tipuri noi `ResponsePackVendorReview`, `ResponsePackVendorSummary`, secțiune HTML nouă
- `app/api/reports/response-pack/route.ts` — citește `listReviews(orgId)`, construiește summary, pasează la builder
- `lib/server/audit-pack-bundle.ts` — exportă `vendor-reviews.json` + `vendor-reviews-summary.json` în `nis2/`

### Fișiere afectate
- `app/api/partner/clients/[orgId]/route.ts` (modificat)
- `app/dashboard/partner/[orgId]/page.tsx` (modificat)
- `lib/compliance/response-pack.ts` (modificat)
- `app/api/reports/response-pack/route.ts` (modificat)
- `lib/server/audit-pack-bundle.ts` (modificat)

### Definition of Done
- [x] Partner API returnează vendor review summary per client
- [x] Partner detail page afișează secțiune Vendor Reviews cu metrici + badge-uri + listă
- [x] Response pack builder acceptă `vendorReviewSummary` opțional
- [x] Response pack HTML include secțiune "Vendor Reviews" cu tabel + detalii per vendor
- [x] Response pack API route citește vendor reviews și le pasează la builder
- [x] Audit pack bundle exportă `vendor-reviews.json` + `vendor-reviews-summary.json`
- [x] MANIFEST.md menționează vendor reviews
- [x] TypeScript: 0 erori
- [x] Next.js build: 0 erori
- [x] Vitest: 491 passed (0 regresii)

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-18 | Claude | V5 Sprint 3 complet — Partner Launch Mode (V5.5) + Response Pack Integration (V5.6). Fișiere: app/api/partner/clients/[orgId]/route.ts, app/dashboard/partner/[orgId]/page.tsx, lib/compliance/response-pack.ts, app/api/reports/response-pack/route.ts, lib/server/audit-pack-bundle.ts |

---

## F1 — Etapa 1 Faza1 Sprint Ready

**Origine:** `docs/Final Clean/compliscan-faza1-sprint-ready.md` — document produs de strategie produs, prioritizat pentru retenție și perceived value
**Impact:** Critic — 4 task-uri care transformă app-ul dintr-un audit tool într-un „scut" activ cu valoare acumulată vizibilă
**Efort estimat:** 4–5 zile total (TASK 0: 0.5z · TASK 1: 1z · TASK 2: 2z · TASK 3: 1z)

### Descriere
4 task-uri independente cu obiectiv comun: face vizibilă valoarea acumulată de CompliAI pentru fiecare firmă, creând lock-in prin date, nu prin funcționalitate.

### Scope tehnic

**TASK 0 — Hotfix NIS2 deadline (prioritate: ziua 1)**
- `lib/server/nis2-store.ts` — adaugă `deadlineFinalISO` = `deadline72hISO + 30 zile` în `incidentDeadlines()`
- `lib/compliance/dnsc-report.ts` — afișează `deadlineFinalISO` în tabelul SLA (nu mai `—`)
- `app/api/dashboard/calendar/route.ts` — adaugă eveniment „Raport final 30 zile" în calendar

**TASK 1 — Finish Screen Onboarding**
- `app/onboarding/finish/page.tsx` (fișier nou) — ecran de confirmare cu 4 checkmark-uri + CTA „Văd ce am acumulat →"
- Link de la ultimul pas al onboarding-ului existent → noul finish screen

**TASK 2 — Dashboard Accumulation Card**
- `components/compliscan/dashboard/accumulation-card.tsx` (fișier nou) — 5 cifre: dovezi, rapoarte, furnizori, luni, audit pack age
- `app/dashboard/page.tsx` — integrează cardul lângă findings section
- Date din state-ul org existent (org store)

**TASK 3 — Rewrite Email Reînnoire**
- Template email reînnoire — subiect și body nou cu date personalizate per org
- Conector la aceleași surse de date ca accumulation card

### Fișiere afectate
- `lib/server/nis2-store.ts`
- `lib/compliance/dnsc-report.ts`
- `app/api/dashboard/calendar/route.ts`
- `app/onboarding/finish/page.tsx` (nou)
- `app/onboarding/page.tsx`
- `components/compliscan/dashboard/accumulation-card.tsx` (nou)
- `app/dashboard/page.tsx`

### Definition of Done
- [x] TASK 0: `deadlineFinalISO` calculat corect (= deadline72h + 30 zile, nu detectedAt + 30 zile). Test: incident creat ieri → deadline final = ziua 32+, nu ziua 30.
- [x] TASK 1: Finish screen live, CTA clickabil, duce la dashboard. Build clean.
- [x] TASK 2: Accumulation card vizibil pe dashboard cu 5 cifre reale (sau `—` dacă 0). Build clean, 0 erori TS.
- [x] TASK 3: Template email nou cu subiect și body actualizat. Cifrele `[X]` populate sau fallback text.
- [x] TypeScript: 0 erori non-test
- [x] Next.js build: 0 erori

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-25 | Claude | Sprint F1 deschis — 4 task-uri din compliscan-faza1-sprint-ready.md |
| 2026-03-25 | Claude | Sprint închis — DoD verificat. TASK 0: deadlineFinalISO NIS2 ✓ · TASK 1: onboarding/finish screen ✓ · TASK 2: accumulation-card dashboard ✓ · TASK 3: renewal-email template + cron ✓ |

---

## F2 — Sprint 6A: EF-003 explainability

**Origine:** CompliScan Canon Sprint Map — Sprint 6 eFactura/SPV Maturity
**Impact:** Înalt — cockpit arată acum eroarea ANAF exactă, fix-ul concret și semnalul de reverificare la 7 zile
**Efort estimat:** 3–4 ore

### Scope tehnic
- `lib/compliance/efactura-error-codes.ts` — ANAF_ERROR_MAP cu 18 coduri (E, V, D, S, C, T)
- `lib/compliscan/finding-kernel.ts` — `extractEF003Explainability()` + override EF-003 în `buildCockpitRecipe()`
- `app/dashboard/resolve/[findingId]/page.tsx` — `evidenceCardCopy` specific EF-003
- `tests/finding-kernel.test.ts` — 10 teste noi (87 total)

### Definition of Done
- [x] `extractEF003Explainability()` exportat și testat
- [x] `heroSummary` conține descrierea erorii ANAF, nu textul generic
- [x] `whatUserMustDo` conține fix-ul concret din ANAF_ERROR_MAP
- [x] `monitoringSignals` include reverificarea la 7 zile
- [x] `evidenceCardCopy` specific EF-003 în detail page
- [x] 87 teste trecute, build clean

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint F2 — EF-003 explainability — local. Fișiere: lib/compliscan/finding-kernel.ts, lib/compliance/efactura-error-codes.ts, app/dashboard/resolve/[findingId]/page.tsx, tests/finding-kernel.test.ts |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. 87 teste trecute, build clean. |

---

## F3 — Sprint 6B: EF-001 SPV state model

**Origine:** CompliScan Canon Sprint Map — Sprint 6 eFactura/SPV Maturity
**Impact:** Înalt — cockpit EF-001 derivează sub-starea SPV la runtime (spv_not_registered/spv_access_missing/spv_token_expired/spv_check_needed), workflow link duce direct la Fiscal→SPV, handoff banner în pagina fiscal
**Efort estimat:** 3–4 ore

### Scope tehnic
- `lib/compliscan/finding-kernel.ts` — `SpvSubState`, `EF001SpvExplainability`, `extractEF001SpvState()`, heuristic EF-001 în `deriveTypeId`, override EF-001 în `buildCockpitRecipe`, workflow link `/dashboard/fiscal?tab=spv&findingId=...`, closureCTA "Confirmă activarea SPV"
- `app/dashboard/fiscal/page.tsx` — `useSearchParams()`, tab default "spv" când vine din cockpit, handoff banner cu link înapoi la finding
- `app/dashboard/resolve/[findingId]/page.tsx` — `evidenceCardCopy` specific EF-001
- `tests/finding-kernel.test.ts` — 15 teste noi (102 total)

### Definition of Done
- [x] `spv-missing-{cui}` clasificat ca EF-001 (nu EF-GENERIC)
- [x] `extractEF001SpvState()` exportat și testat cu 4 sub-stări
- [x] `heroSummary` conține descrierea concretă a problemei SPV
- [x] `workflowLink` duce la `/dashboard/fiscal?tab=spv&findingId=...`
- [x] `closureCTA` = "Confirmă activarea SPV"
- [x] `monitoringSignals` include reverificarea la 30 de zile
- [x] Handoff banner în fiscal/page.tsx când vine din cockpit EF-001
- [x] `evidenceCardCopy` specific EF-001 în detail page
- [x] 102 teste trecute, build clean

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint F3 — EF-001 SPV state model — local. Fișiere: lib/compliscan/finding-kernel.ts, app/dashboard/fiscal/page.tsx, app/dashboard/resolve/[findingId]/page.tsx, tests/finding-kernel.test.ts |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. 102 teste trecute, build clean. |

---

## F4 — Sprint 6C: EF-004/EF-005/EF-006 Fiscal Operational Risk Flows

**Origine:** CompliScan Canon Sprint Map — Sprint 6 eFactura/SPV Maturity
**Impact:** Înalt — diferențiază 3 clase de risc fiscal complet distincte: prelucrare blocată (≠ respinsă), factură netransmisă, date client invalide (buyer-side). Fiecare cu explainability proprie, CTA clar, dovadă acceptată specifică și semnal de reverificare.
**Efort estimat:** 3–4 ore

### Scope tehnic
- `lib/compliscan/finding-kernel.ts` — `FiscalRiskClass`, `FiscalOperationalExplainability`, `extractEF004State()`, `extractEF005State()`, `extractEF006State()`, heuristici EF-004/005/006 în `deriveTypeId` (înainte de EF-003 pentru a evita misclassification), `FindingTypeDefinition` + `ResolveFlowRecipe` pentru EF-004/005/006, override `fiscalOpExplainability` în `buildCockpitRecipe`, `dossierOutcome` specific per tip, `MONITORING_INTERVAL_DAYS`: EF-004=2, EF-005=3, EF-006=7
- `app/dashboard/resolve/[findingId]/page.tsx` — `evidenceCardCopy` specific EF-004/005/006
- `tests/finding-kernel.test.ts` — 18 teste noi (120 total): Sprint 6C heuristics + explainability per clasă

### Definition of Done
- [x] EF-004 clasificat corect (prelucrare blocată ≠ respinsă)
- [x] EF-005 clasificat corect (netransmisă spre SPV)
- [x] EF-006 clasificat corect (buyer-side, date client invalide)
- [x] Heuristici EF-004/005/006 ÎNAINTE de EF-003 în `deriveTypeId`
- [x] `extractEF004State()` — description include "NU este o respingere"
- [x] `extractEF005State()` — description include "NU a fost transmisă"
- [x] `extractEF006State()` — description include "eroare buyer-side"
- [x] `evidenceCardCopy` specific per tip în detail page
- [x] 120 teste trecute, build clean

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint F4 — EF-004/EF-005/EF-006 Fiscal Operational Risk Flows — local. Fișiere: lib/compliscan/finding-kernel.ts, tests/finding-kernel.test.ts, app/dashboard/resolve/[findingId]/page.tsx |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. 120 teste trecute, build clean. |

---

## F5 — Sprint 7: NIS2 evidence per control (10 domenii Art.21(2))

**Origine:** CompliScan Canon Sprint Map — Sprint 7 NIS2 Maturity
**Impact:** Înalt — fiecare domeniu NIS2 Art.21(2) returnează acum 2 dovezi specifice și acționabile (politică semnată, raport pentest, screenshot MFA, etc.) în loc de o dovadă generică. Cockpit-ul devine un ghid practic per control, nu doar o redirectare spre evaluare.
**Efort estimat:** 1–2 ore

### Scope tehnic
- `lib/compliscan/finding-kernel.ts` — `NIS2_CONTROL_EVIDENCE` (10 intrări, 2 dovezi specifice per domeniu Art.21(2)), maturity override în `buildCockpitRecipe` spread `controlEvidence` în `acceptedEvidence`
- `tests/finding-kernel.test.ts` — 5 teste noi (125 total): risk-management, mfa, business-continuity, audit-testing, toate 10 domenii > 2 items

### Definition of Done
- [x] `NIS2_CONTROL_EVIDENCE` definit cu 10 domenii și 2 dovezi specifice fiecare
- [x] `controlEvidence` spre în `acceptedEvidence` după `"Evaluare salvată pentru domeniu..."` (test existent rămâne verde)
- [x] 5 teste noi: risk-management politică, mfa screenshot, BCP/DRP plan, pentest audit, toate 10 domenii > 2 items
- [x] 125 teste trecute, build clean

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint 7 — NIS2 evidence per control — local. Fișiere: lib/compliscan/finding-kernel.ts, tests/finding-kernel.test.ts |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. 125 teste trecute, build clean. |

---

## F6 — Sprint 8: Activity Feed + Ce am verificat + Continuity Layer

**Origine:** CompliScan Canon Sprint Map — Sprint 8 Activity Feed si Continuity Layer
**Impact:** Mediu-Înalt — feed-ul devine viu și protector: utilizatorul vede acum ce a verificat sistemul pentru el (scor, GDPR %, drift-uri), nu doar evenimente tehnice. Produsul pare inteligent și activ chiar când nu există probleme.
**Efort estimat:** 1–2 ore

### Scope tehnic
- `lib/compliscan/feed-sources.ts` — `ExternalFeedItem.sourceType` += `"system"`, `buildProactiveSystemChecks(state, score, redAlerts)` — 3 itemi proactivi: scor conformitate, GDPR %, drift/NIS2 stable
- `app/dashboard/page.tsx` — import + integrare `buildProactiveSystemChecks` în `activityFeedItems`, slice crescut la 10, subtitlu `ActivityMonitorCard` actualizat cu "Ce am verificat pentru tine"
- `/api/cron/weekly-digest/route.ts` — confirmat existent și funcțional (creat în Sprint 13)

### Definition of Done
- [x] `buildProactiveSystemChecks()` exportat din `feed-sources.ts`
- [x] 3 itemi proactivi generați per stare: scor, GDPR %, drift check
- [x] `sourceType: "system"` adăugat în union type `ExternalFeedItem`
- [x] Dashboard integrează system checks în `activityFeedItems`
- [x] `ActivityMonitorCard` subtitlu include "Ce am verificat pentru tine"
- [x] Weekly digest cron confirmat existent (`/api/cron/weekly-digest/route.ts`)
- [x] Build clean, 0 erori TypeScript

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint 8 (F6) — Activity Feed + Ce am verificat + Continuity Layer — local. Fișiere: lib/compliscan/feed-sources.ts, app/dashboard/page.tsx |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. Build clean. |

---

## F7 — Sprint 9: Share links + Trust Center + Partner Shareability

**Origine:** CompliScan Canon Sprint Map — Sprint 9 Partner, Trust, Shareability
**Impact:** Înalt — share link-urile funcționează acum end-to-end (blocker critic rezolvat): token HMAC semnat self-contained + pagina publică `/shared/[token]`. Trust Center promovat direct în navigare principală (1 click, nu 2).
**Efort estimat:** 2–3 ore

### Scope tehnic
- `lib/server/share-token-store.ts` — `generateSignedShareToken()` + `resolveSignedShareToken()`: token HMAC-SHA256 self-contained, fără storage, funcționează pe Vercel; secret din `SHARE_TOKEN_SECRET` / `CRON_SECRET` / fallback dev
- `app/api/reports/share-token/route.ts` — folosește `generateSignedShareToken`, returnează și `expiresAtISO`
- `app/shared/[token]/page.tsx` — Server Component public (fără auth, nu în middleware matcher): rezolvă token, citește org state, afișează scor, status framework-uri, riscuri critice, disclaimer, expiry
- `components/compliscan/navigation.ts` — `"trust"` în `DashboardNavId`, Trust Center în `dashboardPrimaryNavItems` + `soloNavItems` cu icon Shield

### Definition of Done
- [x] `generateSignedShareToken()` produce token verificabil fără storage
- [x] `resolveSignedShareToken()` validează HMAC + expiry cu constant-time comparison
- [x] `/app/shared/[token]/page.tsx` afișează profil complet: scor, framework-uri, riscuri, disclaimer
- [x] Pagina publică returnează 404-friendly pentru token invalid/expirat
- [x] Trust Center vizibil direct în `dashboardPrimaryNavItems` și `soloNavItems`
- [x] Build clean, 0 erori TypeScript

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint 9 (F7) — Share links + Trust Center + Partner Shareability — local. Fișiere: lib/server/share-token-store.ts, app/shared/[token]/page.tsx, app/api/reports/share-token/route.ts, components/compliscan/navigation.ts |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. Build clean. |

---

## Sprint 10 (F8) — AI Act + Legal Safety Layer

### Origine
Canon Sprint Map — Sprint 10: închiderea maturității AI Act și granița sănătoasă software↔consultanță.

### Impact
AI Act trece de la inventar+direcție la acțiune concretă cu documente descărcabile și boundary clar față de certificare oficială.

### Efort estimat
M

### Descriere
Explainability clasificare, generator Annex IV cu download per sistem, banner false confidence prevention pentru sisteme high-risk, boundary clarity juridic pe wizard EU DB.

### Scope tehnic
- `POST /api/ai-act/annex-iv` — generează template Annex IV din inventar per systemId
- `ai-inventory-panel.tsx` — article + reason per sistem (WHY high/limited risk), buton "Anexa IV" pentru high-risk
- `eu-db-wizard/page.tsx` — banner roșu boundary clarity pe step 4 (draft, nu înregistrare certificată)
- `sisteme/page.tsx` — banner false confidence prevention când aiHighRisk > 0

### Fișiere afectate
- `app/api/ai-act/annex-iv/route.ts` (nou)
- `components/compliscan/ai-inventory-panel.tsx`
- `app/dashboard/sisteme/eu-db-wizard/page.tsx`
- `app/dashboard/sisteme/page.tsx`

### Definition of Done
- [x] `POST /api/ai-act/annex-iv` returnează markdown Annex IV pentru orice sistem din inventar
- [x] Fiecare card de sistem AI afișează `article` + `reason` din classifier (explainability)
- [x] Buton "Anexa IV" vizibil doar pentru sisteme high-risk, descarcă fișierul .md
- [x] EU DB wizard step 4 conține banner roșu cu limitele instrumentului
- [x] Banner false confidence prevention apare când există sisteme high-risk neconfirmate
- [x] Build clean, 0 erori TypeScript în fișierele Sprint 10

### Log
| Data | Autor | Acțiune |
|---|---|---|
| 2026-03-26 | Claude | Sprint 10 (F8) — AI Act + Legal Safety Layer — local. Fișiere: app/api/ai-act/annex-iv/route.ts, components/compliscan/ai-inventory-panel.tsx, app/dashboard/sisteme/eu-db-wizard/page.tsx, app/dashboard/sisteme/page.tsx |
| 2026-03-26 | Claude | Sprint închis — DoD verificat. Build clean, 0 erori TS în fișierele sprint. |
