# CompliScan Flow Test Kit - User Nou - Document Flow

Acest pachet este facut pentru un user nou care vrea sa testeze flow-ul principal:

`Scanare -> Control -> Dovada -> Audit si export`

Scopul pachetului:

- sa ai un document usor de urcat in `Scanare`
- sa vezi findings reale si task-uri in `Control` / `Dovada`
- sa ai cateva dovezi gata de atasat in `Remediere`

## Ce contine

### Documente principale pentru `Scanare`

1. `01-policy-tracking.pdf`
   - caz usor
   - ar trebui sa produca un semnal de tracking / cookies

2. `02-high-risk-scoring.pdf`
   - caz mediu
   - ar trebui sa produca un semnal de high-risk / decizie automata

3. `03-recruitment-high-risk-bundle.pdf`
   - caz complet
   - ar trebui sa produca mai multe semnale concurente:
     - high-risk
     - lipsa review uman
     - date personale
     - retentie
     - transfer international

### Texte fallback pentru `Text manual`

- `01-policy-tracking-source.txt`
- `02-high-risk-scoring-source.txt`
- `03-recruitment-high-risk-bundle-source.txt`

Foloseste-le daca OCR-ul citeste prost PDF-ul sau daca vrei sa testezi direct modul `Text manual`.

### Dovezi suport pentru `Remediere`

- `04-evidence-cookie-consent-log.txt`
- `05-evidence-human-review-procedure.txt`
- `06-evidence-retention-and-transfer-register.txt`

Acestea sunt documente simple de test. Le poti folosi ca fisiere de atasat atunci cand inchizi task-uri in `Remediere`.

## Cum recomand sa rulezi testul

### Varianta rapida

1. Intra in `Scanare`
2. Urca `01-policy-tracking.pdf`
3. Ruleaza analiza
4. Mergi in `Control` si verifica finding-ul de tracking / cookies
5. Mergi in `Dovada -> Remediere`
6. Ataseaza `04-evidence-cookie-consent-log.txt`
7. Valideaza si rescaneaza
8. Mergi in `Audit si export`

### Varianta completa

1. Intra in `Scanare`
2. Urca `03-recruitment-high-risk-bundle.pdf`
3. Ruleaza analiza
4. In `Control`, confirma sistemul si semnalele principale
5. In `Dovada -> Remediere`, lucreaza task-urile rezultate
6. Ataseaza:
   - `05-evidence-human-review-procedure.txt`
   - `06-evidence-retention-and-transfer-register.txt`
7. Ruleaza din nou validarea unde este cazul
8. Intra in `Audit si export` pentru snapshot si livrabil

## Ce ar trebui sa vezi

### Pentru `01-policy-tracking.pdf`

- tracking / cookies
- nevoie de confirmare pentru consimtamant

### Pentru `02-high-risk-scoring.pdf`

- high-risk / decizie automata
- nevoia de validare umana

### Pentru `03-recruitment-high-risk-bundle.pdf`

- high-risk
- lipsa review uman
- prelucrare de date personale
- retentie mentionata explicit
- transfer international mentionat explicit

## Observatie importanta

Aceste documente sunt pentru test de produs, nu documente legale reale.

Nu contin date personale reale si nu trebuie folosite in audit extern sau productie.
