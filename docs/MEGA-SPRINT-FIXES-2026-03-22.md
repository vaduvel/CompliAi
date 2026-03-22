# MEGA Sprint Fixes — Live QA Consolidation

**Data:** 2026-03-22  
**Status:** propus  
**Obiectiv:** stabilizare functionala productie dupa cleanup UX/IA runtime, fara redesign nou si fara feature expansion.

---

## 1. Scope

Acest sprint unifica:

- raportul Claude din [docs/QA-REPORT-2026-03-22.md](./QA-REPORT-2026-03-22.md)
- testarea live facuta manual pe productie Vercel
- backlogul de testare reala din:
  - [public/testing-backlog-real-flows-2026-03-15.md](../public/testing-backlog-real-flows-2026-03-15.md)
  - [public/testing-yaml-drift-flow-2026-03-15.md](../public/testing-yaml-drift-flow-2026-03-15.md)

Sprintul NU acopera:

- redesign UX/IA nou
- rescriere automation layer
- transmitere facturi reale la ANAF / SPV
- activitati care pot produce efecte reale pe CUI/CIF de test

Regula operationala:

- pentru e-Factura testam doar status/mock/validare locala
- nu se ruleaza sync/transmit real cat timp CUI-ul de test este real

---

## 2. Verdict Consolidat

### Ce spune Claude

Raportul Claude confirma ca valul mare de buguri de infrastructura si productie a fost inchis:

- write-uri Vercel EROFS
- auth/register duplicate handling
- alert preferences + digest pipeline
- RBAC pe AI systems POST
- Sentry flush
- Stripe webhook bypass middleware
- policies blank page
- NIS2 org bootstrap
- preview `.data/` tolerance

Din raportul Claude raman deschise doar:

1. BUG-012 - Audit pack fara date NIS2 raw
2. BUG-020 - Shadow AI answers array fara limita
3. BUG-023 - lipsa deduplicare findings la rescan

### Ce spune testarea live

Testarea live pe productie confirma ca produsul merge pe fluxurile principale, dar a scos la suprafata probleme functionale reale pe output, intake truth si discovery accuracy:

1. export PDF rupt in productie
2. YAML autodiscovery dependent de nume exact de fisier
3. mismatch intre `vatRegistered` si justificarea `SAF-T`
4. agregare zgomotoasa / incoerenta in Response Pack
5. confirm finding -> task/doc flow doar partial vizibil
6. duplicate `h1` in dashboard loading HTML

### Concluzie

Nu mai avem o criza de infrastructura.

Avem acum un sprint de:

- output correctness
- applicability truth
- discovery accuracy
- audit completeness
- low-risk hardening

---

## 3. Matrice Unificata de Fixuri

## FX-01 - Export PDF rupt pe productie

**Prioritate:** P1  
**Sursa:** live QA  
**Simptom:** `POST /api/reports/pdf` intoarce `500` pe productie cu eroare `ENOENT ... Helvetica.afm`.  
**Impact:** userul nu poate genera principalul livrabil PDF.  
**Fisiere tinta:**

- `app/api/reports/pdf/route.ts`
- `app/api/documents/export-pdf/route.ts`
- `lib/server/pdf-generator.ts`
- `lib/server/audit-pack-bundle.ts`

**Ipoteza:** generatorul PDF foloseste asset/font path care nu este robust in bundle-ul Vercel.

**Done cand:**

- `POST /api/reports/pdf` raspunde `200` pe productie
- `Audit Pack bundle` continua sa includa PDF valid
- exista test pentru pathing/runtime serverless

---

## FX-02 - YAML autodiscovery legat strict de numele `compliscan.yaml`

**Prioritate:** P1  
**Sursa:** live QA + backlog anterior confirmat  
**Simptom:** acelasi continut YAML valid este tratat corect doar cand numele fisierului este exact `compliscan.yaml` / `compliscan.yml`.  
**Impact:** AI inventory si risk classification devin false din cauza fallback-ului pe manifest autodiscovery.

**Fisiere tinta:**

- `lib/server/compliscan-yaml.ts`
- `lib/server/manifest-autodiscovery.ts`
- `app/api/ai-systems/discover/route.ts`
- `lib/server/manifest-autodiscovery.test.ts`

**Directie recomandata:**

- recunoastere pe continut/schema, nu doar pe nume
- fallback clar si explicit daca YAML nu e valid
- test pe:
  - `compliscan.yaml`
  - `compliscan-recruitment-high-risk.yaml`
  - `compliscan-customer-support.yaml`

**Done cand:**

- YAML valid cu nume descriptiv intra pe calea YAML reala
- recrutare high-risk nu mai cade pe `Fraud detection · OpenAI`
- framework-ul include `compliscan-yaml` cand continutul e valid

---

## FX-03 - Mismatch `vatRegistered` vs justificare `SAF-T`

**Prioritate:** P1  
**Sursa:** live QA  
**Simptom:** prefill ANAF poate returna `vatRegistered: false`, dar applicability salveaza `saft` cu motiv textual de tip "firma este platitoare de TVA".  
**Impact:** onboarding-ul pierde incredere; userul vede reguli contradictorii.

**Fisiere tinta:**

- `app/api/org/profile/prefill/route.ts`
- `app/api/org/profile/route.ts`
- `lib/compliance/applicability.ts`
- posibil `lib/server/anaf-company-lookup.ts`

**Directie recomandata:**

- separa clar:
  - `requiresEfactura`
  - `vatRegistered`
  - `saft`
- nu mai folosi mesaj textual "platitoare de TVA" daca sursa reala nu confirma asta
- explicatia trebuie sa derive din acelasi semnal care produce verdictul

**Done cand:**

- applicability si prefill nu se mai bat cap in cap pe acelasi CUI
- mesajele explicative folosesc aceeasi baza factuala
- exista test pentru caz `vatRegistered=false`

---

## FX-04 - Audit Pack bundle nu include NIS2 raw state

**Prioritate:** P1  
**Sursa:** Claude BUG-012  
**Simptom:** exportul de audit nu include scoruri NIS2, incidente, vendori, board members in toate variantele.  
**Impact:** livrabil incomplet pentru audit/client.

**Fisiere tinta:**

- `app/api/exports/audit-pack/route.ts`
- `app/api/exports/audit-pack/client/route.ts`
- `app/api/exports/audit-pack/bundle/route.ts`
- `lib/server/audit-pack.ts`
- `lib/server/audit-pack.test.ts`
- `app/api/exports/audit-pack/bundle/route.test.ts`

**Observatie tehnica:**

- `route.ts` si `client/route.ts` par sa paseze `nis2State`
- `bundle/route.ts` trebuie aliniat si verificat cap-coada

**Done cand:**

- toate cele 3 variante de audit pack contin aceeasi baza NIS2 relevanta
- exista test explicit pentru bundle cu `nis2State`

---

## FX-05 - Lipsa deduplicare findings la rescan

**Prioritate:** P1  
**Sursa:** Claude BUG-023 + backlog anterior confirmat  
**Simptom:** rescannarea aceluiasi continut umfla artificial findings queue si scorul scade fals.  
**Impact:** produsul pare instabil; remedierea nu reduce zgomotul.

**Fisiere tinta:**

- `lib/compliance/llm-scan-analysis.ts`
- `lib/server/scan-workflow.ts`
- state merge / persistence path pentru scan findings
- teste de rescan relevante

**Directie recomandata:**

- dedup cross-scan pe combinatie stabila:
  - code / title / legalReference / normalized paragraph hash / framework
- pastrare provenance, nu duplicare finding operational

**Done cand:**

- rescan pe acelasi document nu creste artificial findings
- scorul si queue-ul raman stabile cand nu exista schimbare reala

---

## FX-06 - Response Pack poate afisa agregari incoerente

**Prioritate:** P2  
**Sursa:** live QA  
**Simptom:** exemple de tip `aiSystemsInventoried: 0` si `highRiskAiSystems: 14` in acelasi pachet.  
**Impact:** raportul isi pierde credibilitatea.

**Fisiere tinta:**

- `app/api/reports/response-pack/route.ts`
- `lib/compliance/response-pack.ts`

**Directie recomandata:**

- separa explicit:
  - sisteme AI inventariate declarativ
  - semnale AI detectate in findings
  - sisteme high-risk confirmate vs inferate
- nu compara metri care vin din universuri diferite in acelasi counter set

**Done cand:**

- counter-ele devin defensibile si consistent explicabile
- exista test pentru cazuri cu findings AI multe dar inventory mic

---

## FX-07 - Confirm finding -> task/doc flow incomplet expus

**Prioritate:** P2  
**Sursa:** live QA  
**Simptom:** confirmarea unui finding declanseaza document generator async, dar feedback-ul de task/result este slab sau lipseste.  
**Impact:** userul nu intelege ce s-a intamplat dupa confirmare.

**Fisiere tinta:**

- `app/api/findings/[id]/route.ts`
- `components/compliscan/resolve-page.tsx`
- `app/dashboard/resolve/[findingId]/page.tsx`
- eventual maparea task candidate / document candidate

**Directie recomandata:**

- contract clar:
  - ce persista imediat
  - ce se genereaza async
  - ce feedback UI apare imediat

**Done cand:**

- dupa confirmare, userul vede clar:
  - status nou
  - task creat sau motiv absent
  - document generat sau in curs

---

## FX-08 - Shadow AI answers array fara limita

**Prioritate:** P3  
**Sursa:** Claude BUG-020  
**Simptom:** endpointul accepta payload foarte mare fara limita pe answers.  
**Impact:** abuz / performanta / cost.

**Fisiere tinta:**

- `app/api/shadow-ai/route.ts`
- testele rutei

**Done cand:**

- requestul respinge payload-uri peste prag rezonabil
- exista test pentru overflow

---

## FX-09 - Rate limiting nu acopera GET-urile sensibile

**Prioritate:** P3  
**Sursa:** Claude BUG-021  
**Simptom:** unele GET-uri sensibile nu sunt acoperite de middleware-ul de limitare.  
**Impact:** low, dar merita inchis dupa P1/P2.

**Fisiere tinta:**

- middleware de rate limiting
- `app/api/inspector/route.ts`
- `app/api/health-check/route.ts`

---

## FX-10 - Duplicate `h1` in dashboard loading HTML

**Prioritate:** P3  
**Sursa:** live QA  
**Simptom:** skeleton-ul si pagina finala produc doua `h1` in HTML-ul route-ului.  
**Impact:** semantica / accesibilitate / SEO low-level.

**Fisiere tinta:**

- `app/dashboard/loading.tsx`
- `components/compliscan/dashboard-segment-skeleton.tsx`

---

## 4. Ce este confirmat de ambele surse

### Confirmat direct sau indirect de Claude + live/backlog

- audit/export mai are lipsuri reale
- scan/discovery accuracy mai are probleme reale
- low-risk hardening inca are puncte ramase

### Confirmat de live QA + backlog anterior

- YAML filename bug este real, repetabil si vechi
- rescan pollution / dedup lipsa este reala

### Confirmat doar de live QA acum

- PDF export Vercel runtime failure
- VAT / SAF-T mismatch
- Response Pack metric inconsistency
- finding confirm visibility gap
- duplicate `h1`

---

## 5. Ordinea de executie recomandata

## Workstream 1 - Output blockers

1. FX-01 PDF export
2. FX-04 Audit Pack NIS2 raw

### Motiv

Acestea blocheaza exact livrabilele promise userului.

---

## Workstream 2 - Intake truth

1. FX-03 VAT / SAF-T mismatch

### Motiv

Daca onboarding-ul nu este coerent, toata increderea ulterioara scade.

---

## Workstream 3 - Scan / discovery accuracy

1. FX-02 YAML autodiscovery
2. FX-05 finding dedup
3. FX-06 Response Pack counters
4. FX-07 confirm -> task/doc visibility

### Motiv

Aici sta adevarul operational al produsului.

---

## Workstream 4 - Hardening low-risk

1. FX-08 Shadow AI answers limit
2. FX-09 GET rate limit sweep
3. FX-10 duplicate `h1`

---

## 6. Propunere de executie

### Sprint A - P1 blockers si truth

- FX-01
- FX-03
- FX-04
- FX-05

### Sprint B - accuracy si trust

- FX-02
- FX-06
- FX-07

### Sprint C - hardening scurt

- FX-08
- FX-09
- FX-10

---

## 7. Validare obligatorie

Pentru fiecare sprint:

- `npm test`
- `npm run lint`
- `npm run build`

### Smoke live sigur

Se reruleaza strict fara ANAF sync/transmit:

- auth + login
- `POST /api/org/profile/prefill`
- `POST /api/org/profile`
- `POST /api/scan/extract`
- `POST /api/scan/[id]/analyze`
- `POST /api/ai-systems/discover`
  - cu `compliscan.yaml`
  - cu YAML valid cu nume necanonic
- `GET /api/reports/response-pack`
- `POST /api/reports/pdf`
- evidence upload + auth guard
- `GET /api/integrations/efactura/status`
- `POST /api/efactura/validate` doar cu XML dummy

---

## 8. Definition of Done

Sprintul este inchis doar daca:

1. PDF export functioneaza pe productie
2. YAML valid nu mai depinde strict de numele `compliscan.yaml`
3. applicability nu mai produce mesaje contradictorii fata de prefill
4. rescan-ul nu mai umfla artificial finding queue
5. audit pack bundle include NIS2 raw relevant
6. response pack are counters coerenti
7. confirmarea finding-urilor are feedback clar pentru user
8. low-risk hardening este inchis
9. toate validarile automate trec
10. smoke live trece fara actiuni reale in ANAF

---

## 9. Recomandare finala

Da, merita un mega sprint de fixes.

Nu este un sprint de produs nou, ci un sprint de:

- inchidere output blockers
- aliniere truth layer
- reducere false positives / duplicate noise
- intarire increderii in livrabile

Recomandare de start:

1. deschidem branch nou din `main`
2. executam Sprint A
3. rerulam smoke live sigur
4. abia apoi continuam cu Sprint B

