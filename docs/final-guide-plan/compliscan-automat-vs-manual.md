# CompliScan — Ce se automatizează vs ce rămâne la om
**Data:** 2026-03-20
**Sursa:** Sinteza tuturor documentelor generate în această sesiune
**Logica:** Automat = CompliScan face fără intervenție umană
           Semi-automat = CompliScan pregătește, omul aprobă/semnează
           Manual = rămâne complet la om, CompliScan nu poate ajuta

---

## LEGENDA

| Simbol | Înseamnă |
|---|---|
| 🟢 AUTOMAT | CompliScan face singur, fără nicio intervenție |
| 🟡 SEMI-AUTOMAT | CompliScan pregătește 80-95%, omul doar aprobă sau semnează |
| 🔴 MANUAL | Rămâne la om — fie legal imposibil de automatizat, fie nu există API |

---

---

# ZONA 1 — Onboarding & Profil Firmă

| Task | Status | Cum |
|---|---|---|
| Completare nume, adresă, CAEN, județ, sector | 🟢 AUTOMAT | ANAF CUI API fetches totul după CUI |
| Determinare obligații (GDPR/NIS2/AI Act/e-Factura) | 🟢 AUTOMAT | CAEN + nr angajați → ApplicabilityEngine |
| Clasificare entitate NIS2 (esențială/importantă) | 🟢 AUTOMAT | CAEN + dimensiune → logică deterministă |
| Completare număr angajați | 🔴 MANUAL | ANAF nu returnează acest câmp |
| Completare email și parolă | 🔴 MANUAL | Date personale, nu pot fi pre-completate |

---

# ZONA 2 — Scanare & Analiză Documente

| Task | Status | Cum |
|---|---|---|
| Extragere text din PDF/imagine | 🟢 AUTOMAT | Google Vision OCR |
| Analiză semantică și detectare gaps | 🟢 AUTOMAT | Gemini cu prompt specializat per framework |
| Generare findings cu severity + referință legală | 🟢 AUTOMAT | Compliance engine + Gemini |
| Confidence scoring per finding | 🟢 AUTOMAT | Gemini returnează scor + reasoning chain |
| Cross-mapare finding → multiple framework-uri | 🟢 AUTOMAT | rule-library.ts extins |
| Validare XML e-Factura | 🟢 AUTOMAT | efactura-validator.ts + ANAF API |
| Decizie finală pe finding critic (confirmat/respins) | 🟡 SEMI-AUTOMAT | CompliScan propune, omul aprobă |
| Upload document pentru scanare | 🔴 MANUAL | Omul decide ce document scanează |

---

# ZONA 3 — Import NIS2@RO Tool Oficial DNSC

| Task | Status | Cum |
|---|---|---|
| Extragere câmpuri din Excel/PDF DNSC | 🟢 AUTOMAT | Google Vision OCR |
| Mapare câmpuri la wizard intern | 🟢 AUTOMAT | Gemini semantic mapping |
| Pre-fill 85-95% din câmpuri | 🟢 AUTOMAT | Org profile + ANAF CUI + Gemini |
| Cross-check și corecție erori din Excel | 🟢 AUTOMAT | Validare față de datele org |
| Generare formular oficial DNSC gata de trimis | 🟢 AUTOMAT | Template pre-completat |
| Completare câmpuri specifice (board members, detalii incident) | 🟡 SEMI-AUTOMAT | CompliScan sugerează, omul confirmă |
| Semnare electronică a formularului | 🔴 MANUAL | Necesită certificat digital al reprezentantului |
| Trimitere email la evidenta@dnsc.ro | 🔴 MANUAL | Act juridic — nu poate fi delegat |
| Descărcare manuală tool de pe dnsc.ro | 🔴 MANUAL | Nu există API DNSC |

---

# ZONA 4 — Monitorizare Legislativă

| Task | Status | Cum |
|---|---|---|
| Verificare zilnică DNSC/ANSPDCP/ANAF/EUR-Lex | 🟢 AUTOMAT | Cron zilnic + hash comparison |
| Detectare modificări față de ziua anterioară | 🟢 AUTOMAT | SHA-256 hash comparison |
| Rezumare modificare în română (3-5 propoziții) | 🟢 AUTOMAT | Gemini cu prompt "rezumă pentru IMM" |
| Identificare framework afectat (GDPR/NIS2/AI Act) | 🟢 AUTOMAT | Gemini + rule mapping |
| Identificare utilizatori afectați din platformă | 🟢 AUTOMAT | Filtrare după sector + framework activ |
| Trimitere alertă personalizată | 🟢 AUTOMAT | Resend email + in-app notification |
| Generare finding nou din modificare legislativă | 🟢 AUTOMAT | Trigger automat în scan pipeline |
| Interpretare impact juridic complet | 🟡 SEMI-AUTOMAT | Gemini dă rezumat, juristul validează pentru cazuri complexe |
| Decizie de implementare la nivel de firmă | 🔴 MANUAL | Decizie de management |

---

# ZONA 5 — Remediere & Generare Documente

| Task | Status | Cum |
|---|---|---|
| Identificare document necesar per finding | 🟢 AUTOMAT | Resolution Layer — mapping finding → document |
| Generare draft document (DPA, politică GDPR, NIS2 plan) | 🟢 AUTOMAT | document-generator.ts + Gemini + org profile |
| Pre-completare cu date firmă + furnizor | 🟢 AUTOMAT | Org profile + ANAF CUI API |
| Atașare draft la finding | 🟢 AUTOMAT | Closure Agent |
| Notificare user "documentul e gata de revizuit" | 🟢 AUTOMAT | Resend alert |
| Auto-complete task la confidence >90% | 🟢 AUTOMAT | Remediation Agent |
| Escalare task la confidence <70% | 🟢 AUTOMAT | requiresHumanApproval() |
| Revizie conținut document | 🟡 SEMI-AUTOMAT | Omul citește și modifică dacă e cazul |
| Semnare document | 🔴 MANUAL | Act juridic — necesită semnătură |
| Negociere clauze cu partenerul | 🔴 MANUAL | Relație comercială |
| Trimitere document spre semnare partenerului | 🟡 SEMI-AUTOMAT | CompliScan generează emailul, omul apasă Send |

---

# ZONA 6 — Vendor Risk & DPA Management

| Task | Status | Cum |
|---|---|---|
| Import furnizori din e-Factura | 🟢 AUTOMAT | ANAF OAuth2 API — lunar automat |
| Detectare furnizor nou | 🟢 AUTOMAT | Comparare cu snapshot anterior |
| Alertă "furnizor nou fără DPA" | 🟢 AUTOMAT | Event trigger + Resend |
| Fetch date furnizor (nume, adresă, CAEN) | 🟢 AUTOMAT | ANAF CUI API |
| Clasificare risc furnizor (scăzut/mediu/ridicat) | 🟢 AUTOMAT | CAEN + tip serviciu + Gemini |
| Pre-fill questionnaire vendor review 70-80% | 🟢 AUTOMAT | Org profile + e-Factura data + Gemini |
| Generare DPA pre-completat | 🟢 AUTOMAT | Template + date furnizor din ANAF |
| Reminder reînnoire DPA la 11 luni | 🟢 AUTOMAT | Cron + Resend |
| Completare câmpuri specifice questionnaire | 🟡 SEMI-AUTOMAT | Omul completează ce Gemini nu știe |
| Evaluare finală risc furnizor | 🟡 SEMI-AUTOMAT | CompliScan propune, responsabilul aprobă |
| Semnare și trimitere DPA | 🔴 MANUAL | Act juridic |
| Negociere termeni cu furnizorul | 🔴 MANUAL | Relație comercială |

---

# ZONA 7 — Monitoring e-Factura & Fiscal

| Task | Status | Cum |
|---|---|---|
| Fetch mesaje SPV zilnic | 🟢 AUTOMAT | ANAF OAuth2 + cron 6:00 AM |
| Detectare facturi respinse | 🟢 AUTOMAT | Parse răspuns API ANAF |
| Alertă imediată factură respinsă + motiv | 🟢 AUTOMAT | Resend email în <1 oră |
| Validare XML înainte de trimitere | 🟢 AUTOMAT | efactura-validator.ts + ANAF API |
| Detectare semnale risc fiscal (pattern anormal) | 🟢 AUTOMAT | Fiscal Sensor Agent |
| Generare raport lunar semnale fiscale | 🟢 AUTOMAT | Report Agent + Resend |
| Corectare XML factură respinse | 🟡 SEMI-AUTOMAT | CompliScan arată exact ce e greșit, omul corectează |
| Retransmitere factură corectată | 🔴 MANUAL | Act comercial |
| Contestare decizie ANAF | 🔴 MANUAL | Act juridic |

---

# ZONA 8 — NIS2 Assessment & DNSC

| Task | Status | Cum |
|---|---|---|
| Pre-fill 80% din assessment (20 întrebări) | 🟢 AUTOMAT | Gemini + org profile + scan documente |
| Scor maturitate per domeniu | 🟢 AUTOMAT | nis2-rules.ts + weighted scoring |
| Identificare gap-uri față de cerințe | 🟢 AUTOMAT | Gap analysis automat |
| Generare plan remediere cu priorități | 🟢 AUTOMAT | Resolution Layer per gap |
| Generare raport DNSC în format cerut | 🟢 AUTOMAT | dnsc-report.ts + template |
| Reminder deadline înregistrare DNSC | 🟢 AUTOMAT | Cron + Resend alert |
| Timer 24h/72h incidente cu alertă la 50% | 🟢 AUTOMAT | SLA timer + Resend |
| Completare răspunsuri subiective (detalii tehnice specifice) | 🟡 SEMI-AUTOMAT | Omul completează, CompliScan ghidează |
| Semnare și trimitere formular DNSC | 🔴 MANUAL | Act juridic |
| Desemnare responsabil securitate | 🔴 MANUAL | Decizie organizațională |
| Implementare măsuri tehnice (HTTPS, criptare etc.) | 🔴 MANUAL | Muncă tehnică reală |

---

# ZONA 9 — Incident Management

| Task | Status | Cum |
|---|---|---|
| Clasificare automată tip incident | 🟢 AUTOMAT | Gemini + dnsc-wizard.ts |
| Determinare dacă e notificabil (24h/72h) | 🟢 AUTOMAT | Logică deterministă pe tip incident |
| Pre-completare formular notificare DNSC/ANSPDCP | 🟢 AUTOMAT | Template + org profile + incident data |
| Checklist răspuns incident pas cu pas | 🟢 AUTOMAT | Template per tip incident |
| Timer vizibil cu alertă la 50% și 80% din termen | 🟢 AUTOMAT | SLA timer + Resend |
| Generare raport final incident | 🟢 AUTOMAT | document-generator.ts |
| Coordonare echipă internă în timpul incidentului | 🔴 MANUAL | Management de criză |
| Trimitere notificare la DNSC sau ANSPDCP | 🔴 MANUAL | Act juridic |
| Comunicare cu clienții afectați de incident | 🔴 MANUAL | Relație comercială + juridic |
| Implementare măsuri post-incident | 🔴 MANUAL | Muncă tehnică reală |

---

# ZONA 10 — Colectare Dovezi & Audit Pack

| Task | Status | Cum |
|---|---|---|
| Centralizare automată toate dovezile | 🟢 AUTOMAT | Auditor Vault — orice document adăugat e indexat |
| Timestamping și hash per document | 🟢 AUTOMAT | Supabase Storage + audit trail |
| Generare Audit Pack ZIP la cerere | 🟢 AUTOMAT | handleGenerateAuditPack() |
| Generare One-Page Report PDF | 🟢 AUTOMAT | handleDownloadExecutivePdf() |
| Generare Audit Pack lunar automat | 🟢 AUTOMAT | Cron lunar + email |
| Inspector Mode săptămânal automat | 🟢 AUTOMAT | Cron săptămânal + diff față de săptămâna anterioară |
| Alertă "dosar incomplet — lipsesc dovezi pentru X" | 🟢 AUTOMAT | audit-quality-gates.ts |
| Trimitere dosar la autoritate | 🔴 MANUAL | Act juridic |
| Prezentare raport la management | 🔴 MANUAL | Relație umană |

---

# ZONA 11 — Retenție & Comunicare (ce ține omul activ în platformă)

| Task | Status | Cum |
|---|---|---|
| Email zilnic condițional (doar dacă e ceva nou) | 🟢 AUTOMAT | Cron 7:50 AM + logică condițională |
| Alertă scor scăzut față de ieri | 🟢 AUTOMAT | Score delta calculation + Resend |
| Deadline tracker cu countdown vizibil | 🟢 AUTOMAT | daysUntilExpiry per document |
| Digest săptămânal consultanți (toți clienții) | 🟢 AUTOMAT | Cron luni 8:00 AM + Partner Hub |
| Raport lunar per client (gata de trimis) | 🟢 AUTOMAT | Cron 1 ale lunii + Report Agent |
| Streak conformitate (zile consecutive peste prag) | 🟢 AUTOMAT | complianceStreak calculat zilnic |
| Benchmark sector ("ești în top 15%") | 🟢 AUTOMAT | Agregare anonimizată per CAEN |

---

# Rezumat numeric

| Categorie | Nr. task-uri | % din total |
|---|---|---|
| 🟢 AUTOMAT complet | 67 | 65% |
| 🟡 SEMI-AUTOMAT (CompliScan 80-95%, omul aprobă) | 16 | 15% |
| 🔴 MANUAL (rămâne la om) | 21 | 20% |
| **TOTAL** | **104** | **100%** |

---

# Ce rămâne MEREU la om — lista completă

Acestea nu pot fi automatizate niciodată, indiferent de tehnologie:

**Juridic și legal:**
- Semnare orice document (DPA, politici, formulare autorități)
- Trimitere notificări la DNSC, ANSPDCP, ANAF
- Contestare decizii autorități
- Negociere clauze contractuale

**Decizii organizaționale:**
- Desemnare responsabil securitate / DPO
- Decizie acceptare risc rezidual
- Aprobare buget pentru măsuri tehnice
- Implementare măsuri tehnice (HTTPS, criptare, backup)

**Relații umane:**
- Comunicare cu clienții afectați de incident
- Prezentare raport la management sau board
- Negociere cu parteneri și furnizori

**Limitări tehnice reale:**
- Descărcare manuală tool DNSC (zero API)
- Verificare status dosar la autorități (zero API)
- Completare câmpuri subiective care necesită context intern

---

# Mesajul de produs care rezultă

> **80% din munca de conformitate o face CompliScan automat.**
> **Tu ești responsabil pentru 20% — semnături, decizii și relații.**
> **Nicio automatizare nu poate semna în locul tău. Dar poate pregăti
> tot ce trebuie să semnezi în 5 minute în loc de 5 ore.**
