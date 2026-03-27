# CompliAI — Final User Matrix Bible

## Ce este documentul ăsta

Acesta este documentul final, în format de matrice, pentru cei 3 useri principali ai produsului.

Este făcut ca să poată fi folosit direct de:
- Product
- UX
- UI
- Engineering
- QA
- Content
- Founder
- Claude / Codex

Acesta este documentul care trebuie să răspundă 1:1 la:
- ce face fiecare user
- în ce ordine
- pe ce ecran
- ce vede
- ce citește
- ce apasă
- ce face sistemul
- unde ajunge după
- ce risc există dacă ecranul este greșit

---

# 1. Regula absolută a produsului

## Un finding = un cockpit = un singur loc de execuție

După ce userul intră într-un finding, trebuie să poată, din același cockpit:
- să înțeleagă problema
- să confirme cazul
- să execute rezolvarea
- să genereze / completeze / încarce
- să valideze dovada unde este necesar
- să confirme
- să trimită la Dosar
- să lase cazul în Monitorizare

Dacă userul trebuie să se plimbe arbitrar între mai multe centre pentru același caz, produsul este greșit.

---

# 2. Userii țintă

## U1 — Mihai / Proprietar IMM / Solo
Vrea claritate, primul pas, dovadă și liniște.

## U2 — Diana / Consultant / Partner
Vrea control pe mai mulți clienți, prioritizare, execuție, handoff.

## U3 — Radu / Compliance intern
Vrea adevăr operațional, audit trail, disciplină, revalidare și control.

---

# 3. IA principală

## Primară
- Acasă
- Scanează
- De rezolvat
- Dosar
- Setări

## Secundară / contextuală / specialist
- NIS2
- DSAR
- Fiscal
- Vendor Review
- DORA
- Whistleblowing
- Audit Log
- Trust / exports avansate
- Agents
- sisteme AI
- alte zone de profunzime

---

# 4. Matrice completă — U1 Mihai / Proprietar IMM / Solo

## 4.1 Awareness / Intrare

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Awareness | Ad / Search / Referral | Să înțeleagă dacă merită să intre | mesaj / reclamă / link | promisiunea de bază | click pe reclamă / link | deschide landing sau pricing | `/` sau `/pricing` | dacă mesajul e vag, userul nu intră |
| Consideration | Landing `/` | Să înțeleagă ce face produsul | hero, 3 pași, rezultate, CTA | ce face produsul, traseul până la dovadă | `Începe gratuit`, `Vezi demo`, `Vezi pricing` | îl duce în auth sau pricing | `/login` / `/register` / `/pricing` | dacă pagina spune 5 povești, userul pleacă |
| Consideration | Pricing `/pricing` | Să înțeleagă planul potrivit | 3 planuri | Gratuit = diagnostic, Pro = operare, Partner = multi-client | `Începe gratuit` / `Pornește Pro` | îl duce în auth | `/login` / `/register` | dacă pricing-ul vinde doar feature-uri, nu decide |

---

## 4.2 Auth / Login / Register

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Auth | `/login` / `/register` | Să intre rapid | formular simplu | minim necesar | `Creează cont` / `Intră` | creează sesiune / autentifică | `/onboarding` | dacă auth e complicat, abandonează |

---

## 4.3 Onboarding — wizard observabil

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Onboarding 1 | `/onboarding` Pas 1 | Să aleagă modul potrivit | 3 opțiuni de rol, progress rail | diferența dintre roluri | `Continuă` după ce alege `Proprietar / Manager` | salvează user mode | Pasul 2 în onboarding | dacă opțiunile sunt egale și confuze, alege greșit sau abandonează |
| Onboarding 2 | `/onboarding` Pas 2 | Să dea datele firmei | câmpuri CUI, website, sector, mărime | de ce sunt necesare | `Continuă` / `Verifică` | normalizează CUI, website, profilează firma | Pasul 3 sau clarificări | dacă cerem prea mult sau nu explicăm utilitatea, simte că muncește gratis |
| Onboarding 3 | `/onboarding` Pas 3 | Să răspundă la întrebări care chiar schimbă findings-ul | întrebări clare, pas observabil | „Mai avem X întrebări” | `Continuă` | actualizează applicability, findings, next action | Pasul 4 | dacă întrebările apar prin card growth și nu ca pas nou, userul nu vede că are încă muncă |
| Onboarding 4 | `/onboarding` Pas 4 | Să înțeleagă că sistemul verifică | loading clar, progres, semnale curate | că sistemul lucrează pe datele firmei | nimic sau `Continuă` dacă există | construiește findings și snapshot | Pasul 5 | dacă nu pare că se întâmplă ceva real, onboarding-ul pare fals |
| Onboarding 5 | `/onboarding` Pas 5 | Să primească primul tablou util | ce se aplică, ce am găsit, ce faci acum | aplicabilitate și primul caz | `Deschide primul caz` / `Mergi la De rezolvat` | îl trimite în flow-ul real | `/dashboard/resolve` | dacă există ecran duplicat gen `/onboarding/finish`, creează fricțiune inutilă |

---

## 4.4 Home

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Orientation | `/dashboard` | Să știe unde este și ce face acum | readiness, ce se aplică, ce am găsit, ce faci acum, KPI, 3 evenimente | starea firmei și următorul pas | `Deschide cazul` / `De rezolvat` | îl duce în inbox sau caz | `/dashboard/resolve` sau `/dashboard/resolve/[findingId]` | dacă Home e mall de tool-uri, userul nu știe de unde să înceapă |

---

## 4.5 Resolve list

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Triage | `/dashboard/resolve` | Să vadă ce e prioritar | listă de findings, severitate, status, what to do now | care e primul caz și cât e de grav | click pe row / CTA | deschide cockpitul | `/dashboard/resolve/[findingId]` | dacă lista devine pseudo-cockpit, îl încarcă și îl rătăcește |

---

## 4.6 Cockpit — finding documentar

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Confirm risk | `/dashboard/resolve/[findingId]` | Să confirme că finding-ul este real | titlu, severitate, mini-stepper, „Acum faci asta” | problema și ce urmează | `Confirmă riscul și deschide generarea` | finding -> `confirmed`, deschide imediat zona documentară inline sub hero | același cockpit | dacă contextul e prea lung, nu ajunge la acțiune |
| Prepare resolution | același cockpit | Să genereze rezolvarea | zonă inline de generare, sub hero | ce document se generează și ce câmpuri trebuie completate | `Generează draftul` | produce draftul | același cockpit | dacă generatorul îl scoate din coloana principală, se rupe spine-ul |
| Review draft | același cockpit | Să vadă documentul | preview document | conținutul draftului | `Continuă la verificare` | trece la validare | același cockpit | dacă nu există preview, nu are încredere |
| Validate evidence | același cockpit | Să știe dacă dovada e acceptabilă | checks pass/fail, status validare | ce trece și ce lipsește | `Re-scannează` / `Regenerează` / `Confirmă și salvează` | marchează dovada ca acceptabilă / cere corecții | același cockpit | dacă poate salva fără validate, produsul minte |
| Resolve risk | același cockpit | Să închidă cazul cu documentul confirmat | CTA clar după validare | că documentul confirmat poate fi folosit acum pentru închiderea riscului | `Rezolvă riscul cu acest document` | finding -> `resolved`, pregătește handoff către Dosar | același cockpit | dacă lipsește pasul ăsta, userul nu înțelege dacă documentul chiar rezolvă cazul |
| Send to dossier | același cockpit | Să finalizeze | banner de succes + handoff clar | că dovada trebuie trimisă la Dosar înainte de monitoring | `Adaugă documentul la Dosar` / `Deschide Dosarul` | finding -> `under_monitoring`, dovada legată | `/dashboard/resolve` sau `/dashboard/dosar` | dacă success-ul e neclar, userul nu știe dacă a terminat |

---

## 4.7 Cockpit — finding operațional

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Confirm risk | cockpit | Să confirme cazul | titlu, status, „Acum faci asta” | ce control trebuie aplicat | `Confirm și rezolv` | activează execuția | același cockpit | dacă nu există confirmare clară, starea rămâne ambiguă |
| Execute | cockpit | Să facă acțiunea | instrucțiune scurtă, evidence card, upload / note | ce trebuie făcut și ce dovadă se cere | `Încarcă dovada` / scrie notă / `Continuă` | salvează dovada temporar | același cockpit | dacă nu se cere dovadă minimă, închiderea e falsă |
| Validate completeness | cockpit | Să știe că dovada e suficientă | status complet / incomplet | ce mai lipsește | `Confirmă și salvează` | acceptă dovada | același cockpit | dacă nu există gating, cazurile se închid prea ușor |
| Send to dossier | cockpit | Să termine | success strip | că dovada a intrat la Dosar și cazul e monitorizat | `Următorul caz` / `Deschide Dosarul` | actualizează Dosarul și monitoring | `/dashboard/resolve` sau `/dashboard/dosar` | dacă Dosarul nu reflectă adevărul, userul pierde încrederea |

---

## 4.8 Cockpit — finding specialist / extern

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Confirm risk | cockpit | Să pornească cazul | titlu, mini-stepper, „Acum faci asta” | de ce trebuie acțiune externă / specialist | `Confirm și continuă` | pregătește handoff sau inline flow | același cockpit sau surface controlată | dacă nu e clar de ce pleacă, pare produs rupt |
| Execute controlled action | drawer / side sheet / controlled handoff | Să facă acțiunea | mini-wizard sau context handoff | ce trebuie completat și unde se revine | `Continuă`, `Deschide flow-ul`, `Revino în caz` | păstrează `findingId`, context și return state | revine în cockpit | dacă pierde findingId sau return path, cazul se rupe |
| Attach evidence | cockpit | Să aducă dovada înapoi în caz | evidence block, upload, note | ce dovadă trebuie atașată | `Atașează dovada`, `Confirmă` | leagă dovada de finding | același cockpit | dacă dovada rămâne în alt modul, Dosarul nu are adevărul |
| Send to dossier | cockpit | Să închidă | success strip | că totul a fost legat corect | `Deschide Dosarul` / `Următorul caz` | monitoring activ | `/dashboard/dosar` sau `/dashboard/resolve` | dacă specialist module devin produse paralele, spine-ul moare |

---

## 4.9 Dosar

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Overview | `/dashboard/dosar` | Să știe dacă pachetul stă în picioare | status pachet, 3 KPI, blockers, 2 CTA | dacă e gata, ce îl blochează, ce are deja | `Rezolvă gap-urile` / `Deschide Audit Pack` | îl duce la cazuri sau la pack | `/dashboard/resolve` sau pack view | dacă overview-ul e reports dump, userul nu mai înțelege nimic |
| Evidence & gaps | Dosar subtab | Să vadă ce are și ce lipsește | registru dovezi, gap-uri, finding -> dovadă cerută | ce e valid și ce lipsește | `Deschide cazul` / `Vezi dovada` | îl duce la finding sau la asset | `/dashboard/resolve/[findingId]` | dacă nu leagă gap-ul de caz, nu poate lucra cap-coadă |
| Packs & export | Dosar subtab | Să exporte ce e gata | pachete, exporturi, blocaje | ce poate trimite și ce nu | `Exportă`, `Deschide pack-ul` | generează / descarcă pachetul | export flow | dacă exportul e promovat prea devreme, userul sare peste rezolvare |
| Traceability & audit | Dosar subtab | Să intre în profunzime doar când are nevoie | timeline, validări, matrix | detalii de audit și istoric | `Vezi detalii` | deschide profunzimea | intern în Dosar | dacă zona asta infectează overview-ul, Dosarul devine monstru |

---

## 4.10 Monitoring și reopen

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Monitoring signal | Home / alerts / Dosar | Să afle ce s-a schimbat | eveniment scurt, motiv, CTA | ce s-a verificat / reaprins | `Deschide cazul` | îl duce în același finding | `/dashboard/resolve/[findingId]` | dacă monitoring-ul nu trimite înapoi în caz, devine noise |
| Reopen | cockpit reaprins | Să înțeleagă de ce cazul revine | explicare scurtă, stepper actualizat | ce s-a schimbat și ce trebuie reverificat | `Reconfirmă` / `Actualizează dovada` | reentry în flow de revalidare | același cockpit | dacă redeschiderea nu e clară, pare că produsul se contrazice |
| Revalidation | cockpit | Să reverifice și să reconfirme | dovadă anterioară, next review, verificări noi | ce rămâne valabil și ce trebuie schimbat | `Confirmă revalidarea` / `Înlocuiește dovada` | actualizează Dosarul și monitoring | același cockpit | dacă revalidarea nu are traseu clar, cazul îmbătrânește fără control |

---

# 5. Matrice completă — U2 Diana / Consultant / Partner

## 5.1 Awareness / Intrare

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Awareness | Ad / Referral / LinkedIn / Demo | Să înțeleagă dacă produsul îi crește serviciul | mesaj orientat pe portofoliu și livrare | că poate gestiona mai mulți clienți și livra pachete | click pe link | deschide landing / pricing | `/` sau `/pricing` | dacă mesajul e prea solo/IMM-only, nu se vede în el |
| Consideration | Landing / Pricing | Să înțeleagă valoarea Partner | same core promise + angle de multi-client | Partner = portofoliu, urgențe, handoff | `Începe gratuit` / `Contact Partner` | îl duce în auth | `/login` / `/register` | dacă planul Partner nu e clar, nu vede valoarea B2B |

---

## 5.2 Auth și onboarding Partner

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Auth | `/login` / `/register` | Să intre | formular simplu | minimul necesar | `Creează cont` / `Intră` | sesiune activă | `/onboarding` | dacă auth e greu, abandonează |
| Onboarding 1 | `/onboarding` | Să aleagă modul Partner | opțiunile de rol | diferențele dintre moduri | `Continuă` după `Consultant / Partner` | salvează user mode partner | pasul următor | dacă modul nu e clar, poate intra pe flow greșit |
| Onboarding 2 | `/onboarding` | Să își profileze propriul workspace | date firmă / cabinet / identitate profesională | de ce se cer aceste date | `Continuă` | pregătește workspace-ul de portofoliu | portfolio setup | dacă onboardingul îl tratează ca pe un user solo, contextul e greșit |
| First destination | portfolio entry | Să ajungă în contextul potrivit | portofoliu gol sau CTA de adăugare client | ce urmează să facă | `Adaugă client` | creează client workspace | portfolio / client setup | dacă îl duci în dashboard solo, se rupe logica lui de lucru |

---

## 5.3 Portfolio / client intake

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Portfolio overview | `/portfolio` | Să vadă portofoliul și urgențele | listă clienți / empty state / urgencies | care client arde și unde trebuie să intre | `Adaugă client` / click pe client | creează client nou sau intră în client workspace | client setup sau workspace client | dacă portofoliul nu prioritizează, pierde timp pe clientul greșit |
| Add client | partner intake flow | Să creeze un client nou | CUI, website, date minime client | că va crea workspace separat | `Continuă` | profilează clientul și generează findings inițiale | workspace client | dacă nu e clar că intră într-un workspace separat, pierde contextul |

---

## 5.4 Workspace client — Home / Resolve / Cockpit

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Client Home | client `/dashboard` | Să vadă situația clientului | snapshot client, next action, status | ce se aplică clientului și ce arde | `Deschide cazul` / `De rezolvat` | intră în triage client | `/dashboard/resolve` client-context | dacă nu e clar pe ce client lucrează, riscă să acționeze în context greșit |
| Client Resolve | client `/dashboard/resolve` | Să aleagă cazul clientului | findings ale clientului | ce finding e prioritar | click pe finding | deschide cockpitul clientului | `/dashboard/resolve/[findingId]` | dacă contextul clientului nu e persistent, tot flow-ul devine periculos |
| Client Cockpit | client cockpit | Să execute în numele clientului | același Smart Resolve Stack | cazul, pasul curent, dovada necesară | `Confirm și rezolv`, `Generează`, `Confirmă și salvează` etc. | actualizează findingul clientului, Dosarul clientului, monitoring client | același cockpit / client Dosar | dacă flow-ul pentru consultant e diferit sau mai prost, nu poate scala |

---

## 5.5 Dosar și livrare către client

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Client Dossier | client `/dashboard/dosar` | Să știe ce poate livra clientului | status pachet, blockers, dovezi, exporturi | dacă poate trimite ceva sau mai are de rezolvat | `Deschide Audit Pack`, `Exportă`, `Rezolvă gap-urile` | exportă sau îl retrimite în lucru | pack flow sau `/dashboard/resolve` | dacă Dosarul nu e clar, handoff-ul către client arată amator |
| Portfolio reporting | `/portfolio/reports` sau contextual | Să livreze status per client | rapoarte și pachete pe client | ce are fiecare client și ce lipsește | `Generează raport` / `Descarcă` | generează livrabil | export flow | dacă rapoartele nu au consistență, nu creează valoare profesională |

---

## 5.6 Monitoring și reentry pe portofoliu

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Portfolio alerts | `/portfolio/alerts` sau overview | Să știe ce client cere atenție acum | alerte și evenimente per client | cine are drift / reopen / review | click pe client / click pe caz | duce în client context și apoi în finding | client `/dashboard/resolve/[findingId]` | dacă monitoring-ul nu e agregat bine, partenerul nu poate triage eficient |
| Reopen client case | client cockpit | Să reînchidă cazul clientului | aceeași logică de revalidation | de ce s-a reaprins | `Reconfirmă`, `Actualizează dovada` | update Dosar și monitoring client | același cockpit | dacă reopen-ul nu păstrează client context, consultantul pierde urma |

---

# 6. Matrice completă — U3 Radu / Compliance intern

## 6.1 Awareness / Entry

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Awareness | Demo / sales / pricing / referral | Să vadă dacă produsul are coloană vertebrală reală | messaging orientat pe control, dovadă, audit | că produsul nu e doar scanner / generator | `Vezi demo`, `Începe trial`, `Contactează-ne` | intră în trial sau demo | auth / demo flow | dacă produsul pare superficial, un compliance lead nu intră |

---

## 6.2 Auth și onboarding Compliance

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Auth | `/login` / `/register` | Să intre | formular simplu | auth minim | `Intră` / `Creează cont` | sesiune activă | `/onboarding` | dacă auth e complicat, scade încrederea |
| Onboarding 1 | `/onboarding` | Să aleagă modul corect | roluri | diferențele | `Continuă` după `Responsabil conformitate` | salvează user mode compliance | pas următor | dacă modul nu schimbă experiența, onboarding-ul minte |
| Onboarding 2 | `/onboarding` | Să profileze compania real | CUI, website, mărime, sector, clarificări | de ce se cer și ce afectează | `Continuă` | profilează organizația și stackul de obligații | pas următor | dacă întrebările nu sunt disciplinate, onboarding-ul devine haos |
| Onboarding 3+ | `/onboarding` | Să răspundă clarificărilor reale | wizard observabil pe pași | că răspunsurile schimbă findings și documente | `Continuă` | actualizează applicability și findings | verificare / snapshot | dacă clarificările apar pe ascuns, pare produs neglijent |
| Snapshot | final onboarding | Să vadă starea inițială utilă | applicability, findings, next action | ce i se aplică și primul caz | `Deschide primul caz` / `Mergi la De rezolvat` | îl trimite în spine | `/dashboard/resolve` | dacă snapshot-ul este generic, nu vede valoare reală |

---

## 6.3 Home / triage

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Home | `/dashboard` | Să vadă starea și punctele sensibile | readiness, findings, KPI, feed scurt | ce e mai grav și ce trebuie acționat | `Deschide cazul`, `De rezolvat`, eventual `Dosar` | intră în caz sau triage | `/dashboard/resolve` / cockpit / Dosar | dacă Home este prea lat, consumă atenția și nu ajută triage-ul |

---

## 6.4 Resolve și cockpit Compliance

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Resolve | `/dashboard/resolve` | Să lucreze sistematic pe cazuri | finding queue curată | severitate, status, what to do now | click pe finding / filtre | deschide cockpitul | cockpit | dacă lista e prea descriptivă, încetinește execuția |
| Cockpit | `/dashboard/resolve/[findingId]` | Să execute cu adevăr și urmă | Smart Resolve Stack + context secundar | problema, pasul curent, close condition | `Confirm și rezolv`, `Generează`, `Verifică dovada`, `Confirmă și salvează` | persistă stări, leagă dovada, actualizează Dosarul | același cockpit / Dosar | dacă contextul greu stă deasupra acțiunii, încetinește execuția |
| Specialist depth | contextual | Să aibă profunzime fără să piardă spine-ul | accordions, secondary panels, controlled handoff | legal context, traceability, mappings | `Vezi detalii`, `Deschide flow specialist` | deschide profunzimea controlat | contextual / revine în cockpit | dacă specialist depth devine centru principal, spine-ul moare |

---

## 6.5 Dossier / audit / monitoring

| Stage | Screen / Route | User Goal | Ce vede | Ce citește | Ce apasă | System response | Next route | Failure risk if wrong |
|---|---|---|---|---|---|---|---|---|
| Dossier overview | `/dashboard/dosar` | Să știe dacă pachetul e credibil | status pachet, KPI, blockers, CTA | dacă poate exporta sau ce îl blochează | `Rezolvă gap-urile`, `Deschide Audit Pack` | îl retrimite în lucru sau deschide pachetul | `/dashboard/resolve` / pack view | dacă overview-ul e prea greu, nu mai are rol de control |
| Evidence & gaps | Dosar subtab | Să vadă adevărul pe dovezi | evidence register, missing proof, statusuri | ce e valid, ce e incomplet, ce trebuie revizuit | `Deschide cazul`, `Vezi dovada` | merge la caz sau asset | cockpit / evidence detail | dacă lipsurile nu sunt legate de finding, nu pot fi rezolvate disciplinat |
| Traceability & audit | Dosar subtab | Să intre în profunzime pentru audit | timeline, baseline, validations, matrix | istoric și mapări | `Vezi detalii`, `Open timeline`, `Confirmă grupul` | păstrează profunzimea în Dosar | intern | dacă zona asta e expusă sus pentru toți, produsul devine nefolosibil |
| Monitoring | alerts / feed / Dosar | Să controleze reaprinderile și review-urile | drift, reopened cases, review dates | ce s-a schimbat și unde trebuie să reintre | `Deschide cazul` | îl trimite în cockpitul exact | cockpit | dacă monitoring-ul nu e viu, cazurile moarte rămân moarte |
| Revalidation / reopen | cockpit reaprins | Să reconfirme sau să înlocuiască dovada | de ce s-a reaprins, dovada veche, noul pas | ce trebuie revizuit | `Reconfirmă`, `Înlocuiește`, `Actualizează review` | actualizează monitoring și Dosarul | același cockpit | dacă re-open-ul nu e disciplinat, audit trail-ul devine fragil |

---

# 7. Screen responsibility matrix

| Screen | Rol principal | Ce trebuie să facă | Ce nu are voie să facă |
|---|---|---|---|
| Landing | vinde intrarea | explică produsul și CTA | să fie strategie, pricing, personas și panică toate odată |
| Pricing | clarifică planul | diagnostic vs operare vs partner | să fie feature dump |
| Login/Register | lasă userul să intre | auth rapid | să ceară mult context înainte de valoare |
| Onboarding | profilează și pregătește snapshotul | wizard observabil | să ascundă pași noi |
| Home | orientează | stare + next action | să fie tool mall |
| Scanează | primește surse și pornește analiza | intake | să fie pseudo-cockpit |
| De rezolvat | prioritizează și deschide cazul | inbox | să rezolve finding-uri de unul singur |
| Cockpit | execută cazul | confirmare -> execuție -> validare -> Dosar -> monitoring | să expulzeze userul arbitrar |
| Dosar | arată dovada și exportul | proof + blockers + export + audit trail | să fie reports dump sau cockpit 2 |
| Monitoring | ține cazul viu | alertă + reentry | să fie log tehnic fără next step |

---

# 8. Obligatory system behaviors

| Situație | Ce trebuie să facă sistemul |
|---|---|
| User termină onboardingul | îl trimite direct în flow-ul real, nu într-un finish duplicat |
| Apar întrebări noi în onboarding | le marchează ca pas / sub-pas nou observabil |
| Finding documentar | oferă generator + validate evidence |
| Finding operațional | cere evidence note / upload / attestation |
| Finding specialist | folosește inline / drawer / handoff controlat cu context |
| Dovada este validabilă | nu permite `save evidence` fără validate |
| Cazul se închide | trimite dovada la Dosar și activează monitoring |
| Review date / drift / schimbare | reaprinde cazul și trimite userul înapoi în același cockpit |

---

# 9. Anti-pattern matrix

| Anti-pattern | De ce este greșit |
|---|---|
| Home plin de tool-uri și benchmark-uri | userul nu mai știe care e next action |
| Scan cu 5 moduri egale și multiple warnings | intake-ul devine haos |
| Resolve list care face și execuție | se dublează cockpitul |
| Cockpit cu 3 panouri grele și mult context | acțiunea moare sub informație |
| Draft -> save evidence fără validate | produsul minte despre adevărul dovezii |
| Dosar = reports dump | userul nu mai înțelege ce are și ce lipsește |
| Monitoring fără reentry în caz | devine noise |
| Onboarding cu întrebări care apar pe ascuns | userul nu percepe progresul și se pierde |

---

# 10. Final operating sentence

Pentru toți cei 3 useri, aplicația trebuie să curgă așa:

**aud de produs -> intru -> sistemul îmi profilează contextul -> văd ce se aplică și ce s-a găsit -> intru pe cazul corect -> îl închid în același cockpit -> dovada intră la Dosar -> cazul rămâne monitorizat -> dacă se reaprinde, revin exact acolo unde trebuie**

Asta este matricea finală.
