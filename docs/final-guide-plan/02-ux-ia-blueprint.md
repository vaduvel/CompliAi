# CompliScan — Arhitectură UX & IA Revizuită
**Versiune:** 2.0  
**Data:** 2026-03-20  
**Motiv revizuire:** Flow-ul actual fragmentează journey-ul principal (scan → înțelege → repară) în 3+ secțiuni de navigare fără punte clară. Userii nu știu unde să scaneze și nu știu ce să facă după.

---

## Principiul central al acestei IA

> **Un user care nu știe ce să facă nu e un user prost. E un produs prost structurat.**

Noua IA este construită în jurul unui singur job-to-be-done:
**Intri → Scanezi → Înțelegi ce e greșit → Repari → Dovedești.**

Tot restul este fie suport pentru acest flux, fie output (rapoarte).

---

## 1. Navigare nouă — 4 itemi primari

### Structura veche (problematică)
```
Dashboard / Scanare / Control (×6 sub-itemi) / Dovadă (×4) / Politici / Setări
```
**Problemă:** 6 itemi top-level + 16 sub-pagini. Control are 6 sub-secțiuni care
nu sunt logic legate între ele din perspectiva userului.

### Structura nouă
```
┌────────────────────────────────────┐
│  CompliScan                        │
├────────────────────────────────────┤
│  ⊞  Acasă          stare & urgențe │
│  ⊙  Scanează       input & analiză │
│  ⚐  De rezolvat    findings & tasks│  ← badge count
│  ⊟  Rapoarte       dovezi & export │
├────────────────────────────────────┤
│  ⚙  Setări                         │
└────────────────────────────────────┘
```

### Logica re-mapării

| Pagini vechi | Unde merg acum |
|---|---|
| Dashboard | Acasă |
| Scanare → Flux scanare | Scanează |
| Scanare → Documente | Scanează → tab Istoric |
| Control → Sisteme AI | De rezolvat → filter AI Act |
| Control → Conformitate AI | De rezolvat → finding detail |
| Control → Drift & Alerte | De rezolvat → badge Drift |
| Control → NIS2 | De rezolvat → filter NIS2 |
| Control → Agenți | Setări → Automatizare |
| Control → Vendor Review | De rezolvat → filter Furnizori |
| Dovadă → Remediere | De rezolvat (task completion) |
| Dovadă → Auditor Vault | Rapoarte |
| Dovadă → Rapoarte & Export | Rapoarte |
| Dovadă → Log audit | Rapoarte → Log |
| Politici → Politici interne | Rapoarte → Politici |
| Politici → Generator | Acasă → shortcut / De rezolvat → inline |

---

## 2. Harta paginilor revizuită

### Publice (neautentificat)
Rămân identice: `/`, `/pricing`, `/login`, `/reset-password`, `/demo/*`, `/terms`, `/privacy`, `/dpa`

### Dashboard (`/dashboard/*`)

| Pagină | URL | Secțiune sidebar |
|---|---|---|
| Acasă | `/dashboard` | Acasă |
| Scanează | `/dashboard/scan` | Scanează |
| Scan Rezultate | `/dashboard/scan/results/[scanId]` | Scanează (sub-pagină) |
| De rezolvat | `/dashboard/resolve` | De rezolvat |
| Finding Detail | `/dashboard/resolve/[findingId]` | De rezolvat (sub-pagină) |
| Rapoarte | `/dashboard/reports` | Rapoarte |
| Auditor Vault | `/dashboard/reports/vault` | Rapoarte |
| Log Audit | `/dashboard/reports/audit-log` | Rapoarte |
| Politici | `/dashboard/reports/policies` | Rapoarte |
| Setări | `/dashboard/settings` | Setări |

**Total: 10 pagini vizibile** față de 25 în varianta veche.  
Complexitatea nu dispare — se mută în sub-pagini și tabs locale, nu în navigare primară.

---

## 3. Descrierea fiecărui ecran principal

### 3.1 Acasă (`/dashboard`)

**Ce face:** Oferă starea curentă și un singur CTA primar.

**Regula de aur:** Maxim 1 (unu) element acționabil prominent. Tot restul e informativ.

**Structura paginii:**
```
[Page Header]
  Starea conformității tale · DORI SRL

[Primary Action Card]              ← ÎNTOTDEAUNA primul element
  ⚠  5 finding-uri de rezolvat — 2 critice
  "Rezolvarea lor crește scorul cu ~14 puncte"
  [Rezolvă acum →]

[Score + Health Check]             ← side-by-side
  Scor global (ring)  |  Health Check (5 itemi cu status dot)

[Framework Readiness]              ← informativ, nu acționabil
  GDPR 71 / NIS2 42 / AI Act 55 / e-Factură 88
```

**Ce NU mai apare pe Acasă:**
- EvidenceCore blob animation
- DriftCommandCenter (separat)
- Snapshot & Recent Activity (mutat în Rapoarte)
- OnboardingProgress (mutat în Setări după completare)
- CER Directive signal (mutat în setări / info drawer)

**Când Primary Action Card e gol:**
```
✓  Conformitate la zi — niciun finding critic deschis.
   [Rulează o nouă scanare]   [Descarcă raport]
```

---

### 3.2 Scanează (`/dashboard/scan`)

**Ce face:** Este singurul loc unde userul interacționează cu input-ul.

**Structura paginii:**
```
[Page Header]
  Scanează un document

[Source Type Selector]             ← 4 carduri vizuale, nu dropdown
  📄 Document   ✏️ Text liber   📦 Manifest   ⚙️ YAML

[Upload Zone]                      ← apare după selectarea tipului
  Drop zone mare, clar, cu instrucțiuni
  [Upload] sau [Paste text]

[Progress State]                   ← în timpul analizei
  "Analizez documentul…"
  Progress bar animat

[Tabs: Activ | Istoric]
```

**Post-scan — redirect automat la:**
`/dashboard/scan/results/[scanId]`

---

### 3.3 Scan Rezultate (`/dashboard/scan/results/[scanId]`)

**Ce face:** Această pagină NU există în varianta actuală. Este punctul cel mai important de rezolvat.

**Structura:**
```
[Success Banner]
  ✓ Analiza finalizată · Contract furnizor IT · 8 findings

[Findings grupate]
  🔴 Critice (2)     → expandabile cu "Rezolvă →" inline
  🟡 Ridicate (2)    → expandabile
  ⚪ Medii (3)       → expandabile
  ℹ️ Informative (1) → colapsate by default

[CTA primar]
  [Adaugă toate în queue →]     [Descarcă raport scan]
```

**Reguli:**
- Fiecare finding are buton "Rezolvă →" care deschide Resolution Layer inline (nu navigare)
- "Adaugă toate în queue" → redirect la `/dashboard/resolve` cu filtrul pe noul scan activ
- Nu există "Înapoi la scanare" — există "Scanează din nou" (acțiune, nu navigare)

---

### 3.4 De rezolvat (`/dashboard/resolve`)

**Ce face:** Agregă TOT ce necesită acțiune umană, indiferent de framework.

**Această pagină înlocuiește:** Remediere, Sisteme AI (ca acțiuni), Conformitate AI, Drift & Alerte, NIS2 (gaps), Vendor Review.

**Structura:**
```
[Page Header]
  De rezolvat · 5 deschise
  [badge: 2 critice] [badge: 2 ridicate] [badge: 1 medie]

[Filter Tabs]
  Toate (5) | GDPR (2) | NIS2 (2) | AI Act (1) | Furnizori (0)

[Finding Rows — sortate: critical first]
  [CRITIC] Lipsă DPA furnizor IT         GDPR  2h   [De revizuit ▼]
    → click expand → Resolution Layer inline (7 pași)

  [CRITIC] Registru activități neact.    GDPR  3h   [Detectat ▼]
  [RIDICAT] Sistem AI nedeclarat         AI Act 3h   [Detectat ▼]
  [MEDIU]  Maturitate NIS2 — Criptografie NIS2 1z   [De revizuit ▼]
  [MEDIU]  Înregistrare DNSC neefectuată  NIS2  exp   [Escaladat ▼]
```

**Resolution Layer (inline, nu pagină separată):**
```
Pasul 1 ✓  Problemă     (gri — rezolvat)
Pasul 2 ✓  Impact       (gri — rezolvat)
Pasul 3 ●  Acțiune      (activ) → [Generează DPA →]
Pasul 4 ○  Document generat
Pasul 5 ○  Pas uman
Pasul 6 ○  Dovadă de închidere
Pasul 7 ○  Revalidare
```

**Stările unui finding (Human Review State Machine):**
```
detected → pendingReview → escalated → confirmed / dismissed
                                              ↓
                                        remediation → resolved / accepted
```

**Vizual per stare:**
- detected = amber badge "Detectat"
- pendingReview = violet badge "De revizuit"
- escalated = violet intens badge "Escaladat"
- confirmed = amber/red (depinde de severity outcome)
- dismissed = neutral badge "Respins"
- remediation = neutral-active badge "În remediere"
- resolved = emerald badge "Rezolvat"

---

### 3.5 Rapoarte (`/dashboard/reports`)

**Ce face:** Output-ul — dovezi, rapoarte, log-uri. Numai read + download.

**Structura:**
```
[Page Header]
  Dovezi & Export · Stare audit: Pregătit

[4 carduri acțiune]
  📦 Audit Pack ZIP        → [Generează]
  📋 Raport 1 pagină       → [Descarcă PDF]
  🔒 Auditor Vault         → [Configurează]
  📝 Log Audit             → [Vezi log]

[Sub-tabs]
  Rapoarte | Politici interne | Log Audit | Trust Center
```

---

## 4. Flow-uri principale revizuite

### Flow 1: Prima utilizare (onboarding)
```
Register → /dashboard
  └─ Dacă profil incomplet → ApplicabilityWizard (modal, nu pagină)
       ↓ completat
  └─ Primary Action Card: "Rulează prima scanare"
       ↓ click
  └─ /dashboard/scan
       ↓ upload doc
  └─ /dashboard/scan/results/[id]
       ↓ "Adaugă în queue"
  └─ /dashboard/resolve
       ↓ expand primul finding critic
  └─ Resolution Layer inline → Generează document → marchează done
       ↓ finding rezolvat
  └─ Scor crește + toast feedback
```
**Pași pentru valoare:** 5 (față de 9+ în varianta actuală)

---

### Flow 2: Utilizator recurent (zilnic)
```
/dashboard (Acasă)
  └─ Primary Action Card arată ce s-a schimbat
       ↓ click "Rezolvă acum"
  └─ /dashboard/resolve (filtrat pe nou)
       ↓ lucrează finding-urile
  └─ Done — scor actualizat, Acasă reflectă noua stare
```
**Pași pentru value:** 3

---

### Flow 3: Post-scanare
```
/dashboard/scan → upload → analiză
  └─ Auto-redirect: /dashboard/scan/results/[id]
       ↓ revizuiește findings
       ↓ "Adaugă toate în queue"
  └─ /dashboard/resolve (filtrat pe scan curent)
```
**Userul NU trebuie să știe că există un "queue" separat — e dus acolo automat.**

---

### Flow 4: NIS2 / AI Act (nu se mai pierd în sub-meniuri)
```
/dashboard/resolve → filter "NIS2"
  └─ Toate gap-urile NIS2 vizibile
       ↓ expand "Maturitate Criptografie"
  └─ Resolution Layer cu Assessment link inline
       ↓ sau filter "AI Act"
  └─ Finding "Sistem nedeclarat" → [Adaugă în inventar] inline
```

---

## 5. Ce se elimină din navigarea primară (dar rămâne în produs)

| Eliminat din nav | Unde trăiește |
|---|---|
| Control → Agenți | Setări → Automatizare |
| Control → Drift detaliat | De rezolvat → badge "Drift" pe finding |
| Control → Vendor Review | De rezolvat → filter "Furnizori" |
| Politici → Generator | Inline în Resolution Layer (la pasul "Document generat") |
| Politici → Politici interne | Rapoarte → tab Politici |
| Dovadă → Remediere | Integrată în De rezolvat |
| Snapshot & Activity | Rapoarte |
| DNSC Wizard | De rezolvat → finding "Înregistrare DNSC" → Resolution Layer |

---

## 6. Reguli UX de respectat în implementare

1. **Un singur CTA primar per pagină.** Nu două butoane verzi egale niciodată.
2. **Post-scan = redirect automat la Results.** Nu toast + nimic.
3. **Resolution Layer este inline.** Nu pagini separate `/findings/[id]` (sau dacă există, sunt accesibile ca deep link, nu ca navigare primară).
4. **De rezolvat este singurul loc cu acțiuni.** Nu pune butoane "Rezolvă" în Acasă, în Rapoarte, în Setări.
5. **Filtrele din De rezolvat înlocuiesc sub-meniurile.** NIS2/GDPR/AI Act sunt tabs, nu itemi sidebar.
6. **Onboarding Progress dispare după completare.** Nu rămâne permanent în sidebar.
7. **Setările nu sunt în fluxul principal.** Agenți, Integrări, Membri — în Setări, nu în Control.
8. **Badge-ul din sidebar pe "De rezolvat"** reflectă în timp real nr. de finding-uri critice+ridicate nerezolvate.

---

## 7. Metrici de succes UX

| Metric | Acum (estimat) | Target |
|---|---|---|
| Clicuri pentru prima scanare | 4-6 | ≤ 2 |
| Clicuri de la scan la primul finding rezolvat | 8-12 | ≤ 4 |
| % useri care găsesc "De rezolvat" fără ajutor | ~40% | ≥ 85% |
| Timp până la prima acțiune de remediere | ~8 min | ≤ 3 min |
| Nr. pagini vizitate per sesiune tipică | 5-7 | 2-3 |
