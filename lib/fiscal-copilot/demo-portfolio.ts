/**
 * FiscCopilot — Demo Portfolio (seed data pentru testing)
 *
 * 5 clienți realiști cu profile diferite + evenimente fiscale.
 * Folosit pentru:
 *  - Smoke testing Match Path Engine
 *  - Daily Briefing demo
 *  - UI dashboard preview
 *
 * NU este date reale. Toate sunt sintetice (CUI-uri inventate).
 */

import type { ClientProfile, FiscalEvent } from "./match-paths/types";

export const DEMO_CABINET_ID = "demo-cabinet-marius";
export const DEMO_CABINET_NAME = "Cabinet Marius Demo";

export const DEMO_CLIENTS: ClientProfile[] = [
  {
    id: "client-marcel-srl",
    name: "Marcel Construct SRL",
    cui: "RO12345678",
    type: "SRL",
    vatRegime: "TVA_normal",
    hasEmployees: true,
    registeredDate: "2019-03-15",
    caenCodes: ["4120", "4399"],
    estimatedAnnualRevenueEUR: 320_000,
    flags: ["distribuie_dividende", "are_asociati_multipli"],
  },
  {
    id: "client-andreea-pfa",
    name: "Andreea Popescu PFA",
    cui: "RO98765432",
    type: "PFA",
    vatRegime: "non_TVA",
    hasEmployees: false,
    registeredDate: "2022-07-01",
    caenCodes: ["7022"],
    estimatedAnnualRevenueEUR: 45_000,
    flags: [],
  },
  {
    id: "client-cristina-micro",
    name: "Cristina Trade SRL",
    cui: "RO11223344",
    type: "SRL_MICRO",
    vatRegime: "TVA_la_incasare",
    hasEmployees: true,
    registeredDate: "2020-11-12",
    caenCodes: ["4711", "4712"],
    estimatedAnnualRevenueEUR: 480_000, // aproape de pragul 500K
    flags: ["distribuie_dividende", "tva_la_incasare"],
  },
  {
    id: "client-florin-ii",
    name: "Florin Mobilă II",
    cui: "RO55667788",
    type: "II",
    vatRegime: "non_TVA",
    hasEmployees: false,
    registeredDate: "2024-09-20",
    caenCodes: ["3100", "4647", "4755"],
    estimatedAnnualRevenueEUR: 110_000,
    flags: ["vanzari_numerar"], // aproape de pragul casa de marcat
  },
  {
    id: "client-mihai-srl-mare",
    name: "Mihai Logistics SRL",
    cui: "RO99887766",
    type: "SRL",
    vatRegime: "TVA_normal",
    hasEmployees: true,
    registeredDate: "2015-06-01",
    caenCodes: ["4941", "5210"],
    estimatedAnnualRevenueEUR: 1_200_000,
    flags: ["distribuie_dividende"],
  },
];

/**
 * Generează evenimente fiscale realiste pentru demo portfolio.
 * Folosește data curentă ca anchor — events sunt distribuite în ultimul an.
 */
export function generateDemoEvents(today: Date = new Date()): FiscalEvent[] {
  const yearAgo = new Date(today);
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  const events: FiscalEvent[] = [];

  // Marcel SRL — dividende în anul trecut, NU a depus D205, are diurne recente
  events.push({
    id: "evt-marcel-1",
    clientId: "client-marcel-srl",
    type: "dividend_distribution",
    date: new Date(today.getFullYear() - 1, 8, 15).toISOString(),
    amountRON: 80_000,
    refDoc: "AGA-2025-09-15",
    meta: { beneficiaries: 2 },
  });
  for (let i = 0; i < 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - 5 - i * 3);
    events.push({
      id: `evt-marcel-diurna-${i}`,
      clientId: "client-marcel-srl",
      type: "diurna_recorded",
      date: d.toISOString(),
      amountRON: 150 + i * 30,
      refDoc: `OD-${i}`,
      meta: { employee: "ION POPA", days: 3 },
    });
  }

  // Cristina Trade — distribuie dividende + revenue spre prag micro
  events.push({
    id: "evt-cristina-div",
    clientId: "client-cristina-micro",
    type: "dividend_distribution",
    date: new Date(today.getFullYear() - 1, 10, 20).toISOString(),
    amountRON: 45_000,
    refDoc: "AGA-2025-11-20",
  });
  // Simulează revenue cumulat în anul curent ~2.1M RON (peste 80% din prag)
  for (let m = 0; m < today.getMonth(); m++) {
    events.push({
      id: `evt-cristina-rev-${m}`,
      clientId: "client-cristina-micro",
      type: "invoice_emitted",
      date: new Date(today.getFullYear(), m, 15).toISOString(),
      amountRON: 175_000,
      refDoc: `INV-${today.getFullYear()}-${m + 1}`,
    });
  }

  // Florin II — vânzări numerar acumulate aproape de pragul casa marcat
  for (let m = 0; m < today.getMonth() + 1; m++) {
    events.push({
      id: `evt-florin-rev-${m}`,
      clientId: "client-florin-ii",
      type: "bank_receipt",
      date: new Date(today.getFullYear(), m, 10).toISOString(),
      amountRON: 38_000,
      refDoc: `BR-${m}`,
    });
  }

  // Mihai Logistics — large SRL, multiple events
  events.push({
    id: "evt-mihai-div",
    clientId: "client-mihai-srl-mare",
    type: "dividend_distribution",
    date: new Date(today.getFullYear() - 1, 5, 30).toISOString(),
    amountRON: 250_000,
    refDoc: "AGA-2025-06",
  });
  // SAF-T uploaded la timp pentru lunile trecute, dar lipsește luna anterioară
  for (let m = 0; m < today.getMonth() - 1; m++) {
    events.push({
      id: `evt-mihai-saft-${m}`,
      clientId: "client-mihai-srl-mare",
      type: "saft_uploaded",
      date: new Date(today.getFullYear(), m + 1, 20).toISOString(),
      meta: {
        period: `${today.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
        periodMonth: m + 1,
      },
    });
  }

  return events;
}
