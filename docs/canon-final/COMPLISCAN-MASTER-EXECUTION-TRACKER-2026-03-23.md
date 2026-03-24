# CompliScan - Master Execution Tracker

Date: `2026-03-23`
Status: `execution tracker`
Decision: `nu lansam inca; executam canonul`

## Rolul acestui document

Acest fisier NU inlocuieste masterul. Este doar trackerul operational derivat din master, folosit ca sa raspundem rapid la 4 intrebari:

1. Ce este deja aliniat?
2. Ce este partial?
3. Ce este blocant?
4. Care este ordinea corecta de executie?

Daca trackerul contrazice masterul, masterul castiga.

## Sursa de adevar

Ordinea corecta pentru decizii este:

1. [COMPLISCAN-MASTER-FINAL-v3.md](/Users/vaduvageorge/Downloads/COMPLISCAN-MASTER-FINAL-v3.md)
2. [COMPLISCAN-MASTER-EXECUTION-TRACKER-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MASTER-EXECUTION-TRACKER-2026-03-23.md)
3. [COMPLISCAN-VERCEL-MAIN-LIVE-AUDIT-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-VERCEL-MAIN-LIVE-AUDIT-2026-03-23.md)
4. [COMPLISCAN-AUDIT-ALIGNMENT-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-AUDIT-ALIGNMENT-2026-03-23.md)

Regula simpla:

- masterul spune produsul tinta
- trackerul spune starea executiei
- auditurile spun ce este confirmat azi

## Igiena documentelor

Ca sa nu ne mai pierdem in `docs/`, folosim setul minim:

- canon produs: [COMPLISCAN-MASTER-FINAL-v3.md](/Users/vaduvageorge/Downloads/COMPLISCAN-MASTER-FINAL-v3.md)
- tracker executie: [COMPLISCAN-MASTER-EXECUTION-TRACKER-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-MASTER-EXECUTION-TRACKER-2026-03-23.md)
- audit live: [COMPLISCAN-VERCEL-MAIN-LIVE-AUDIT-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-VERCEL-MAIN-LIVE-AUDIT-2026-03-23.md)
- audit aliniere repo: [COMPLISCAN-AUDIT-ALIGNMENT-2026-03-23.md](/Users/vaduvageorge/Desktop/CompliAI/docs/canon-final/COMPLISCAN-AUDIT-ALIGNMENT-2026-03-23.md)

Restul documentelor raman context istoric sau tehnic. Nu le mai folosim ca sursa principala de decizie.

## Legenda statusuri

- `ALIGNED` - exista si este suficient de aproape de canon
- `PARTIAL` - fundatia exista, dar flow-ul sau modelul nu este inca corect cap-coada
- `BLOCKER` - lipsa sau ruptura suficient de mare incat nu putem pretinde aliniere la master
- `REAUDIT` - exista ceva, dar nu este suficient reverificat azi ca sa-l declaram gata

## Decizie executiva

Pe baza masterului si a auditului de azi:

- nu lansam public inca
- nu rescriem masterul
- nu mai scriem alt document de produs
- nu facem refactor mare de platforma
- facem refactor serios de flow runtime si patch-uri tintite pe gap-urile canonice

## Launch gates

Acestea trebuie sa fie verzi inainte de orice discutie serioasa de launch:

1. onboarding real in 4 pasi, fara salturi confuze intre dashboard si wizard
2. flow complet `finding -> wizard -> preview -> confirmare -> dovada -> rezolvat`
3. `/trust` public live plus DPA CompliScan accesibil
4. scoring convergent pe dashboard, benchmark si rapoarte
5. NIS2 cu model real in 3 etape, nu doar 24h/72h

## Tracker pe capitole din master

| ID | Status | Verdict scurt | Ce avem azi | Ce lipseste ca sa respectam masterul |
| --- | --- | --- | --- | --- |
| `S0.1` | `ALIGNED` | model NIS2 Art. 23 3-etape complet: early warning (24h) -> raport 72h -> raport final (1 luna), cu validare secventiala API-enforced, stepper vizual UI, auto-advance status | tipuri structurate per etapa in [nis2-store.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/server/nis2-store.ts), validare secventa in [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/nis2/incidents/[id]/route.ts), stepper UI in [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/nis2/page.tsx), 10 teste noi | — |
| `S0.2` | `ALIGNED` | guardrail-uri API-enforced: DOCUMENT_APPROVAL_REQUIRED, DOCUMENT_CONFIRMATION_INCOMPLETE, DOCUMENT_NOT_LINKED_TO_FINDING; checklist 3 itemi obligatorii; draft resumable | API-ul blocheaza `resolved` fara draft legat + checklist complet; generatorul si resolve page merg acum pe flow ghidat; vezi [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/findings/[id]/route.ts) si [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx) | — |
| `S0.3` | `PARTIAL` | `/trust` public exista acum, cu DPA si subprocessors publice, dar gate-ul legal nu este inca inchis | pagina publica exista in [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/trust/page.tsx), DPA download in [dpa-compliscan.pdf](/Users/vaduvageorge/Desktop/CompliAI/public/legal/dpa-compliscan.pdf), subprocessors in [subprocessors.html](/Users/vaduvageorge/Desktop/CompliAI/public/legal/subprocessors.html) | counsel sign-off pe wording + copie DPA finala/pre-semnata in forma de release |
| `S1.1` | `ALIGNED` | toti consumatorii backend folosesc computeDashboardSummary; dashboard GDPR status aliniat la task-uri canonice; 0 divergente ramase | `computeDashboardSummary` in benchmark, snapshot, digest, audit-pack, partner-report, dashboard-response, portfolio; GDPR card informata de task-uri canonice | — |
| `S1.2` | `ALIGNED` | flow complet finding -> wizard -> preview -> confirmare -> dovada -> rezolvat cu guardrail-uri API-enforced | `De rezolvat`, detail page si `Generator` sunt legate prin draft persistent si approval explicit; vezi [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/resolve/[findingId]/page.tsx) si [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/generator/page.tsx) | — |
| `S1.3` | `PARTIAL` | import exista, dar nu este in forma robusta descrisa in master | exista import CSV in [portfolio-overview-client.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/portfolio-overview-client.tsx#L260) | lipsesc preview/mapping/retry/template standard in forma din master |
| `S1.4` | `ALIGNED` | onboarding 4 pasi corect, guard-uri anti-redirect, flow curat, TS clean | flow-ul dedicat este in [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/onboarding/page.tsx) si [onboarding-form.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/onboarding-form.tsx); 3 guard-uri: no-session, viewer-skip, completion-check | — |
| `S1.5` | `BLOCKER` | mobilul nu are flow-ul canonic cerut | exista UI responsive pe multe ecrane | lipseste onboarding mobil dedicat si finding flow compact de telefon |
| `S2.1` | `PARTIAL` | assessment NIS2 exista, prefill cu confidence nu | store si rules exista | sursa, confidence si confirmare per intrebare trebuie adaugate |
| `S2.2` | `PARTIAL` | Agent OS exista, dar cere hardening exact cum spune masterul | agent runner, review si commit exista | drift trebuie legat la baseline validat, evidence trebuie persistat, run-urile trebuie sa devina repetabile; vezi [route.ts](/Users/vaduvageorge/Desktop/CompliAI/lib/compliance/route.ts#L85) |
| `S2.3` | `BLOCKER` | DSAR tracking lipseste ca modul dedicat | exista doar piese indirecte de evidenta si tasking | pagina, modelul si termenele DSAR nu sunt implementate |
| `S2.4` | `ALIGNED` | post-incident tracking complet: remediation started/completed/follow-up validation, notes, badge remediat; panel vizibil pe incidente inchise | PostIncidentPanel in [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/dashboard/nis2/page.tsx), tip Nis2PostIncidentTracking in store, API PATCH accepta postIncidentTracking, test acoperit | — |
| `S3.1` | `PARTIAL` | portfolio-first este real, batch actions nu sunt inca fluxul din master | `/portfolio`, `/portfolio/alerts`, `/portfolio/tasks`, `/portfolio/reports` exista | lipsesc preview si confirmare batch per firma pentru drafturi |
| `S3.2` | `PARTIAL` | DNSC wizard exista, enrichment-ul mai are loc de lucru | eligibilitate si prefill de baza exista | mai mult prefill si ghidaj contextual, fara reinventare |
| `S3.3` | `PARTIAL` | cron-ul lunar exista, dar este reminder, nu generare automata | reminder email si link la vault exista; vezi [route.ts](/Users/vaduvageorge/Desktop/CompliAI/app/api/cron/audit-pack-monthly/route.ts#L1) | bundling automat si stare clara "pack gata / pack incomplet" |
| `S3.4` | `ALIGNED` | trial si export sunt in mare parte acoperite | banner/billing/export-data exista | mai ramane polish si verificare pe edge cases, nu rebuild |
| `S3.5` | `ALIGNED` | eFactura este una dintre cele mai mature zone | validare XML, status, signals si SPV surfaces exista | mai mult hardening si teste, nu redesign de produs |
| `S4.1` | `PARTIAL` | trust disclosure AI Act exista acum public, iar CE gate-ul este tratat prudent, dar validarea juridica ramane deschisa | sectiunea publica exista in [page.tsx](/Users/vaduvageorge/Desktop/CompliAI/app/trust/page.tsx), badge-ul in [ce-badge.tsx](/Users/vaduvageorge/Desktop/CompliAI/components/compliscan/ce-badge.tsx), disclosure download in [ai-act-disclosure.pdf](/Users/vaduvageorge/Desktop/CompliAI/public/legal/ai-act-disclosure.pdf) | counsel sign-off pe wording si decizia explicita daca produsul ramane doar Art. 50 transparency sau intra in alta categorie |
| `S4.2` | `PARTIAL` | AI Act are deja fundatie buna, dar nu este exact forma din master | assessment, conformity pack si inventory exista | clasificare auto-detect mai explicita si confirmata uman |
| `S4.3` | `BLOCKER` | wizard-ul EU Database nu exista | exista doar fundatie AI Act si ideea de submit manual | pagina, exporter JSON si flow-ul dedicat lipsesc |

## Ce este deja peste nivelul sugerat de master

Acestea NU trebuie rescrise de la zero:

- fundatia `portfolio-first`
- fundatia `Agent OS`
- fundatia `AI Act`
- fundatia `eFactura`
- billing/export-data

Regula aici este simpla:

- pastram ce este bun
- il aliniem semantic la master
- nu demolam zonele deja mai mature doar ca sa copiem literal documentul

## Ordinea de executie recomandata

Ordinea corecta, fara sa reinventam nimic, este:

1. `S1.4` onboarding real in 4 pasi
2. `S0.2 + S1.2` flow unic findings -> documente -> dovada
3. `S0.3 + S4.1` trust public + disclosure minim corect
4. `S1.1` scoring convergent
5. `S0.1 + S2.4` model NIS2 complet
6. `S2.2` Agent OS hardening
7. `S2.3` DSAR
8. `S3.1 + S3.2 + S3.3` consultant/reporting polish
9. `S4.2 + S4.3` AI Act completeness final

## Reguli de lucru de acum inainte

Cand lucram dupa acest tracker:

- nu mai deschidem initiativ alt document de produs
- nu schimbam masterul fara motiv exceptional
- actualizam doar trackerul si auditul cand se inchide ceva important
- fiecare task nou trebuie mapat explicit la un ID din master

## Verdict final

Produsul actual nu este "varza" la nivel de fundatie tehnica, dar este rupt la nivel de flow cap-coada.

Decizia corecta este:

- masterul ramane canon
- trackerul devine tabla de executie
- launch-ul asteapta pana cand launch gates devin verzi
