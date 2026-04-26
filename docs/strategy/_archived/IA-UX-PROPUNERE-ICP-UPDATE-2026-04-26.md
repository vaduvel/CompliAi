# IA-UX-PROPUNERE — ICP UPDATE 2026-04-26

**Status**: addendum oficial care suprascrie persona Diana + pricing din `IA-UX-PROPUNERE (1).md`
**Trigger**: descoperire critică — contabilii CECCAR NU fac compliance, fac fiscal/e-Factura
**Sursă verificată prin research**: 40+ firme DPO RO (GDPR Complet 800 clienți, LegalUp 400, Decalex, WestGDPR, etc.)
**Destinație canonical**: `docs/strategy/compliscan-v1-final-spec-2026-04-26.md`

---

## De ce există acest addendum

`IA-UX-PROPUNERE (1).md` (2052 linii) conține persona Diana definită ca **"contabilă CECCAR cu 5-30 clienți SRL"** și pricing **€19-99/lună**.

Research-ul de piață și descoperirea critică a fondatorului au demonstrat că:

1. **Contabilii CECCAR NU fac compliance**. Fac fiscal + e-Factura. Compliance-ul (GDPR/NIS2/AI Act) îl fac firmele DPO externalizat (~40 firme RO verificate public).

2. **Diana corectă** = consultant DPO la firmă boutique (DPO Data Protection, WestGDPR, Decalex, etc.), NU contabilă.

3. **Pricing-ul €19-99/lună** subestima de 3-5x valoarea reală pentru DPO firms (math: cabinet cu 30 clienți × €120 markup = €3.600 revenue/lună → €299 plată acceptabilă).

**Acest addendum**: schimbă **doar** persona Diana + pricing tier. Restul documentului — 15 principii, 10 primitive, 5 nav modes, 43 rute canonice, sprint plan S0-S4 — rămâne **valid 100%** pentru noul ICP.

---

## SCHIMBARE 1 — Diana persona

### În IA-UX-PROPUNERE original

> **Diana** (partner / consultant contabil) e user primar v1 și baseline pentru întreaga arhitectură.
> Diana e contabilă CECCAR cu 15 clienți SRL existenți. Vrea portofoliu, urgențe zilnice, execuție rapidă per client, livrabile brand-uite Cabinet Popescu & Asociații.

### Înlocuit cu (canonical 2026-04-26)

> **Diana** (consultant DPO / privacy specialist / cabinet GDPR) e user primar v1 și baseline pentru întreaga arhitectură.
> Diana e consultant la o firmă boutique de externalizare DPO (ex: DPO Data Protection, WestGDPR, Decalex) cu 20-80 clienți IMM. Echipă 2-10 specialiști (jurist + IT + auditor). Tarifează clientul €100-250/lună abonament DPO. Vrea portofoliu cross-client, urgențe zilnice, execuție rapidă per client, livrabile brand-uite cu logo-ul cabinetului.

### Persona secondary updated

| Persona | Înainte | După |
|---|---|---|
| **Mihai** | Patron solo SRL (user primar pe Free tier) | Patron SRL care primește servicii DPO de la Diana — **NU user, doar destinatar** (magic links, trust profile, rapoarte lunare) |
| **Radu** | Compliance officer fintech 75 angajați | Compliance officer intern fintech/healthcare/banking RO — single workspace mode, plan Studio |

### Exemple cabinet brand updated

| Înainte | După |
|---|---|
| Cabinet Popescu & Asociații | DPO Complet (logo + brand) |
| Cabinet Mihăescu Contabil | WestGDPR / Decalex |
| Diana CECCAR | Diana CIPP/E #12345 |

---

## SCHIMBARE 2 — Pricing tiers

### În IA-UX-PROPUNERE original

```
Solo / Growth / Pro / Studio
€19 / €49 / €99 / €199 per lună
+ €100 RON markup per client cabinet
```

### Înlocuit cu (canonical 2026-04-26)

```
Starter:    €49/lună   < 5 clienți (funnel rampă)
Solo:       €99/lună   5-19 clienți
Growth:     €249/lună  20-49 clienți   ⭐ SWEET SPOT
Pro:        €499/lună  50-149 clienți
Studio:     €999/lună  150+ clienți
Enterprise: quote      custom

Add-ons:
+ €100/lună Mistral EU sovereignty
+ €50/lună per 25 clienți peste limită
```

### Math validation cu pricing nou

```
Diana începătoare (4 clienți × €100 markup = €400/lună revenue):
  Starter €49 = 12% revenue → ACCEPTABIL (funnel)

Diana Solo (15 clienți × €100 = €1.500/lună revenue):
  Solo €99 = 6.6% revenue → ROI clar

Diana Growth (30 clienți × €120 = €3.600/lună revenue):       ⭐
  Growth €249 = 7% revenue → ROI BRUTAL

Diana Pro (80 clienți × €150 = €12.000/lună revenue):
  Pro €499 = 4% revenue → ROI EXCELENT
```

### Logica funnel-ului (NOUĂ)

```
Diana începătoare (3-4 clienți)         → Starter €49
   ↓ 6 luni cu 5+ clienți
Diana Solo (15 clienți)                 → Solo €99
   ↓ 12 luni cu 20+ clienți
Diana Growth (30 clienți)               → Growth €249
   ↓ 18-24 luni cu 50+ clienți
Diana Pro (80 clienți)                  → Pro €499
```

---

## SCHIMBARE 3 — Modulele active per persona

### Diana DPO (DPO OS — primary launch)

```
✓ GDPR (privacy policy, DPA, ROPA, DSAR, DPIA)
✓ NIS2 (eligibility, assessment, incident, governance)
✓ AI Act (inventar, governance, EU DB)
✓ DSAR automation
✓ Whistleblowing intern
✓ Pay Transparency (hiring transparency mass + reporting nișă)
✓ Vendor management
✓ DORA (financial sector clients only)
✗ Fiscal modules (off — different product)
```

### Cabinet contabil (Fiscal OS — secondary, hibernation)

```
✓ e-Factura validator UBL CIUS-RO
✓ ANAF SPV OAuth
✓ Discrepanțe e-TVA
✓ Filing record log
✓ Signal log ANAF
✓ Read-only integrare SmartBill / Saga / Oblio
⏸ SAF-T (post v1, complex)
✗ GDPR / NIS2 / AI Act (off — different audience)
```

### Compliance intern (Internal mode — sub-mode DPO OS)

```
✓ GDPR + NIS2 (opt) + AI Act (opt)
✓ Approvals queue
✓ Review cycles
✓ Audit log
✓ Agent orchestrator
✓ Single workspace mode (NU portfolio)
```

---

## CE NU se schimbă în IA-UX-PROPUNERE

Tot restul rămâne valid 100%:

| Element | Status |
|---|---|
| 15 principii (P1-P15) | ✅ Valid 100% |
| 10 primitive (Firmă, Profil, Portofoliu, Scanare, Finding, Dovadă, Dosar, Livrabil, Alertă, Monitorizare) | ✅ Valid 100% |
| 5 moduri de navigație (Mihai, Diana portfolio, Diana client, Radu, Viewer) | ✅ Valid 100% |
| 43 rute canonice | ✅ Valid 100% |
| Sprint plan S0-S4 (12 săptămâni) | ✅ Valid 100% |
| 22 rute legacy de eliminat | ✅ Valid 100% |
| Workspace banner pattern | ✅ Valid 100% |
| White-label arhitectural (P9) | ✅ Valid 100% |
| Disclaimer "Orchestrator nu avocat" | ⚠️ Reformulat la "validare expert CIPP/E recomandată" |

**Cu schimbarea persona + pricing, toate sprint-urile S0-S4 sunt executabile fără modificări de cod structural.**

---

## Acțiuni necesare în execuție

### Pentru GPT-5.5 (sau orice agent care execută Sprint 1+)

1. **Onboarding pas 1** (Sprint 1 / S2.T1):
   - Întrebarea NU mai e "Cabinet sau firmă proprie?"
   - Întrebarea CORECTĂ: **"Cine ești?"** cu 3 opțiuni:
     - Cabinet GDPR / privacy / cybersec → DPO OS
     - Cabinet contabilitate CECCAR → Fiscal OS
     - Companie cu DPO intern → Internal mode (single workspace)

2. **Pricing rebuild** (Sprint 1 / S1.05 sau S3.05):
   - Înlocuiește tier-uri €19/49/99/199 cu €49/99/249/499/999
   - Adaugă Starter ca tier minim
   - Magic link limits per tier explicit

3. **Brand sweep** (Sprint 1 / pre-launch):
   - CompliAI → CompliScan global (57 fișiere identificate)
   - Cabinet Popescu → DPO Complet (în mock-uri, exemple)

4. **Disclaimer reframe** (Sprint 4 / S4.07):
   - "Verifică cu specialist" → "Drafturi pregătite pentru validarea expertului tău CIPP/E"

5. **Fiscal OS clarification** (Sprint 2 / S2.06):
   - Adaugă explicit: integrare bidirecțională read-only cu SmartBill / Saga / Oblio
   - Marcheaza ca prerequisit pentru lansare Fiscal OS (Q4 2026 decision)

### Pentru fondator

1. Citește `compliscan-v1-final-spec-2026-04-26.md` ca sursa unică de adevăr
2. Folosește `IA-UX-PROPUNERE (1).md` PLUS acest addendum pentru context complet
3. Niciun viitor agent nu trebuie să citească IA-UX-PROPUNERE FĂRĂ acest addendum

---

## Sumar single line

> **Persona Diana = consultant DPO (NU contabil). Pricing = €49-999/lună (NU €19-199). Restul IA-UX-PROPUNERE (15 principii, 43 rute, 5 sprint-uri, 22 rute legacy) rămâne valid 100%. Acest addendum previne documentation drift la execuția Sprint 1+.**

---

**Document creat**: 26 aprilie 2026
**Status**: canonical addendum la `IA-UX-PROPUNERE (1).md`
**Reference principal**: `docs/strategy/compliscan-v1-final-spec-2026-04-26.md`
**Următorul update**: după validarea cu 5 firme DPO (decision gate săpt 4)
