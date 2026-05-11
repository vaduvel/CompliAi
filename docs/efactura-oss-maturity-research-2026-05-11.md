# CompliScan vs European E-Invoicing OSS — Maturity Research

**Data:** 2026-05-11
**Scop:** Identifică pattern-uri de automatizare din alte piețe mature (IT SDI, HU NAV, PL KSeF, FR FacturX, ES VeriFactu, Peppol) pe care le putem adopta în CompliScan pentru a matura codul.

## TL;DR

**Unde lider CompliScan:** OCR + AI, bank reconcile, multi-tenant cabinet portfolio, e-TVA reconcile, SAF-T D406 hygiene, auto-repair sugestie.

**Unde duc peers:** lifecycle FSM, archival, signing XAdES, resumable batch, hash-chain, last-request audit, CLI, Peppol gateway, MCP exposure.

**Gap principal NU e RO-specific (avem 32 validări + cele 13 killer features) — e engineering maturity:** pattern-uri ingineresc pe care SDI/NAV/KSeF le ship-ează default.

## Top 10 features de adoptat (sortat după impact/LOC)

| # | Feature | LOC | Source | Why |
|---|---|---|---|---|
| **1** | Resumable batch upload sessions | ~250 | [artpods56/ksef2](https://github.com/artpods56/ksef2) | Cabinete cu 100-1000 facturi/lună — crash pe item 437/500 = pierd progres |
| **2** | Lifecycle FSM (draft → built → validated → submitted → accepted/rejected/timeout) | ~400 | [italia/fatturapa-testsdi](https://github.com/italia/fatturapa-testsdi) | Audit trail clar pentru disputes ANAF |
| **3** | `getLastRequestData()` audit hook | ~120 | [pzs/nav-online-invoice](https://github.com/pzs/nav-online-invoice) | Cabinetul vede exact request + response — necesar pentru ANAF dispute |
| **4** | MCP server wrapping SPV SDK | ~600 | [florin-szilagyi/efactura-anaf-ts-sdk](https://github.com/florin-szilagyi/efactura-anaf-ts-sdk) | **Moat strategic** — Claude/agents pot folosi end-to-end |
| **5** | CLI mirror (`compliscan upload`, `validate`) | ~500 | [printesoi/e-factura-go](https://github.com/printesoi/e-factura-go) | Cabinete cu cron batches mari |
| **6** | PDF/A-3 hybrid invoice (XML embed în PDF) | ~300 | [akretion/factur-x](https://github.com/akretion/factur-x) | Închide objecția "vreau PDF" |
| **7** | Schematron monthly sync (phive-rules-cius-ro) | ~200 | [phax/phive-rules](https://github.com/phax/phive-rules) | ANAF schimbă rules — fără sync, drift |
| **8** | Document sequence gap detector | ~150 | [joaomfrebelo/Saft-PT_4_PHP](https://github.com/joaomfrebelo/Saft-PT_4_PHP) | Primul check al inspectorului ANAF |
| **9** | UBL → HTML/PDF renderer pentru incoming | ~400 | ublrenderer + factur-x | SPV download = raw UBL, useri nu pot citi |
| **10** | White-list IBAN re-verify la payment day | ~200 | [SAP-samples bank-validation](https://github.com/SAP-samples/localization-toolkit-s4hana-cloud-bank-account-validation) | Pattern PL — anti-fraud combo cu bank reconcile |

## Killer features observed în alte piețe, NU pe roadmap

1. **Hash chain (VeriFactu / ZATCA pattern)** — `PreviousInvoiceHash` per factură, tamper-evident. RO va veni cu ceva similar via ViDA.
2. **QR code pe factură** (RO B2C 2025 + Saudi/Spain) — TLV-encoded supplier+VAT+date+total.
3. **Universal canonical doc (GOBL/Invopop)** — un singur JSON, multiple emitters (RO, PL, IT, DE). Future-proof.
4. **WARN→ERROR migration policy** (Hungary) — pre-anunță care warnings devin fatal next release. Acum ship-uim V-rules silent.
5. **Pluggable SPV inbox persistence** (Oxalis pattern) — interface, nu rewrite, când treci de la filesystem → S3 → Supabase.
6. **Streaming SAF-T D406 writer** — Saft-PT_4_PHP StreamWriter gestionează fișiere GB fără OOM.
7. **Test harness simulator ANAF SPV** — Italy ship fatturapa-testsdi (simulator complet). Noi testăm pe ANAF prod.
8. **TSD timestamp packaging** (RFC 5544) — arhivare 10 ani fără dependence externă.
9. **Smartcard/USB token integration** — eIDAS QES (qualified signature) — pattern FE-Extensions.
10. **Outcome notification (EC code)** — Italy notifies sender + receiver de acceptanță/refuz. Util pentru reconcile.

## Comparison matrix (CompliScan vs peers)

| Capability | CompliScan | IT SDI | HU NAV | PL KSeF | ES VeriFactu | Peppol |
|---|---|---|---|---|---|---|
| Pre-submit validation | ✅ 32 reguli | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-repair sugestie | ✅ | ❌ | 🟡 | 🟡 | ❌ | ❌ |
| Bulk ZIP upload | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Resumable batch | ❌ | 🟡 | ✅ | **✅** | ✅ | 🟡 |
| Lifecycle FSM | 🟡 | **✅** | ✅ | ✅ | ✅ | ✅ |
| Notification taxonomy | 🟡 | **✅** | ✅ | ✅ | ✅ | ✅ |
| Conservazione (archive) | ❌ | **✅ 10y** | ✅ 8y | ✅ 10y | ✅ | ❌ |
| XAdES/CAdES signing | ❌ | **✅** | ❌ | **✅** | **✅** | ✅ |
| Hash-chain anti-fraud | ❌ | ❌ | ❌ | ❌ | **✅** | ❌ |
| Last-request audit | ❌ | ✅ | **✅** | ✅ | ✅ | ✅ |
| OAuth2 + rotation | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| CLI mirror | ❌ | 🟡 | ✅ | ✅ | ✅ (gobl) | ✅ |
| MCP / agent-ready | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OCR / AI extract | **✅** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Bank↔invoice reconcile | **✅** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-tenant cabinet | **✅** | 🟡 | 🟡 | 🟡 | 🟡 | N/A |
| Cross-border (Peppol AS4) | ❌ | ✅ | ❌ | ✅ | ✅ | **✅** |
| White-list IBAN check | ❌ | ❌ | ❌ | **✅** | 🟡 | ❌ |
| e-TVA real-time reconcile | **✅** | ❌ | ❌ | ❌ | ✅ (SII) | ❌ |
| QR pe factură | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| PDF/A-3 hybrid | ❌ | 🟡 | ❌ | ❌ | ❌ | ❌ |
| Document sequence gap | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| ERP↔SPV reconcile | **✅ 3 ERPs** | ✅ | ✅ | ✅ | ✅ | ✅ |

## Reusable open-source components

| Need | Library | License |
|---|---|---|
| CIUS-RO Schematron canonic | `phax/phive-rules-cius-ro` (Maven) | Apache-2.0 |
| EN16931 validation engine | [phax/phive](https://github.com/phax/phive) | Apache-2.0 |
| Universal invoice JSON | [invopop/gobl](https://github.com/invopop/gobl) | Apache-2.0 |
| Hash-chain pattern | [invopop/gobl.verifactu](https://github.com/invopop/gobl.verifactu) | Apache-2.0 |
| XAdES signing (TS) | [PeculiarVentures/xadesjs](https://github.com/PeculiarVentures/xadesjs) | MPL-2.0 |
| PDF/A-3 + XML embed | [akretion/factur-x](https://github.com/akretion/factur-x) | BSD |
| Peppol AS4 | [phax/phase4](https://github.com/phax/phase4) / [OxalisCommunity/oxalis-ng](https://github.com/OxalisCommunity/oxalis-ng) | Apache-2.0 |
| BNR FX rates | [Bloggify/node-bnr](https://github.com/Bloggify/node-bnr) | MIT |

## Sources

Full list of 50+ verified GitHub repos in agent's complete report. Key references:
- **RO** — printesoi/e-factura-go, florin-szilagyi/efactura-anaf-ts-sdk
- **IT** — italia/fatturapa-testsdi, nicogis/FE-Extensions
- **HU** — pzs/nav-online-invoice (best community SDK)
- **PL** — artpods56/ksef2 (state-of-the-art async-first)
- **FR** — akretion/factur-x (PDF/A-3 hybrid toolkit)
- **ES** — invopop/gobl + invopop/gobl.verifactu (hash-chain)
- **PT** — joaomfrebelo/Saft-PT_4_PHP (StreamWriter + CLI)
- **Peppol** — phax/phase4, OxalisCommunity/oxalis-ng, phax/phive-rules
- **Multi-country** — phax/phive (validation engine, 30+ countries)

Compiled by Claude Code research agent, 2026-05-11.
