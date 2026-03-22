# CompliScan — Ce API-uri și metode folosim ca să automatizăm munca oamenilor
**Data:** 2026-03-20
**Scop:** Harta completă a integrărilor disponibile real, ce automatizăm cu fiecare,
și ce facem când API-ul nu există (workaround inteligent).

---

## Realitatea API-urilor românești (înainte să construiești orice)

| Instituție | API disponibil? | Autentificare | Ce poți face |
|---|---|---|---|
| ANAF e-Factura | ✅ DA, real | OAuth2 + certificat digital | Fetch facturi, mesaje SPV, validare XML |
| ANAF SPV | ✅ DA, parțial | OAuth2 + certificat digital | Mesaje, cereri, istoric bilanț |
| ANAF CUI lookup | ✅ DA, public | Fără auth | Date firmă după CUI |
| DNSC | ❌ NU | — | Zero API, doar email |
| ANSPDCP | ❌ NU | — | Zero API, doar formular web |
| Monitorul Oficial | ❌ NU | — | Scraping HTML |
| EUR-Lex | ✅ DA | Fără auth | Acte normative EU în toate limbile |
| Google Vision OCR | ✅ DA | API Key | OCR documente, PDF, imagini |
| Gemini / Claude | ✅ DA | API Key | Analiză semantică, generare text |

---

---

# INTEGRARE 1 — ANAF OAuth2 + e-Factura API
## Cel mai important și cel mai valoros

---

### Ce este

ANAF pune la dispoziția dezvoltatorilor de aplicații un sistem OAuth2
la adresa `anaf.ro/InregOauth`. Orice aplicație software se poate înregistra
și obține acces la serviciile electronice ANAF.

După înregistrarea pe portalul ANAF și obținerea unui certificat digital
calificat, primești Client ID și Client Secret. Endpoint-urile de autentificare sunt:
Authorization: `logincert.anaf.ro/anaf-oauth2/v1/authorize`
Token: `logincert.anaf.ro/anaf-oauth2/v1/token`

### Ce face API-ul e-Factura concret

API-ul permite: validarea XML-ului facturii, verificarea stării unui mesaj
transmis anterior, obținerea listei de mesaje disponibile pentru descărcare,
cu filtrare după număr de zile și CIF.

Transmisia tehnică se face machine-to-machine via API sau prin upload pe portal.
Odată transmisă, răspunsul ANAF (aprobare sau raport de eroare) apare în SPV.
Furnizorii trebuie să monitorizeze SPV-ul pentru a confirma că facturile au fost acceptate.

### Ce automatizăm cu el în CompliScan

**1. Import automat furnizori**
La conectarea contului ANAF al userului, CompliScan trage automat
lista tuturor furnizorilor cu care firma a avut tranzacții în ultimele 60 de zile.
Fiecare furnizor nou → alertă "furnizor nou detectat — evaluează riscul NIS2".

**2. Monitor facturi respinse zilnic**
Cron zilnic 6:00 AM: fetch mesaje SPV din ultimele 24 ore.
Dacă există facturi respinse → alertă imediată cu motivul erorii și cum să o corecteze.
Userul află de eroare în 6 ore, nu în 5 zile când își amintește să verifice SPV-ul.

**3. Validare XML înainte de trimitere**
Userul uploadează XML-ul facturii → CompliScan validează local (ai deja
`efactura-validator.ts` cu 15+ reguli) + validare via API ANAF.
Dacă trece → semnal verde. Dacă nu → erori exacte cu cum să le repare.

**4. Detecție semnale de risc fiscal**
Analizezi pattern-urile din mesajele SPV:
- Furnizor cu multe facturi respinse → risc furnizor crescut
- Facturi cu valori anormale față de media istorică → semnal risc
- Frecvență neobișnuită de tranzacții → alertă

**5. Pre-fill automat vendor risk questionnaire**
La adăugarea unui furnizor din e-Factura → CompliScan știe deja:
CUI furnizor, denumire, adresă, CAEN, istoricul tranzacțiilor.
Questionnaire-ul de vendor risk → 80% pre-completat automat.

### Cum implementezi

```
Pas 1: Înregistrezi CompliScan pe portal.anaf.ro ca aplicație OAuth2
Pas 2: Userul se autentifică cu certificatul său digital (one-time setup)
Pas 3: Stochezi refresh token în Supabase (encrypted, per org)
Pas 4: Cron zilnic folosește token-ul pentru a fetch mesajele SPV
Pas 5: Procesezi răspunsul și actualizezi state-ul org-ului
```

**Limitare importantă:** Necesită că userul să aibă certificat digital calificat
și cont în SPV. ~70% din firmele cu obligații e-Factura îl au deja.
Pentru restul: workaround prin upload manual XML (ai deja asta).

**Fișiere existente de extins:** `efactura-validator.ts`, `POST /api/nis2/vendors/import-efactura`

---

---

# INTEGRARE 2 — ANAF CUI Lookup API (public, fără auth)
## Simplu, rapid, valoros

---

### Ce este

ANAF oferă un endpoint public fără autentificare pentru date de identificare
după CUI. Returnează: denumire firmă, adresă, CAEN, cod fiscal, status TVA,
stare firmă (activă/radiată/inactivă).

**Endpoint:** `https://webserviced.anaf.ro/SPVWS2/rest/cerere?tip=DATE IDENTIFICARE&cui=XXXXXXX`

### Ce automatizăm cu el

**1. Verificare automată furnizor la adăugare**
Userul introduce CUI-ul unui furnizor → CompliScan fetches automat datele complete.
Nu mai completează manual: denumire, adresă, CAEN, sector.
În plus: verifică dacă firma e activă (nu radiată).

**2. Pre-fill org profile la onboarding**
La înregistrare, userul introduce CUI-ul firmei sale →
CompliScan completează automat tot profilul organizației:
denumire, adresă, CAEN, sector, status TVA.
Onboarding-ul scade de la 10 minute la 2 minute.

**3. Clasificare automată sector NIS2**
Pe baza CAEN-ului, CompliScan determină automat dacă firma e
în sectoare NIS2 obligatorii (IT, energie, transport, sănătate, financiar).
Userul nu mai trebuie să știe că CAEN 6201 = sectorul IT = NIS2 obligatoriu.

**4. Validare furnizori în bulk pentru consultanți**
Un contabil cu 30 de clienți → upload lista CUI-uri → CompliScan validează
toți furnizorii simultan și marchează pe cei radiați sau cu probleme.

### Cum implementezi

```javascript
// Simplu fetch, fără OAuth
const response = await fetch(
  `https://webserviced.anaf.ro/SPVWS2/rest/cerere?tip=DATE IDENTIFICARE&cui=${cui}`
);
const data = await response.json();
// Returnează: denumire, adresa, cod_caen, stare, tva_platitor
```

**Timp de implementare: 1 zi**
**Fișiere de creat:** `lib/anaf-cui-client.ts`

---

---

# INTEGRARE 3 — Google Vision OCR
## Deja în cod, dar subutilizat

---

### Ce este

API de la Google pentru extragere text din imagini și PDF-uri.
Funcționează pe orice document: contracte scanate, fotografii de documente,
PDF-uri generate de soft-uri vechi care nu permit copy-paste.

### Ce automatizăm cu el (extins față de ce ai acum)

**1. Import NIS2@RO Tool oficial (Excel/PDF)**
Userul uploadează tool-ul Excel descărcat de pe DNSC →
Vision extrage toate câmpurile și întrebările →
Gemini mapează la wizard-ul intern →
85-95% pre-completat automat.

**2. Scanare contracte primite de la parteneri**
Contractul vine scanat sau ca PDF din soft contabil →
Vision extrage textul → Gemini analizează clauzele →
Findings cu ce lipsește din perspectivă GDPR/NIS2.

**3. Procesare documente de identitate pentru GDPR**
Firme care procesează copii CI/pașapoarte →
Verifică că au consimțământ documentat pentru fiecare copie procesată.

**4. Digitizare arhivă veche**
Firme cu documente de conformitate vechi pe hârtie →
Upload batch de imagini → CompliScan le digitizează și le indexează
în Auditor Vault cu dată și categorie.

**Fișiere existente:** Ai deja Google Vision integrat în scan pipeline.
Extinzi pentru noile source types.

---

---

# INTEGRARE 4 — Gemini API (sau Claude API)
## Creierul automatizării

---

### Ce face concret în CompliScan

Gemini/Claude nu e un chatbot. E motorul care transformă
date brute în acțiuni inteligente. Iată exact ce face:

**1. Analiză semantică documente (nu keyword matching)**

În loc de: "dacă documentul conține cuvântul 'date personale' → finding GDPR"
Face: "Acest contract transferă responsabilitatea prelucrării datelor
angajaților către un terț fără a specifica temeiul legal — Art. 28 GDPR
cere un DPA explicit. Confidence: 94%. Sursă: clauza 7.3, paragraful 2."

**2. Clasificare automată tip firmă și obligații**

Input: CAEN 6201, 22 angajați, București, folosește ChatGPT în producție
Output: "Entitate importantă NIS2 (sector IT, >10 angajați).
Obligații: înregistrare DNSC, assessment maturitate, incident management.
Deadline: sept. 2025 (expirat — risc amendă). AI Act: sistem AI declarat
cu potențial high-risk — necesită Annex IV."

**3. Rezumare modificări legislative**

Input: pagina web DNSC cu o circulară nouă de 15 pagini
Output: "DNSC a actualizat cerințele pentru Planul de Răspuns la Incidente
(Art. 21(2)(b)). Schimbarea principală: termenul de notificare intermediară
scade de la 72h la 48h. Te afectează dacă: ești entitate NIS2 și nu ai
actualizat planul în ultimele 6 luni. Acțiune: actualizează documentul
'Incident Response Plan' din Auditor Vault."

**4. Generare documente contextualizate**

Nu generează un DPA generic. Generează un DPA specific pentru:
- DORI SRL (furnizor) → FIRMA XYZ (client)
- Tip date: date angajați (nume, CNP, salariu)
- Temeiul legal: contract de muncă Art. 6(1)(b) GDPR
- Durata: pe durata contractului + 5 ani arhivare
- Măsuri tehnice: specifice pentru sectorul IT

**5. Scoring confidence per finding**

Fiecare finding generat are:
- Confidence score (0-100%)
- Reasoning chain (de ce a ajuns la această concluzie)
- Sursă exactă (paragraf, pagină, clauză)
- Acțiune recomandată cu referință legală exactă

**Implementare:** Ai deja `gemini.ts` și `/api/chat`.
Extinzi cu prompts specializate per use-case în loc de un singur prompt generic.

---

---

# INTEGRARE 5 — EUR-Lex API (legislație EU)
## Radar legislativ automat

---

### Ce este

EUR-Lex este baza de date oficială a legislației Uniunii Europene.
Are un API public fără autentificare care permite căutarea și
descărcarea actelor normative în toate limbile UE, inclusiv română.

**Endpoint:** `https://eur-lex.europa.eu/search.html?type=quick&lang=ro`
**API SPARQL:** `https://publications.europa.eu/webapi/rdf/sparql`

### Ce automatizăm cu el

**1. Monitor modificări AI Act**

Cron săptămânal: verifică dacă au apărut acte delegate sau
de implementare noi sub AI Act (Regulation 2024/1689).
Dacă da → rezumat în română → alertă utilizatori cu sisteme AI declarate.

**2. Monitor modificări NIS2**

Verifică amendamente la Directiva NIS2 (2022/2555) și
actele de implementare naționale.

**3. Bază de cunoștințe juridice pentru Gemini**

Când Gemini analizează un document, poate referenția textul exact
din legislație (nu doar articolul) pentru a crește acuratețea finding-urilor.

**Implementare:** Cron săptămânal, `http-client.ts` existent.
Creezi `lib/eurlex-monitor.ts` (estimat: 2 zile).

---

---

# INTEGRARE 6 — Web Scraping surse românești
## Când nu există API

---

### Ce scraping faci și de unde

Niciuna din sursele românești principale nu are API. Le monitorizezi
prin scraping HTML cu hash comparison (detectezi modificări față de
snapshot-ul anterior).

| Sursă | URL | Ce monitorizezi | Frecvență |
|---|---|---|---|
| ANSPDCP | `dataprotection.ro/web/guest/acasa` | Ghiduri, decizii, amenzi publicate | Zilnic |
| DNSC | `dnsc.ro/noutati` | Circulare, ghiduri NIS2 | Zilnic |
| ANAF Noutăți | `anaf.ro/anaf/internet/ANAF/noutati` | Modificări proceduri fiscale | Zilnic |
| Monitorul Oficial | `monitoruloficial.ro` | Legi noi publicate | Zilnic |

**Implementare:**

```typescript
// lib/legislation-monitor.ts
async function checkForChanges(url: string, orgId: string) {
  const currentContent = await fetch(url).then(r => r.text());
  const currentHash = sha256(currentContent);
  const previousHash = await getStoredHash(url, orgId);

  if (currentHash !== previousHash) {
    await storeHash(url, orgId, currentHash);
    const summary = await gemini.summarize(currentContent, {
      language: 'ro',
      focusOn: 'compliance changes affecting Romanian businesses',
      outputFormat: 'bullet points max 5'
    });
    await notifyAffectedUsers(summary, url);
  }
}
```

**Risc:** Site-urile guvernamentale se schimbă des ca structură HTML.
Construiești monitorizarea să fie robustă la schimbări minore de layout.
Fallback: dacă scraping-ul eșuează 3 zile consecutiv → alertă internă.

---

---

# INTEGRARE 7 — Resend (email) — deja în cod, extins
## Motorul de retenție

---

### Ce trimiți și când

**Email zilnic condițional (6:00 AM)**
Trimis DOAR dacă există ceva nou față de ziua anterioară:
scor scăzut, finding nou, deadline în 7 zile, modificare legislativă.
Format: subiect cu scorul + 1 CTA clar.

**Alertă imediată (în timp real) pentru 4 evenimente:**
1. Scor a scăzut față de ieri → "De ce a scăzut și ce faci"
2. Finding critic nou detectat → "Ai 1 problemă care necesită atenție azi"
3. Document expiră în 30 zile → "DPA-ul cu furnizorul X expiră în 28 zile"
4. Modificare legislativă relevantă → "DNSC a publicat ceva care te afectează"

**Digest săptămânal consultanți (luni 8:00 AM)**
Agregat per portofoliu: toți clienții, ordonați după urgență.
"3 clienți necesită atenție această săptămână."

**Raport lunar per client (1 ale lunii)**
Generat automat, trimis clientului final sau consultantului.
Gata de prezentat, fără să fie nevoie să îl scrie nimeni.

**Fișiere existente:** `email-alerts.ts`, `weekly-digest.ts`, `onboarding-emails.ts`
**Ce adaugi:** Events noi + logică condițională pentru email zilnic.

---

---

# Ce NU există și nu poți face automat

Trebuie să fii sincer cu utilizatorii despre ce necesită acțiune umană:

| Task | De ce nu se poate automatiza | Workaround |
|---|---|---|
| Înregistrare DNSC | Zero API, necesită email + semnătură digitală | Generezi formularul complet, userul îl trimite |
| Depunere notificări ANSPDCP | Zero API, formular web manual | Generezi documentul, ghidezi pasul de trimitere |
| Semnare DPA | Necesită semnătură juridică | Generezi DPA-ul, userul îl semnează și uploadează |
| Confirmare înregistrare TVA | SPV parțial, nu returnează status în timp real | Userul verifică manual în SPV |
| Verificare status dosar ANSPDCP | Zero API | Reminder manual la 30 zile |

---

---

# Arhitectura completă de automatizare

```
┌─────────────────────────────────────────────────────────────────┐
│                     SURSE DE DATE                               │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ ANAF OAuth2  │ ANAF CUI     │ EUR-Lex API  │ Scraping           │
│ e-Factura    │ Public API   │ (legislație  │ DNSC/ANSPDCP/      │
│ SPV mesaje   │ Date firmă   │  EU)         │ Monitor Oficial    │
└──────┬───────┴──────┬───────┴──────┬───────┴─────────┬──────────┘
       │              │              │                 │
       ▼              ▼              ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PROCESARE (Gemini + logică)                   │
│  Semantic analysis │ Classification │ Summarization │ Scoring   │
└─────────────────────────────────────┬───────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACȚIUNI AUTOMATE                           │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│ Findings     │ Documente    │ Vendor risk  │ Email alerts       │
│ generate     │ generate     │ update       │ (Resend)           │
│ automat      │ automat      │ automat      │                    │
└──────────────┴──────────────┴──────────────┴────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN IN THE LOOP                            │
│  Aprobare finding │ Semnare document │ Trimitere la autoritate  │
│  (doar pe Low     │ (mereu manual)   │ (mereu manual)           │
│   confidence)     │                  │                          │
└─────────────────────────────────────────────────────────────────┘
```

---

---

# Ordinea de implementare (după ce stabilizezi aplicația)

| Prioritate | Integrare | Efort | Impact | Când |
|---|---|---|---|---|
| P0 | ANAF CUI Public API | 1 zi | ★★★★★ | Înainte de beta |
| P0 | Email zilnic condițional | 2 zile | ★★★★★ | Înainte de beta |
| P1 | Gemini prompts specializate per use-case | 3 zile | ★★★★★ | Luna 1 |
| P1 | ANAF OAuth2 + e-Factura fetch automat | 5 zile | ★★★★★ | Luna 1-2 |
| P2 | Scraping legislativ (DNSC/ANSPDCP) | 3 zile | ★★★★☆ | Luna 2 |
| P2 | EUR-Lex monitor | 2 zile | ★★★☆☆ | Luna 2 |
| P3 | Import NIS2@RO Tool cu Gemini | 3 zile | ★★★★☆ | Luna 3 |
| P3 | Digest săptămânal consultanți | 2 zile | ★★★★★ | Luna 3 |

**Total efort estimat realist: 3-4 săptămâni de dev**
**Dar P0 se poate face în prima săptămână și aduce valoare imediată.**

---

## Mesajul final pentru utilizator

Când compliScan e complet integrat, mesajul pe care îl poți promite:

> "Conectezi contul tău ANAF o singură dată.
> De atunci, CompliScan monitorizează zilnic SPV-ul tău,
> îți alertează când apar probleme fiscale sau de conformitate,
> generează automat documentele necesare
> și îți spune exact ce ai de semnat și trimis.
> Tu faci doar ce necesită semnătura ta.
> Restul îl facem noi."
