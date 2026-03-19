# CompliScan — ANAF Signals Roadmap
## Integrarea semnalelor fiscale reale in V5 / V6 fara sa rupi arhitectura

Data: 2026-03-18
Status: Roadmap draft
Scop: transformarea celor 5 semnale ANAF intr-un plan de produs executabil
Principiu: nu construim 5 module noi. Integram semnalele in arhitectura existenta:
signal -> finding -> evidence -> report -> revalidation -> agent rail

---

## 0. Teza centrala

CompliScan nu trebuie sa raspunda la presiunea fiscala prin inca o suita de pagini.
Trebuie sa raspunda prin 4 straturi deja existente:

1. Signal Layer
2. Findings + Resolution Layer
3. Reports / Packs
4. Agent Rails (mai tarziu, in V6)

Asta inseamna:
- orice semnal ANAF nou intra mai intai ca signal
- semnalele importante devin findings
- findings produc output extern (report / pack / response)
- doar semnalele validate operational ajung mai tarziu in agenti

---

## 1. Cele 5 semnale ANAF

### S1 — e-Factura rejected / pending / mismatch
Semnal:
- factura respinsa
- factura pending prea mult
- lipsa corelare emitere -> status ANAF
- vendor cu istoric repetat de respingeri

### S2 — RO e-TVA discrepancy / conformity notification
Semnal:
- discrepanta RO e-TVA
- notificare de conformare
- deadline de raspuns
- explicatie / justificare necesara

### S3 — SAF-T hygiene / filing consistency
Semnal:
- filing lipsa
- filing intarziata
- rectificari repetate
- consistenta slaba

### S4 — Sector risk mode
Semnal:
- firma activeaza intr-un domeniu vizat
- nivel de vigilenta trebuie crescut

### S5 — Notification + filing discipline
Semnal:
- notificare primita
- termen apropiat / depasit
- lipsa owner
- lipsa raspuns / follow-up

---

## 2. Unde intra fiecare in produs

| Signal | Dashboard | Findings | Health Check | One-Page Report | Response Pack | Partner Hub | V6 |
|---|---|---|---|---|---|---|---|
| S1 e-Factura | Da | Da | Da | Da | Optional | Da | Fiscal Sensor |
| S2 e-TVA | Da | Da | Da | Da | Da | Da | Compliance Monitor |
| S3 SAF-T | Optional | Da | Da | Optional | Optional | Da | Compliance Monitor |
| S4 Sector risk | Da | Prioritizare | Optional | Optional | Optional | Da | Routing / scoring |
| S5 Notifications | Da | Da | Da | Optional | Da | Da | Work item trigger |

---

## 3. Roadmap pe faze

# PHASE A — V5 Signal Integration Core
Scop:
semnalele ANAF apar in produs fara sa rupi flow-urile existente

### A1. e-Factura Signal Hardening
Include:
- rejected invoice queue
- pending-too-long rule
- mismatch finding
- vendor repeated rejection signal
- urgency score
- redeschidere pana la confirmare

Output:
- findings fiscale reale
- semnal zilnic pentru contabil
- vizibilitate imediata in partner hub

### A2. Notification Inbox Foundation
Include:
- notification inbox generic
- due date
- owner
- status:
  - primit
  - in analiza
  - raspuns trimis
  - overdue

Output:
- semnalele ANAF nu mai raman in afara produsului
- baza pentru e-TVA si filing discipline

### A3. Sector Risk Mode
Include:
- tag pe org profile
- vigilance strip pe dashboard
- findings cu severitate mai mare in sectoare tintite
- cue vizual in Partner Hub

Output:
- prioritate mai buna
- mesaj comercial mai puternic
- operatorul stie cand trebuie sa fie mai atent

---

# PHASE B — V5 Closure Workflows
Scop:
semnalul nu ramane avertizare, ci devine workflow de inchidere

### B1. RO e-TVA Discrepancy Workflow
Include:
- discrepancy inbox
- countdown de raspuns
- explanation draft
- response evidence
- closure + revalidation

Output:
- primul workflow ANAF complet, de la semnal la raspuns si dovada

### B2. Filing Discipline Layer
Include:
- filing discipline score
- overdue filing findings
- owner assignment
- escalation
- reminder logic

Output:
- produsul incepe sa semene cu compliance operations, nu doar scanner

### B3. Response Pack Enrichment
Include:
- sectiune fiscala in Response Pack
- status e-Factura / e-TVA / notificari
- summary pentru partener / administrator

Output:
- produsul poate raspunde extern mai bine la presiunea fiscala

---

# PHASE C — V5 Hygiene + Revalidation
Scop:
presiunea fiscala devine monitorizare continua, nu reactie singulara

### C1. SAF-T Hygiene
Include:
- filing status
- late / missing / rectified indicators
- consistenta warning
- hygiene score

Output:
- semnal fiscal nou pentru firmele mici
- integrare in Health Check

### C2. Fiscal Health Check Section
Include:
- bloc fiscal dedicat in health check
- e-Factura
- e-TVA
- SAF-T
- filing discipline

Output:
- owner-ul vede repede unde se degradeaza postura fiscala

### C3. Revalidation Rules
Include:
- redeschidere findings fiscale daca raman nerezolvate
- reminder la expirarea review-ului
- stale evidence logic

Output:
- semnalele nu mor dupa prima vizualizare

---

# PHASE D — V6 Agent Rails
Scop:
doar semnalele validate in V5 ajung in agentic mode

### D1. Fiscal Sensor
Porneste din:
- rejected invoices
- pending invoices
- vendor repeated issues

Face:
- rescoring
- re-open finding
- work item suggestion
- partner alert

### D2. Compliance Monitor
Porneste din:
- e-TVA discrepancy
- filing discipline
- overdue responses
- SAF-T hygiene

Face:
- reminder
- stale signal detection
- response pack refresh
- escalation suggestion

### D3. Routing / Prioritization Agent
Porneste din:
- sector risk
- org profile
- findings severity
- partner queue load

Face:
- prioritizeaza cine arde primul
- muta clienti in urgency queue
- sugereaza next best action

---

## 4. Ce NU facem

Nu facem:
- modul ANAF gigantic separat
- emitere factura
- mini-ERP
- verdict fiscal automat
- raspuns automat la autoritati fara om
- agenti care trimit singuri ceva oficial

Regula:
totul ramane bounded, evidence-driven, human-in-the-loop.

---

## 5. Ordinea de prioritate reala

### P0 fiscal
1. e-Factura signal hardening
2. Notification inbox foundation
3. Sector risk mode

### P1 fiscal
4. e-TVA discrepancy workflow
5. Filing discipline layer
6. Response pack enrichment

### P2 fiscal
7. SAF-T hygiene
8. Fiscal health check section
9. Revalidation rules

### P3 fiscal / agentic
10. Fiscal Sensor
11. Compliance Monitor
12. Routing / prioritization agent

---

## 6. Ce trebuie sa primeasca Claude ca regula de implementare

1. Nu construi modul ANAF separat, lat si izolat
2. Fiecare semnal fiscal trebuie sa aiba closure path
3. Findings fiscale trebuie sa foloseasca Resolution Layer complet
4. Tot ce ajunge in report / response pack trebuie sa fie verificabil
5. Doar ce e stabil in V5 ajunge in agent rails in V6

---

## 7. Prompt scurt pentru Claude

Claude, integrate the ANAF signals as a phased roadmap inside the existing CompliScan architecture.

Do NOT build a new giant ANAF module.

Use this structure:
- Signal Layer
- Findings + Resolution Layer
- Reports / Packs
- Agent Rails later in V6

Implement in phases:

PHASE A:
- e-Factura signal hardening
- notification inbox foundation
- sector risk mode

PHASE B:
- RO e-TVA discrepancy workflow
- filing discipline layer
- response pack enrichment

PHASE C:
- SAF-T hygiene
- fiscal section in health check
- revalidation rules

PHASE D (V6 only):
- Fiscal Sensor
- Compliance Monitor
- Routing / Prioritization Agent

Rules:
1. Every fiscal signal must become either a finding or disappear
2. No fiscal warning should stay isolated without ownership or due date
3. Important fiscal issues must show in dashboard, partner hub, and reports
4. Keep everything Romania-first, bounded, and evidence-driven
5. No automatic legal/fiscal final decisions

Goal:
CompliScan should become fiscally aware and operationally useful, not just informational.
