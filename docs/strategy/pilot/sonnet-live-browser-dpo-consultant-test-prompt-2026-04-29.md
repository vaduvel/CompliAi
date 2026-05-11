# Prompt Sonnet — Live Browser Test DPO Consultant

**Context:** CompliScan ruleaza local pe `v3-unified`, in mod local/demo. Scopul tau este sa testezi produsul ca un consultant DPO real, nu ca developer. Nu modifica codul. Nu face refactor. Navigheaza aplicatia, observa flow-ul, noteaza frictiuni, bug-uri, incoerente si ce ar bloca un pilot real.

## Prompt de dat lui Sonnet

Esti Sonnet si ai acces la browser local. Vreau sa testezi CompliScan live ca si cum ai fi Diana Popescu, consultant DPO la DPO Complet SRL, cu portofoliu de clienti.

## HARD PREFLIGHT — obligatoriu inainte de browser

Nu porni din root repo. Root-ul `/Users/vaduvageorge/Desktop/CompliAI` poate fi pe branch vechi si NU are scenariul `dpo-consultant`.

Trebuie sa lucrezi exclusiv din:

```text
/Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/v3-unified
```

Ruleaza:

```bash
cd /Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/v3-unified
git branch --show-current
rg "dpo-consultant" 'app/api/demo/[scenario]/route.ts' lib/server/demo-seed.ts
```

Conditii obligatorii:

- branch-ul trebuie sa fie `v3-unified`;
- `rg` trebuie sa gaseasca `dpo-consultant`;
- daca endpoint-ul spune doar `imm | nis2 | partner | revalidation`, esti in repo/branch gresit. Opreste-te si schimba in worktree-ul de mai sus.

Aplicatia corecta este pe:

```text
http://localhost:3000
```

Daca demo-ul nu este seed-uit, intra prima data aici:

```text
http://localhost:3000/api/demo/dpo-consultant
```

Daca serverul nu raspunde, porneste local din:

```text
/Users/vaduvageorge/Desktop/CompliAI/.claude/worktrees/v3-unified
```

cu:

```bash
COMPLISCAN_DATA_BACKEND=local COMPLISCAN_AUTH_BACKEND=local COMPLISCAN_ALLOW_LOCAL_FALLBACK=true npm run dev
```

## Reguli importante

- Nu modifica codul.
- Nu face commit.
- Nu schimba strategie/produs.
- Nu testa production si nu introduce date reale.
- Nu te opri la prima pagina. Mergi cap-coada ca un consultant DPO.
- Daca ceva nu merge, noteaza exact pasii de reproducere.
- Daca vezi text vechi `CompliAI`, marcheaza-l ca bug de branding.
- Daca vezi statusuri contradictorii intre dashboard, raport lunar, audit pack sau portfolio, marcheaza-l ca bug critic de incredere.
- Daca vezi console errors/hydration warnings, noteaza exact pagina si actiunea.

## Rolul tau in test

Actioneaza ca Diana Popescu:

- ai cabinet DPO;
- ai mai multi clienti;
- intri dimineata sa vezi cine arde azi;
- rezolvi DPA/RoPA/DSAR;
- trimiti documente la client prin magic link;
- urmaresti approve/reject/comment;
- verifici evidence ledger;
- verifici raport lunar;
- verifici Audit Pack;
- verifici daca ai putea folosi aplicatia intr-un pilot real.

## Flow obligatoriu de testat

### 1. Seed + Portofoliu

1. Deschide `http://localhost:3000/api/demo/dpo-consultant`.
2. Verifica daca esti redirectat in portofoliu.
3. Confirma ca vezi:
   - DPO Complet SRL;
   - Diana / email demo;
   - Apex Logistic SRL;
   - Lumen Clinic SRL;
   - Cobalt Fintech IFN.
4. Verifica daca portofoliul raspunde la intrebarea: “Ce client are prioritate azi?”

Noteaza:

- Este clar cine are risc critic?
- Este clar ce trebuie facut azi?
- Sunt duplicate in work queue?
- Scorurile par coerente?
- Exista text sau butoane confuze?

### 2. Lumen Clinic — DSAR critic

Testeaza cazul Lumen ca prioritate de zi:

1. Intra in Lumen Clinic.
2. Cauta DSAR pacient neinchis / termen depasit.
3. Verifica daca deadline-ul este clar.
4. Verifica daca se intelege urmatorul pas.

Noteaza:

- Ar intelege un DPO real de ce Lumen e primul?
- Deadline-ul arata “depasit cu X zile”?
- Exista CTA clar pentru rezolvare?
- Ce lipseste pentru DSAR real?

### 3. Apex Logistic — DPA / RoPA / Cookie

Testeaza Apex ca flow documentar GDPR:

1. Intra in Apex Logistic.
2. Verifica DPA Stripe aprobat.
3. Verifica RoPA Stripe gap.
4. Verifica cookie banner gap.
5. Verifica daca exista dovezi validate.
6. Verifica daca Apex poate trece din `review_required` in `audit_ready`.

Noteaza:

- Dashboard, portfolio, monthly report si Audit Pack spun aceeasi stare?
- Evidence ledger are titluri clare?
- Missing evidence count este coerent?
- Se intelege diferenta intre “dosar de lucru” si “audit_ready”?

### 4. Cobalt Fintech — AI OFF + reject/comment

Testeaza Cobalt ca scenariu sensibil:

1. Intra in Cobalt Fintech IFN.
2. Verifica AI OFF / client sensibil.
3. Genereaza sau gaseste magic link pentru documentul DPA payroll.
4. Deschide shared page.
5. Verifica daca pagina este white-label DPO Complet.
6. Testeaza comment.
7. Testeaza reject cu motiv.
8. Dupa reject, verifica daca nu mai poti aproba acelasi document.
9. Verifica daca reject/comment apar in dashboard/event ledger/evidence.

Noteaza:

- Patronul final intelege ce vede?
- Butoanele approve/reject/comment sunt clare?
- Cookie banner-ul este discret?
- Dupa reject, statusul este clar pentru cabinet?
- Exista dovada trasabila?

### 5. Template-uri cabinet

Verifica pagina de template-uri cabinet:

```text
/dashboard/cabinet/templates
```

Noteaza:

- DPO-ul intelege ca poate importa propriile template-uri?
- UI-ul accepta ideea de `.docx`, `.md`, `.txt`?
- Se vad versiuni / sursa / status?
- Ce ar intreba un cabinet real aici?

### 6. Raport lunar

Testeaza rapoartele de portofoliu:

```text
/portfolio/reports
```

Sau zona de rapoarte disponibila in UI.

Noteaza:

- Raportul lunar poate fi trimis clientului fara rescriere manuala?
- Include ce s-a lucrat?
- Include approve/reject/comment?
- Include ce ramane deschis?
- Include next actions?
- Este brand-uit cabinet?

### 7. Audit Pack / Export

Testeaza exporturile disponibile:

- Audit Pack client;
- export cabinet;
- orice ZIP/HTML/PDF disponibil.

Noteaza:

- Se poate descarca?
- Denumirile sunt clare?
- Manifestul e coerent?
- Apare CompliAI undeva?
- Spune fals ca este audit-ready cand nu este?
- Daca e audit_ready, toate suprafetele spun acelasi lucru?

### 8. Navigatie si UX general

Parcurge sidebar-ul si suprafetele principale:

- Portofoliu;
- Remediere clienti;
- Furnizori;
- Rapoarte;
- Dashboard client;
- Dosar;
- Magic links;
- Setari / branding daca exista.

Noteaza:

- Exista pagini prea tehnice pentru DPO?
- Exista limbaj nepotrivit pentru client-facing?
- Exista prea multe concepte simultan?
- Ce ai ascunde pentru pilot?
- Ce ai pune mai in fata?

## Intrebari la care trebuie sa raspunzi in raport

Raspunde concret, dupa test:

1. Care sunt ultimele 5 lucruri pe care Diana le poate face pentru un client DPO in aplicatie?
2. Unde sunt notate aceste lucruri?
3. Ce livrabil poate trimite clientului?
4. Ce dovada se pastreaza?
5. Cum stie Diana ce client are prioritate azi?
6. Cum urmareste aprobarile clientului?
7. Cum face raportarea lunara?
8. Cum gestioneaza RoPA / DPA / DSAR in practica?
9. Ce ramane in email/Word/Drive?
10. Ce parte ti-ar fi rusine sa o arati intr-un audit?

## Format raport final

Livreaza raportul in romana, in structura asta:

```md
# Raport test live browser — DPO Consultant

## Verdict scurt
- Demo readiness: X/10
- Pilot readiness: X/10
- Production readiness DPO cabinet: X/10
- Full cabinet migration readiness: X/10

## Ce functioneaza bine
- ...

## Bug-uri critice
| Severitate | Pagina | Pas reproducere | Ce se intampla | Ce ar trebui sa se intample |

## Incoerente de business logic
| Zona | Observatie | Impact DPO | Fix recomandat |

## Frictiuni UX pentru consultant DPO
| Zona | Ce doare | Recomandare |

## Client-facing risks
| Zona | Risc | Fix |

## Ce lipseste pentru pilot real
- ...

## Ce lipseste pentru migrare completa de cabinet
- ...

## Cele 10 intrebari de validare
1. ...

## Top 10 fixuri recomandate, in ordine
1. ...

## Decizie
A intra in pilot acum? DA/NU
Conditii minime pentru pilot:
- ...
```

## Scorare

Fii dur, dar corect:

- `10/10` = as folosi maine pe clienti reali fara rezerve.
- `8-9/10` = as accepta pilot controlat.
- `6-7/10` = demo bun, dar pilot riscant.
- `<6/10` = nu as arata unui DPO real.

Nu da scoruri optimiste daca exista contradictii intre artefacte. In compliance, inconsistenta omoara increderea.
