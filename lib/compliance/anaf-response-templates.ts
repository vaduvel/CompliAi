// Bibliotecă de template-uri pentru răspunsuri standard la notificări ANAF.
//
// Surse: practica contabililor + texte legale OUG 70/2024, OUG 89/2025,
// Cod Procedură Fiscală Art. 105.
//
// Fiecare template:
//   - tip notificare (etva_diff_sub_threshold, etva_diff_above_threshold,
//     conformare_factura_furnizor, conformare_cheltuieli_nejustificate, etc.)
//   - subject (linia de subiect a răspunsului)
//   - body cu placeholders {{org_name}}, {{cif}}, {{period}}, etc.
//   - referință legală
//   - acțiunea recomandată după trimitere

export type AnafNotificationType =
  | "etva_diff_sub_threshold"          // P300 vs D300, Δ sub prag
  | "etva_diff_above_threshold"        // P300 vs D300, Δ peste prag
  | "conformare_factura_furnizor_lipsa" // Furnizor nu a declarat factura în D394
  | "conformare_cheltuieli_nejustificate" // ANAF consideră riscante anumite cheltuieli
  | "conformare_facturi_e_factura_netransmise" // Lipsă transmitere e-Factura
  | "saft_d406_eroare_validare"        // Eroare validare D406 ANAF
  | "saft_d406_lipsa_depunere"         // Termen ratat D406
  | "amenda_e_factura_b2b"              // Amendă pentru netransmitere
  | "etva_duplicate_invoice"            // Notificare cu factură duplicată
  | "spv_cont_inactiv"                  // SPV neactivat sau cu acces restricționat

export type ResponseTemplate = {
  type: AnafNotificationType
  label: string                         // ex: „Răspuns notificare e-TVA — diferențe sub prag"
  subject: string                       // subiect email/fax/SPV
  body: string                          // body cu placeholders
  legalReference: string
  recommendedAction: string             // ce să facă contabilul după trimitere
  attachmentsRequired: string[]         // documente de atașat
}

export const ANAF_RESPONSE_TEMPLATES: ResponseTemplate[] = [
  {
    type: "etva_diff_sub_threshold",
    label: "Răspuns notificare e-TVA — diferențe sub prag (>20% SAU ≥5K, dar nu ambele)",
    subject:
      "Răspuns la notificarea e-TVA pentru perioada {{period}} — CIF {{cif}} — diferențe explicate",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, am primit notificarea dvs. privind diferențele între declarația D300 depusă pentru perioada {{period}} și declarația 300 pre-completată (P300).

Am analizat diferențele identificate și am constatat:
- {{difference_explanation}}

Diferențele observate sunt sub pragul tehnic de notificare (>20% AND ≥5.000 RON conform OUG 70/2024 modif. OUG 89/2025) și provin din {{cause}} (ex: facturi de la furnizori întârziate la sincronizare, ajustări fiscale conform Cod Fiscal Art. {{art}}).

Anexăm:
{{attachments_list}}

Considerăm că D300 depusă reflectă corect operațiunile economice ale perioadei și că nu se impune rectificare.

Cu deosebită considerație,
{{signer_name}}
{{signer_role}}`,
    legalReference: "OUG 70/2024 (modif. OUG 89/2025) · Cod Fiscal Art. 322",
    recommendedAction:
      "După trimitere, monitorizează inboxul SPV pentru eventuală re-notificare. Dacă ANAF cere informații suplimentare în 20 zile, răspunde imediat.",
    attachmentsRequired: ["Extras D300 depusă", "Extras P300 ANAF", "Justificare diferență (notă)"],
  },
  {
    type: "etva_diff_above_threshold",
    label: "Răspuns notificare e-TVA — diferențe PESTE prag (rectificare D300)",
    subject:
      "Răspuns la notificarea e-TVA pentru perioada {{period}} — CIF {{cif}} — depunere D300 rectificativă",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, ca răspuns la notificarea dvs. privind perioada {{period}}, confirm că diferențele identificate între D300 depusă și P300 pre-completat depășesc pragul tehnic de notificare (>20% ȘI ≥5.000 RON).

Am analizat sursele diferenței și am identificat:
- {{cause}}

Pentru remediere, am depus în data de {{rectification_date}} declarația D300 rectificativă pentru perioada {{period}} cu următoarele corecții:
- {{corrections_list}}

Anexăm:
{{attachments_list}}

Considerăm cazul închis cu această rectificare. Vă rog confirmați recepția și păstrarea în dosarul fiscal.

Cu deosebită considerație,
{{signer_name}}
{{signer_role}}`,
    legalReference: "OUG 70/2024 · Cod Fiscal Art. 322 alin. 2",
    recommendedAction:
      "Asigură-te că D300 rectificativă a fost depusă efectiv via SPV ÎNAINTE de a trimite acest răspuns. Atașează confirmarea SPV (recipisa).",
    attachmentsRequired: [
      "Recipisa SPV pentru D300 rectificativă",
      "Comparator D300 vs P300 după rectificare",
      "Notă justificativă cu sursele diferenței",
    ],
  },
  {
    type: "conformare_factura_furnizor_lipsa",
    label: "Răspuns notificare conformare — furnizor nu a declarat factura",
    subject:
      "Răspuns la notificarea de conformare pentru factura {{invoice_number}} — CIF {{cif}}",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, am primit notificarea dvs. de conformare privind factura {{invoice_number}} emisă de furnizorul {{supplier_name}} (CIF {{supplier_cif}}).

Confirm că factura a fost primită și înregistrată legal în contabilitatea firmei subscrisă, având toate elementele necesare conform Cod Fiscal Art. 319. Atașez:
- Copia facturii originale
- Confirmarea recepției e-Factura din SPV (data {{efactura_date}})
- Extras din jurnalul de cumpărări (luna {{period}})

Posibilitatea ca furnizorul să nu fi declarat factura în D394 nu afectează deductibilitatea TVA-ului în beneficiul subscrisei, conform jurisprudenței CJUE (cauza C-385/09 Nidera) și prevederilor Cod Fiscal Art. 297.

Solicităm să transmiteți această confirmare furnizorului pentru a-și corecta declarația.

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "Cod Fiscal Art. 297 + 319 · CJUE C-385/09 (Nidera)",
    recommendedAction:
      "După trimitere, contactează furnizorul direct să-și depună D394 rectificativă. Păstrează copie din SPV ca dovadă pentru eventual control.",
    attachmentsRequired: [
      "Factură originală PDF",
      "Confirmare recepție e-Factura SPV",
      "Extras jurnal cumpărări",
    ],
  },
  {
    type: "conformare_cheltuieli_nejustificate",
    label: "Răspuns notificare conformare — cheltuieli nejustificate",
    subject:
      "Răspuns la notificarea de conformare privind cheltuielile {{period}} — CIF {{cif}} — justificare deductibilitate",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, în răspuns la notificarea dvs. privind cheltuielile considerate ca posibil nejustificate pentru perioada {{period}}, transmit următoarele clarificări:

Cheltuielile menționate (sumă totală {{total_amount}} RON) se referă la {{expense_category}} și sunt deductibile fiscal conform Cod Fiscal Art. 297, având:
- Documente justificative complete (anexate)
- Legătură directă cu activitatea economică (obiect de activitate {{caen_code}})
- Înregistrare contabilă conformă cu OMFP 1802/2014

Pentru fiecare cheltuială atașez:
{{attachments_list}}

Considerăm că deductibilitatea acestor cheltuieli este pe deplin justificată legal și nu se impune o ajustare a impozitului pe profit.

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "Cod Fiscal Art. 297 · OMFP 1802/2014",
    recommendedAction:
      "Asigură-te că ai documente justificative pentru FIECARE cheltuială menționată în notificare. Atașează minim factura + bonul/decontul + dovada plății.",
    attachmentsRequired: [
      "Facturi originale PDF",
      "Documente justificative (deconturi, contracte)",
      "Extras cont bancar cu plățile",
    ],
  },
  {
    type: "conformare_facturi_e_factura_netransmise",
    label: "Răspuns notificare — facturi netransmise în e-Factura",
    subject:
      "Răspuns notificare facturi neraportate e-Factura — perioada {{period}} — CIF {{cif}}",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, am primit notificarea privind facturile considerate ca netransmise în sistemul RO e-Factura pentru perioada {{period}}.

Am identificat {{count}} facturi în această situație:
{{invoices_list}}

Cauzele observate:
- {{cause}} (ex: indisponibilitate sistem ANAF e-Factura, eroare token OAuth, retransmitere blocată)

Acțiuni întreprinse:
1. Am verificat statusul în SPV — facturile {{transmitted_count}} apar transmise corect.
2. Pentru cele {{still_pending_count}} netransmise, am inițiat retransmitere în data de {{retransmission_date}}.
3. Am atașat dovezi de încercare anterior (logs SmartBill/Saga + capturi error message ANAF).

Solicităm respectuos să:
- Confirmați recepția pentru facturile transmise corect
- Anulați eventualele penalități pentru perioada de indisponibilitate ANAF (conform Codul Procedură Fiscală Art. 105 alin. 4)

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "OUG 120/2021 modif. OUG 115/2023 · Cod Procedură Fiscală Art. 105",
    recommendedAction:
      "Atașează capturi de ecran cu erorile ANAF din momentul încercării de transmitere (Bad Gateway, OAuth fail, etc.). Acestea pot anula penalitățile.",
    attachmentsRequired: [
      "Lista facturi cu status",
      "Capturi error ANAF (dacă au fost erori)",
      "Recipise SPV pentru retransmitere",
    ],
  },
  {
    type: "saft_d406_eroare_validare",
    label: "Răspuns — eroare validare D406 SAF-T",
    subject: "Răspuns notificare D406 SAF-T — eroare structură pentru perioada {{period}}",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, în legătură cu notificarea de eroare la validarea D406 SAF-T pentru perioada {{period}}:

Eroarea raportată: {{error_message}}
Cauza identificată: {{root_cause}} (ex: cont 442 trunchiat la 3 cifre, ProductCode lipsă, încărcare cu validator vechi)

Acțiuni întreprinse:
1. Am corectat planul de conturi în programul {{accounting_software}} — actualizare la versiunea {{software_version}}.
2. Am redepus D406 pentru perioada {{period}} în data de {{redepunere_date}} — recipisă ataşată.
3. Am verificat integritatea fișierului XML pre-depunere cu validatorul oficial ANAF DUKIntegrator versiunea {{validator_version}}.

Considerăm cazul închis cu această re-depunere conformă.

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "Ord. ANAF 1783/2021 · OUG 188/2022",
    recommendedAction:
      "Verifică în programul tău contabil că plan de conturi e corect (cont 442 cu 4 cifre obligatoriu). Folosește validator-ul SAF-T din CompliScan ÎNAINTE de re-depunere.",
    attachmentsRequired: ["Recipisa SPV redepunere D406", "Output validator DUKIntegrator (clean)"],
  },
  {
    type: "amenda_e_factura_b2b",
    label: "Contestație amendă e-Factura B2B (cu motiv tehnic ANAF)",
    subject:
      "Contestație amendă {{amenda_amount}} RON — neplauzibilitate tehnică ANAF perioada {{period}}",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, contestă procesul-verbal de amendă nr. {{pv_number}} din data {{pv_date}}, în valoare de {{amenda_amount}} RON, pentru pretinsa netransmitere a facturii {{invoice_number}} în sistemul RO e-Factura.

Motive de contestare:
1. **Indisponibilitate platforma ANAF** — în perioada {{outage_period}}, sistemul e-Factura a fost indisponibil sau a returnat erori HTTP 502/503/504. Anexez capturi de ecran cu mesaje de eroare datate.
2. **Imposibilitate obiectivă de îndeplinire** — conform Cod Procedură Fiscală Art. 105 alin. 4, neîndeplinirea obligației din cauza forței majore (defecțiune sistem terț ANAF) NU atrage sancțiuni.
3. **Termen de transmitere prelungit automat** — conform OUG 120/2021 Art. 13 alin. (4), termenul se prelungește cu durata indisponibilității sistemului.

Solicit:
- Anularea amenzii {{amenda_amount}} RON
- Confirmarea în scris a faptului că factura {{invoice_number}} a fost transmisă corect (în data {{transmission_date}}, după revenirea sistemului)

Anexez:
- Capturi de ecran cu erorile ANAF datate
- Recipisa SPV de transmitere ulterioară
- Documentația tehnică oficială ANAF privind indisponibilitatea (dacă a fost publicată)

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "Cod Procedură Fiscală Art. 105 alin. 4 · OUG 120/2021 Art. 13",
    recommendedAction:
      "Contestația trebuie depusă în 45 zile de la primirea PV. Atașează DOVEZI tehnice (screenshots datate). În lipsa lor, contestația va fi respinsă.",
    attachmentsRequired: [
      "Procesul-verbal de amendă (copie)",
      "Capturi de ecran erori ANAF datate",
      "Recipisa SPV transmitere finală",
    ],
  },
  {
    type: "etva_duplicate_invoice",
    label: "Răspuns — facturi duplicate în notificarea e-TVA",
    subject: "Răspuns la notificarea e-TVA cu duplicate — perioada {{period}} — CIF {{cif}}",
    body: `Stimată Direcție,

Subscrisa, {{org_name}}, CIF {{cif}}, am primit notificarea dvs. e-TVA pentru perioada {{period}} ce conține {{duplicate_count}} facturi duplicate (apar de mai multe ori în P300 pre-completat).

Am verificat în propria evidență contabilă (jurnal cumpărări/vânzări) și confirm că:
- Fiecare factură menționată există o singură dată în registrele noastre
- Suma TVA dedusă/colectată în D300 reflectă corect aceste tranzacții (fiecare o singură dată)
- Diferența între P300 și D300 provine exclusiv din duplicarea acestora în baza ANAF

Solicit corectarea P300 prin eliminarea duplicatelor și considerăm cazul închis fără rectificare D300.

Anexez:
- Listă facturi cu indicare unde apar duplicate în P300
- Extras jurnal cumpărări/vânzări (intrare unică per factură)

Cu deosebită considerație,
{{signer_name}}`,
    legalReference: "OUG 70/2024 · Cod Fiscal Art. 297",
    recommendedAction:
      "Documentează ECHIDIC fiecare duplicat (poziția 1 vs. poziția 2 în P300). Solicită răspuns scris ANAF că P300 va fi corectat.",
    attachmentsRequired: [
      "Listă duplicate identificate",
      "Extras jurnal contabil unic",
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getTemplateByType(type: AnafNotificationType): ResponseTemplate | null {
  return ANAF_RESPONSE_TEMPLATES.find((t) => t.type === type) ?? null
}

export function fillTemplate(
  template: ResponseTemplate,
  values: Record<string, string>,
): { subject: string; body: string } {
  const fill = (str: string) =>
    str.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? `{{${key}}}`)
  return {
    subject: fill(template.subject),
    body: fill(template.body),
  }
}

export const ANAF_TEMPLATE_TYPES: Array<{ type: AnafNotificationType; label: string }> =
  ANAF_RESPONSE_TEMPLATES.map((t) => ({ type: t.type, label: t.label }))
