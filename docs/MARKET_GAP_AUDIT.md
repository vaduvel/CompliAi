# CompliAI - Market Gap Audit
## Comparativ: Ce avem vs Ce ne trebuie (conform Market Research)

> Analiză: Martie 2026

---

## EXECUTIVE SUMMARY

| Aspect | Status | Gap |
|--------|--------|-----|
| **Applicability Engine** | ✅ Implementat | - |
| **e-Factura Validator** | ✅ Implementat | Lipsește auto-repair |
| **e-Factura Auto-repair** | ⚠️ Parțial | Doar fix-uri de bază, nu CUI auto-detect |
| **AI Inventory + Classification** | ✅ Implementat | - |
| **NIS2 Eligibility Wizard** | ✅ Implementat | - |
| **Partner Architecture** | ⚠️ Parțial | Lipsește white-label |
| **ONRC Integration** | ❌ Nu există | CRITICAL |
| **Regulatory Radar** | ⚠️ Parțial | Cron job există, dar nu generează auto-tasks |
| **ANAF SPV API** | ❌ Nu există | CRITICAL |

---

## A. e-Factura - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ Validator XML (`/api/efactura/validate`)
- ✅ Repair XML de bază (`/api/efactura/repair` - fixes XML headers, basic fixes)
- ✅ Status interpreter
- ✅ Filing discipline tracking

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **Auto-repair CUI lipsă** | Sistemul nu detectează automat CUI-ul firmei din profil și nu-l adaugă în XML | HIGH |
| **Auto-repair date lipsă** | Nu completează automat câmpuri lipsă din profilul firmei | HIGH |
| **SPV API Real** | Nu există conectare la ANAF SPV pentru submit automat | CRITICAL |
| **Pre-submit validation** | Nu verifică factura ÎNAINTE de trimitere, ci doar DUPĂ | MEDIUM |

### Ce TREBUIE să adăugăm:
```
1. Pre-submit validation → înainte de a trimite la SPV
2. Auto-repair cu date din profil → completează CUI, denumire, adresă automat
3. Integrare SPV (cu token client) → submit automat după repair
4. Retry logic → retrimite automat dacă eșuează prima dată
```

---

## B. AI Act - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ AI Inventory (discovery + manual add)
- ✅ AI Classification (risk level: minimal/limited/high)
- ✅ Conformity Assessment questionnaire
- ✅ Shadow AI questionnaire
- ✅ AI Compliance Pack management

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **CE Marking generator** | Nu generează declarația de conformitate pentru providers | MEDIUM |
| **High-risk tasks generator** | Nu generează automat task-uri pentru high-risk systems | MEDIUM |
| **Fundamental rights impact assessment** | Nu are template pentru FRIA | LOW |
| **Human oversight documentation** | Nu are template pentru documentarea supravegherii umane | LOW |

### Ce TREBUIE să adăugăm:
```
1. CE Marking declaration generator (pentru providers)
2. Auto-generated tasks pentru high-risk: "Completează documentație tehnică", "Implementează human oversight"
3. Template FRIA (Fundamental Rights Impact Assessment)
4. AI literacy tracking - cine a fost instruit pe AI tools
```

---

## C. NIS2 + DORA - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ NIS2 Eligibility Wizard (calcul din CAEN + angajați)
- ✅ NIS2 Assessment questionnaire
- ✅ NIS2 Maturity assessment
- ✅ DNSC registration form generator
- ✅ Incident reporting workflow (24h deadline tracking)
- ✅ DORA incident tracking
- ✅ DORA TPRM (Third Party Risk Management)

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **DNSC API integration** | Nu există înregistrare automată la DNSC | HIGH |
| **Incident auto-classification** | Nu clasifică automat severitatea incidentului | MEDIUM |
| **Board reporting** | Nu generează rapoarte executive pentru board | MEDIUM |
| **DORA specific pentru sector** | Nu există sector-specific assessments (banking, insurance) | MEDIUM |

### Ce TREBUIE să adăugăm:
```
1. DNSC API integration - înregistrare automată (dacă există API)
2. Auto-classification pentru incidente - ML based severity scoring
3. Board-ready reports - executive summary cu risk heatmap
4. Sector-specific DORA templates pentru banking/fintech/asigurări
```

---

## D. GDPR - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ RoPA Generator (complet)
- ✅ Cookie Policy Generator
- ✅ Privacy Policy Generator
- ✅ DPA (Data Processing Agreement) Generator
- ✅ Retention Policy Generator
- ✅ DSAR workflow (submit, tracking, response)
- ✅ Document versioning
- ✅ Evidence tracking

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **DPO Register** | Nu există registru cu DPO-ii firmelor | LOW |
| **RPO Register** | Nu există registru cu Responsabilii de protecția datelor | LOW |
| **GDPR Impact Assessment template** | Nu există template DPIA complet | MEDIUM |
| **Auto-notificare breșe** | Nu există workflow automat pentru notificarea ANSPDCP | MEDIUM |

### Ce TREBUIE să adăugăm:
```
1. DPO Register - cine e DPO pentru fiecare firmă în portofoliu
2. DPIA template complet cu risk scoring
3. Breach notification workflow - generează formular ANSPDCP automat
```

---

## E. Partner Architecture - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ Portfolio view (agregat across all clients)
- ✅ CSV import pentru clienți
- ✅ Cross-client analytics (aggregated scores)
- ✅ Shared vendor database
- ✅ Task management per client
- ✅ Client-specific settings

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **White-label** | Nu există branding personalizat pentru parteneri | **CRITICAL** |
| **Commission tracking** | Nu există sistem de tracking pentru comisioane | HIGH |
| **Client portal** | Clienții partenerului nu au access separat | HIGH |
| **White-label reports** | Rapoartele nu pot fi customizate per partener | MEDIUM |

### Ce TREBUIE să adăugăm:
```
1. White-label engine:
   - Custom logo, colors, fonts per partner
   - Custom domain support
   - Custom email templates
2. Commission tracking - cine a adus ce client, ce comision
3. Client portal - partenerul poate da access clientului la rapoartele lui
4. Custom report templates per partner
```

---

## F. ONRC + ANAF Integration - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ❌ **Nimic** - Nu există integrare ONRC
- ❌ **Nimic** - Nu există integrare ANAF SPV (doar validator local)
- ✅ CUI prefill (parțial) - din date publice

### Ce LIPSEȘTE (Gap):
| Integrare | Status | Complexitate | Impact |
|-----------|--------|--------------|--------|
| **ONRC API** | ❌ Nu există | Medium | CRITICAL |
| **ANAF SPV API** | ❌ Nu există | High | CRITICAL |
| **ANAF date firme** | ⚠️ Parțial | Medium | HIGH |

### Ce TREBUIE să adăugăm:
```
1. ONRC API - preluare automată date firmă din CUI:
   - Denumire completă
   - Adresa sediu
   - Cod CAEN
   - Număr angajați
   - Cifră de afaceri (dacă e public)

2. ANAF SPV API:
   - Submit facturi automat (cu token client)
   - Status check automat
   - Download facturi primite
```

---

## G. Regulatory Radar - Ce avem vs Ce ne trebuie

### Ce AVEM:
- ✅ Cron job `legislation-monitor` - daily check
- ✅ Cron job `agent-regulatory-radar` - weekly
- ✅ Monitorizare surse: ANSPDCP, DNSC, ANAF
- ✅ SHA-256 hash comparison pentru detectare schimbări
- ✅ Gemini summarization pentru conținut

### Ce LIPSEȘTE (Gap):
| Gap | Descriere | Impact |
|-----|-----------|--------|
| **Auto-task generation** | Nu generează automat task-uri când detectează schimbare | **CRITICAL** |
| **User notification** | Nu notifică utilizatorii de schimbări legislative | HIGH |
| **Impact analysis per firm** | Nu analizează ce impact are fiecare schimbare per profil | HIGH |
| **Monitorul Oficial** | Nu scrape Monitorul Oficial | MEDIUM |

### Ce TREBUIE să adăugăm:
```
1. Auto-task generation:
   - Când detectează schimbare legislativă
   - Analizează ce framework-uri afectează firma
   - Creează task "Actualizează политика conform legii noi"
   
2. User notifications:
   - Email când apare lege nouă relevantă
   - In-app notification cu link la task

3. Impact analysis per firm:
   - Profile-based filtering (nu trimiți NIS2 la PFA)
   - Severity scoring (critical/medium/low)
```

---

## H. Pricing - Ce avem vs Ce trebuie

### Ce AVEM:
- ✅ Plan Solo, Business, Enterprise, Partner
- ✅ Stripe integration pentru plăți

### Ce LIPSEȘTE:
| Plan | Preț propus în research | Preț curent | Gap |
|------|-------------------------|-------------|-----|
| Solo | 29 EUR | ? | - |
| Business | 79 EUR | ? | - |
| Enterprise | 199 EUR | ? | - |
| Partner | 299 EUR | ? | - |

---

## PRIORITĂȚI DE DEVELOPMENT

### 🔴 CRITICAL (Luna 1-2):
1. **e-Factura Auto-repair** - completează CUI, date din profil automat
2. **Pre-submit validation** - verifică înainte de a trimite
3. **ONRC Integration** - preluare date firmă din CUI

### 🟠 HIGH (Luna 3-4):
4. **White-label** - branding per partener
5. **Regulatory Radar Auto-tasks** - generează task-uri din schimbări legislative
6. **Client Portal** - access separat pentru clienții partenerului

### 🟡 MEDIUM (Luna 5-6):
7. **ANAF SPV Integration** - submit automat (dacă există API public)
8. **Board Reporting** - rapoarte executive NIS2/DORA
9. **CE Marking Generator** - pentru AI providers
10. **DPIA Template** - GDPR impact assessment complet

### 🟢 LOW (Luna 7+):
11. **Commission Tracking** - sistem de comisioane pentru parteneri
12. **Monitorul Oficial scraping**
13. **Breach Notification Workflow** - notificare ANSPDCP automată

---

## COMPARATIV: RESEARCH vs REALITATE

| Principiu din Research | Status în App | Note |
|------------------------|---------------|------|
| **Applicability Engine** | ✅ Implementat | Funcționează bine |
| **e-Factura Auto-repair** | ⚠️ Parțial | Doar basic fixes |
| **AI Inventory + Classification** | ✅ Implementat | Full implementation |
| **NIS2 Eligibility Wizard** | ✅ Implementat | Funcționează bine |
| **White-label** | ❌ Lipsește | CRITICAL GAP |
| **CSV Import clienți** | ✅ Implementat | Funcționează |
| **Regulatory Radar** | ⚠️ Parțial | Detectează dar nu generează tasks |
| **ONRC Integration** | ❌ Lipsește | CRITICAL GAP |
| **ANAF SPV** | ❌ Lipsește | CRITICAL GAP |
| **Auto-task generation** | ❌ Lipsește | CRITICAL GAP |

---

## CONCLUZIE

### Ce avem BINE:
- Applicability Engine (funcționează)
- e-Factura Validator (funcționează)
- AI Inventory + Classification (bine implementat)
- NIS2 Eligibility + Assessment (bine implementat)
- Partner Portfolio (bine implementat, fără white-label)

### Ce LIPSEȘTE (Top 5):
1. **White-label** - Partenerii nu pot vinde sub brand propriu
2. **ONRC Integration** - Utilizatorul trebuie să introducă datele manual
3. **e-Factura Auto-repair** - Doar basic, nu completează date din profil
4. **Regulatory Radar Auto-tasks** - Detectează dar nu acționează
5. **ANAF SPV Integration** - Nu poate trimite automat facturi

### Recomandare:
Prioritizează white-label + ONRC integration în următoarele 2 luni pentru a atrage parteneri (contabili).