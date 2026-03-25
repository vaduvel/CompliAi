# CompliScan — Sprint Etapa 1: Implementation Ready
**Data:** 2026-03-25  
**Status:** Gata de dat la developer  
**Principiu:** Nu construim module noi. Facem vizibile lucrurile care există.

---

## ⚠️ TASK 0 — Hotfix urgent (înainte de orice altceva)
**Prioritate: Săptămâna 1, ziua 1. Nu e backlog — e eroare activă.**

### Corectare logică NIS2 în `lib/compliance/nis2-rules.ts`

**Problema:** Termenul pentru raportul final NIS2 este documentat greșit în cod.

**Ce e greșit acum:**
- Logica curentă calculează termenul raportului final ca 30 zile de la incident

**Ce e corect:**
- Raport inițial: 72 ore de la detectarea incidentului
- Raport final: 30 zile de la raportul inițial (nu de la incident) → deci ~32 zile de la incident
- Dacă incidentul nu e rezolvat la 30 zile: se trimite raport de progres la 30 zile + raport final la închidere

**Acțiune:** Verifică și corectează calculul de deadline în `lib/compliance/nis2-rules.ts`

**Metrică de validare:** Zero utilizatori să primească deadline greșit după fix. Testează cu un incident simulat creat ieri — deadline-ul afișat trebuie să fie ziua 32, nu ziua 30.

---

## TASK 1 — Finish Screen Onboarding
**Fișier:** `app/onboarding/finish/page.tsx` (sau echivalentul)  
**Efort estimat:** 1 zi  
**Săptămâna:** 1

### Ce se schimbă
Onboarding-ul nu mai se termină cu lista de findings. Se termină cu un ecran de confirmare care comunică că s-a creat baza de conformitate.

### Copy exact
```
✓ Am creat primul snapshot de conformitate al firmei tale
✓ Am detectat ce reglementări ți se aplică
✓ Am pregătit primul raport de bază
✓ Dacă vine un control mâine, nu mai pornești de la zero

[ Văd ce am acumulat →]
```

### Metrică de succes
- **Primară:** Click-rate pe CTA „Văd ce am acumulat" — țintă baseline: ≥ 40%
- **Secundară:** Retenție la 30 zile a utilizatorilor care au văzut noul finish screen vs. varianta veche (A/B dacă e posibil, altfel before/after pe cohorte)
- **Cum măsori:** Event tracking pe butonul CTA — `onboarding_finish_cta_clicked`

### Note implementare
- Datele pentru cele 4 checkmark-uri sunt statice la prima sesiune (nu depind de date reale ale utilizatorului)
- CTA duce la dashboard, cu scroll sau highlight pe accumulation card (Task 2)

---

## TASK 2 — Dashboard Accumulation Card
**Fișier nou:** `components/compliscan/dashboard/accumulation-card.tsx`  
**Efort estimat:** 2 zile  
**Săptămâna:** 1-2

### Ce afișează cardul
Card permanent lângă findings deschise, cu 5 cifre:

```
Ce am construit pentru tine
📁  [X] dovezi salvate
📄  [X] rapoarte generate
🏢  [X] furnizori monitorizați
⏱   [X] luni de monitorizare continuă
📦  Ultimul Audit Pack: acum [X] zile
```

### Surse de date — CONFIRMAT ÎNAINTE DE IMPLEMENTARE
> ⚠️ Cineva tehnic (tech lead sau PO) trebuie să confirme aceste surse înainte să înceapă implementarea. Fără confirmare, developerul blochează în ziua 1.

| Cifră afișată | Sursa de date (de confirmat) |
|---|---|
| Dovezi salvate | Tabel `vault` sau `evidence_attachments` — `COUNT` pe `org_id` |
| Rapoarte generate | Tabel `documents` sau `reports` — `COUNT` pe `org_id` |
| Furnizori monitorizați | Tabel `vendors` — `COUNT` pe `org_id` WHERE `active = true` |
| Luni de monitorizare | Diferență în luni între `created_at` pe `org` și `NOW()` |
| Ultimul Audit Pack | `MAX(created_at)` din tabelul de audit packs, calculat ca zile față de azi |

**Acțiune înainte de sprint:** Tech lead confirmă sau corectează numele exacte de tabele/coloane.

### Metrică de succes
- **Primară:** Utilizatorii care văd cardul au retenție la 60 zile mai bună decât cei care nu îl văd — urmărit pe cohorte după lansare
- **Secundară:** Zero erori de date (cifre null sau 0 pentru organizații cu activitate reală) — validat în QA înainte de lansare

### Edge cases de tratat
- Organizație nouă (0 dovezi, 0 rapoarte): cardul afișează `—` sau `0`, nu se ascunde
- Ultimul Audit Pack necunoscut: afișează `—`, nu „acum 0 zile"

---

## TASK 3 — Rewrite Email de Reînnoire
**Fișier:** Template email în sistemul de notificări  
**Efort estimat:** 2 ore copy + 1 zi implementare  
**Săptămâna:** 1

### Versiunea veche (de înlocuit)
```
Subiect: Abonamentul tău expiră în 7 zile. Reînnoiește acum.
[CTA: Reînnoiește]
```

### Versiunea nouă — copy exact

**Subiect:** `[Firma ta] — 12 luni de conformitate. Ce se întâmplă dacă nu reînnoiești.`

**Body:**
```
În ultimele 12 luni, CompliScan a acumulat pentru [Numele firmei]:

  📁 [X] dovezi de conformitate
  📄 [X] rapoarte lunare generate
  📦 [X] pachete de audit
  ⏱  Monitorizare continuă NIS2, GDPR, eFactura

Tot istoricul — dovezile, rapoartele, pachetele de audit — 
rămâne accesibil cât timp contul este activ.

La expirare, datele sunt păstrate 90 de zile, după care sunt 
șterse definitiv conform politicii noastre.

[ Păstrează istoricul tău → ]
```

**Note copy:**
- Cifrele `[X]` sunt populate dinamic din aceleași surse ca dashboard card (Task 2)
- Dacă cifrele sunt 0 pentru un utilizator, folosește fallback: „monitorizare continuă activă" fără cifre
- Tonul e factual, nu urgentizant artificial — lăsăm datele să vorbească

### Metrică de succes
- **Primară:** Rata de reînnoire în primele 7 zile de la email — comparată cu rata din ultimele 3 luni (before/after)
- **Secundară:** Click-rate pe CTA „Păstrează istoricul tău" — tracking event `renewal_email_cta_clicked`
- **Când măsori:** La 30 zile după lansarea noului template

---

## Tabel prioritizare Etapa 1

| Task | Efort | Impact | Săptămâna | Metrică de succes |
|---|---|---|---|---|
| **TASK 0** — Hotfix NIS2 rules | 0.5 zile | **Critic — eroare activă** | 1, ziua 1 | Zero deadline greșit în teste |
| **TASK 1** — Finish screen onboarding | 1 zi | **Critic — prima impresie** | 1 | Click-rate CTA ≥ 40% |
| **TASK 3** — Rewrite email reînnoire | 1 zi | **Critic — retenție directă** | 1 | Rată reînnoire comparată before/after |
| **TASK 2** — Dashboard accumulation card | 2 zile | **Mare — percepție produs** | 1-2 | Retenție 60 zile pe cohorte |

---

## Definiția „Etapa 1 validată"
Etapa 2 începe când:
1. Hotfix NIS2 e în producție și testat ✓
2. Finish screen e live și click-rate-ul CTA e măsurat pe minim 50 de sesiuni ✓
3. Email de reînnoire e live pe minim o cohortă de utilizatori cu abonament expirabil în 30 zile ✓
4. Dashboard card e live și nu are erori de date în QA ✓

**Nu e nevoie de rezultate pozitive pentru a trece la Etapa 2 — e nevoie de date măsurate.**

---

## Ce NU se face în Etapa 1
- Nu se forțează daily usage artificial
- Nu se adaugă gamification (streak-uri, badges)
- Nu se construiesc module noi
- Nu se lansează Etapa 2 înainte ca toate metricile de mai sus să fie măsurate
