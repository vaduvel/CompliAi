# Non-DPO framework findings backlog

Data: 2026-04-29  
Sursa: testele live-browser Sonnet din 2026-04-29, filtrate dupa decizia curenta de scope.  
Status: parking lot pentru sprinturi viitoare, nu blocker pentru pilotul DPO Consultant.

## Regula de scope

Acest document NU schimba directia curenta.

Sprintul activ ramane: **DPO Consultant ICP**.

Pentru Diana Popescu / DPO Complet, blocantele sunt doar pe:

- GDPR operational
- Legea 190/2018 / CNP / date sensibile
- RoPA Art. 30
- DPIA cand implica date personale
- DSAR
- DPA / vendor privacy review
- ANSPDCP breach notification 72h
- training GDPR
- template-uri cabinet
- magic link approvals
- evidence ledger
- monthly report
- audit pack / export
- white-label cabinet

Tot ce tine de NIS2 tehnic, DORA, fiscal, e-Factura, SAF-T, Pay Transparency, Whistleblowing sau full compliance officer se parcheaza aici si se reia doar cand acel ICP intra in sprint.

## Findings parcate pe framework

### CISO / NIS2 / CER

Owner viitor: CISO consultant / IMM internal security lead.  
Nu este owner DPO, cu exceptia incidentelor care includ date personale si declanseaza ANSPDCP 72h.

Findings raportate:

- Unele rute NIS2 au fost raportate cu 500 in testele vechi (`/api/nis2/incidents`, `/dashboard/incidente`, `/dashboard/breach`). Intre timp partea DPO breach a fost expusa separat prin `/dashboard/breach` si aliasuri `/api/breach-notification`, dar sprintul CISO trebuie sa retesteze NIS2 full.
- Modulul NIS2 trebuie separat in UI de flow-ul DPO: DPO vede doar "Breach ANSPDCP 72h"; CISO vede DNSC/NIS2 operational.
- NIS2 incident reporting trebuie verificat cap-coada: creare incident, clasificare, timeline, notificare DNSC, legatura separata cu ANSPDCP cand incidentul include date personale.
- Need deep links clare din alerte spre incidentul NIS2 si spre actiunea urmatoare.
- Need language split: "incident securitate / DNSC" pentru CISO, "breach date personale / ANSPDCP" pentru DPO.

Backlog recomandat cand intram pe CISO:

- Smoke authenticated pentru toate rutele NIS2: `/dashboard/nis2`, `/dashboard/nis2/inregistrare-dnsc`, `/api/nis2/incidents`.
- Scenario CISO cu 2 clienti: unul in scope NIS2, unul out-of-scope.
- DNSC report draft + evidence export.
- Incident lifecycle: open -> assessed -> reported -> closed.
- Cross-over test: incident cu personal data injecteaza si finding ANSPDCP pentru DPO.

### DORA / financial compliance

Owner viitor: DORA specialist / fintech compliance.  
Nu este blocker DPO.

Findings raportate:

- Rutele DORA au fost mentionate ca ascunse sau netestate in browser live.
- Cobalt Fintech poate avea DPIA / AI / vendor privacy flow pentru DPO, dar DORA full ramane alt produs.
- Trebuie validat daca pagina DORA este demo-safe sau trebuie ascunsa pana la sprintul fintech.

Backlog recomandat cand intram pe DORA:

- Define DORA scope separat de GDPR/DPIA.
- Vendor ICT register, incident classification, critical third-party dependencies.
- BNR-facing language, nu DPO language.
- Nu promite enterprise GRC / ServiceNow replacement pana nu exista maturity real.

### Fiscal / e-Factura / SAF-T

Owner viitor: contabil CECCAR / cabinet fiscal.  
Nu este blocker DPO.

Findings raportate:

- Fiscal apare in unele navigatii pentru partner workspace, dar pentru Diana trebuie ascuns sau tratat ca out-of-scope.
- e-Factura/SAF-T nu trebuie testate in demo DPO.
- Cand intram pe Fiscal ICP, flow-ul trebuie vandut ca layer peste SmartBill/Saga/ANAF SPV, nu ca inlocuitor de contabilitate.

Backlog recomandat cand intram pe Fiscal:

- Scenario contabil cu 20 clienti si facturi UBL.
- Validare CIUS-RO / e-Factura import + status SPV.
- SAF-T hygiene report.
- Multi-client fiscal dashboard.
- Export raport fiscal client-facing.

### HR / Pay Transparency

Owner viitor: HR consultant / IMM internal HR lead.  
Nu este blocker DPO, exceptand training GDPR si datele angajatilor sub GDPR.

Findings raportate:

- Pay Transparency a fost inclus de Sonnet in "module ascunse", dar nu apartine pilotului Diana.
- DPO poate vedea training GDPR si privacy notices pentru angajati; nu trebuie sa detina compensatii, pay-gap analytics sau HRIS.

Backlog recomandat cand intram pe HR:

- Pay transparency gap workflow: role catalog, bands, pay-gap report, remediation tasks.
- Whistleblowing split clar fata de GDPR.
- HRIS import/export strategy.
- Client-facing HR report.

### Whistleblowing

Owner viitor: HR/legal compliance consultant / IMM internal officer.  
Nu este blocker DPO.

Findings raportate:

- Modulul exista ca suprafata potentiala, dar nu trebuie afisat Dianei ca obligatie DPO core.
- DPO poate fi consultat daca sesizarile contin date personale, dar ownership-ul operational este separat.

Backlog recomandat cand intram pe Whistleblowing:

- Secure intake channel.
- Case lifecycle, confidentiality, anti-retaliation metadata.
- Evidence and access-control hardening.
- Monthly/quarterly report.

### AI Act

Owner viitor: AI governance advisor / legal tech / fintech compliance.  
DPO interaction: doar daca sistemul AI prelucreaza date personale sau implica DPIA.

Findings raportate:

- Cobalt Fintech IFN are AI OFF si scoring-credit scenario, util pentru DPO only ca DPIA / personal data risk.
- Annex IV / AI Act full trebuie testat separat, nu in demo DPO.
- DPO trebuie sa poata spune "AI OFF pentru client sensibil" si "necesita DPIA"; nu trebuie sa livreze full conformity assessment.

Backlog recomandat cand intram pe AI:

- AI inventory.
- Risk classification.
- Annex IV generation.
- Provider/model documentation.
- AI OFF/EU-only/no-training policy per client.

### Full-stack compliance officer / IMM internal

Owner viitor: IMM internal officer / COO / office manager.  
Nu exista inca larg in piata RO ca buyer matur; aceasta categorie ramane faza 2/3.

Findings raportate:

- Sonnet a evaluat aplicatia ca si cum Diana ar trebui sa vada toate modulele. Aceasta concluzie este gresita pentru DPO, dar utila pentru viitorul "full-stack compliance officer".
- Cand intram pe IMM internal, trebuie dashboard modular cu module active/inactive, nu sidebar DPO-only.

Backlog recomandat cand intram pe IMM internal:

- Role-based cockpit switcher: DPO, Fiscal, CISO, HR, Legal.
- Active frameworks per workspace.
- Unified evidence ledger across frameworks.
- Monthly board report.
- Module maturity labels ca avertismente interne, nu marketing public.

## Decizie finala

Nu mai folosim aceste findings ca argument ca pilotul DPO nu poate continua.

Le folosim astfel:

- DPO sprint: doar privacy/DPO findings.
- CISO sprint: NIS2/CER findings.
- Fiscal sprint: e-Factura/SAF-T findings.
- HR sprint: Pay Transparency/Whistleblowing findings.
- AI sprint: AI Act findings.
- IMM internal sprint: unified cockpit si cross-framework orchestration.

Formula operationala:

> Motorul poate impinge mai multe masini, dar in sprintul curent testam doar masina DPO. Restul masinilor intra pe rand la stand.
