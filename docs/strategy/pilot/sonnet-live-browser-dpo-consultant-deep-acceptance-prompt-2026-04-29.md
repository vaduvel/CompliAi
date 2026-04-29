# Prompt Sonnet — DPO Consultant Deep Acceptance Test

**Data:** 29 aprilie 2026  
**Țintă:** CompliScan `v3-unified` după fix pack `7a94e0c fix DPO browser acceptance gaps`  
**Scop:** test live în browser ca DPO real, nu audit superficial de UI.

---

## Prompt de dat lui Sonnet

Ești Sonnet și ai acces la browser local. Vreau să testezi CompliScan live ca și cum ai fi **Diana Popescu, consultant DPO la DPO Complet SRL**, cu 3 clienți în portofoliu:

- Apex Logistic SRL;
- Lumen Clinic SRL;
- Cobalt Fintech IFN.

Nu testa ca developer. Testează ca un consultant DPO care decide dacă ar intra într-un pilot real cu aplicația.

Obiectivul tău nu este să fii amabil. Obiectivul este să-mi spui dacă Diana poate lucra realist în aplicație:

- vede ce client arde azi;
- găsește DSAR-ul critic;
- trimite / urmărește documente;
- păstrează dovezi;
- generează raport lunar;
- exportă dosar / cabinet;
- păstrează coerență între dashboard, portfolio, raport lunar, evidence ledger și audit pack;
- nu expune brand vechi, mesaje false sau stări contradictorii.

---

## HARD PREFLIGHT — obligatoriu înainte de browser

Nu porni din root repo. Root-ul `/Users/vaduvageorge/Desktop/CompliAI` poate fi pe branch vechi.

Lucrează exclusiv din:

```text
/Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/v3-unified
```

Rulează înainte de orice browser:

```bash
cd /Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/v3-unified
git branch --show-current
git log -1 --oneline
rg "dpo-consultant" 'app/api/demo/[scenario]/route.ts' lib/server/demo-seed.ts
```

Condiții obligatorii:

- branch-ul trebuie să fie `v3-unified`;
- ultimul commit trebuie să fie `7a94e0c` sau mai nou;
- `rg` trebuie să găsească `dpo-consultant`;
- dacă endpoint-ul spune doar `imm | nis2 | partner | revalidation`, ești în repo/branch greșit. Oprește-te.

Dacă serverul nu rulează, pornește-l din același worktree:

```bash
COMPLISCAN_DATA_BACKEND=local COMPLISCAN_AUTH_BACKEND=local COMPLISCAN_ALLOW_LOCAL_FALLBACK=true npm run dev
```

Folosește portul afișat de Next.js. Poate fi `3000`, `3001`, `3002` etc. În raport scrie exact portul folosit.

Seed demo:

```text
http://localhost:<PORT>/api/demo/dpo-consultant
```

---

## Reguli stricte

- Nu modifica codul.
- Nu face commit.
- Nu reseta date reale.
- Nu testa production.
- Nu introduce date personale reale.
- Nu te opri după prima eroare. Continuă și raportează tot.
- Pentru fiecare bug critic: dă pașii de reproducere, pagina, ce ai văzut, ce ar trebui să fie.
- Dacă vezi `CompliAI` în suprafețe publice/client-facing, marchează bug critic de branding.
- Dacă vezi contradicții între portfolio, dashboard, raport lunar, evidence ledger și audit pack, marchează bug critic de încredere.
- Dacă o funcție există în API dar nu poate fi accesată natural din UI, marchează fricțiune UX.
- Dacă un DPO ar trebui să meargă în email/Word/Drive pentru a termina munca, spune exact ce rămâne în afara aplicației.

---

## Mental model pentru test

Imaginează-ți că Diana deschide aplicația luni dimineața și are 90 de minute să lucreze:

1. Vrea să știe cine are prioritate azi.
2. Vrea să rezolve sau să avanseze cel mai urgent caz.
3. Vrea să trimită un document la client.
4. Vrea să vadă dacă clientul a aprobat, respins sau comentat.
5. Vrea să știe ce dovadă rămâne în dosar.
6. Vrea să genereze un raport lunar trimisibil.
7. Vrea să exporte ceva care poate fi arătat intern sau într-un audit.

Testează aplicația exact prin acest fir.

---

## Flow 0 — Smoke rapid înainte de UI

Înainte de raportul final, verifică dacă aceste lucruri sunt adevărate în browser/API:

- `/api/demo/dpo-consultant` redirectează în portofoliu.
- `Portfolio` are 3 clienți.
- `Portfolio Tasks` nu este gol.
- `Portfolio Vendors` nu este gol.
- `Portfolio Reports` are buton / flow de generare raport lunar.
- `Cabinet Templates` are minim 3 template-uri.
- `Lumen / DSAR` are cerere DSAR reală, nu pagină goală.
- `/privacy`, `/terms`, `/dpa` nu afișează `CompliAI`.

Dacă unul dintre acestea e fals, marchează direct ca blocker.

---

## Flow 1 — Portofoliu: “cine arde azi?”

Deschide portofoliul după seed.

Verifică:

- Apar Apex, Lumen, Cobalt?
- Este clar că Lumen are DSAR critic?
- Work queue / urgency queue este ordonată logic?
- Există duplicate între finding și alertă?
- Există deadline-uri reale?
- Este clar ce trebuie făcut azi?
- Scorurile sunt coerente cu riscurile?
- Se vede consultantul / cabinetul corect?

Judecată DPO:

- Diana ar ști în 30 secunde unde să intre?
- Ar avea încredere în prioritizare?
- Dacă sunt 50 de clienți, modelul ar scala sau pare demo-only?

---

## Flow 2 — Lumen Clinic: DSAR critic

Intră în Lumen Clinic și testează DSAR.

Verifică:

- DSAR-ul “pacient neînchis / termen depășit” există în modulul DSAR?
- Deadline-ul este vizibil?
- Apare statusul corect: `in_progress` sau echivalent?
- Se vede dacă identitatea este verificată?
- Se vede dacă există draft de răspuns?
- Există CTA natural pentru “rezolvă / generează răspuns / marchează răspuns trimis”?
- Dacă apeși pe alertă sau task, ajungi direct la DSAR sau te pierzi?

Judecată DPO:

- Un DPO real ar putea continua cazul din aplicație?
- Ce ar trebui încă să facă în email / Word / Drive?
- Este suficient pentru pilot sau doar pentru demo?

---

## Flow 3 — Apex Logistic: DPA + RoPA + Cookie + evidence

Intră în Apex.

Testează:

- DPA Stripe aprobat prin magic link;
- evidence ledger pentru aprobarea DPA;
- RoPA Stripe gap;
- cookie banner gap;
- audit readiness;
- dashboard summary;
- dosar / audit pack / export dacă există.

Verifică foarte strict:

- Evidence Ledger are titluri clare, nu “Task fără titlu”?
- Evidence count din array este egal cu summary-ul?
- RoPA și cookie sunt închise sau deschise? Aceeași stare apare peste tot?
- Dacă Apex e `review_required`, raportul lunar și dashboard-ul spun același lucru?
- Dacă Apex e `audit_ready`, toate suprafețele spun același lucru?
- Missing evidence count este logic?
- Apare vreun control AI dacă Apex nu are sistem AI în scope?
- Audit Pack spune “dosar de lucru” când nu e final?

Judecată DPO:

- Aș arăta acest dosar clientului?
- Aș păstra acest export ca dovadă?
- Ce m-ar face să nu am încredere?

---

## Flow 4 — Cobalt Fintech: AI OFF + reject/comment

Intră în Cobalt.

Testează:

- Se vede că AI este OFF pentru client sensibil?
- DPA payroll / documentul trimis la client există?
- Poți deschide magic link?
- Pagina shared este white-label DPO Complet?
- Clientul poate comenta?
- Clientul poate respinge cu motiv?
- După respingere, aceeași pagină nu permite aprobare contradictorie?
- Rejection/comment apar în dashboard, alerts, event/evidence/traceability unde e cazul?

Judecată DPO:

- Statusul respingerii este clar pentru cabinet?
- Motivul respingerii este păstrat suficient de bine?
- Clientul final înțelege ce aprobă / respinge?
- Cookie bannerul de pe pagina shared e discret?

---

## Flow 5 — Portfolio Tasks

Deschide:

```text
/portfolio/tasks
```

Verifică:

- Lista nu este goală.
- Lumen DSAR apare ca prioritate.
- Task-urile sunt deduplicate.
- Fiecare task are client, prioritate, owner, evidence, due date unde e relevant.
- Clicking pe task te duce la locul acționabil sau doar la pagină generică?

Judecată DPO:

- Diana poate folosi pagina asta ca “ce fac azi”?
- E mai bună decât Excel/task list manual?
- Ce lipsește ca task management real?

---

## Flow 6 — Portfolio Vendors

Deschide:

```text
/portfolio/vendors
```

Verifică:

- Lista nu este goală.
- Stripe apare pentru Apex.
- PayFlow apare pentru Cobalt.
- OpenAI/ChatGPT apare dacă Cobalt are AI/sistem relevant.
- Vendorii sunt deduplicați logic.
- Se vede în ce client apare vendorul?
- Există next action clar pentru DPA/vendor review?

Judecată DPO:

- Are valoare reală pentru DPO sau e doar listă?
- Ar ajuta la vendor DPA management?
- Ce ar lipsi pentru portofoliu de 30 clienți?

---

## Flow 7 — Raport lunar

Deschide:

```text
/portfolio/reports
```

Testează butonul de generare raport lunar.

Verifică:

- Raportul se generează on-demand.
- Include cei 3 clienți.
- Include ce s-a lucrat.
- Include ce rămâne deschis.
- Include next actions.
- Include dovezi validate / pendinte.
- Este client-facing sau doar intern?
- Este brand-uit DPO Complet?
- Ar putea Diana să-l trimită clientului fără rescriere manuală?
- Raportul lunar spune aceeași stare ca dashboard / portfolio?

Judecată DPO:

- Raportul justifică abonamentul lunar al cabinetului?
- Ce ar trebui editat manual înainte de trimitere?
- Ce lipsește pentru “trimite clientului”?

---

## Flow 8 — Cabinet Templates

Deschide:

```text
/dashboard/cabinet/templates
```

Verifică:

- Există minim 3 template-uri: DPA, răspuns DSAR, RoPA.
- UI explică `.docx`, `.md`, `.txt`.
- Se văd version label, source file, status, active/draft.
- Poți înțelege cum ar importa Diana template-urile ei reale?
- Există risc să creadă că pierde formulările proprii?

Judecată DPO:

- Template import este suficient pentru pilot?
- Ce ar lipsi pentru migrare completă?
- Ar trebui test cu document Word real “murdar”?

---

## Flow 9 — Magic Links / Client-facing

Testează toate suprafețele client-facing disponibile:

- shared magic link;
- approve;
- reject;
- comment;
- status final;
- logo / brand / consultant;
- privacy/terms/dpa links dacă apar.

Verifică:

- Clientul nu este obligat să intre într-o aplicație complicată.
- Nu apare CompliScan prea agresiv dacă ar trebui white-label.
- Nu apare CompliAI.
- Nu apar disclaimere sperioase sau contradictorii.
- Butoanele sunt clare.
- După decizie finală, nu se poate crea stare contradictorie.

Judecată DPO:

- Aș trimite linkul unui patron real?
- Ar suna profesional?
- Ce ar trebui schimbat înainte de un client real?

---

## Flow 10 — Audit Pack / Export / Offboarding

Testează exporturile disponibile natural din UI:

- Audit Pack client;
- export cabinet;
- orice JSON/ZIP/HTML/PDF disponibil;
- dacă există gating Pro, vezi dacă e comunicat corect.

Verifică:

- Se poate descărca ceva util în demo?
- Denumirile fișierelor sunt clare?
- Manifestul e coerent?
- Hash-urile există unde se promite?
- Evidence list include fișiere reale?
- Exportul are client/cabinet separate corect?
- Apare `local_fallback` și dacă da, este clar că e mod demo?
- Există documente de trust / security / DPA / subprocessori accesibile?

Judecată DPO:

- Aș folosi exportul ca dovadă?
- Aș putea face offboarding?
- Ce lipsește pentru client real?

---

## Flow 11 — Legal / Security / Trust

Verifică paginile:

```text
/privacy
/terms
/dpa
/trust
```

și orice trust pack / security pack vizibil în aplicație.

Verifică:

- Brandul este CompliScan peste tot?
- Rolurile sunt clare: client final → cabinet DPO → CompliScan?
- DPA-ul este template/draft sau semnabil?
- Subprocessorii sunt clari?
- Se explică AI OFF / AI ON?
- Se explică retenție / ștergere / export?
- Limbajul este calm sau prea defensiv?

Judecată DPO:

- Aș putea cere intern aprobarea unui pilot pe baza acestor documente?
- Ce document juridic lipsește pentru pilot real?
- Ce document juridic lipsește pentru migrare completă?

---

## Flow 12 — Consistență globală

Alege un client, ideal Apex, și compară aceeași stare în:

- portfolio overview;
- portfolio reports;
- dashboard client;
- evidence ledger;
- audit readiness summary;
- audit pack/export dacă există;
- monthly report preview.

Verifică:

- scor;
- risk label;
- open findings;
- missing evidence;
- validated evidence;
- audit readiness;
- baseline status;
- next actions.

Marchează critic orice contradicție.

Exemplu de contradicție critică:

- Dashboard spune `audit_ready`, dar raport lunar spune `review_required`.
- Evidence ledger are 2 itemi, summary spune 4.
- DSAR alert critic există, dar modulul DSAR e gol.
- Audit Pack listează fișier care nu există în export.

---

## Flow 13 — “Messy real world” sanity check

Nu modifica codul, dar judecă produsul pentru cazuri reale murdare:

- clientul aprobă greșit;
- clientul respinge și revine;
- documentul are versiuni negociate;
- DSAR are excepții;
- un consultant junior greșește;
- clientul cere export pe 2 ani;
- o dovadă trebuie ștearsă/restaurată;
- două persoane lucrează pe același client;
- template-ul cabinetului are clauze custom;
- datele trebuie ținute AI OFF.

Pentru fiecare, spune:

- aplicația acoperă acum;
- acoperă parțial;
- nu acoperă;
- ce fix ar fi minim pentru pilot.

---

## Cele 10 întrebări de validare

Răspunde concret, după test:

1. Care sunt ultimele 5 lucruri pe care Diana le poate face pentru un client DPO în aplicație?
2. Unde sunt notate acele lucruri?
3. Ce livrabil poate trimite clientului?
4. Ce dovadă se păstrează?
5. Cum știe Diana ce client are prioritate azi?
6. Cum urmărește aprobările clientului?
7. Cum face raportarea lunară?
8. Cum gestionează RoPA / DPA / DSAR în practică?
9. Ce rămâne în email / Word / Drive?
10. Ce parte ți-ar fi rușine să o arăți într-un audit?

---

## Scorare obligatorie

Folosește scoruri dure:

- `10/10` = aș folosi mâine pe clienți reali fără rezerve;
- `8-9/10` = aș accepta pilot controlat;
- `6-7/10` = demo bun, dar pilot riscant;
- `<6/10` = nu aș arăta unui DPO real.

Scoruri cerute:

- Demo readiness;
- Pilot readiness;
- DPO daily workflow readiness;
- Monthly reporting readiness;
- Evidence / traceability readiness;
- Audit Pack / export readiness;
- Legal / trust readiness;
- Full cabinet migration readiness.

Nu da scor mare dacă există contradicții între artefacte. În compliance, inconsistența omoară încrederea.

---

## Format raport final

Livrează raportul în română, exact în structura:

```md
# Raport test live browser — DPO Consultant Deep Acceptance

Data test:
Commit testat:
Port local:
Persona:
Portofoliu:

## Verdict scurt
| Dimensiune | Scor | Verdict |
|---|---:|---|
| Demo readiness | X/10 | ... |
| Pilot readiness | X/10 | ... |
| DPO daily workflow readiness | X/10 | ... |
| Monthly reporting readiness | X/10 | ... |
| Evidence / traceability readiness | X/10 | ... |
| Audit Pack / export readiness | X/10 | ... |
| Legal / trust readiness | X/10 | ... |
| Full cabinet migration readiness | X/10 | ... |

## Decizie
A intra în pilot controlat acum? DA/NU

Condiții minime rămase înainte de pilot:
- ...

Condiții rămase înainte de migrare completă cabinet:
- ...

## Ce funcționează bine
- ...

## Blockere critice
| Severitate | Zonă | Pași reproducere | Ce se întâmplă | Ce ar trebui să se întâmple |
|---|---|---|---|---|

## Incoerențe de business logic
| Zonă | Observație | Impact DPO | Fix recomandat |
|---|---|---|---|

## Fricțiuni UX pentru consultant DPO
| Zonă | Ce doare | Recomandare |
|---|---|---|

## Client-facing risks
| Zonă | Risc | Fix |
|---|---|---|

## Test pe clienți
### Apex Logistic
- ...
### Lumen Clinic
- ...
### Cobalt Fintech
- ...

## Cele 10 întrebări de validare
1. ...

## Ce rămâne în email / Word / Drive
- ...

## Top 10 fixuri recomandate, în ordine
1. ...

## Ce aș testa în pilot 30 zile
- ...

## Verdict final ca DPO
Scrie 2-3 paragrafe ca și cum ai fi Diana și ai răspunde fondatorului.
```

---

## Important

Raportul trebuie să fie util pentru execuție. Nu vreau impresii generale. Vreau:

- pași concreți;
- ce ai văzut;
- ce înseamnă pentru DPO;
- ce blochează pilotul;
- ce blochează migrarea completă;
- ce este doar nice-to-have.

Dacă aplicația e mai bună decât raportul anterior, spune asta. Dacă încă are găuri, spune-le direct.
