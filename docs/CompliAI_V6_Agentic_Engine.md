# CompliAI — V6: Agentic Compliance Engine

> Data: 2026-03-18
> Scop: Transforma CompliAI din dashboard asistat in motor de compliance agentic.
> Timeline: V6 se construieste DUPA V4 (go commercial). Se implementeaza in 2-3 faze.
> Filosofie: Nu inlocuim omul. Ii luam 80% din munca repetitiva si ii lasam doar deciziile.
> Bazat pe: Cercetare Deloitte, Bain, EY, Gartner, Complyance ($20M GV), Anecdotes.ai, MetricStream 2026.

---

## De ce V6, nu V5

V5 = iteratie pe feedback clienti reali (bugfix, polish, pricing adjustment).
V6 = salt de paradigma: din "tool care arata probleme" in "agent care rezolva probleme".

Nu sarim V5. V5 se intampla organic dupa primii clienti. V6 se planifica acum, se construieste cand V4 e stabil si ai revenue.

---

## Ce se intampla in piata — fapte, nu hype

### Agentic GRC e real si finantat
- Complyance: $20M Series A de la Google Ventures (feb 2026). 16 agenti live, 30+ planificati. Fortune 500 clienti. Reduce munca manuala GRC cu 70%.
- Anecdotes.ai: platforma agentiva GRC cu no-code builder, agenti specializati, handoff uman.
- MetricStream: integreaza agenti AI across GRC lifecycle — evidence collection, risk monitoring, control testing.
- Delve: agenti autonomi care navigheaza sisteme, se autentifica si capteaza artefacte de compliance in real-time.

### Cifrele care conteaza
- Deloitte: pana la 75% din companii vor investi in agentic AI in 2026.
- Gartner: pana in 2028, 33% din aplicatiile enterprise vor include agenti AI. Pana in 2030, 40% din cheltuielile SaaS enterprise se vor muta spre pricing usage/outcome-based.
- Bain: SaaS-urile care nu integreaza AI risca canibalizare pe workflow-urile repetitive.
- IBM: companiile care piloteaza agenti AI vad imbunatatiri de productivitate intre 35-55%.

### Ce fac agentii GRC concret (nu teoretic)
De la Complyance (cei mai avansati):
- Evidence Review Agent: auditeaza dovezile pentru gaps inainte sa le vada auditorul
- Risk Mitigation Agent: draftuieste planuri de tratare a riscurilor cu task-uri
- Findings Agent: detecteaza controale failed si genereaza riscuri/task-uri automat
- TPRM Agent: evalueaza vendori end-to-end
- Fiecare agent: configurat de user, logheaza fiecare actiune, surface-uieste output pentru aprobare umana

### Ce NU fac inca (limitari reale 2026)
- Nu iau decizii juridice — sugereaza, omul decide
- Nu semneaza documente — pregatesc, omul semneaza
- Nu inlocuiesc auditorul — pregatesc dosarul, auditorul verifica
- Nu sunt 100% deterministi — pot gresi, de aceea human-in-the-loop e obligatoriu
- Nu functioneaza fara date bune — garbage in, garbage out

---

## Pozitia CompliAI: De ce putem deveni agentici

CompliAI V1-V4 construieste EXACT infrastructura pe care agentii au nevoie:

| Ce ai deja | Ce devine in V6 |
|-----------|-----------------|
| Resolution Layer (problema → actiune → dovada → revalidare) | Agent Execution Framework — agentul parcurge aceiasi pasi |
| e-Factura Signal (detectie automata facturi respinse) | Fiscal Sensor Agent — monitorizare continua + remediere automata |
| Health Check periodic (verificare expirari) | Compliance Monitor Agent — scan continuu + alerte + auto-remediere |
| Document Generator (Gemini → politici, DPA, IR plan) | Document Agent — genereaza, revizuieste, versioneaza automat |
| Applicability Engine (profil → ce se aplica) | Regulatory Intelligence Agent — monitorizeaza schimbari legislative |
| Vendor Risk Score (import → scoring → findings) | Vendor Risk Agent — evaluare continua + alerte + re-review automat |
| Audit Pack (ZIP + manifest) | Audit Preparation Agent — compileaza, verifica completitudine, genereaza |

Diferenta fata de Complyance: ei au 30 de agenti pentru enterprise global.
Tu ai nevoie de 5 agenti pentru IMM-uri romanesti. Mai putin, mai focusat, mai profund pe context local.

---

## Arhitectura V6: 5 Agenti + 1 Orchestrator

### Model conceptual

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPLI-AI V6 AGENTIC                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              ORCHESTRATOR                            │    │
│  │  Primeste trigger → decide agent → ruleaza →         │    │
│  │  verifica output → cere aprobare umana daca e nevoie │    │
│  │  → logheaza tot → revalideaza periodic               │    │
│  └──────────┬──────────┬──────────┬──────────┬─────────┘    │
│             │          │          │          │               │
│  ┌──────────▼┐  ┌──────▼─────┐ ┌─▼────────┐ ┌▼──────────┐  │
│  │ FISCAL    │  │ COMPLIANCE │ │ DOCUMENT  │ │ VENDOR    │  │
│  │ SENSOR    │  │ MONITOR    │ │ AGENT     │ │ RISK      │  │
│  │           │  │            │ │           │ │ AGENT     │  │
│  │ Monitorizez│  │ Verific    │ │ Generez   │ │ Evaluez   │  │
│  │ e-Factura │  │ expirari   │ │ documente │ │ furnizori │  │
│  │ SPV, ANAF │  │ stale data │ │ actualizez│ │ monitorizez│  │
│  │ facturi   │  │ gaps noi   │ │ versionez │ │ DPA/SLA   │  │
│  └───────────┘  └────────────┘ └───────────┘ └───────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              REGULATORY RADAR AGENT                   │   │
│  │  Monitorizez DNSC.ro, EUR-Lex, Monitorul Oficial     │   │
│  │  Detectez schimbari → creez finding → alert user      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ══════════════════════════════════════════════════════════  │
│  HUMAN-IN-THE-LOOP: Omul aproba, semneaza, decide.         │
│  Agentul pregateste, sugereaza, executa repetitivul.        │
│  ══════════════════════════════════════════════════════════  │
└─────────────────────────────────────────────────────────────┘
```

---

## AGENT 1: Fiscal Sensor Agent (e-Factura → Compliance)

### Ce face azi (V3-V4, manual/semi-automat):
- Utilizatorul importa facturi sau configureaza polling ANAF
- Signal Dashboard arata facturi respinse
- Findings se genereaza, utilizatorul le parcurge

### Ce face V6 (agentic):
- **Monitorizare continua**: Polling automat SPV la interval configurabil (zilnic/orar)
- **Detectie automata**: Factura respinsa → finding creat FARA input uman
- **Clasificare automata**: Motiv respingere → categorie risc (CUI invalid, format XML, termen depasit)
- **Remediere sugerata**: "Factura INV-2026-042 respinsa — CUI furnizor invalid. Corecteaza in {softul de facturare} si retrimite."
- **Vendor flagging automat**: Furnizor nou detectat din facturi → risk scoring → DPA check → finding daca lipseste
- **Escalare inteligenta**: Daca 3+ facturi respinse in aceeasi saptamana → alerta critica contabil + administrator
- **Raport automat saptamanal**: "Saptamana aceasta: 2 facturi respinse, 1 corectata, risc fiscal estimat: {suma} RON"

### Human-in-the-loop:
- Agentul NU corecteaza factura (asta face Oblio/SmartBill)
- Agentul NU trimite facturi la ANAF
- Agentul DOAR detecteaza, clasifica, sugereaza, si escaleaza
- Omul corecteaza, retrimite, si confirma rezolvarea

### Trigger:
- Cron job: polling SPV zilnic la 07:00
- Event: import manual facturi
- Event: vendor nou detectat

### Estimare implementare: 6-8 ore peste infra V3-V4

---

## AGENT 2: Compliance Monitor Agent (Health Check Continuu)

### Ce face azi (V3-V4):
- Health Check la login daca > 7 zile de la ultimul check
- Verificare expirari documente, assessments stale

### Ce face V6 (agentic):
- **Scan continuu** (nu la login, ci periodic — zilnic sau saptamanal)
- **Auto-detectie degradare**: Politica GDPR a expirat → finding automat + closure recipe
- **Auto-regenerare documente expirate** (cu aprobare umana):
  - Politica confidentialitate > 12 luni → agentul genereaza versiune noua draft → notifica: "Am generat o versiune actualizata a politicii GDPR. Revizuieste si publica."
- **Monitoring assessment staleness**: NIS2 assessment > 6 luni → finding: "Re-evaluare recomandata"
- **Vendor review cycle**: Vendor cu lastReviewDate > 12 luni → finding automat
- **Training expiry tracking**: Board member cu training expirat → finding + reminder
- **Scor de sanatate live**: Nu doar la login — actualizat in background, vizibil permanent
- **Weekly digest automat**: Agentul compileaza singur digest-ul din datele live

### Human-in-the-loop:
- Agentul NU publica documente regenerate — le draftuieste
- Agentul NU decide ca un assessment e invalid — sugereaza re-evaluare
- Omul revizuieste, aproba, publica

### Trigger:
- Cron job: scan zilnic la 06:00
- Event: document generat, finding inchis, assessment completat
- Calendar: review cycles configurate per org

### Estimare implementare: 5-7 ore peste Health Check V3

---

## AGENT 3: Document Agent (Generare + Versionare + Actualizare)

### Ce face azi (V3-V4):
- Generator pe baza Gemini — utilizatorul alege tipul, apasa buton, primeste Markdown/PDF
- Pre-fill din OrgProfile

### Ce face V6 (agentic):
- **Generare proactiva**: Dupa ce Applicability Engine determina ce se aplica → agentul sugereaza documentele necesare: "Ti se aplica NIS2. Ai nevoie de: Plan IR, Politica securitate, Registru vendori. Generez?"
- **Versionare automata**: Cand orgProfile se schimba (sector, angajati) → agentul re-evalueaza documentele existente: "Profil actualizat — politica GDPR poate necesita actualizare. Generez versiune noua?"
- **Completare lipsuri**: Dupa assessment NIS2 → agentul detecteaza gaps → ofera sa genereze documentele care le-ar inchide
- **Context-aware generation**: Documentele generate includ automat: CUI, sector, scor curent, findings deschise relevante
- **Diff view**: Cand regenereaza un document, arata ce s-a schimbat fata de versiunea anterioara

### Human-in-the-loop:
- Agentul NU publica documente — genereaza drafturi
- Agentul NU decide ce document e "corect" — omul revizuieste
- Agentul sugereaza, omul aproba

### Trigger:
- Event: profil actualizat, assessment completat, finding nou
- Calendar: review anual documente
- Manual: buton "Genereaza document"

### Estimare implementare: 4-6 ore peste Document Generator V3

---

## AGENT 4: Vendor Risk Agent (Evaluare + Monitorizare Continua)

### Ce face azi (V3-V4):
- Import vendori din e-Factura
- Risk score pe baza factorilor (tech, DPA, SLA)
- Findings pentru high-risk

### Ce face V6 (agentic):
- **Evaluare initiala automata**: Vendor importat → scoring instant → clasificare → finding daca high-risk
- **Re-evaluare periodica**: La fiecare import nou de facturi → re-calcul score → detectie schimbari
- **DPA expiry tracking**: DPA cu vendor X expira in 30 zile → finding + reminder
- **Vendor incident detection**: Daca un vendor apare in stiri cu breach de securitate (via web search periodic) → alerta: "Furnizorul {name} a raportat un incident de securitate. Verifica impactul."
- **Supply chain report automat**: Raport trimestrial generat automat cu starea tuturor vendorilor, risk scores, DPA-uri, SLA-uri
- **Clasificare NACE automata**: CUI vendor → lookup CAEN → categorie sector → scoring mai precis

### Human-in-the-loop:
- Agentul NU decide ca un vendor e "safe" — sugereaza nivel de risc
- Agentul NU semneaza DPA-uri — genereaza template si notifica
- Omul decide, semneaza, confirma

### Trigger:
- Event: import facturi, vendor nou
- Cron: re-evaluare lunara vendori existenti
- Cron: scan stiri/breaches saptamanal (optional, avantaj)

### Estimare implementare: 5-7 ore peste Vendor Risk V3

---

## AGENT 5: Regulatory Radar Agent (Monitorizare Legislativa)

### Ce face azi (V3-V4):
- Texte statice cu statut juridic (✅/⚠️/📝)
- AI Act timeline manual

### Ce face V6 (agentic):
- **Scan periodic surse oficiale**: DNSC.ro, EUR-Lex, Monitorul Oficial, ANSPDCP — detecteaza publicatii noi
- **Clasificare impact**: Ordin DNSC nou → agentul evalueaza: "Afecteaza firmele NIS2 din sectorul {sector}? Da/Nu. Daca da, ce trebuie facut."
- **Finding automat**: Lege noua relevanta → finding: "Ordin DNSC 3/2026 publicat. Modifica cerinte maturitate. Revizuieste auto-evaluarea."
- **Timeline auto-update**: Digital Omnibus adoptat → agentul actualizeaza automat deadline-urile AI Act in produs
- **Alert user**: "Schimbare legislativa detectata. Impact: {descriere}. Actiune recomandata: {actiune}."

### Human-in-the-loop:
- Agentul NU interpreteaza legea — semnaleaza si sugereaza
- Agentul NU modifica obligatii existente fara aprobare
- Omul verifica, decide, confirma

### Limitari tehnice:
- DNSC.ro si Monitorul Oficial nu au API-uri — necesita web scraping sau verificare periodica manuala
- EUR-Lex are API (SPARQL/REST) — utilizabil
- Acuratete depinde de calitatea parsing-ului — confidence level obligatoriu

### Trigger:
- Cron: scan saptamanal surse
- Manual: "Verifica actualizari legislative"

### Estimare implementare: 6-10 ore (cel mai complex agent)

---

## ORCHESTRATOR: Cum lucreaza impreuna

```ts
interface AgentOrchestrator {
  // Primeste trigger
  onTrigger(trigger: AgentTrigger): void

  // Decide ce agent ruleaza
  routeToAgent(trigger: AgentTrigger): AgentType[]

  // Ruleaza agentul
  executeAgent(agent: AgentType, context: AgentContext): AgentOutput

  // Verifica output
  validateOutput(output: AgentOutput): ValidationResult

  // Decide: auto-apply sau cere aprobare
  requiresHumanApproval(output: AgentOutput): boolean

  // Logheaza tot
  logAction(action: AgentAction): void

  // Planifica revalidare
  scheduleRevalidation(findingId: string, intervalMonths: number): void
}

interface AgentTrigger {
  type: 'cron' | 'event' | 'manual'
  source: string        // 'efactura-polling', 'assessment-completed', 'user-click'
  data: any
  timestamp: string
}

interface AgentOutput {
  agentType: AgentType
  actions: AgentAction[]
  findings: FindingResolution[]
  documents: GeneratedDocument[]
  notifications: Notification[]
  confidence: number    // 0-1
  requiresApproval: boolean
  reasoning: string     // explicatie pe care userul o vede
}

type AgentType = 'fiscal_sensor' | 'compliance_monitor' | 'document' | 'vendor_risk' | 'regulatory_radar'
```

### Regula de aur: HUMAN-IN-THE-LOOP
```
NIVEL 1 — Auto-execute (fara aprobare):
  - Detectie finding (agentul gaseste problema)
  - Clasificare severitate
  - Generare closure recipe
  - Trimitere notificare
  - Logare actiune
  - Calcul scor

NIVEL 2 — Auto-draft, human-approve:
  - Generare document nou/actualizat
  - Sugestie remediere
  - Escalare la contabil/administrator
  - Modificare status finding

NIVEL 3 — Human-only (agentul NU face):
  - Semnare documente
  - Trimitere la DNSC/ANSPDCP
  - Decizie juridica
  - Stergere date
  - Modificare profil organizatie
  - Aprobari financiare
```

---

## Pricing V6: De la Seat-Based la Outcome-Based

### Modelul curent (V4):
- Free / Pro / Partner — subscriptie lunara per org

### Modelul V6 (hibrid):
```
FREE (Diagnostic)
  Neschimbat — applicability + scor

PRO (Guided Compliance) — €99-149/luna
  Tot ce e in V4 Pro
  + Agenti in mod semi-automat
  + Health Check automat saptamanal
  + Document versioning
  + Vendor re-scoring automat

PRO+ (Agentic Compliance) — €199-249/luna
  Tot ce e in Pro
  + Agenti full autonomi (cu aprobare umana)
  + Regulatory Radar
  + Vendor incident monitoring
  + Auto-regenerare documente expirate
  + Rapoarte automate saptamanale
  + Compliance score live (nu la login)

PARTNER (Agentic Multi-Client) — €349-499/luna
  Tot ce e in Pro+
  + Multi-client hub cu agenti per client
  + Rapoarte portofoliu automate
  + Escalare cross-client
  + API pentru integrare cu softul contabil
```

### Alternative outcome-based (experimental):
- Per finding rezolvat: €5-15 per finding inchis cu dovada
- Per document generat: €3-10 per document PDF
- Per raport: €10-25 per One-Page Report / Response Pack

Recomandare: incepe cu subscriptie, adauga outcome-based ca optiune dupa ce ai date de utilizare.

---

## Ordine de implementare V6

### Faza 1 — Fundatia agentiva (dupa V4 stabil, ~15-20 ore)
1. Agent Orchestrator framework (trigger → route → execute → validate → log)
2. Compliance Monitor Agent (cel mai natural — extinde Health Check)
3. Fiscal Sensor Agent (extinde e-Factura Signal cu polling automat)

### Faza 2 — Agenti de productivitate (~12-16 ore)
4. Document Agent (generare proactiva + versionare + diff)
5. Vendor Risk Agent (re-evaluare periodica + DPA tracking)

### Faza 3 — Inteligenta legislativa (~8-12 ore)
6. Regulatory Radar Agent (scan surse + classificare impact + auto-update timeline)

### Total V6: ~35-48 ore in 3 faze

---

## Diferentiere vs Complyance (competitorul direct)

| Aspect | Complyance ($20M, enterprise) | CompliAI V6 (solo, IMM RO) |
|--------|------------------------------|---------------------------|
| Target | Fortune 500, enterprise global | IMM 10-250 angajati Romania |
| Frameworks | SOC 2, ISO 27001, HIPAA, NIST, PCI | NIS2 RO, GDPR, AI Act, e-Factura |
| Nr agenti | 30+ generici | 5 specializati pe context local |
| Integrare fiscala | Zero | SPV/e-Factura nativ |
| Limba | Engleza | Romana nativ |
| Pret | Enterprise (nedisclosed, probabil $10K+/an) | Sub €250/luna |
| Canal distributie | Sales force enterprise | Contabili B2B2B |
| Profunzime locala | Zero Romania | DNSC wizard, ANAF, CAEN, CUI |

Concluzie: nu concurezi cu Complyance. Ei fac SOC 2 pentru CVS Health. Tu faci NIS2 + e-Factura pentru firma de 50 angajati din Timisoara. Piete complet diferite.

---

## Ce NU devine V6

| Nu construim | De ce |
|---|---|
| Agent care semneaza documente | Liability + ilegal fara delegare explicita |
| Agent care trimite la DNSC/ANSPDCP | Risc prea mare, omul face asta |
| Agent care decide conformitatea | "Esti compliant" = opinie juridica = nu facem |
| Agent care editeaza facturi | CompliAI NU e soft de facturare |
| Agent care face contabilitate | CompliAI NU e ERP |
| 30+ agenti generici | Facem 5, bine, pe context local |
| Agentic pricing fara date | Incepi cu subscriptie, adaugi outcome dupa validare |

---

## Definition of Done V6

CompliAI V6 este gata cand:

- [ ] Orchestratorul ruleaza minim 3 agenti independent
- [ ] Fiscal Sensor detecteaza facturi respinse fara input uman
- [ ] Compliance Monitor regenereaza draft document expirat automat
- [ ] Document Agent sugereaza proactiv documente lipsaConformitate
- [ ] Vendor Risk Agent re-evalueaza periodic si genereaza findings
- [ ] Fiecare actiune de agent e loghata si auditabila
- [ ] Human-in-the-loop functioneaza pe 3 niveluri (auto/draft-approve/human-only)
- [ ] Utilizatorul vede clar CE a facut agentul si DE CE
- [ ] Agentii nu iau decizii juridice si nu semneaza
- [ ] Pricing reflecta valoarea agentiva (Pro+ tier)

---

## Timeline realist complet

| Versiune | Ce face | Cand | Status |
|----------|---------|------|--------|
| V2 | Production-ready | Martie 2026 | 🟡 In lucru |
| V3 | Guided Closure Engine | Aprilie 2026 | ⚪ Aprobat |
| V4 | Go Commercial | Aprilie-Mai 2026 | ⚪ Planificat |
| V5 | Iteratie pe feedback clienti | Mai-Iunie 2026 | ⚪ Organic |
| **V6** | **Agentic Compliance Engine** | **Iulie-August 2026** | **⚪ Acest document** |

La momentul in care ajungi la V6, ai deja:
- Clienti platitori (V4)
- Feedback real (V5)
- Infrastructura stabila (V2-V3)
- Revenue (V4)

V6 devine upgrade-ul care justifica pretul Pro+ si diferentiaza definitiv de orice competitor local.

---

*V6 — Agentic Compliance Engine*
*Nu inlocuim omul. Ii luam 80% din munca repetitiva.*
*2026-03-18*
