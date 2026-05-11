// SPV XML archive helper — pain #10 validat: "PDF vs XML legal confusion —
// multe firme tratează PDF-ul SPV-ului ca document legal (e XML-ul semnat MF)".
//
// Plus pain colateral 60-day retention: "SPV ANAF păstrează XML-uri doar 60 zile;
// după aceea companiile pierd accesul".
//
// Soluție: auto-archive metadata XML-urilor primite. Storage real (binar) se
// face în Supabase storage / S3 — aici doar tipuri + helpers pure.

export type ArchivedXmlRecord = {
  id: string
  /** ID SPV (upload_id ANAF). */
  spvUploadId: string
  /** Număr factură. */
  invoiceNumber: string
  /** CIF furnizor. */
  supplierCif: string
  /** CIF client. */
  customerCif?: string
  /** Data emiterii originală. */
  issueDateISO: string
  /** Data primirii în SPV. */
  receivedAtISO: string
  /** Data arhivării locale. */
  archivedAtISO: string
  /** SHA-256 hash al XML-ului (verificare integritate). */
  xmlSha256: string
  /** Dimensiune octeți. */
  sizeBytes: number
  /** Storage key (Supabase storage path sau S3 key). */
  storageKey: string
  /** Status: original semnat MF, deci NU se reseteaza vreodată. */
  signed: boolean
  /** Direction: received din SPV sau emis de noi. */
  direction: "received" | "issued"
}

export type ArchiveStats = {
  total: number
  receivedFromSpv: number
  issuedByUs: number
  totalSizeMB: number
  oldestArchivedISO?: string
  newestArchivedISO?: string
  /** Câte XML-uri ar fi expirat din SPV (>60 zile de la primire) dar sunt salvate local. */
  rescuedFromSpvExpiry: number
}

const SPV_RETENTION_DAYS = 60

export function buildArchiveStats(records: ArchivedXmlRecord[], nowISO: string): ArchiveStats {
  const nowMs = new Date(nowISO).getTime()
  const expiryThresholdMs = nowMs - SPV_RETENTION_DAYS * 86_400_000
  let totalSize = 0
  let received = 0
  let issued = 0
  let rescued = 0
  let oldest: string | undefined
  let newest: string | undefined
  for (const r of records) {
    totalSize += r.sizeBytes
    if (r.direction === "received") received++
    else issued++
    if (r.direction === "received") {
      if (new Date(r.receivedAtISO).getTime() < expiryThresholdMs) rescued++
    }
    if (!oldest || r.archivedAtISO < oldest) oldest = r.archivedAtISO
    if (!newest || r.archivedAtISO > newest) newest = r.archivedAtISO
  }
  return {
    total: records.length,
    receivedFromSpv: received,
    issuedByUs: issued,
    totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
    oldestArchivedISO: oldest,
    newestArchivedISO: newest,
    rescuedFromSpvExpiry: rescued,
  }
}

/**
 * SHA-256 cu Web Crypto API — folosit la archive ca să asigurăm integritate XML.
 * (Funcția e thin wrapper — folosită doar în Node 18+ și browser.)
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Educational copy pentru popup-ul PDF vs XML (pain #10).
 * Folosit în UI ca să educăm cabinetele care confundă PDF-ul SPV cu original.
 */
export const PDF_VS_XML_EDUCATIONAL_TEXT = {
  title: "Atenție: PDF-ul SPV NU e documentul legal",
  body: [
    "Documentul fiscal cu valoare legală e XML-ul semnat de Ministerul Finanțelor (MF), NU PDF-ul afișat de SPV.",
    "PDF-ul SPV e doar o reprezentare vizuală — în caz de audit ANAF, doar XML-ul semnat MF e admisibil.",
    "SPV păstrează XML-urile doar 60 de zile. După acest termen, pierzi accesul prin portal.",
    "Soluție: arhivează XML-urile local (CompliScan o face automat pentru tine via Supabase storage).",
  ],
  legalReference: "OUG 120/2021 Art. 12 + Cod Procedură Fiscală Art. 109",
} as const
