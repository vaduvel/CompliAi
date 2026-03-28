# CompliScan — Experience Blueprint

**Data:** 2026-03-25  
**Scop:** blueprint executabil al experientei de produs.  
**Format:**  
- ce vede userul  
- ce face sistemul  
- ce trebuie sa afisam in UI

---

# 1. Landing Page

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Hero clar, promisiune simpla | Nu ruleaza nimic inca | Headline: „Afli ce ti se aplica, rezolvi ce lipseste si pastrezi dovada.” |
| CTA principal | Pregateste intrarea in onboarding | CTA: „Incepe gratuit” + subtext clar: „Pornim din CUI, website si semnalele tale operationale.” |
| 3 pasi simpli | Explica traseul complet | 1. Introduci CUI / website 2. Vezi ce ti se aplica 3. Rezolvi si pastrezi dovada |
| Dovada de output | Arata rezultatul final, nu doar feature-uri | Preview: Audit Pack, Trust Center, dovada salvata, rapoarte |
| Segmentare buyer | Pregateste intrarea potrivita | Blocuri: Pentru IMM / Pentru consultant / Pentru compliance intern |

---

# 2. Onboarding

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Pas 1: cine esti | Colecteaza minimul necesar | CUI, website, mod de lucru: solo / consultant / intern |
| Pas 2: Compli verifica | Ruleaza prefill si verificari automate | Mesaje live: „Verificam datele firmei”, „Analizam website-ul”, „Cautam semnale”, „Pregatim snapshot-ul” |
| Pas 3: rezultat initial | Construieste primul snapshot | „Asta ti se aplica”, „Asta am gasit deja”, „Asta facem acum” |
| Save and return | Salveaza progresul | Buton si mesaj: „Poti continua mai tarziu” |

---

# 3. Primul Snapshot

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Ce ti se aplica | Mapeaza framework-uri aplicabile | Carduri simple: GDPR / eFactura / NIS2: da-nu-posibil / AI Act: da-nu-posibil |
| Ce am gasit deja | Agrega rezultate din CUI, website, semnale | Checklist vizual: politica, site, SPV, furnizori, zone de completat |
| Top 3 actiuni | Prioritizeaza urmatorul pas | 1 actiune principala + 2 secundare, cu timp estimat si rezultat estimat |

---

# 4. Prima Rezolvare

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Problema clara | Leaga finding-ul de rezolvare | Titlu simplu + de ce conteaza + ce obtii daca rezolvi |
| CTA contextual | Deschide generatorul / flow-ul corect | Buton: „Genereaza acum” / „Adauga dovada” / „Continua” |
| Generator preselectat | Completeaza contextul task-ului | Template deja selectat, date deja preumplute unde este sigur |
| Confirmare explicita | Blocheaza inchiderea automata | Checkbox-uri de confirmare + CTA final: „Confirm si salvez dovada” |

---

# 5. Momentul de Dovada

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Task rezolvat | Salveaza artifactul si actualizeaza snapshot-ul | Mesaj principal: „Dovada a fost salvata la dosar.” |
| Primul artifact | Inregistreaza documentul / dovada | Link direct spre Vault / Artifact / Timeline |
| Snapshot actualizat | Recalculeaza starea | „Snapshot-ul tau a fost actualizat” + eventual scor / progres |

---

# 6. Home dupa prima sesiune

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Ce ai acumulat | Numara dovezi, rapoarte, luni monitorizate | Card: dovezi, rapoarte, furnizori monitorizati, luni, ultimul audit pack |
| Ce e urgent acum | Prioritizeaza lucrurile deschise | Top 3 actiuni urgente |
| Ce am verificat pentru tine | Afiseaza activitate utila | Feed: SPV, furnizori, site, NIS2, changes |

---

# 7. Faza 2 — Continuitate

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Activitate recenta utila | Consuma cron-uri, semnale, verificari | „Am verificat pentru tine...”, „Am detectat...”, „Ti-am pregatit...” |
| Eveniment extern relevant | Leaga piata / autoritatea de workspace-ul userului | 1 eveniment real + cum stai tu fata de el + 1 CTA |
| Notificari utile | Filtreaza zgomotul | Notificari doar pentru schimbari relevante, deadline-uri, respingeri, rights requests |

---

# 8. Layerul Agentic

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Compli lucreaza pentru tine | Ruleaza agenti si monitorizari | Nu jargon tehnic. Doar: „Am verificat”, „Am comparat”, „Am gasit”, „Am salvat” |
| Status de supraveghere | Arata ca sistemul e activ | Bloc simplu: ce monitorizam si cand am verificat ultima data |

---

# 9. Persona A — IMM owner

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Claritate, nu jargon | Ascunde complexitatea | Limbaj simplu, top 3 actiuni, quick wins |
| Rezolvare rapida | Ofera flow direct | CTA clar + timp estimat + dovada salvata |
| Protectie continua | Monitorizeaza schimbari | Mesaje: „Iti tinem spatele”, „Te anuntam cand apare ceva nou” |

---

# 10. Persona B — Consultant / contabil

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Portfolio cu urgenta | Agrega pe clienti | Urgency queue, top firme, scoruri, trends |
| Context pe clientul curent | Pastreaza workspace context | Banner persistent: „Lucrezi pentru: Firma X” |
| Batch safe actions | Pregateste drafturi sigure | Batch generate + confirmare individuala per firma |

---

# 11. Persona C — Compliance intern / DPO / CTO

| Ce vede userul | Ce face sistemul | Ce trebuie sa afisam in UI |
|---|---|---|
| Framework overview | Grupeaza pe obligatii | GDPR / NIS2 / AI Act / eFactura |
| Evidence state | Arata ce exista si ce lipseste | Artifact timeline, evidence state, trust/export |
| Trasabilitate | Pastreaza istoricul | Cine a aprobat, cand, ce s-a schimbat |

---

# 12. Ce NU trebuie sa facem

| Ce nu trebuie sa vada userul | Ce nu trebuie sa faca sistemul | Ce trebuie evitat in UI |
|---|---|---|
| Task dump gigant la prima sesiune | Sa arunce toate problemele simultan | Liste lungi, jargon, 10 concepte noi odata |
| CTA vag | Sa lase userul sa ghiceasca pasul urmator | „Mergi in Generator” fara link direct |
| Log tehnic rece | Sa afiseze cron-uri brute | „job completed”, „sync run” |
| Inchidere automata falsa | Sa marcheze rezolvat fara confirmare | lipsa checkboxes, lipsa dovada |

---

# 13. Ce trebuie sa spuna produsul in primele 5 secunde

## Landing
„Afli ce ti se aplica, rezolvi ce lipseste si pastrezi dovada.”

## Onboarding
„Las-o pe Compli sa verifice pentru tine.”

## Snapshot
„Asta ti se aplica. Asta am gasit. Asta faci acum.”

## Prima rezolvare
„Nu doar iti arat problema. Te duc direct sa o inchizi.”

## Dovada
„Tot ce rezolvi ramane la dosar.”

## Continuitate
„Si cand nu esti aici, noi verificam pentru tine.”

---

# 14. Concluzie

CompliScan trebuie sa fie citit ca un flux coerent:

**promisiune -> verificare -> snapshot -> rezolvare -> dovada -> monitorizare -> infrastructura**

Nu ca o colectie de module.

Daca fiecare ecran spune clar:
- ce vede userul
- ce a facut sistemul
- ce trebuie sa faca userul acum

atunci produsul se citeste repede, chiar daca in spate e complex.
