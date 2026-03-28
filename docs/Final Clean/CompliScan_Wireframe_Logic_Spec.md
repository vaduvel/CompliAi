# CompliScan — Wireframe Logic Spec

**Data:** 2026-03-25  
**Scop:** specificatie de logica wireframe, ecran cu ecran.  
**Nu este design vizual.**  
Este ordinea corecta a blocurilor, ierarhia vizuala si ce trebuie sa intre above the fold.

---

# Regula generala

Pe fiecare ecran, structura trebuie sa raspunda in ordinea asta:

1. **Unde sunt?**
2. **Ce este important acum?**
3. **Ce a facut sistemul pentru mine?**
4. **Ce fac eu mai departe?**
5. **Ce pot vedea mai jos daca vreau detaliu?**

Daca aceasta ordine se rupe, produsul pare greu.

---

# 1. Landing Page

## Above the fold
### Zona stanga
- Headline
- Subheadline
- CTA principal
- CTA secundar
- microcopy de reassurance

### Zona dreapta
- preview simplu de produs
- 1 mock relevant, nu 4
- highlight vizual pe:
  - snapshot
  - top action
  - dovada salvata

## Below the fold
1. Cum functioneaza in 3-5 pasi
2. Ce primesti concret
3. Pentru cine este
4. Output extern / dovezi / Audit Pack / Trust
5. CTA final

## Prioritate vizuala
1. Promisiune
2. Primul pas
3. Output concret
4. Credibilitate

## Nu pune above the fold
- pricing complet
- toate framework-urile
- lista lunga de features
- jargon

---

# 2. Onboarding — Step 1

## Above the fold
- Titlu clar
- Subtitlu scurt
- 3-4 campuri esentiale
- CTA principal
- CTA secundar „continui mai tarziu”

## Structura
### Zona centrala
- card formular
- ajutor contextual sub fiecare camp
- progres simplu (ex: Pasul 1 din 3)

### Zona laterala dreapta (optional)
- ce urmeaza dupa acest pas
- „dupa ce completezi, Compli verifica pentru tine”

## Prioritate vizuala
1. Campurile
2. Clarificari utile
3. Sentimentul ca nu dureaza mult

## Nu pune
- intrebari avansate
- explicatii juridice lungi
- framework-uri detaliate

---

# 3. Onboarding — Step 2 / Verificare automata

## Above the fold
- titlu
- subtext scurt
- progres vizual
- lista de verificari in curs

## Structura
### Zona centrala
- lista de verificari animate:
  - verificam datele firmei
  - analizam website-ul
  - cautam semnale
  - pregatim snapshot-ul

### Zona jos
- mesaj de reassurance:
  „nu trebuie sa faci nimic acum”

## Prioritate vizuala
1. Sistemul lucreaza
2. Nu dureaza mult
3. Rezultatul urmeaza imediat

## Nu pune
- log tehnic
- erori brute
- denumiri interne ale motorului

---

# 4. Onboarding — Finish Screen

## Above the fold
- titlu de succes
- 3-4 lucruri create deja
- mesaj de reassurance
- CTA principal
- CTA secundar

## Structura
### Zona centrala
- bife mari:
  - primul snapshot creat
  - reglementari detectate
  - prime actiuni pregatite
  - dosar initial pornit

### Zona de jos
- „daca vine un control maine, nu mai pornesti de la zero”

## Prioritate vizuala
1. Am construit deja ceva
2. Nu ai doar probleme, ai deja baza
3. Uite unde mergi acum

## Nu pune
- lista lunga de findings
- 4 scoruri fara context
- alerte rosii multe

---

# 5. Dashboard Initial / Primul Snapshot

## Above the fold
### Banda de sus
- context page title
- un mesaj simplu de orientare

### Coloana principala stanga
1. Ce ti se aplica
2. Ce am gasit deja
3. Top 3 actiuni

### Coloana dreapta
- acumulare initiala / snapshot
- stare generala
- eventual un bloc mic de reassurance

## Ordinea blocurilor
1. **Ce ti se aplica**
2. **Ce am gasit deja**
3. **Ce faci acum**
4. **Ce ai acumulat**
5. **Detalii / framework breakdown**

## Prioritate vizuala
1. Actiunea
2. Applicability
3. Findings clare
4. Acumularea

## Below the fold
- framework details
- dovezi existente
- activity preview

## Nu pune above the fold
- prea multe grafice
- 4 scoruri mari simultan
- multe widget-uri egale ca importanta

---

# 6. Resolve Screen

## Above the fold
### Zona stanga (70%)
- titlul problemei
- descrierea simpla
- de ce conteaza
- ce dovada se accepta

### Zona dreapta (30%)
- card „Acum faci asta”
- 3-4 pasi max
- CTA principal
- CTA secundar

## Ordinea corecta
1. Problema
2. Impact
3. Ce faci acum
4. Buton direct
5. Dovezi / detalii / help

## Prioritate vizuala
1. CTA contextual
2. Beneficiul rezolvarii
3. Dovada care ramane

## Below the fold
- detalii juridice
- explicatii complete
- istoric task
- log de schimbari

## Nu pune
- instructiuni vagi de tip „mergi in Generator”
- 10 campuri deodata
- confirmare automata ascunsa

---

# 7. Generator Screen

## Above the fold
- titlu document
- subtext scurt
- stepper simplu
- campurile necesare acum

## Layout
### Zona centrala mare
- formular ghidat

### Zona laterala dreapta
- context:
  - de ce se genereaza
  - ce finding rezolva
  - ce se va salva dupa confirmare

## Ordinea
1. Date esentiale
2. Preview
3. Confirmare
4. Salvare la dosar

## Prioritate vizuala
1. Completeaza minimul necesar
2. Vezi ce obtii
3. Confirma constient
4. Salveaza

## Nu pune
- selector generic cu multe template-uri
- alta navigatie complexa
- ruperea contextului de task

---

# 8. Success / Dovada Salvata

## Above the fold
- titlu mare de success
- ce s-a salvat
- unde il gasesti
- ce s-a actualizat
- 2 CTA-uri clare

## Layout
### Zona centrala
- mesaj principal
- fact box:
  - artifact
  - data
  - legatura cu task-ul
  - status nou

### Zona de jos
- CTA 1: Vezi dosarul
- CTA 2: Mergi la urmatoarea actiune

## Prioritate vizuala
1. Dovada exista
2. Snapshot-ul s-a schimbat
3. Ai progres real

## Nu pune
- doar toast mic
- succes fara link
- succes fara progres vizibil

---

# 9. Dashboard dupa prima rezolvare

## Above the fold
### Banda de sus
- scor / stare generala
- mesaj contextual simplu

### Coloana stanga
1. Top 3 actiuni urgente
2. Ce am verificat pentru tine

### Coloana dreapta
1. Ce am construit pentru tine
2. ultimul audit / ultimul snapshot / trust quick link

## Ordinea blocurilor
1. Urgenta
2. Acumulare
3. Activitate automata
4. Detalii si framework-uri
5. Export / trust / dovezi

## Prioritate vizuala
1. Ce faci acum
2. Ce ai deja
3. Ce verificam pentru tine

## Nu pune above the fold
- multe widget-uri secundare
- multe carduri cu aceeasi greutate
- lipsa diferentei intre urgent si util

---

# 10. Activity Feed

## Above the fold
- titlu clar
- 3-5 itemi utili
- 1 CTA spre pagina completa daca exista

## Layout
### Fiecare item
- data
- ce a facut sistemul
- de ce conteaza
- CTA daca e nevoie

## Prioritate vizuala
1. Ce s-a facut
2. Relevanta
3. Actiunea urmatoare

## Nu pune
- termeni tehnici
- statusuri brute
- evenimente fara impact

---

# 11. Notifications

## Layout logic
### Header dropdown
- maxim 5 notificari relevante
- grupate pe:
  - cere actiune
  - te informeaza
  - s-a salvat / s-a generat

### Notification detail
- titlu scurt
- o linie care spune de ce conteaza
- CTA unic

## Prioritate
1. Deadline / actiune
2. Schimbare relevanta
3. Informare

## Nu pune
- 20 notificari simultan
- notificari de sistem fara relevanta
- duplicari intre feed si clopot

---

# 12. Portfolio

## Above the fold
### Banda de sus
- titlu
- search
- filtru
- CTA import / add client

### Zona principala
1. urgency queue
2. lista firme / overview
3. actiuni batch sigure

### Zona laterala sau banda secundara
- trend score
- clienti cu schimbari
- statusul exporturilor

## Prioritate vizuala
1. Ce arde azi
2. Pe ce firma intri
3. Ce poti face in batch

## Dupa workspace switch
Above the fold:
- banner persistent „Lucrezi pentru: Firma X”
- CTA „Inapoi la portofoliu”

## Nu pune
- context pierdut dupa switch
- batch fara confirmare
- multe tabele grele din prima

---

# 13. Trust / Export / Share

## Above the fold
- titlu clar
- ce reprezinta fiecare output
- 3 carduri max

## Ordinea cardurilor
1. Audit Pack
2. Trust Center
3. One-page report / Share link

## Ce trebuie sa fie vizibil
- cui ii trimiti
- de ce ai folosi fiecare output
- daca e public / privat / expira

## CTA-uri
- Descarca
- Copiaza link
- Trimite Trust Center-ul tau

## Nu pune
- denumiri similare si confuze
- lipsa descrierii de use case
- multiple pagini fara hub clar

---

# 14. Regula de above the fold

Pe orice ecran, above the fold trebuie sa contina numai:

1. Contextul ecranului
2. Cel mai important lucru de acum
3. CTA-ul principal
4. Dovada ca sistemul a facut ceva pentru user

Tot ce este:
- detaliu
- istoric
- breakdown
- explicatie juridica
- log
merge below the fold sau in expand.

---

# 15. Formula finala

## Zona de sus
Unde sunt + ce e important

## Zona centrala
Ce a facut sistemul + ce fac eu acum

## Zona laterala
Reassurance + acumulare + context

## Zona de jos
Detalii, breakdown, istoric, explicatii

---

# 16. Concluzie

Wireframe-ul corect pentru CompliScan trebuie sa respecte aceeasi logica peste tot:

- **sus:** claritate si urgenta
- **mijloc:** actiune si ajutor
- **dreapta:** context si dovada
- **jos:** detaliu si istoric

Daca fiecare ecran respecta aceasta logica, produsul ramane puternic fara sa para greu.
