# CompliScan - Ghid rapid pentru Engineering

Acest ghid explica modul simplu in care o echipa tehnica poate trimite catre CompliScan doar fisierele relevante pentru controlul operational:

- `compliscan.yaml`
- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `requirements.txt`
- `pyproject.toml`
- `poetry.lock`

Scopul nu este sa trimiti tot repository-ul, ci doar sursa de adevar si manifests care pot genera:

- inventar AI
- findings cu mapare legala
- drift fata de baseline
- dovezi pentru audit

## 1. Ce avem acum

Astazi, CompliScan poate:

- valida `compliscan.yaml`
- analiza manifests relevante
- genera findings si alerte pe baza semnalelor tehnice
- detecta drift fata de baseline-ul validat
- actualiza dashboard-ul prin repo sync

Astazi, CompliScan **nu** face inca:

- scanare completa a codului sursa
- webhook deep integration cu API GitHub / GitLab pentru a descarca singur fisierele
- runtime SDK

Asta inseamna ca integrarea recomandata pentru MVP este:

- `CI sync`, nu monitorizare magica din tot repo-ul

## 2. Fisierul compliscan.yaml

Pune `compliscan.yaml` in root-ul proiectului. Acesta este sursa declarata de adevar pentru:

- provider
- model
- capability
- risk class
- data residency
- personal data processed
- human oversight

Exemplu minim:

```yaml
version: "1.0"
system_id: "customer-support-ai"
name: "Customer Support Copilot"

specs:
  provider: "openai"
  model: "gpt-4o"
  capability: ["text-generation"]

governance:
  risk_class: "limited"
  data_residency: "eu-central-1"
  personal_data_processed: true
  retention_days: 30

human_oversight:
  required: true
  review_method: "sampling-audit"
  reviewer_role: "support-lead"
  alert_on_failure: true

mapping:
  regulations: ["GDPR", "EU-AI-ACT"]
  articles: ["Art. 13", "Art. 14", "Art. 50"]
```

Exemplu complet:

- [compliscan.example.yaml](./compliscan.example.yaml)

## 3. Endpoint-ul de repo sync

Endpoint:

- `POST /api/integrations/repo-sync`
- `POST /api/integrations/repo-sync/github`
- `POST /api/integrations/repo-sync/gitlab`

Header recomandat:

- `Content-Type: application/json`
- `x-compliscan-sync-key: <secret>`

Headere optionale pentru multi-workspace:

- `x-compliscan-org-id`
- `x-compliscan-org-name`
- `x-compliscan-user-email`

Nota:

- daca `COMPLISCAN_SYNC_KEY` este configurat in server, header-ul trebuie trimis obligatoriu
- local pe `localhost`, endpoint-ul merge si fara cheie

## 4. Payload-ul trimis din CI

Trimite doar fisierele relevante si continutul lor.

Exemplu:

```json
{
  "provider": "github",
  "repository": "acme/customer-support-app",
  "branch": "main",
  "commitSha": "abc123def456",
  "files": [
    {
      "path": "compliscan.yaml",
      "content": "version: \"1.0\"\nsystem_id: \"customer-support-ai\"\nname: \"Customer Support Copilot\"\n..."
    },
    {
      "path": "package.json",
      "content": "{ \"dependencies\": { \"openai\": \"^4.0.0\", \"langchain\": \"^0.2.0\" } }"
    }
  ]
}
```

Pentru adaptoarele dedicate poti trimite si o forma mai simpla:

### GitHub adapter

Endpoint:

- `POST /api/integrations/repo-sync/github`

Payload:

```json
{
  "repository": "acme/customer-support-app",
  "refName": "main",
  "sha": "abc123def456",
  "manifests": {
    "compliscan.yaml": "version: \"1.0\"\n...",
    "package.json": "{ \"dependencies\": { \"openai\": \"^4.0.0\" } }"
  }
}
```

### GitLab adapter

Endpoint:

- `POST /api/integrations/repo-sync/gitlab`

Payload:

```json
{
  "projectPath": "acme/customer-support-app",
  "refName": "main",
  "sha": "abc123def456",
  "manifests": {
    "compliscan.yaml": "version: \"1.0\"\n...",
    "requirements.txt": "openai==1.0.0\nlangchain==0.2.0"
  }
}
```

## 5. Exemplu de curl simplu

```bash
curl -X POST http://localhost:3001/api/integrations/repo-sync \
  -H "Content-Type: application/json" \
  -H "x-compliscan-sync-key: ${COMPLISCAN_SYNC_KEY}" \
  -d @repo-sync.json
```

## 6. Exemplu GitHub Actions

Acesta este modelul simplu. El citeste fisierele relevante si le trimite catre adaptorul GitHub dupa push.

```yaml
name: compliscan-sync

on:
  push:
    branches: ["main"]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build repo sync payload
        run: |
          node <<'EOF'
          const fs = require("fs");
          const path = require("path");

          const relevant = [
            "compliscan.yaml",
            "package.json",
            "package-lock.json",
            "pnpm-lock.yaml",
            "yarn.lock",
            "requirements.txt",
            "pyproject.toml",
            "poetry.lock"
          ];

          const files = relevant
            .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
            .map((file) => ({
              path: file,
              content: fs.readFileSync(path.join(process.cwd(), file), "utf8")
            }));

          fs.writeFileSync(
            "repo-sync.json",
            JSON.stringify(
              {
                repository: process.env.GITHUB_REPOSITORY,
                refName: process.env.GITHUB_REF_NAME,
                sha: process.env.GITHUB_SHA,
                manifests: Object.fromEntries(files.map((file) => [file.path, file.content]))
              },
              null,
              2
            )
          );
          EOF

      - name: Send to CompliScan
        run: |
          curl -X POST "${{ secrets.COMPLISCAN_URL }}/api/integrations/repo-sync/github" \
            -H "Content-Type: application/json" \
            -H "x-compliscan-sync-key: ${{ secrets.COMPLISCAN_SYNC_KEY }}" \
            -d @repo-sync.json
```

## 7. Exemplu GitLab CI

```yaml
compliscan_sync:
  image: node:20
  stage: test
  script:
    - |
      node <<'EOF'
      const fs = require("fs");
      const path = require("path");

      const relevant = [
        "compliscan.yaml",
        "package.json",
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "requirements.txt",
        "pyproject.toml",
        "poetry.lock"
      ];

      const files = relevant
        .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
        .map((file) => ({
          path: file,
          content: fs.readFileSync(path.join(process.cwd(), file), "utf8")
        }));

      fs.writeFileSync(
        "repo-sync.json",
        JSON.stringify(
          {
            projectPath: process.env.CI_PROJECT_PATH,
            refName: process.env.CI_COMMIT_REF_NAME,
            sha: process.env.CI_COMMIT_SHA,
            manifests: Object.fromEntries(files.map((file) => [file.path, file.content]))
          },
          null,
          2
        )
      );
      EOF
    - |
      curl -X POST "$COMPLISCAN_URL/api/integrations/repo-sync/gitlab" \
        -H "Content-Type: application/json" \
        -H "x-compliscan-sync-key: $COMPLISCAN_SYNC_KEY" \
        -d @repo-sync.json
```

## 8. Ce se intampla dupa sync

Pentru fiecare fisier relevant:

- se creeaza un scan nou
- se genereaza findings cu mapare legala, daca exista semnale
- se actualizeaza sistemele AI detectate
- se compara snapshot-ul nou cu baseline-ul validat
- se genereaza drift daca providerul, modelul, risk class sau data residency s-au schimbat

## 9. Ce trebuie sa faca echipa dupa primul sync

1. confirma sistemele AI detectate care intra real in inventar
2. valideaza snapshot-ul bun ca baseline
3. ataseaza dovezi la task-urile importante
4. foloseste `Auditor Vault` pentru audit-ready review

## 10. Regula simpla

CompliScan trebuie tratat ca un control operational:

- `compliscan.yaml` = sursa declarata de adevar
- manifests = semnale tehnice
- baseline = varianta aprobata
- drift = orice schimbare relevanta dupa aprobare

Acesta este modelul simplu care pastreaza produsul clar si util.
