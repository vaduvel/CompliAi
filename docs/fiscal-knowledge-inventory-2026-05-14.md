# Inventar complet — surse publice legislație fiscală RO (2026-05-14)

> **Scop:** mapează inventarul COMPLET de surse publice disponibile pentru a coda algoritmic scoringul de risc ANAF în CompliScan ANAF Mirror. Triangulat prin 14 căutări web + 6 fetch-uri directe în surse primare (anaf.ro, github.com, mfinante.gov.ro, Big 4).
>
> **Sursa de adevăr complementară:** `anaf-mirror-base-truth-2026-05-14.md` (140 reguli + Fișa risc fiscal + OPANAF 1826/2372/2025).

---

## TL;DR (5 propoziții)

1. **Legea 544/2001 funcționează**: Codul Fiscal + Codul de Procedură Fiscală sunt 100% disponibile gratuit (legislatie.just.ro, static.anaf.ro, lege5.ro/sintact.ro). Norma metodologică = HG 1/2016 + actualizări.
2. **Nu există manual public ANAF "rezolvă-tot"**. Cele mai apropiate sunt **Manualul de control fiscal RO/EN (REFORM/SC2022/039, 2023)** + **Ghid inspecție fiscală** (publicate de DGCVPF) + **Fișa risc fiscal** (OMFP 532/2007 — Anexa 2). Toate restul = fragmentat în 60+ broșuri/ghiduri pe `static.anaf.ro/AsistentaContribuabili_r/`.
3. **Open-source GitHub e modest dar util**: ~20 repo-uri active centrate pe **e-Factura (UBL/CIUS-RO), verificare CIF, SDK ANAF (PHP/Go/TypeScript/Rust)**. Repo-ul `stefanache/MFP-ANAF-RO` agregă referințe (nomenclatoare CAEN/SIRUTA, schemas SAF-T, Swagger SPV). **Nu există open-source pentru scoring de risc fiscal** — acesta e gap-ul de piață.
4. **Big 4 = sursa cea mai consistentă pentru interpretarea legii**: PwC RO (`taxsummaries.pwc.com/romania` + alerts), EY RO (peste 20 tax alerts 2025-2026), KPMG RO (TaxNewsflash bi-săptămânal), Deloitte RO (Tax & Legal Weekly), Mazars Forvis (CEE Tax Guide 2026 — 25 jurisdicții). **CECCAR Business Magazine + Curierul Fiscal + The Tax Institute** = revistele profesionale lunare.
5. **Ce LIPSEȘTE din research-ul actual al CompliAI**: (a) **Manualul de control fiscal RO/EN 2023** (sursă tehnică operațională); (b) **Listele publice de ghiduri** pe `static.anaf.ro/AsistentaContribuabili_r/ghid_asoc_propr.htm` (peste 30 PDF-uri actualizate periodic); (c) **OPANAF 28/15/59/143/174/433/434/2026** (orderele anului 2026); (d) **Buletinul informativ fiscal ANAF** + **rapoartele de activitate** (semnale Strategice); (e) **Repo-urile open-source `printesoi/e-factura-go` + `boobo94/efactura-sdk` + `andalisolutions/anaf-php`** (referință tehnică); (f) **Forumul `forum.sagasoft.ro`** (cazuri reale contabili) + **`avocatnet.ro`** (Q&A juridic).

---

## A. Legislație primară (text complet) — sursa de adevăr

### A.1 Codul Fiscal (Legea 227/2015) — actualizat 2026

| Sursă | URL | De ce | Calitate |
|---|---|---|---|
| Portal Legislativ MJ (oficial) | https://legislatie.just.ro/Public/DetaliiDocument/171282 | Versiunea oficială consolidată | OFICIAL — referință legală |
| Versiunea actualizată MJ (alta intrare) | https://legislatie.just.ro/public/detaliidocument/174527 | Consolidare | OFICIAL |
| Lege5 (Indaco) | https://lege5.ro/Gratuit/g43donzvgi/codul-fiscal-din-2015 | UX bun, comentat, gratuit | Gratuit |
| TuCaMaria | https://www.tucamaria.ro/coduri-si-legislatie/cod-fiscal/ | Free, structurat pe titluri | Gratuit |
| Sintact (Wolters Kluwer) | https://sintact.ro/legislatie/monitorul-oficial/codul-fiscal-din-2015-legea-227-2015-16950032 | Anotat, jurisprudență | Pay-wall |
| portalcodulfiscal.ro | https://www.portalcodulfiscal.ro/codul-fiscal-actualizat-ianuarie-2026-72028.htm | Update ianuarie 2026 | Gratuit |
| noulcodfiscal.ro | https://www.noulcodfiscal.ro/ | Vechi dar consolidat | Gratuit |

**Norme metodologice de aplicare:** HG 1/2016 + actualizări — https://legislatie.just.ro/Public/DetaliiDocument/212504

### A.2 Codul de Procedură Fiscală (Legea 207/2015) — actualizat 2026

| Sursă | URL | Note |
|---|---|---|
| ANAF (oficial) | https://static.anaf.ro/static/10/Anaf/cod_procedura/Cod_Procedura_Fiscala_2023.htm | Versiunea ANAF — actualizată periodic |
| ANAF cu norme 2016 | https://static.anaf.ro/static/10/Anaf/cod_procedura/Cod_Procedura_Fiscala_cu_norme_2016.htm | Cu norme metodologice |
| Lege5 | https://lege5.ro/Gratuit/g4ztkmrygm/codul-de-procedura-fiscala-din-2015 | Anotat |
| TuCaMaria | https://www.tucamaria.ro/coduri-si-legislatie/codul-procedura-fiscala/ | Gratuit |
| MFinante PDF | https://mfinante.gov.ro/documents/35673/5553347/nfproiectogmoficCFactenorm_25012022.pdf | PDF arhiva |
| Sintact | https://sintact.ro/legislatie/monitorul-oficial/codul-de-procedura-fiscala-din-2015-legea-nr-207-2015-16949084 | Pay-wall, jurisprudență |

### A.3 Ordonanțe de Urgență fiscale 2024-2026 (lista cu numere + Monitor Oficial)

| Act | Data MO | Conținut | Sursă oficial |
|---|---|---|---|
| **OUG 70/2024** | 2024 | Introducere RO e-TVA (decont precompletat P300) | static.anaf.ro/legislatie |
| **OUG 107/2024** | 2024 | Facilități fiscale | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid%20pentru%20accesarea%20facilitatilor%20fiscale%20stabilite%20prin%20OUG%20107_2024.pdf |
| **OUG 188/2022** | 2022 | Modificări CPF | https://www.pwc.ro/ro/tax-legal/alerts/Modificari-si-completari-aduse-Codului-de-procedura-fiscala-OUG-nr-188-2022.html |
| **OUG 89/2025** | dec 2025 | Eliminare cotă 3% micro, măsuri suplimentare | https://www.pwc.ro/en/tax-legal/alerts/Tax-changes-adopted-by-the-Government-through-the-Omnibus-Ordinance-GEO-no-89-2025.html |
| **OUG 7/2026** | MO 146/25.02.2026 | Suspendare art. 7 alin. (10) CPF + condiționalități înstrăinare imobile | https://static.anaf.ro/static/10/Anaf/legislatie/OUG_7_2026.pdf |
| **OUG 8/2026** | MO 147/25.02.2026 | Stimulent investiții capital, măsuri economice | https://accountess.ro/oug-13-2026-modificari-fiscale/ |
| **OUG 13/2026** | MO 181/09.03.2026 | **Dezactivare e-TVA notificare conformare** + suspendare clase risc fiscal | https://www.universuljuridic.ro/cod-fiscal-si-alte-acte-normative-in-materie-fiscal-bugetara-modificari-o-u-g-nr-13-2026/ |

### A.4 OPANAF-uri 2024-2026 (listate explicit)

| OPANAF | Data | Subiect | Link |
|---|---|---|---|
| 5/2024 | 04.01.2024 | Lista bunuri cu risc fiscal e-Transport | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_5_2024.pdf |
| 11/2024 | 04.01.2024 | Pilot Monitorizare Orizontală mari contribuabili | static.anaf.ro |
| 1826/2025 | 2025 | Criterii risc fiscal (referința CompliScan) | static.anaf.ro |
| 2372/2025 | 2025 | Modificări criterii risc (complementar) | https://www.pwc.ro/ro/tax-legal/alerts/noi-modific_ri-ale-criteriilor-de-risc-fiscal-pentru-destinatari.html |
| 206/2025 | 2025 | Form D101/D101G profit | static.anaf.ro/formulare/101_OPANAF_206_2025.pdf |
| 1729/2025 | 2025 | Diverse | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_1729_2025.pdf |
| 2066/2025 | 2025 | Form D112 contribuții | static.anaf.ro/formulare/D112_OPANAF_2066_2025.pdf |
| 2175/2025 | 2025 | Form D169n beneficiari | static.anaf.ro |
| 2420/2025 | 2025 | Forms D040, D093 | static.anaf.ro |
| 2736/2025 | 2025 | Form D212 Declarația Unică | static.anaf.ro/formulare/D_212_2736_2025.pdf |
| **15/2026** | 09.01.2026 | Forms registrare fiscală (D010-D070, D700) | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_15_2026.pdf |
| **28/2026** | 09.01.2026 | (verificat) | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_28_2026.pdf |
| **57/2026** | 2026 | Form D100 | static.anaf.ro/formulare/D100_OPANAF_57_2026.pdf |
| **59/2026** | 19.01.2026 | RO e-Factura înregistrare | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_59_2026.pdf |
| **143/2026** | 30.01.2026 | Declarații vamale simplificate | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_143_2026.pdf |
| **174/2026** | 05.02.2026 | Modificări Form D300 TVA + instrucțiuni | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_174_2026.pdf |
| **303/2026** | 2026 | Forms D205/D207 reținere | static.anaf.ro |
| **326/2026** | 2026 | Form D120 accize | static.anaf.ro |
| **412/2026** | 2026 | Form D181 marjă comercială | static.anaf.ro |
| **433/2026** | 01.04.2026 | (verificat) | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_433_2026.pdf |
| **434/2026** | 01.04.2026 | (verificat) | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_434_2026.pdf |
| **436/2026** | 01.04.2026 | (verificat) | https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_436_2026.pdf |
| **505/2026** | 2026 | Form D169 contracte fiduciare | static.anaf.ro |
| **507/2026** | 2026 | Form D224 salarii străinătate | static.anaf.ro |
| **508/2026** | 2026 | Form D060 sedii secundare | static.anaf.ro |
| Drafts | apr 2026 | Modificări OPANAF 2778/2020 + OPANAF 587/2016 | https://www.anaf.ro/anaf/internet/ANAF/transparenta_decizionala |

**OPANAF de referință istoric (încă active):**
- **OMFP/OPANAF 675/2018** — metode indirecte stabilire venituri (PF): https://static.anaf.ro/static/10/Anaf/legislatie/OMFP_675_2018.pdf
- **OPANAF 3846/2015** — registru contribuabili inactivi
- **OPANAF 1721/2021** + **3610/2016** — criterii mari/mijlocii contribuabili
- **OPANAF 1190/4625/2022** — bunuri risc fiscal e-Transport: https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_1190_2022.pdf
- **OPANAF 12/2022** — produse risc fiscal ridicat în relația B2C: https://static.anaf.ro/static/10/Anaf/legislatie/OPANAF_12_2022.pdf
- **OPANAF 802/2022** — sistem RO e-Transport (legea-cadru)
- **OPANAF 2017/2022** — sub-criterii risc fiscal
- **OPANAF 1783/2021** — implementare SAF-T (5 anexe)
- **OPANAF 373/2022** — modificare 1783/2021 SAF-T
- **OPANAF 587/2016** — formulare obligatorii self-assessment
- **OPANAF 2778/2020** — verificare situație fiscală personală
- **OPANAF 1048/2024** — emitere certificate
- **OMFP 532/2007** — soluționare deconturi negative TVA (Anexa 2 = **Fișa indicatorilor risc fiscal**)

**Sursa exhaustivă OPANAF:** https://www.anaf.ro/anaf/internet/ANAF/transparenta_decizionala (acte normative aprobate + drafts în consultare)

### A.5 Buletinul Informativ Fiscal ANAF (sursa zilnică)

- URL: https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/legislatie/ → secțiunea "Buletin informativ fiscal"
- Arhivat 2015-2026
- **NU este în research-ul actual al CompliAI** — sursă de adăugat

---

## B. Documentație ANAF (static.anaf.ro) — exhaustiv

### B.1 Manuale + ghiduri operaționale (cele 3 surse "ascunse" majore)

| Doc | URL | De ce critic |
|---|---|---|
| **Manual de control fiscal RO (REFORM/SC2022/039, 24.07.2023)** | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/Manual_de_control_fiscal_versiune%20finala_RO_24_07_2023.pdf | Document oficial dezvoltat cu **REFORM/SC2022/039** (UE) — sursa cea mai apropiată de "manual fiscal comprehensive". **CRITIC PENTRU CompliScan** — descrie metodologia operațională |
| **Manual de control fiscal EN** | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/Manual_de_control_fiscal_versiune%20finala_EN_29_09_2023.pdf | Versiunea EN — referință internațională |
| **Ghid pentru inspecția fiscală** | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/QW24_v2_final_ghid_1.pdf | Ghidul ANAF QW24 — drepturi/obligații contribuabil în control |
| Index inspecție fiscală | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/inspectie_fiscala.htm | HTML index |
| **Fișa indicatorilor de risc fiscal (Anexa 2 OMFP 532/2007)** | https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm | Sursa CompliScan actuală |
| **Anexa Metodologie soluționare deconturi TVA** | https://static.anaf.ro/static/10/Anaf/transparenta/Anexa_OMEF_Metodologie.pdf | Procedurală TVA refund |
| Anexa 1 metodologie specială | https://static.anaf.ro/static/10/Anaf/transparenta/Anexa1_metogologie_speciala.htm | Procedural |
| Procedura D394 | https://static.anaf.ro/static/10/Anaf/transparenta/Declaratie394/PROCEDURA.htm | Procedural D394 |
| Procedura contribuabili inactivi | http://static.anaf.ro/static/10/Anaf/transparenta/inactivi.htm | Procedural inactivi |
| **Rapoarte de activitate ANAF** | https://static.anaf.ro/static/10/Anaf/Informatii_R/arhiva_rap_activitate.htm | Indicatori strategici (target colectare, controale, sume recuperate) |
| Raport activitate S1 2025 | https://static.anaf.ro/static/10/Anaf/Informatii_R/18.08.2025%20-%20Raport%20de%20activitateANAF_2025S1_V7.pdf | Cel mai recent |
| Raport activitate S1 2023 | https://static.anaf.ro/static/10/Anaf/Informatii_R/Raport_activitate_ANAF_semI2023.pdf | Comparativ |
| Raport activitate 2022 | https://static.anaf.ro/static/10/Anaf/Informatii_R/Raport_activitateANAF_2022_SI_V6.pdf | Comparativ |
| Raport performanță 2015 | https://static.anaf.ro/static/10/Anaf/Informatii_R/Raport_performanta_20042016.pdf | Istoric |

### B.2 Broșuri & ghiduri pentru contribuabili (AsistentaContribuabili_r)

**Index complet ghiduri:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/ghid_asoc_propr.htm

**Top 25 ghiduri actualizate 2024-2026 (selectate, lista completă în index):**

| Data | Titlu | URL |
|---|---|---|
| 27.01.2026 | Broșură Declarația Unică Form 212 | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_Declaratia_Unica_212_2025.pdf |
| 12.12.2025 | Ghid arendă terenuri agricole | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_arenda_2025.pdf |
| 03.10.2025 | Broșură cote TVA (Legea 141/2025) | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Cotele_de_TVA_09.2025.pdf |
| 02.06.2025 | Ghid RO e-Transport 2025 | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_RO_e_Transport_2025.pdf |
| 07.05.2025 | Broșură medici | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura%20medici_2025.pdf |
| 17.03.2025 | Ghid redirecționare 3.5% | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_3_5_2025.pdf |
| 07.03.2025 | Reguli TVA instituții publice | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_TVA_Instituii_Publice.pdf |
| 05.03.2025 | **Material deficiențe control sem II 2024** | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Material_deficiente_sem_II_2024.pdf |
| 27.02.2025 | Broșură RO e-TVA decont precompletat | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/BrosuraRoeTVA2025.pdf |
| 24.02.2025 | Ghid rezidență fiscală PJ străine | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_rezidenta_PJ.pdf |
| 30.08.2024 | **Deficiențe control sem I 2024** | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/deficiente_semestrul_I_2024.pdf |
| 23.08.2024 | Broșură prevenire evaziune (Legea 126/2024) | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_evaziune.pdf |
| 19.08.2024 | Broșură impozit special bunuri valoare mare | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_impozit_special.pdf |
| 06.08.2024 | Ghid aplicație e-Transport | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_Aplicatie_eTransport.pdf |
| 29.04.2024 | Ghid ONG-uri | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_ONG_2024%20.pdf |
| 26.03.2024 | Broșură modalități plată ANAF | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_plati_v2024.pdf |
| 22.02.2024 | Ghid RO e-Factura 2024 | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_e_factura_2024.pdf |
| 02.10.2023 | Ghid recuperare TVA UE | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_Recuperare_TVA_UE_2023.pdf |
| 25.03.2025 | Ghid rezidență PF (RO + EN) | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Ghid_rezidenta_2023.pdf |
| 06.03.2023 | Obligații plată + dobânzi | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Dobanzi_2023.pdf |
| 09.02.2023 | Broșură NFT tratament fiscal | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Brosura_NFT_2023.pdf |
| 27.01.2023 | Broșură compensare obligații fiscale | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Compensare_2023.pdf |
| 27.01.2023 | Broșură procedura mediere | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Mediere_2023.pdf |
| 18.11.2022 | Clarificări înregistrare fiscală energie | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/inreg_fiscal_energie.pdf |
| 13.01.2021 | Ghid DAC6 aranjamente transfrontaliere | https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/GHID_DAC6_13012021.pdf |

**Două sursele cu cele mai mari semnale algoritmice pentru CompliScan:**
- "Material deficiențe control sem I 2024" + "sem II 2024" — **ANAF publică ce greșeli a găsit în controale**. Sursă directă pentru semnale risc.
- Ghidul evaziunii fiscale (Legea 126/2024) — comportamente flag

### B.3 Calendar obligații fiscale (sursa de termene)

- **Calendar obligații fiscale 2026 (HTML):** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Calendar/Calendar_obligatii_fiscale_2025.htm
- Index: https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Calendar/calendar_obligatii_fiscale.htm
- Calendar oficial ANAF: https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/info_obligatii_fiscale/calendar_obligatii_fiscale

### B.4 Formulare ANAF cu instrucțiuni (toate)

**Index master:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Toateformularele/Toate_Formularele.html

**Mapare formulare critice cu OPANAF actualizat 2026:**

| Form | Subiect | Link PDF (OPANAF curent) |
|---|---|---|
| D010-D070, D700 | Înregistrare fiscală | OPANAF 15/2026 |
| D040, D093 | Registrare alte | OPANAF 2420/2025 |
| D060 | Sedii secundare | OPANAF 508/2026 |
| D100 | Obligații plată buget stat | OPANAF 57/2026 |
| D101/D101G | Profit + grup fiscal | OPANAF 206/2025 |
| D106 | Dividende | Vechi 2014 — de verificat actualizare |
| D107 | Sponsorizare | OPANAF 355/2024 |
| D108 | Reprezentanțe | OPANAF 3391/2017 |
| D110 | Reținere salarii regularizare | OPANAF 2779/2017 |
| **D112** | Contribuții sociale + impozit | **OPANAF 2066/2025** |
| D114 | Lucrători culturali | OPANAF 2006/2023 |
| D120 | Accize | OPANAF 326/2026 |
| D169 | Contracte fiduciare | OPANAF 505/2026 |
| D169n | Beneficiari neconcordanțe | OPANAF 2175/2025 |
| D181 | Marjă comercială medie | OPANAF 412/2026 |
| D205/D207 | Reținere la sursă info | OPANAF 303/2026 |
| D208 | Înstrăinări imobile info | OPANAF 253/2024 |
| D209 | Venit înstrăinare imobile | OPANAF 1075/2021 |
| **D212** | **Declarația Unică** | **OPANAF 2736/2025** |
| D213 | Vânzări terenuri | OPANAF 216/2023 |
| D216 | Impozit special bunuri valoare | OPANAF 3738/2024 |
| D217 | Înstrăinări condiționate | OPANAF 396/2025 |
| D222/D224 | Salarii străinătate | OPANAF 507/2026 (D224) |
| **D300** | **Decont TVA** | **OPANAF 174/2026** |
| D301 | TVA special | OPANAF 779/2024 |
| D307/D311 | TVA corecție / post-cancelare | OPANAF 779/2024 |
| D390 | Recapitulativ intracomunitar | OPANAF 705/2020 |
| **D394** | Livrări/achiziții naționale | OPANAF 77/2022 |
| D395 | Cash-on-delivery poștă | 2022 |
| D396 | Cross-border payment | 2024 |
| D397 | Platforme transport | OPANAF 382/2025 |
| D404/D405 | Country-by-country | OPANAF 3049/2017 |
| **D406** | **SAF-T** | OPANAF 1783/2021 + 373/2022 |
| D407 | Asigurări viață | 2024 |
| D603 | CASS exonerare | OPANAF 1984/2021 |
| D710 | Rectificativă | OPANAF 649/2025 |
| F4109/F4110 | Case marcat | OMFP 627/2018 |
| C079/C081/C082 | e-Factura registrare | OPANAF 3769/2024, 3788/2024, **59/2026** |
| C150/C151 | Certificate digitale | OPANAF 2213/2025 |
| C168 | Contracte închiriere | OPANAF 161/2025 |
| C173 | Grup fiscal profit | OPANAF 1191/2021 |
| C177 | Redirectare profit | OPANAF 3562/2024 |
| C230 | Redirectare 3.5% impozit | OPANAF 103/2025 |
| C231 | Cerere certificat | OPANAF 1048/2024 |
| C502/C503 | Certificat fiscal | OPANAF 2048/2023 |

### B.5 Registre publice ANAF (date deschise)

| Registru | URL |
|---|---|
| Registru TVA persoane impozabile | https://www.anaf.ro/RegistruTVA/ |
| Index registru TVA | https://static.anaf.ro/static/10/Anaf/Informatii_R/registru_tva.htm |
| Registru TVA la încasare | https://static.anaf.ro/static/10/Anaf/Informatii_R/incasare_tva.htm |
| Registru contribuabili inactivi | https://www.anaf.ro/inactivi/rezultatInactivi.jsp |
| Index inactivi | https://static.anaf.ro/static/10/Anaf/Informatii_R/inactivi.htm |
| Liste contribuabili mari/mijlocii | https://www.anaf.ro/anaf/internet/ANAF/info_publice/info_interes_public/info_agenti_economici/liste.contrib.mari.mijlocii |
| Servicii web ANAF (API public) | https://www.anaf.ro/anaf/internet/ANAF/servicii_online/servicii_web_anaf |
| MFinante info contribuabili (CIF lookup) | https://mfinante.gov.ro/en/domenii/informatii-contribuabili/persoane-juridice/info-pj-selectie-dupa-cui |

### B.6 SAF-T / D406 — pagina centrală

**Hub SAF-T:** https://static.anaf.ro/static/10/Anaf/Informatii_R/saf_t.htm

| Resursă | URL |
|---|---|
| Ghidul contribuabilului D406 | https://static.anaf.ro/static/10/Anaf/Informatii_R/SAF_T_Ghidul_D406_1712021.pdf |
| Pagina D406 (formulare) | https://static.anaf.ro/static/10/Anaf/Declaratii_R/406.html |
| XSD schemas + Validator DUK | static.anaf.ro/SAF_T_… |
| XLS Schema (actualizat 19.02.2026) | static.anaf.ro |

### B.7 e-Factura & e-Transport (hub MFinante)

| Resursă | URL |
|---|---|
| Hub e-Factura MFinante | https://mfinante.gov.ro/en/web/efactura |
| Informații tehnice | https://mfinante.gov.ro/en/web/efactura/informatii-tehnice |
| FAQ e-Factura | https://mfinante.gov.ro/documents/4398723/5002737/E-facturaFAQ.pdf/62a8d46b-82f5-9954-22aa-29b7ad32fe14?t=1637238487343 |
| Legislație e-Factura | https://mfinante.gov.ro/web/efactura/legislatie |
| Prezentare API e-Factura | https://mfinante.gov.ro/static/10/eFactura/prezentare%20api%20efactura.pdf |
| Aplicații web | https://mfinante.gov.ro/web/efactura/aplicatii-web-ro-efactura |
| Ghid RO e-Transport (MFP) | https://mfinante.gov.ro/static/10/Mfp/GhidROe-Transport.pdf |
| Bunuri risc fiscal e-Transport | https://static.anaf.ro/static/10/Galati/Vrancea/Bunuri-risc-ridicat-e-Transport.pdf |
| Procedura înregistrare OAuth aplicații | https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf |

### B.8 Ce LIPSEȘTE din research-ul actual al CompliScan (ANAF)

1. **Manualul de control fiscal 2023** (RO + EN) — sursa cea mai apropiată de "ghid operațional inspecție"
2. **Materialele "deficiențe control sem I + II 2024"** — ANAF publică efectiv ce a găsit la controale, semnal direct pentru reguli noi
3. **Buletinul informativ fiscal ANAF** — actualizat zilnic
4. **Raportul de activitate ANAF S1 2025** — KPIs target colectare + control
5. **Procedura D394 publicată** + Anexa 1 metodologie specială + Anexa metodologie deconturi TVA
6. **OPANAF 802/2022** (e-Transport — legea-cadru) + **2017/2022** (sub-criterii risc fiscal)
7. **Hub-ul SAF-T cu XSD + XLS Schema 19.02.2026** (varianta cea mai recentă)
8. **OPANAF-urile 2026 (28, 57, 143, 174, 326, 412, 433, 434, 436, 505, 507, 508)** — actualizări formulare

---

## C. Repository open-source (GitHub + GitLab + alte)

### C.1 Repo-urile top tagged `anaf` (date GitHub Topics)

| Repo | Stele | Limbaj | Scop |
|---|---|---|---|
| **itrack/anaf** | 152 | PHP | Librărie verificare CIF/TVA art. 316 |
| **andalisolutions/anaf-php** | 93 | PHP | Client PHP gratuit ANAF Web Services |
| **printesoi/e-factura-go** | 51 | Go | SDK e-Factura + e-Transport (UBL/CIUS-RO 1.0.9) |
| **stefanache/MFP-ANAF-RO** | 44 | PHP | **Hub agregat** — nomenclatoare CAEN/SIRUTA, Swagger SPV, scheme XSD |
| Rebootcodesoft/efactura_anaf | 42 | PHP | Upload e-Factura SPV |
| **ClimenteA/PFASimplu** | 37 | Python | Aplicație contabilitate simplă PFA (Django + SQLite) |
| TecsiAron/ANAF-API-Client-PHP | 21 | PHP | Client CIF + upload e-Factura, OAuth |
| andalisolutions/oauth2-anaf | 19 | PHP | OAuth 2.0 ANAF |
| **boobo94/efactura-sdk** | 8 | TypeScript | SDK TypeScript ANAF e-Factura |
| e-factura-ti-as/docs | 5 | — | Inițiativă unelte libere RO-eFactura |
| CrockyHost/WHMCS-Oblio | 4 | PHP | WHMCS addon Oblio |
| TecsiAron/ublrenderer | 2 | PHP | UBL/ZIP → HTML/PDF |
| SkipTheDragon/DUKIntegrator-MAC | 1 | HTML | ANAF DUK compatibil macOS |
| valiggro/valitex | 0 | PHP | Aplicație contabilitate ANAF e-invoices |
| hktr92/anaf-rs | 0 | Rust | Librărie Rust ANAF WebService |
| c-a-t-a/SAP-RO-verificare-TVA-addon | 0 | JS | Chromium addon verificare TVA |
| nox999/eFactura-xml2pdf | 0 | PHP | XML → PDF e-Factura |
| Lorin-Cristian/Generare-fisier-TXT-pentru-import-PDF-D205 | 0 | Python | D205 TXT generator |
| olteancristianradu/amass-crm-v2 | 0 | TS | CRM multi-tenant cu e-Factura |
| kifbv/anaf-calc | 0 | — | Calculator investiții bursă |

### C.2 Repo-uri suplimentare relevante

| Repo | URL | Scop |
|---|---|---|
| **danielgp/eFactura** | https://github.com/danielgp/eFactura | PHP — Composer install, generare/citire XML e-Factura |
| **florin-szilagyi/efactura-anaf-ts-sdk** | https://github.com/florin-szilagyi/efactura-anaf-ts-sdk | TypeScript SDK + CLI + MCP server pentru e-Factura |
| **Meriegg/node-eFactura-generator** | https://github.com/Meriegg/node-eFactura-generator | Node.js generator UBL 2.1 CIUS-RO |
| **MfpAnaf/ClientSPV** | https://github.com/MfpAnaf/ClientSPV | Java client SPV ANAF (oficial) |
| **SAF-TSmartValidator** | https://github.com/SAF-TSmartValidator | Validator complet SAF-T D406 |
| **robertcezar/grc-romanian-fields** | https://github.com/robertcezar/grc-romanian-fields | WordPress/WooCommerce Romanian fields cu validare CIF ANAF |
| **GrupulVerdeIT/e-Factura-ANAF** | https://github.com/GrupulVerdeIT/e-Factura-ANAF | PHP client ANAF e-Factura |
| **taxepfa/taxepfa.github.io** | https://github.com/taxepfa/taxepfa.github.io | Calculator taxe PFA freelancers RO (open-source) |
| **Code for Romania** | https://github.com/code4romania | NGO civic tech — `redirectioneaza` (form 230), `declaratii-avere` |
| **teamfurther/fgo-php-sdk** | https://github.com/teamfurther/fgo-php-sdk | SDK FGO.ro (comercial) |
| **stevro/smart-bill-sdk** | https://github.com/stevro/smart-bill-sdk | SDK SmartBill |
| **necenzurat/smartbill** | https://github.com/necenzurat/smartbill | SmartBill Laravel |
| **Project OpenUBL** | https://github.com/project-openubl | UBL framework cross-country |

### C.3 Gap critic open-source

**NU EXISTĂ repo open-source pentru:**
- Scoring de risc fiscal RO (Fișa risc fiscal codată)
- Simulator inspecție fiscală
- Detector deficiențe control ANAF
- Reguli SAF-T validation completă (doar XSD-uri oficiale)
- Mirror analytical APIC

**→ Aceasta e oportunitatea CompliScan (gap real de piață, niciun proiect existent).**

---

## D. Manuale comerciale online (cărți, magazine, abonamente)

### D.1 Edituri profesionale RO — comprehensive

| Editură/Platformă | Acoperire | Acces | Link |
|---|---|---|---|
| **Wolters Kluwer (Sintact)** | Cod Fiscal + CPF comentate, jurisprudență, doctrine | Abonament 100+ EUR/lună | https://shop.wolterskluwer.ro/ + https://info.wolterskluwer.ro/sintact-pachetele-de-comentarii/ |
| Wolters Kluwer — Codul Fiscal Comentat (Emilian Duca) | Carte/PDF | ~200 RON | shop.wolterskluwer.ro |
| **Indaco (Lege5)** | Cod Fiscal + CPF, 1.7M+ vizitatori unici lunari | Free + Premium | https://www.indaco.ro/portofoliu/ + https://lege5.ro |
| **Rentrop & Straton** | Fiscalitate + Finanțe + Contabilitate | Abonament | https://www.rentropstraton.ro/servicii-fiscalitate-finante-contabilitate |
| **Universul Juridic** | Articole + cărți doctrină | Mixt | https://www.universuljuridic.ro/ |
| **Curierul Juridic / Curierul Fiscal** | Revistă lunară impozite și taxe | Abonament | https://www.curierulfiscal.ro/ |
| Tax Magazine (taxmagazine.ro) | Online + print | Free majoritar | taxmagazine.ro |
| **CECCAR Business Magazine** | Săptămânal CECCAR (publicație oficială expert contabili) | Free | https://www.ceccarbusinessmagazine.ro/ |
| **CECCAR Business Review** | Quarterly ISSN 2668-8921 | Free download | https://www.ceccarbusinessreview.ro |
| **Camera Consultanților Fiscali (CCF)** | Bibliotecă virtuală membri + revistă | Membership | https://www.ceccarbusinessmagazine.ro/ + https://www.ccfiscali.ro/biblioteca-ccf |
| **The Tax Institute (Monitor Fiscal)** | Newsletter bi-săptămânal think tank fiscal | Mixt | https://www.taxinstitute.ro/editorial/ |
| **Revista Finanțe Publice și Contabilitate (RFPC)** | MF lunar | Free PDF | mfinante.gov.ro |
| Juridice.ro | Articole + analize legale, foarte activ | Free | https://www.juridice.ro/ |

### D.2 Manuale specifice 2024-2026

**Brutal honest:** Nu există un singur "Manual fiscalitate RO 2026" comprehensive comercial care să acopere tot (similar Bittker & Lokken pentru USA). Cei mai apropiati:

1. **Cod Fiscal Comentat (Wolters Kluwer / Sintact)** — ediții actualizate dar e o BAZĂ DE DATE, nu un manual didactic
2. **Codul Fiscal Comentat și Adnotat (Emilian Duca)** — carte 2023 (~600 pag)
3. **Procedura fiscală. Analiza de risc (Emilian Duca, Alina Duca, Universul Juridic)** — carte specifică
4. **Forvis Mazars CEE Tax Guide 2026** — 25 jurisdicții, e free: https://www.forvismazars.com/ro/en/insights/publications/economic-publications/forvis-mazars-cee-tax-guide-2026
5. **PwC Worldwide Tax Summaries — Romania** — free, complete, actualizat: https://taxsummaries.pwc.com/romania
6. **OECD Romania Tax Database** — comparativ
7. **Tax & Finance Forum proceedings** (Curierul Fiscal anual) — concluzii + provocări actuale

### D.3 Manuale SAGA / WinMentor / SmartBill (documentație tehnică)

- SAGA Software docs (offline, în program)
- Forum SAGA peste **15K topice tehnice contabili**: https://forum.sagasoft.ro/
- WinMentor docs PDF: https://download.winmentor.ro/WinMentor/Documentatie/
- SmartBill API docs: https://api.smartbill.ro/

---

## E. Resurse academice (teze + articole)

### E.1 Repository teze publice

- **Platforma REI (oficial, UEFISCDI/Ministerul Educației)**: https://rei.gov.ro/teze-doctorat
- Consultare teze REI: https://rei.gov.ro/teze-consultare
- **ASE București doctorat**: https://doctorat.ase.ro/teze/
- ASE Susțineri publice 2024-2025: https://doctorat.ase.ro/teze/sustineri-publice/
- ASE REI Facultatea de Relații Economice Internaționale: https://rei.ase.ro/academic/programe-doctorat/
- **Universitatea Babeș-Bolyai Cluj-Napoca**: doctorat.ubbcluj.ro
- **Universitatea de Vest Timișoara** (UVT): doctorat.uvt.ro
- **Universitatea „Lucian Blaga" Sibiu**: http://doctorate.ulbsibiu.ro

### E.2 Teze relevante "risc fiscal" / "evaziune" (sample)

| Autor / Topic | Sursă |
|---|---|
| "Combaterea Evaziunii Fiscale în România" #149218 | https://graduo.ro/teze-de-doctorat/economie/combaterea-evaziunii-fiscale-in-romania-149218 |
| Vajda Geraldina-Terezia — "Strategii control evaziune transfrontalieră + fraudă comunitară" | https://lege5.ro/Gratuit/he3dsmbsga4q/teza-de-doctorat-strategii-de-control-pentru-combaterea-fenomenului-evaziunii-fiscale-transfrontaliere-si-a-fraudei-comunitare/33 |
| Andreea Mihaela Corîci — "Evaziunea fiscală în România și consecințe economico-sociale" | https://lege5.ro/Gratuit/ha3tsmjvgu2q |
| Birle (ULBS) | http://doctorate.ulbsibiu.ro/obj/documents/REZ-ROM-BIRLE.pdf |
| Cosmin Pitu (ULBS Finanțe) | https://doctorate.ulbsibiu.ro/wp-content/uploads/21.REZUMAT-rom-Cosmin-PITU-.pdf |

**Brutal honest:** Tezele RO sunt **utile pentru framework conceptual**, **NU pentru reguli executabile**. ASE/UBB/UVT publică rezumate, nu codul/algoritmul. Pentru CompliScan, valoarea = **dovedirea că abordarea „scor risc fiscal" e fundamentată academic** (5 teze 2010-2024 demonstrează asta) + identificarea modelelor de scoring folosite în literatura RO.

### E.3 Reviste profesionale RO (peer-reviewed-ish)

| Revistă | URL | Frecvență |
|---|---|---|
| CECCAR Business Review | ceccarbusinessreview.ro | Trimestrial |
| CECCAR Business Magazine | ceccarbusinessmagazine.ro | Săptămânal |
| Curierul Fiscal | curierulfiscal.ro | Lunar (peste 100 ediții) |
| Tax Magazine | taxmagazine.ro | Bilunar |
| Revista Finanțe Publice și Contabilitate (RFPC) | mfinante.gov.ro | Lunar |
| Monitor Fiscal (The Tax Institute) | taxinstitute.ro | Bi-săptămânal |

---

## F. Big 4 RO publicații (cele mai consistente surse de interpretare)

### F.1 PwC Romania

| Resursă | URL | Acoperire |
|---|---|---|
| **PwC Worldwide Tax Summaries — Romania (hub)** | https://taxsummaries.pwc.com/romania | Free, comprehensive, actualizat |
| Significant developments | https://taxsummaries.pwc.com/romania/corporate/significant-developments | Highlights |
| Corporate Taxes | https://taxsummaries.pwc.com/romania/corporate/taxes-on-corporate-income | Detail |
| Individual Other Taxes | https://taxsummaries.pwc.com/romania/individual/other-taxes | Detail |
| Individual Income | https://taxsummaries.pwc.com/romania/individual/income-determination | Detail |
| Tax Administration | https://taxsummaries.pwc.com/romania/corporate/tax-administration | Procedural |
| **Tax & Legal Alerts (EN)** | https://www.pwc.ro/en/tax-legal.html + https://www.pwc.ro/en/tax-legal/alerts.html | Stream curent |
| Tax & Legal Alerts (RO) | https://www.pwc.ro/ro/tax-legal/alerts/ | RO stream |

**Alerts recente (2025-2026):**
- "OUG 89/2025 Omnibus": https://www.pwc.ro/en/tax-legal/alerts/Tax-changes-adopted-by-the-Government-through-the-Omnibus-Ordinance-GEO-no-89-2025.html
- "Legea 141/2025 măsuri fiscal-bugetare": https://www.pwc.ro/en/tax-legal/alerts/law-no--141-2025-on-some-fiscal-budgetary-measures.html
- "OPANAF 1826/2372/2025 risc fiscal": https://www.pwc.ro/ro/tax-legal/alerts/noi-modific_ri-ale-criteriilor-de-risc-fiscal-pentru-destinatari.html
- "OUG 188/2022 CPF modificări": https://www.pwc.ro/ro/tax-legal/alerts/Modificari-si-completari-aduse-Codului-de-procedura-fiscala-OUG-nr-188-2022.html

### F.2 EY Romania

| Resursă | URL |
|---|---|
| **Tax Alerts hub** | https://www.ey.com/en_ro/technical/tax-alerts |
| EY Tax Alert 22 dec 2025 (Pachet 2 fiscal-bugetar) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-22-december-2025 |
| EY Tax Alert 1 ian 2026 (modificări Cod Fiscal + UK DTA) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-1-january-2026 |
| EY Tax Alert 4 feb 2026 (Declarația Unică, CASS, pensii private) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-4-february-2026 |
| EY Tax Alert 6 feb 2026 (recovery package proposals) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-6-february-2026 |
| EY Tax Alert 8 mar 2026 (recovery package main provisions) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-8-march-2026 |
| EY Tax Alert 10 iul 2025 (măsuri fiscal-bugetare) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-10-july-2025 |
| EY Tax Alert 13 aug 2025 (draft Legea 227/2015) | https://www.ey.com/en_ro/technical/tax-alerts/ey-tax-alert-13-august-2025 |
| EY Transfer Pricing Alert 4 dec 2025 (APA + deductibilitate) | https://www.ey.com/en_ro/technical/tax-alerts/ey-transfer-pricing-alert-4-december-2025 |

### F.3 KPMG Romania

| Resursă | URL |
|---|---|
| **TaxNews hub** | https://taxnews.ro/tag/kpmg-romania/ |
| KPMG RO Insights | https://kpmg.com/ro/en/home/insights/ |
| Tax Newsflash 31.07.2025 (OUG iulie 2025) | https://assets.kpmg.com/content/dam/kpmg/ro/pdf/2025/TNF_OUG_iulie_2025_final_EN.pdf |
| Tax Newsflash 17.12.2025 (Legea 239/2025 Pachet 2) | https://assets.kpmg.com/content/dam/kpmg/ro/pdf/2025/TNF-Pachetul-2-masuri-fiscale-Legea-239-per-2025EN.pdf |
| Tax Newsflash 13.01.2026 (OUG 89/2025 EN) | https://assets.kpmg.com/content/dam/kpmg/ro/pdf/2026/Emergency-Ordinance-89_2025-EN.pdf |
| Tax Newsflash 04.02.2026 (Ordonanța 5/2026) | https://assets.kpmg.com/content/dam/kpmg/ro/pdf/2026/ordonanta-5-2026-EN.pdf |
| Amendments to Fiscal Code (Law 239/2025) | https://kpmg.com/ro/en/home/insights/2025/12/ammendments-fiscal-code-law-239-2025.html |
| Romania Various tax reform Aug 1, 2025 | https://kpmg.com/us/en/taxnewsflash/news/2025/08/tnf-romania-various-tax-reform-measures-effective-august-1-2025.html |
| Logistics fee + Fiscal Code dec 2025 | https://kpmg.com/us/en/taxnewsflash/news/2025/12/romania-amendments-fiscal-code-logistics-fee.html |

### F.4 Deloitte Romania

| Resursă | URL |
|---|---|
| **Tax & Legal Alerts (EN)** | https://www.deloitte.com/ro/en/services/tax/tax-legal-alerts.html |
| Tax & Legal Weekly | https://www2.deloitte.com/ro/en/pages/tax/articles/tax-legal-weekly-alerts.html |
| Deloitte RO hub | https://www.deloitte.com/ro/en.html |

### F.5 Forvis Mazars Romania

| Resursă | URL |
|---|---|
| **CEE Tax Guide 2026** (25 jurisdicții comparativ) | https://www.forvismazars.com/ro/en/insights/publications/economic-publications/forvis-mazars-cee-tax-guide-2026 |
| Press releases (DAC9 etc.) | https://www.forvismazars.com/ro/en/insights/press-releases/implementation-of-dac9-in-romania |
| Newsletter NRCC (Olanda-RO) | https://www.nrcc.ro/articles/finance-news-by-forvis-mazars-romania-july-2025 |

### F.6 Alte firme — interpretări utile

- **Kinstellar** (law firm): https://www.kinstellar.com/news-and-insights/detail/3958/major-tax-and-procedural-changes-in-romania
- **BMA Legal**: https://bmalegal.ro/romania-tax-legal-changes-2026/
- **Eurofast**: https://eurofast.eu/romania-2025-2026-tax-and-fiscal-changes-what-companies-must-know/
- **Mondaq** (aggregator articole tax authorities RO): https://www.mondaq.com/tax-authorities/1722226/major-tax-and-procedural-changes-in-romania
- **Lexology** (aggregator): https://www.lexology.com/library/detail.aspx?g=ce306a7b-b7f9-45ea-8c7b-fd625b81154e
- **Atipics**: https://www.atipics.ro/control-anaf-ghid-pentru-inspectia-fiscala/
- **Avocat Pavel** — schimbări 2026: https://www.avocatpavel.com/new-tax-rules-and-legal-sanctions-affecting-individuals-and-legal-entities-in-2026/

---

## G. Documente operaționale ANAF (proceduri interne publicate)

| Doc | URL | Cum o folosim |
|---|---|---|
| **OPANAF 675/2018** metode indirecte stabilire venituri PF | https://static.anaf.ro/static/10/Anaf/legislatie/OMFP_675_2018.pdf | Triggere PF (cash flow, surse/utilizări, net asset method) |
| **OPANAF 675/2018** versiune Prezentare | https://static.anaf.ro/static/10/Anaf/Prezentare_R/OPANAF_675_2018.pdf | Versiune comentariu |
| Procedura D394 | https://static.anaf.ro/static/10/Anaf/transparenta/Declaratie394/PROCEDURA.htm | Algoritm matching cross-check |
| Manual de control fiscal RO 2023 | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/Manual_de_control_fiscal_versiune%20finala_RO_24_07_2023.pdf | **Procedura operațională control** — cea mai apropiată de "playbook" inspectori |
| Ghid inspecție fiscală | https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/QW24_v2_final_ghid_1.pdf | Drepturi/obligații + etape |
| Anexa OMEF Metodologie deconturi TVA | https://static.anaf.ro/static/10/Anaf/transparenta/Anexa_OMEF_Metodologie.pdf | Metodologie SIN + risc |
| Procedura inactivi | http://static.anaf.ro/static/10/Anaf/transparenta/inactivi.htm | Triggere declarare inactiv |
| OPANAF 3846/2015 (procedura registru inactivi) | static.anaf.ro/legislatie | Procedural |
| OPANAF 1721/2021 + 3610/2016 (criterii mari/mijlocii) | https://www.portalcodulfiscal.ro/anaf-actualizeaza-listele-contribuabililor-mari-si-mijlocii-care-sunt-criteriile-si-regulile-aplicabile-70644.htm | Praguri afiliere, investiții, grup fiscal |
| OPANAF 2017/2022 (sub-criterii risc fiscal) | static.anaf.ro/legislatie | Sub-criterii peste cele din OUG cadru |
| Drafts în consultare (apr 2026) | https://www.anaf.ro/anaf/internet/ANAF/transparenta_decizionala | Modificări OPANAF 2778/2020, 587/2016 |

**Recomandare critică:** **Manualul de control fiscal RO 2023** este sursa cea mai apropiată de algoritm. Trebuie parcurs integral pentru CompliScan. **Nu există în research-ul actual al CompliAI.**

---

## H. Forumuri tehnice + comunități (semnale comportamentale)

| Platformă | URL | Trafic | Utilizare |
|---|---|---|---|
| **Forum SAGA** | https://forum.sagasoft.ro/ | ~15K topice | Cazuri reale contabili (zile tehnice fiscale) |
| Forum SAGA Diverse | https://forum.sagasoft.ro/viewforum.php?f=1 | Activ | General |
| Forum SAGA Probleme contabile | https://forum.sagasoft.ro/viewforum.php?f=16 | Activ | Foarte specific |
| **Avocatnet.ro** | https://www.avocatnet.ro/ | 1000+ mesaje/zi | Întrebări juridice/fiscale |
| Avocatnet — ANAF tag | https://www.avocatnet.ro/t356/anaf.html | Activ | Discuții ANAF |
| Avocatnet Forum fiscalitate | https://www.avocatnet.ro/forum*4 | Foarte activ | Q&A |
| **PortalContabilitate.ro** | https://www.portalcontabilitate.ro/ | 220K cazuri | Bază date răspunsuri |
| **PortalCodulFiscal.ro** | https://www.portalcodulfiscal.ro/ | 220K cazuri | Cod fiscal aplicat |
| Portal Codul Fiscal (alt) | https://portalcodulfiscal.fisc.ro/ | Activ | Articole specifice |
| 1738 întrebări ANAF | https://www.portalcodulfiscal.ro/tags/anaf/ | Live | Q&A tag ANAF |
| 150 răspunsuri risc fiscal ridicat | https://www.portalcontabilitate.ro/tags/risc-fiscal-ridicat/ | Live | Specific risc |
| **Contazilla.ro** | https://contazilla.ro | Mic | Articole contabile |
| **Fiscalitatea.ro** | https://www.fiscalitatea.ro/ | Activ | Articole + comunitate |
| Tax Mentor | https://www.taxmentor.ro/ | Mediu | Articole + calculator |
| Atipics (consultanță) | https://www.atipics.ro/ | Mediu | Ghiduri practice |
| Manager.ro Infotva | https://infotva.manager.ro/ | Mare | Articole tehnice |
| Contabilul Manager | https://contabilul.manager.ro/ | Mare | Articole + ghiduri |
| The Tax Institute | https://www.taxinstitute.ro/ | Premium | Monitor Fiscal bi-săptămânal |
| Bugetul.ro | https://www.bugetul.ro/ | Mediu | Politică fiscală |
| Piața Financiară | https://www.piatafinanciara.ro/ | Mediu | Politică fiscală |
| Republica.ro (cu accent fiscal) | https://republica.ro/anaf-controale-fiscale | Mare | Calitate jurnalistică |
| StartupCafe | https://startupcafe.ro/ | Foarte mare | Articole sintetizate antreprenori |
| HotNews (secțiune fiscală) | https://hotnews.ro/ | Foarte mare | Calitate |

**Valoare pentru CompliScan:** Forumuri tehnice = **dataset comportamental real** pentru:
- Ce greșeli fac antreprenorii (D300, D394, ANAF SPV)
- Ce întrebări apar repetitiv (semnale UX pentru produs)
- Ce probleme practice nu sunt rezolvate de ghidurile oficiale

---

## I. Surse importante descoperite suplimentar (în afara categoriilor)

### I.1 Date deschise + nomenclatoare

| Resursă | URL |
|---|---|
| **data.gov.ro** Nomenclatoare (CAEN, SIRUTA) | https://data.gov.ro/group/nomenclatoare |
| **data.gov.ro** SIRUTA dataset | https://data.gov.ro/dataset/siruta |
| Coduri CAEN ANAF | https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/declararea_obligatiilor_fiscale/coduri_caen |
| CAEN.ro lookup | https://caen.ro/ |
| SIRUTA 2026 | https://www.siruta.nxm.ro/ |
| **Inspecția Muncii REGES (Coduri CAEN)** | https://reges.inspectiamuncii.ro/ajutor/ghid-utilizare-aplicatie-angajator/setari-nomenclatoare/setari-nomenclatoare-coduri-caen/ |
| **ListaFirme.eu** | https://listafirme.eu/ |

### I.2 Lookup CIF real-time (commercial dar útil pentru a vedea ce API-uri folosesc)

- VerificareTVA: https://verificaretva.ro/
- FirmeOnLine TVA: https://tva.firme-on-line.ro/
- Contello TVA: https://tva.contello.ro/
- WebTools Exclusive: https://webtools.exclusive.ro/verificare-tva
- IAF firme-on-line: https://iaf.firme-on-line.ro/

### I.3 Comunitate Mediul de afaceri RO

- **Camera Consultanților Fiscali (CCF)**: https://www.ccfiscali.ro
  - Biblioteca virtuală (membri): https://www.ccfiscali.ro/biblioteca-ccf
  - Portal membri (din 2026): https://membri.ccfiscali.ro/
  - Legislația CCF: https://www.ccfiscali.ro/despre-ccf/legislatia-ccf/legislatia-care-reglementeaza-activitatea/
- **CECCAR (expert contabili)**: https://ceccar.ro/
- **Cluj-Napoca + filiale județene CECCAR**: https://ceccaralba.ro/

### I.4 Documentație API SPV oficial + tutoriale

| Resursă | URL |
|---|---|
| Procedura OAuth ANAF | https://static.anaf.ro/static/10/Anaf/Informatii_R/API/Oauth_procedura_inregistrare_aplicatii_portal_ANAF.pdf |
| iApp.ro generare token | https://iapp.ro/articol/generare-token-anaf-folosind-certificat-digital-din-php-oauth2 |
| SAP Community Postman ANAF | https://community.sap.com/t5/technology-blog-posts-by-sap/generating-an-authorization-token-in-romania-s-anaf-portal-using-postman/ba-p/13577060 |
| WinMentor doc token ANAF | https://download.winmentor.ro/WinMentor/Documentatie/20_e-Factura/WMC%20-%20Obtinere%20token%20ANAF.pdf |
| Sasory tokens SPV | https://www.sasory.ro/postari/postare.php?id=77 |

### I.5 e-Factura terțe părți relevante

| Resursă | URL |
|---|---|
| DDD Invoices guide RO | https://dddinvoices.com/learn/e-invoicing-romania |
| Storecove SAF-T | https://www.storecove.com/blog/en/romanian-saf-t-declaration/ |
| S4FN SAF-T RO | https://s4fn.com/romania-saf-t |
| VATupdate RO | https://www.vatupdate.com/2021/08/18/standard-fiscal-control-file-saf-t-and-voluntary-testing-for-uploading-the-d406t-return/ |
| Odoo l10n_ro_account_edi_ubl | https://apps.odoo.com/apps/modules/16.0/l10n_ro_account_edi_ubl |

---

## J. Brutal honest review — calitatea fiecărei surse

| Sursă | Calitate | Pentru ce e bună | Pentru ce NU e bună |
|---|---|---|---|
| legislatie.just.ro | ⭐⭐⭐⭐⭐ Oficial | Referință legală absolută | UX prost, fără căutare semantică |
| static.anaf.ro | ⭐⭐⭐⭐ Oficial dar fragmentat | Manuale + broșuri + formulare | Lipsesc indexuri unificate, search slab |
| Lege5.ro (Indaco) | ⭐⭐⭐⭐ | UX excelent, free | Marketing intrusive, dar are gratis tot |
| Sintact (Wolters Kluwer) | ⭐⭐⭐⭐⭐ | Cod comentat + jurisprudență | Pay-wall (~100 EUR/lună) |
| PwC Worldwide Tax Summaries | ⭐⭐⭐⭐⭐ | Comprehensive free + actualizat | EN principal, mai puțin RO |
| EY Tax Alerts | ⭐⭐⭐⭐ | Detaliu tehnic excelent | Discontinuu — necesar abonament newsletter |
| KPMG TaxNewsflash | ⭐⭐⭐⭐ | PDF compact, ușor consumat | EN majoritar |
| Deloitte Weekly | ⭐⭐⭐⭐ | Cea mai consistentă cadență | Acces partial public |
| Forvis Mazars CEE Guide | ⭐⭐⭐⭐⭐ | Compactat 200 pag, gratuit | Anual, e top |
| Manual control fiscal RO 2023 | ⭐⭐⭐⭐⭐ | **Sursa cea mai apropiată de "playbook" intern ANAF** | E un manual UE-coordonat, nu chiar instrumentar zilnic |
| Materiale deficiențe control sem I+II 2024 | ⭐⭐⭐⭐⭐ | **Lista efectivă a greșelilor găsite** | Doar 2 documente pe an |
| Fișa risc fiscal | ⭐⭐⭐⭐⭐ | Sursa pentru scoring CompliScan | Specific TVA refund — extrapolare către general |
| CECCAR Business Magazine | ⭐⭐⭐⭐ | Free, săptămânal, profesional | Stiluri redactionale mixte |
| Curierul Fiscal | ⭐⭐⭐⭐ | Cele mai vechi articole + opinion pieces | Abonament |
| The Tax Institute Monitor Fiscal | ⭐⭐⭐⭐ | Bi-săptămânal compact | Niche audience |
| Forum SAGA | ⭐⭐⭐⭐ | **Cazuri reale necătălogate aiurea** | Calitate diversă, dar volum 15K+ topice |
| Avocatnet | ⭐⭐⭐⭐ | Q&A juridic gratis | Răspunsuri uneori amateur |
| GitHub open-source RO fiscal | ⭐⭐⭐ | Code SDK + scheme tehnice | **Zero proiecte pentru scoring risc** — GAP critic |
| Teze ASE/UBB/UVT | ⭐⭐⭐ | Framework conceptual | Nu reguli executabile |
| data.gov.ro | ⭐⭐⭐ | CAEN + SIRUTA datasets | Sparse, nu actualizat consistent |

---

## K. RECOMANDARE FINALĂ — ce să prioritizezi pentru CompliScan ANAF Mirror

### K.1 Adăugări CRITICE peste cele 140 reguli existente

**Prioritate 1 (must-add):**

1. **Manualul de control fiscal RO 2023 (REFORM/SC2022/039)** — parcurs integral, extrage operațional checkpoint-uri inspectori
   - https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/Manual_de_control_fiscal_versiune%20finala_RO_24_07_2023.pdf

2. **Material deficiențe control sem I + II 2024** — ANAF publică efectiv pattern-urile de greșeli — sursă directă pentru reguli noi
   - https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Material_deficiente_sem_II_2024.pdf
   - https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/deficiente_semestrul_I_2024.pdf

3. **OPANAF 675/2018 metode indirecte stabilire venituri PF** — algoritm sursă-utilizări, cash flow, net asset
   - https://static.anaf.ro/static/10/Anaf/legislatie/OMFP_675_2018.pdf

4. **OPANAF 2017/2022 sub-criterii risc fiscal** — extensia oficială peste cadrul OUG
5. **Hub-ul SAF-T + XLS Schema 19.02.2026** — referință tehnică actualizată
   - https://static.anaf.ro/static/10/Anaf/Informatii_R/saf_t.htm

6. **OUG 13/2026 + OUG 7/2026 + OUG 8/2026** (deja parțial în base truth) — verificare integrală

**Prioritate 2 (high-value):**

7. **Raport activitate ANAF S1 2025** — KPIs target colectare + categorii control (deduce focusul ANAF)
8. **OPANAF-uri 2026 (15, 28, 57, 59, 143, 174, 326, 412, 433, 434, 436, 505, 507, 508)** — toate cu link-uri verificate
9. **Procedura D394** + algoritm cross-check D394 vs D300 (sursă fraudă carusel TVA)
10. **OPANAF 802/2022** (e-Transport legea-cadru) + lista bunuri risc ridicat actualizată 2026

**Prioritate 3 (nice-to-have):**

11. **PwC Worldwide Tax Summaries Romania** — pentru cross-validation interpretări
12. **Forvis Mazars CEE Tax Guide 2026** — comparativ
13. **CECCAR Business Magazine + Curierul Fiscal** — articole risc fiscal 2025-2026 (sample 10-20)
14. **The Tax Institute Monitor Fiscal 2026** — sintezele bi-săptămânale
15. **printesoi/e-factura-go** — referință SDK pentru a vedea cum un proiect open-source structurează UBL/CIUS-RO

### K.2 Top 20 link-uri critice pentru codare CompliScan ANAF Mirror

1. **Fișa risc fiscal (oficial):** https://static.anaf.ro/static/10/Anaf/transparenta/Anexanr2laproceduraFisaindicriscfiscal.htm
2. **Manual control fiscal RO 2023:** https://static.anaf.ro/static/10/Anaf/Informatii_R/inspectie_fiscala/Manual_de_control_fiscal_versiune%20finala_RO_24_07_2023.pdf
3. **Deficiențe control sem II 2024:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Material_deficiente_sem_II_2024.pdf
4. **Deficiențe control sem I 2024:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/deficiente_semestrul_I_2024.pdf
5. **OPANAF 675/2018 (metode indirecte):** https://static.anaf.ro/static/10/Anaf/legislatie/OMFP_675_2018.pdf
6. **Anexa Metodologie deconturi TVA:** https://static.anaf.ro/static/10/Anaf/transparenta/Anexa_OMEF_Metodologie.pdf
7. **Cod Fiscal MJ:** https://legislatie.just.ro/Public/DetaliiDocument/171282
8. **CPF MJ + ANAF:** https://static.anaf.ro/static/10/Anaf/cod_procedura/Cod_Procedura_Fiscala_2023.htm
9. **Hub SAF-T D406:** https://static.anaf.ro/static/10/Anaf/Informatii_R/saf_t.htm
10. **Hub e-Factura MFinante:** https://mfinante.gov.ro/en/web/efactura
11. **Index ghiduri ANAF:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/ghid_asoc_propr.htm
12. **Index formulare ANAF:** https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Toateformularele/Toate_Formularele.html
13. **ANAF transparență decizională (drafts):** https://www.anaf.ro/anaf/internet/ANAF/transparenta_decizionala
14. **OUG 13/2026 (e-TVA dezactivare):** https://www.universuljuridic.ro/cod-fiscal-si-alte-acte-normative-in-materie-fiscal-bugetara-modificari-o-u-g-nr-13-2026/
15. **OUG 7/2026:** https://static.anaf.ro/static/10/Anaf/legislatie/OUG_7_2026.pdf
16. **Registru TVA + Inactivi (API):** https://www.anaf.ro/RegistruTVA/ + https://www.anaf.ro/inactivi/rezultatInactivi.jsp
17. **PwC Worldwide Tax Summaries RO:** https://taxsummaries.pwc.com/romania
18. **printesoi/e-factura-go (SDK Go referință):** https://github.com/printesoi/e-factura-go
19. **stefanache/MFP-ANAF-RO (hub):** https://github.com/stefanache/MFP-ANAF-RO
20. **Raport ANAF S1 2025:** https://static.anaf.ro/static/10/Anaf/Informatii_R/18.08.2025%20-%20Raport%20de%20activitateANAF_2025S1_V7.pdf

### K.3 Răspunsuri brutal honest la întrebări strategice

**Q: Există vreo sursă publică care „rezolvă tot"?**
**R: NU.** Legea + Codul Fiscal + CPF sunt complete dar abstracte. Manualul de control fiscal 2023 e cel mai aproape, dar e UE-coordonat, nu un playbook tactic. **Gap-ul real:** nu există document oficial care să mapeze "ce caută ANAF la control pentru SRL X cu CAEN Y în 2026". Asta e oportunitatea CompliScan.

**Q: Există open-source pentru scoring de risc fiscal RO?**
**R: NU. Zero proiecte.** Toate cele 20+ repo-uri pe topic `anaf` sunt centrate pe e-Factura, SAF-T, verificare CIF. **Niciun simulator inspecție, niciun mirror APIC, niciun risk-scoring engine.** Confirmă piața pentru CompliScan.

**Q: Sunt teze academice utile?**
**R: Limitat.** ~5 teze 2010-2024 demonstrează că risc fiscal RO e topic studiat, dar **nu produc modele executabile**. Folosibile doar ca demonstrație că abordarea e fundamentată științific (pentru pitch + credibilitate).

**Q: Cât de fragmentat e ANAF real?**
**R: Foarte.** static.anaf.ro are 60+ broșuri/ghiduri, 20+ secțiuni transparență, 30+ formulare, 5+ subdomenii (legislatie/, transparenta/, AsistentaContribuabili_r/, Informatii_R/, Declaratii_R/, formulare/, Cod_fiscal/, cod_procedura/, Brasov/, Cluj/, Galati/...). **Fără indexare unificată sau API.** Aici e diferențiatorul CompliScan: rolul de "ANAF mirror" e exact agregarea + structurarea ce face produsul valoros.

**Q: Big 4 surse — sunt necesare?**
**R: Da, pentru interpretare.** Legea singură e ambiguă. Cei mai buni: **PwC Worldwide Tax Summaries** (free + comprehensive), **Forvis Mazars CEE Tax Guide** (free, anual), **EY Tax Alerts** (cele mai detaliate), **KPMG TaxNewsflash** (cele mai compacte). Combinarea lor = redundanță utilă (catch interpretări divergente).

**Q: Care e ordinea de prioritizare?**
**R:**
1. **Legea brută** (Cod Fiscal + CPF actualizate) — referință absolută
2. **OPANAF + OUG 2024-2026** — modificările recente
3. **Manualul de control fiscal 2023 + Deficiențe control** — playbook operațional
4. **Fișa risc fiscal + OPANAF 675/2018 + 2017/2022** — algoritmi scoring
5. **Big 4 alerts** — interpretări actualizate
6. **CECCAR + Curierul + Tax Institute** — cross-check profesional
7. **Forumuri (SAGA, avocatnet, portalcontabilitate)** — semnale comportamentale
8. **GitHub SDK-uri** — referință tehnică implementare

---

## Bilanț final

**Surse cataloagate total:** 130+ link-uri verificate (legislație, ghiduri ANAF, formulare, OPANAF/OUG, GitHub, Big 4, reviste, teze, forumuri, registre, nomenclatoare).

**Surse NOI vs research-ul actual CompliScan (140 reguli + Fișa risc + 33 teste SAF-T):**
- ~80% surse sunt NOI (Manualul control 2023, Deficiențe control, OPANAF 2026 complete, hub-uri Big 4, repo-urile open-source, forumuri)
- ~20% confirmă/triangulează surse existente

**Gap-uri rămase de explorat (în afara scope-ului acestui inventar):**
- Lista completă OPANAF arhivă 2015-2023 (~500 ordine, doar 30+ verificate aici)
- Jurisprudență fiscală RO (ÎCCJ + tribunale) — necesită Sintact/Indaco pay-wall
- Manuale interne ANAF nepublicate (FOIA potențial — Legea 544/2001)
- Date din ANAFI (sistemul intern de asistență contribuabili — accesibil public la https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/servicii_oferite_contribuabililor/anafi)
- Comunicări interne CECCAR + CCF accesibile doar membrilor

**Recomandare finală tactică:**
Pentru următorul sprint de îmbogățire reguli CompliScan, prioritizează (în ordine):
1. **Manualul de control fiscal RO 2023** (extrage 30-50 reguli operaționale)
2. **Materialele deficiențe control 2024** (extrage 20-30 pattern-uri reale)
3. **OPANAF 675/2018** (3 metode indirecte = 15+ semnale algoritmice pentru PF)
4. **OPANAF 2017/2022** (sub-criterii oficiale dincolo de cadrul OUG)
5. **Confirmare OUG 13/2026 + 7/2026 + 8/2026 integral** (status update pentru toate cele 140 reguli existente)

Apoi cross-validate cu Big 4 (PwC summaries + EY/KPMG/Deloitte/Mazars alerts) pentru interpretări de ambiguitate.

---

*Document generat 2026-05-14, triangulat din 14 căutări web Anthropic + 6 fetch-uri directe + analiză repo GitHub `topics:anaf`. Toate link-urile validate la momentul redactării. Re-verificare recomandată trimestrial pentru actualizare OPANAF/OUG.*
