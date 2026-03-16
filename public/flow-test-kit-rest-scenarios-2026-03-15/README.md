# CompliScan Flow Test Kit - Restul Scenariilor

Acest pachet acopera restul surselor si functiilor canonice, dincolo de flow-ul principal `Document -> Control -> Dovada -> Audit si export`.

Scopul lui este sa poti testa rapid:

- `Text manual`
- `Repo / manifest`
- `compliscan.yaml`
- `e-Factura XML`
- exporturile principale

## Ce contine

### Text manual

1. `01-text-manual-customer-support.txt`
   - caz limitat
   - asistent suport clienti
   - date personale + retentie + review uman prin sampling

2. `02-text-manual-high-risk-review-gap.txt`
   - caz high-risk
   - scoring recrutare
   - fara review uman
   - retentie lunga + transfer international

### Repo / manifest

3. `03-manifest-package-openai.json`
   - manifest `package.json`
   - semnal clar de dependinte AI pentru autodiscovery

4. `04-manifest-requirements-openai.txt`
   - manifest `requirements.txt`
   - semnal clar de dependinte AI pentru autodiscovery

### compliscan.yaml

5. `05-compliscan-customer-support.yaml`
   - caz limitat
   - support assistant cu review uman si retentie controlata

6. `06-compliscan-recruitment-high-risk.yaml`
   - caz high-risk
   - recrutare, fara review uman, transfer in afara UE

### e-Factura XML

7. `07-efactura-valid-minimal.xml`
   - ar trebui sa treaca validarile structurale de baza

8. `08-efactura-invalid-minimal.xml`
   - lipsesc campuri structurale importante
   - ar trebui sa pice validarile

## Cum recomand sa testezi

### Text manual

1. Intra in `Scanare`
2. Alege `Text manual`
3. Lipeste continutul dintr-un fisier `.txt`
4. Ruleaza analiza
5. Verifica findings, task-uri si handoff spre `Control`

### Repo / manifest

1. Intra in `Scanare`
2. Alege `Repo / manifest`
3. Lipeste continutul din `package.json` sau `requirements.txt`
4. Ruleaza autodiscovery
5. Mergi in `Control` si confirma detectiile utile

### compliscan.yaml

1. Intra in `Scanare`
2. Alege `compliscan.yaml`
3. Lipeste fisierul YAML
4. Ruleaza analiza
5. Verifica sistemul detectat, riscul si semnalele de guvernanta

### e-Factura XML

1. Intra in `Control` sau `Integrari`, in zona e-Factura
2. Lipeste XML-ul
3. Ruleaza validarea
4. Verifica erorile sau warning-urile

## Observatie

Aceste fisiere sunt doar pentru test local de produs. Nu sunt documente oficiale de conformitate si nu trebuie folosite ca livrabile externe.
