/**
 * FiscCopilot — Match Path implementations (top 5 pentru MVP)
 *
 * Fiecare path = pure function deterministică, testabilă.
 * Returnează alert(s) atunci când se aplică.
 */

import type {
  ClientProfile,
  FiscalEvent,
  MatchPath,
  MatchPathAlert,
} from "./types";

function daysBetween(a: Date, b: Date): number {
  const ms = a.getTime() - b.getTime();
  return Math.floor(ms / 86_400_000);
}

function nextDeadline(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0));
}

// ============================================================================
// PATH 1: D205 expiră (dividende) — alert cu 14/7/3/1 zile
// ============================================================================
export const PATH_D205_DEADLINE: MatchPath = {
  id: "d205-deadline",
  name: "D205 dividende — termen apropiat",
  description:
    "Alertă escaladantă pentru depunerea D205 (declarație informativă impozit reținut la sursă pe dividende). Termen: ultima zi din februarie.",
  detect: (client, events, today) => {
    // Aplicabil DOAR pentru SRL/SRL_MICRO care distribuie dividende
    if (!["SRL", "SRL_MICRO"].includes(client.type)) return [];
    if (!client.flags.includes("distribuie_dividende")) return [];

    // Detectează dacă în anul anterior a fost dividend distribution
    const yearAgo = today.getFullYear() - 1;
    const hadDividend = events.some(
      (e) => e.type === "dividend_distribution" && new Date(e.date).getFullYear() === yearAgo
    );
    if (!hadDividend) return [];

    // Check dacă D205 deja depus pentru anul anterior
    const alreadySubmitted = events.some(
      (e) =>
        e.type === "declaration_submitted" &&
        e.meta?.declarationType === "D205" &&
        e.meta?.forYear === yearAgo
    );
    if (alreadySubmitted) return [];

    // Termen: ultima zi din februarie a anului curent
    const isLeapYear =
      (today.getFullYear() % 4 === 0 && today.getFullYear() % 100 !== 0) ||
      today.getFullYear() % 400 === 0;
    const deadline = nextDeadline(today.getFullYear(), 1, isLeapYear ? 29 : 28); // luna 1 = februarie

    const daysToDeadline = daysBetween(deadline, today);
    if (daysToDeadline > 30 || daysToDeadline < -30) return []; // doar în fereastra +30/-30

    let severity: MatchPathAlert["severity"] = "info";
    if (daysToDeadline < 0) severity = "urgent"; // întârziat
    else if (daysToDeadline <= 1) severity = "urgent";
    else if (daysToDeadline <= 3) severity = "high";
    else if (daysToDeadline <= 7) severity = "medium";
    else if (daysToDeadline <= 14) severity = "low";
    else severity = "info";

    const status =
      daysToDeadline < 0
        ? `ÎNTÂRZIAT cu ${Math.abs(daysToDeadline)} zile`
        : `expiră în ${daysToDeadline} zile (${deadline.toLocaleDateString("ro-RO")})`;

    return [
      {
        pathId: "d205-deadline",
        pathName: "D205 dividende — termen",
        clientId: client.id,
        clientName: client.name,
        severity,
        detectedAt: today.toISOString(),
        title: `D205 ${status}`,
        explanation: `${client.name} a distribuit dividende în ${yearAgo}. Declarația informativă D205 pentru impozit reținut la sursă (8%) trebuie depusă până la ultima zi din februarie ${today.getFullYear()}. ${daysToDeadline < 0 ? "Termenul a trecut — risc de amendă pentru declarație informativă întârziată." : ""}`,
        actionSteps: [
          "Centralizează plățile de dividende din anul anterior pe fiecare beneficiar.",
          "Verifică AGA și statele de dividende pentru fiecare distribuire.",
          "Completează D205 cu CNP/CIF, valoare brută, impozit reținut (8%) per beneficiar.",
          "Depune online prin SPV sau DUKIntegrator.",
          "Salvează recipisa în audit pack.",
        ],
        legalSources: [
          { label: "OPANAF 587/2016 (cu modificările ulterioare)", ref: "anaf.ro" },
          { label: "Codul Fiscal art. 132 alin. (2)", ref: "legislatie.just.ro" },
        ],
        deadlineDate: deadline.toISOString(),
      },
    ];
  },
};

// ============================================================================
// PATH 2: Diurnă — propagare în D112
// ============================================================================
export const PATH_DIURNA_D112: MatchPath = {
  id: "diurna-d112",
  name: "Diurnă — propagare în D112",
  description:
    "Detectează înregistrări de diurnă și propune verificarea propagării în declarația D112 lunară.",
  detect: (client, events, today) => {
    if (!client.hasEmployees) return [];

    // Diurne înregistrate în ultima lună
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const recentDiurne = events.filter(
      (e) => e.type === "diurna_recorded" && new Date(e.date) >= lastMonth
    );
    if (recentDiurne.length === 0) return [];

    // D112 termen: 25 ale lunii curente pentru luna anterioară
    const d112Deadline = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 25));
    const daysToD112 = daysBetween(d112Deadline, today);

    if (daysToD112 < -5 || daysToD112 > 20) return []; // doar în fereastră

    const severity: MatchPathAlert["severity"] =
      daysToD112 < 0 ? "urgent" : daysToD112 <= 3 ? "high" : daysToD112 <= 7 ? "medium" : "low";

    const totalDiurnaRON = recentDiurne.reduce((sum, e) => sum + (e.amountRON || 0), 0);

    return [
      {
        pathId: "diurna-d112",
        pathName: "Diurnă → D112",
        clientId: client.id,
        clientName: client.name,
        severity,
        detectedAt: today.toISOString(),
        title: `${recentDiurne.length} diurne (${totalDiurnaRON.toFixed(0)} RON) de propagat în D112`,
        explanation: `Pentru ${client.name} am detectat ${recentDiurne.length} înregistrări de diurnă în ultima lună (total ${totalDiurnaRON.toFixed(0)} RON). Conform Cod Fiscal art. 76, diurnele peste plafonul neimpozabil se includ în D112. Termenul D112 este pe 25 ale lunii.`,
        actionSteps: [
          "Verifică fiecare diurnă: este sub plafonul neimpozabil (23 RON/zi în țară) sau o depășește?",
          "Pentru diurnele PESTE plafon: calculează partea impozabilă.",
          "Înregistrează partea impozabilă în statul de plată pe salariatul respectiv.",
          "Verifică că D112 reflectă corect contribuțiile pe partea impozabilă.",
          "Salvează nota justificativă în audit pack.",
        ],
        legalSources: [
          { label: "Cod Fiscal art. 76 (diurne)", ref: "legislatie.just.ro" },
          { label: "OPANAF 1853/2024 (D112)", ref: "anaf.ro" },
        ],
        deadlineDate: d112Deadline.toISOString(),
      },
    ];
  },
};

// ============================================================================
// PATH 3: Casa de marcat — prag rulaj
// ============================================================================
export const PATH_CASA_MARCAT: MatchPath = {
  id: "casa-marcat-prag",
  name: "Casă de marcat — verificare obligație",
  description:
    "Pentru PFA/II/SRL cu vânzări numerar, verifică dacă rulajul anual depășește pragul ce face AMEF obligatorie.",
  detect: (client, events, today) => {
    if (!client.flags.includes("vanzari_numerar")) return [];
    if (client.flags.includes("are_casa_marcat")) return [];

    const yearStart = new Date(Date.UTC(today.getFullYear(), 0, 1));
    const revenueYTD = events
      .filter(
        (e) =>
          (e.type === "bank_receipt" || e.type === "invoice_emitted") &&
          new Date(e.date) >= yearStart
      )
      .reduce((sum, e) => sum + (e.amountRON || 0), 0);

    // Prag aprox 100.000 EUR ~= 500.000 RON (folosim 500K RON ca threshold prudent)
    const THRESHOLD_RON = 500_000;
    if (revenueYTD < THRESHOLD_RON * 0.5) return []; // sub 50% din prag, nu alertăm

    const ratio = revenueYTD / THRESHOLD_RON;
    let severity: MatchPathAlert["severity"];
    if (ratio >= 1) severity = "urgent";
    else if (ratio >= 0.9) severity = "high";
    else if (ratio >= 0.75) severity = "medium";
    else severity = "low";

    return [
      {
        pathId: "casa-marcat-prag",
        pathName: "Casa de marcat — prag",
        clientId: client.id,
        clientName: client.name,
        severity,
        detectedAt: today.toISOString(),
        title: `Rulaj ${revenueYTD.toFixed(0)} RON (${(ratio * 100).toFixed(0)}% din pragul AMEF)`,
        explanation: `${client.name} are vânzări cu numerar și NU are casă de marcat înregistrată. Rulajul anual cumulat de la 1 ianuarie este de ${revenueYTD.toFixed(0)} RON, aproape de pragul de aprox. 500.000 RON care face AMEF obligatorie pentru cei mai mulți operatori. Verifică în OG 28/1999 actualizat pragul exact pentru profilul tău.`,
        actionSteps: [
          "Verifică OG 28/1999 actualizat pentru pragul exact pe profilul tău fiscal.",
          "Dacă se aplică: comandă AMEF de la furnizor autorizat ANAF.",
          "Înregistrează AMEF în SPV cu profil fiscal și serie.",
          "Configurează raportare lunară Z.",
          "Asigură-te că toate vânzările cu numerar trec prin AMEF de la activare.",
        ],
        legalSources: [
          { label: "OG 28/1999 cu modificările ulterioare", ref: "legislatie.just.ro" },
          { label: "OPANAF privind AMEF", ref: "anaf.ro" },
        ],
        estimatedImpactRON: 10_000, // amendă potentială
      },
    ];
  },
};

// ============================================================================
// PATH 4: Microîntreprindere — depășire prag 500K EUR
// ============================================================================
export const PATH_MICRO_PRAG: MatchPath = {
  id: "micro-prag",
  name: "Microîntreprindere — apropiere prag 500K EUR",
  description:
    "Verifică dacă microîntreprinderea se apropie de pragul 500.000 EUR care declanșează trecerea la impozit pe profit.",
  detect: (client, events, today) => {
    if (client.type !== "SRL_MICRO") return [];

    // Folosim revenue YTD din evenimente (sau estimare)
    const yearStart = new Date(Date.UTC(today.getFullYear(), 0, 1));
    const revenueYTD_RON = events
      .filter((e) => e.type === "invoice_emitted" && new Date(e.date) >= yearStart)
      .reduce((sum, e) => sum + (e.amountRON || 0), 0);

    // ~= 500.000 EUR la curs ~5 RON/EUR = 2.500.000 RON
    const THRESHOLD_RON = 2_500_000;
    if (revenueYTD_RON < THRESHOLD_RON * 0.6) return [];

    const ratio = revenueYTD_RON / THRESHOLD_RON;
    let severity: MatchPathAlert["severity"];
    if (ratio >= 1) severity = "urgent";
    else if (ratio >= 0.9) severity = "high";
    else if (ratio >= 0.75) severity = "medium";
    else severity = "low";

    return [
      {
        pathId: "micro-prag",
        pathName: "Microîntreprindere — prag 500K EUR",
        clientId: client.id,
        clientName: client.name,
        severity,
        detectedAt: today.toISOString(),
        title: `Revenue ${revenueYTD_RON.toFixed(0)} RON (${(ratio * 100).toFixed(0)}% din pragul micro)`,
        explanation: `${client.name} se apropie de pragul de 500.000 EUR (~2.500.000 RON) pentru microîntreprinderi. La depășire, firma trece la impozit pe profit (16%) începând cu trimestrul următor. Recomandă planificare fiscală.`,
        actionSteps: [
          "Estimează revenue cumulat până la finalul anului fiscal.",
          "Pregătește scenariu: dacă depășește pragul, recalculează impozit pe profit pentru perioada rămasă.",
          "Discută cu clientul opțiunile: amânare emiteri facturi (legal), distribuire profit, optimizare cheltuieli deductibile.",
          "Pregătește documentația pentru tranziția la impozit pe profit.",
          "Notifică ANAF la depășire prin declarație D700 sau formularul aplicabil.",
        ],
        legalSources: [
          { label: "Cod Fiscal Titlul III art. 47-57", ref: "legislatie.just.ro" },
          { label: "OUG 115/2023 + OUG 31/2024", ref: "monitoruloficial.ro" },
        ],
      },
    ];
  },
};

// ============================================================================
// PATH 5: SAF-T D406 — termen apropiat / lipsește
// ============================================================================
export const PATH_SAFT_DEADLINE: MatchPath = {
  id: "saft-deadline",
  name: "SAF-T D406 — termen depunere",
  description: "Verifică dacă SAF-T D406 e depus pentru perioada fiscală curentă.",
  detect: (client, events, today) => {
    if (client.type === "PFA" || client.type === "II") return []; // PFA/II au regim simplificat

    // SAF-T termen: 25 ale lunii pentru luna anterioară (lunar) sau 25 după trimestru (trimestrial)
    const month = today.getMonth();
    const isQuarterEnd = [2, 5, 8, 11].includes((month - 1 + 12) % 12);

    const deadline = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 25));
    const daysToDeadline = daysBetween(deadline, today);

    if (daysToDeadline < -10 || daysToDeadline > 20) return [];

    // Check dacă SAF-T pentru luna anterioară a fost încărcat
    const prevMonth = new Date(today);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const periodKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    const alreadyUploaded = events.some(
      (e) =>
        e.type === "saft_uploaded" &&
        (e.meta?.period === periodKey || e.meta?.periodMonth === prevMonth.getMonth() + 1)
    );
    if (alreadyUploaded) return [];

    let severity: MatchPathAlert["severity"];
    if (daysToDeadline < 0) severity = "urgent";
    else if (daysToDeadline <= 2) severity = "urgent";
    else if (daysToDeadline <= 5) severity = "high";
    else if (daysToDeadline <= 10) severity = "medium";
    else severity = "low";

    return [
      {
        pathId: "saft-deadline",
        pathName: "SAF-T D406",
        clientId: client.id,
        clientName: client.name,
        severity,
        detectedAt: today.toISOString(),
        title:
          daysToDeadline < 0
            ? `SAF-T pentru ${periodKey} ÎNTÂRZIAT cu ${Math.abs(daysToDeadline)} zile`
            : `SAF-T pentru ${periodKey} în ${daysToDeadline} zile`,
        explanation: `${client.name} nu are SAF-T D406 încărcat pentru perioada ${periodKey}. Termenul de depunere este 25 ale lunii. Amenzi: 1.000-5.000 RON pentru nedepunere la termen; 500-1.500 RON pentru depunere incorectă.`,
        actionSteps: [
          "Pregătește fișierul SAF-T XML cu jurnal vânzări, cumpărări, master files.",
          "Validează cu DUKIntegrator (33 teste structurale).",
          "Corectează eventualele erori de mapare CAEN/conturi.",
          "Depune prin SPV ANAF.",
          "Salvează recipisa în audit pack.",
        ],
        legalSources: [
          { label: "OPANAF 1783/2021", ref: "anaf.ro/saft" },
          { label: "Cod Procedură Fiscală art. 336", ref: "legislatie.just.ro" },
        ],
        deadlineDate: deadline.toISOString(),
        estimatedImpactRON: 5_000,
      },
    ];
  },
};

// ============================================================================
// REGISTRY
// ============================================================================
export const ALL_MATCH_PATHS: MatchPath[] = [
  PATH_D205_DEADLINE,
  PATH_DIURNA_D112,
  PATH_CASA_MARCAT,
  PATH_MICRO_PRAG,
  PATH_SAFT_DEADLINE,
];

/**
 * Rulează toate path-urile pe un client și returnează alertele găsite, sortate după severitate.
 */
export function runAllPaths(
  client: ClientProfile,
  events: FiscalEvent[],
  today: Date = new Date()
): MatchPathAlert[] {
  const severityOrder = { urgent: 0, high: 1, medium: 2, low: 3, info: 4 } as const;

  return ALL_MATCH_PATHS.flatMap((p) => p.detect(client, events, today)).sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}
