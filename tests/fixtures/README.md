# Fixtures oficiale CompliScan

Aceste fixture-uri sunt folosite pentru testele de maturizare din Sprint 2, Sprint 3 si Sprint 6.

Scop:

- sa avem surse stabile pentru `scan`, `manifest autodiscovery` si `compliscan.yaml`
- sa acoperim si cazuri grele, cu mai multe semnale concurente, pentru verdict si audit defensibility
- sa putem compara usor rezultatele intre refactoruri
- sa evitam testele bazate doar pe stringuri scrise inline

Structura:

- `documents/`
  - texte de politici sau contracte pentru fluxul document-first
- `manifests/`
  - exemple de `package.json`, `requirements.txt` sau lockfiles
- `yaml/`
  - exemple de `compliscan.yaml`
- `expected-findings/`
  - contracte mici despre semnalele-cheie pe care nu vrem sa le pierdem dupa refactoruri

Regula:

- fixture-urile raman mici, lizibile si predictibile
- nu introducem date personale reale
- orice fixture nou trebuie sa poata fi explicat intr-un test sau in backlog-ul de maturizare
