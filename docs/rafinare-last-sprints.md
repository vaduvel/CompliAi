# Rafinare Last Sprints — Ultimele 3 Features Lipsă
**Data:** 2026-03-21
**Scop:** Cele 3 features care duc acoperirea de la 80-90% la 95%+ pe toate segmentele de utilizatori.
**Efort total estimat:** ~5.5 zile

---

## 1. Checklist per Tip Incident (breach / DDoS / ransomware)

**Efort:** 2-3 ore
**Impact:** Diferențiator vânzare — NIS2 Manager NU oferă asta

### De ce contează
- DNSC cere notificare în 24h — firmele intră în panică și nu știu ce pași să facă
- Diferența între un breach de date și un DDoS e enormă ca răspuns
- Firma de transport (Bogdan, 120 angajați) are nevoie de ghidare pas cu pas

### Ce trebuie implementat
Templates diferențiate în Resolution Layer per tip incident:

**Breach de date personale:**
1. Izolează sistemul afectat (nu opri, izolează)
2. Documentează ce date au fost expuse (tip, volum, categorii persoane)
3. Verifică dacă datele erau criptate
4. Notifică DPO-ul intern (dacă există)
5. Pregătește notificarea ANSPDCP (72h) — CompliScan generează formularul
6. Evaluează dacă trebuie notificați persoanele afectate (Art. 34 GDPR)
7. Colectează loguri și evidențe pentru dosar

**DDoS / Indisponibilitate serviciu:**
1. Activează planul de continuitate (dacă există)
2. Contactează furnizorul de hosting/cloud
3. Documentează ora începerii, durata, serviciile afectate
4. Verifică dacă atacul a acoperit o exfiltrare de date
5. Notifică DNSC (24h dacă entitate esențială NIS2)
6. Pregătește raport tehnic incident

**Ransomware:**
1. NU plăti răscumpărarea
2. Deconectează sistemul de la rețea IMEDIAT
3. Verifică ce backup-uri sunt disponibile și neafectate
4. Documentează: tip ransomware, nota de răscumpărare, extensie fișiere
5. Notifică DNSC (24h) — CompliScan generează formularul
6. Raportează la poliție (DIICOT dacă e cazul)
7. Verifică dacă date personale au fost exfiltrate înainte de criptare

**Acces neautorizat:**
1. Schimbă imediat credențialele compromise
2. Verifică logurile de acces — ce a fost accesat
3. Revocă sesiunile active ale contului compromis
4. Documentează: vector de atac, durata accesului, date accesate
5. Evaluează dacă e notificabil DNSC/ANSPDCP
6. Implementează MFA dacă nu exista

### Unde se implementează
- `lib/compliance/incident-checklists.ts` — templates per tip
- Modificare în Resolution Layer: când finding-ul e de tip incident, afișează checklist-ul specific
- Legătură cu C4 din automation doc (clasificare Gemini determină tipul → selectează checklist-ul)

---

## 2. Digest Agregat Partner Hub (toți clienții într-un singur raport)

**Efort:** 2 zile
**Impact:** Contabilul (Elena, 35 clienți) trece de la verificare manuală la overview instant

### De ce contează
- Consultanții sunt PRIORITATEA 1 pentru revenue (1.000-2.500 lei/lună)
- Fără digest agregat, Elena verifică fiecare din cei 35 clienți manual
- Cu digest: deschide un singur email luni dimineață și știe exact cine are urgențe

### Ce trebuie implementat

**Email săptămânal Partner (luni 8:30 AM):**
- Tabel cu toți clienții, sortat după urgență
- Per client: scor conformitate, delta față de săptămâna trecută, nr. alerte deschise, deadline-uri urgente
- Evidențiere vizuală: roșu pentru clienți cu scor scăzut sau deadline iminent
- Link direct per client spre dashboard-ul acelui client
- Sumar: "X clienți necesită atenție, Y sunt în regulă"

**Structura datelor per client:**
```
{
  orgName: string
  score: number
  scoreDelta: number | null
  alerteOpen: number
  deadlineUrgente: number
  nis2Flag: boolean
  ultimaActivitate: string (data)
}
```

### Unde se implementează
- Extindere `email/weekly-digest.ts` cu funcția `sendPartnerWeeklyDigest()`
- Cron separat sau adăugat în cron-ul existent weekly-digest
- Filtrare: trimite doar la userii cu rol `partner` sau `consultant`

---

## 3. Raport Lunar Automat per Client (generat și trimis consultantului)

**Efort:** 3 zile
**Impact:** "Tool de lucru zilnic" în loc de "tool ocazional"

### De ce contează
- Consultantul (Radu, 12 clienți) trebuie să livreze raport lunar fiecărui client
- Acum: generează manual Audit Pack + One-Page Report + email manual per client
- Cu automatizare: primește email pe 1 ale lunii cu raportul gata de trimis per client

### Ce trebuie implementat

**Cron lunar (1 ale lunii, 09:00):**
- Per client din portofoliul consultantului:
  - Generează One-Page Report PDF (funcție existentă)
  - Calculează: scor curent, delta față de luna trecută, findings rezolvate/noi, documente generate
  - Compune email cu sumar + PDF atașat
- Trimite UN SINGUR email consultantului cu toate rapoartele:
  - Sumar portofoliu (câți clienți s-au îmbunătățit, câți au scăzut)
  - Per client: mini-card cu scor + link spre raport complet
  - Atașament: ZIP cu PDF-urile per client (opțional, dacă sub 10MB)

**Alternativă simplă (fără atașamente):**
- Email cu link-uri spre dashboard per client
- Buton "Descarcă toate rapoartele" → generează ZIP on-demand

### Unde se implementează
- `app/api/cron/partner-monthly-report/route.ts` — cron nou
- Extindere `email/email-alerts.ts` cu template email Partner Monthly
- Folosește funcții existente: `generateAuditPack()`, `handleDownloadExecutivePdf()`
- Adaugă în `vercel.json`: `{ "path": "/api/cron/partner-monthly-report", "schedule": "0 9 1 * *" }`

---

## Rezumat impact

| Feature | Segment afectat | Acoperire înainte | Acoperire după |
|---|---|---|---|
| Checklist incident | Firme medii NIS2 | 90% | 95% |
| Digest Partner | Contabili/consultanți | 80% | 95% |
| Raport lunar auto | Contabili/consultanți | 80% | 95% |

**Rezultat final: toate segmentele la 95%+ acoperire.**
