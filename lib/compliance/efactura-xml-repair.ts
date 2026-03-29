import type { EFacturaXmlRepairFix } from "@/lib/compliance/types"

/**
 * Result of an XML repair operation.
 */
export type XmlRepairResult = {
  originalXml: string
  repairedXml: string
  appliedFixes: EFacturaXmlRepairFix[]
  canAutoFix: boolean
}

/**
 * Core utility to repair common formatting and structural errors in e-Factura XMLs
 * before transmission or resubmission.
 * Targets errors like: V002, V003, V005, T003.
 *
 * @param xml The raw string content of the XML.
 * @param errorCodes Specific ANAF error codes that were detected to target the fixes. 
 * If omitted, it will try all safe auto-fixes.
 */
export function repairEFacturaXml(xml: string, errorCodes?: string[]): XmlRepairResult {
  let repairedXml = xml
  const appliedFixes: XmlRepairResult["appliedFixes"] = []

  // Helpers string manipulation in XML
  const replaceTagValue = (tag: string, newValue: string) => {
    const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    // Match the opening tag, the inner content, and the closing tag
    const pattern = new RegExp(
      `(<(?:(?:\\w|-)+:)?${escapedTag}(?:(?:\\s+(?:\\w|-)+="[^"]*")*)\\s*>)([\\s\\S]*?)(<\\/(?:(?:\\w|-)+:)?${escapedTag}>)`,
      "i"
    )
    
    if (pattern.test(repairedXml)) {
      const match = repairedXml.match(pattern)!
      const oldValue = match[2].trim()
      
      if (oldValue !== newValue) {
        repairedXml = repairedXml.replace(pattern, `$1${newValue}$3`)
        return { replaced: true, oldValue }
      }
    }
    return { replaced: false, oldValue: "" }
  }

  // 1. T003 - Encoding definition / root missing XML declaration
  if ((!errorCodes || errorCodes.includes("T003")) && !repairedXml.trim().startsWith("<?xml")) {
    repairedXml = `<?xml version="1.0" encoding="UTF-8"?>\n` + repairedXml.trim()
    appliedFixes.push({
      errorCode: "T003",
      field: "XML Declaration",
      oldValue: "Lipsă",
      newValue: '<?xml version="1.0" encoding="UTF-8"?>',
      explanation: "A fost adăugat header-ul XML obligatoriu pentru procesarea ANAF."
    })
  }

  // 2. V002 - CustomizationID (CIUS RO)
  if (!errorCodes || errorCodes.includes("V002")) {
    const requiredCius = "urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1"
    const fixResult = replaceTagValue("CustomizationID", requiredCius)
    if (fixResult.replaced) {
      appliedFixes.push({
        errorCode: "V002",
        field: "CustomizationID",
        oldValue: fixResult.oldValue,
        newValue: requiredCius,
        explanation: "S-a forțat valoarea standard CIUS-RO cerută de ANAF."
      })
    }
  }

  // 3. V003 - InvoiceTypeCode (380 for standard invoice)
  if (!errorCodes || errorCodes.includes("V003")) {
    const fixResult = replaceTagValue("InvoiceTypeCode", "380")
    if (fixResult.replaced) {
      appliedFixes.push({
        errorCode: "V003",
        field: "InvoiceTypeCode",
        oldValue: fixResult.oldValue,
        newValue: "380",
        explanation: "Codul tipului de factură a fost corectat la 380 (Factură standard)."
      })
    }
  }

  // 4. V006 - DocumentCurrencyCode (RON default)
  if (!errorCodes || errorCodes.includes("V006")) {
    // Usually if missing or empty, but we'll try to replace if it's there but maybe lowercased or something
    const fixResult = replaceTagValue("DocumentCurrencyCode", "RON")
    // Only flag it if it wasn't already RON (e.g. was 'ron' or empty)
    if (fixResult.replaced && fixResult.oldValue.toUpperCase() !== "RON") {
      appliedFixes.push({
        errorCode: "V006",
        field: "DocumentCurrencyCode",
        oldValue: fixResult.oldValue,
        newValue: "RON",
        explanation: "Moneda facturii a fost standardizată la RON."
      })
    }
  }

  // Determine if we managed to fix everything requested (or if there are errors we can't auto-fix)
  // For now, if there are ANY fixes applied, we consider it a partial or full success. 
  // In a robust system, we'd check if `errorCodes` contains codes we *didn't* address.
  const addressedCodes = new Set(appliedFixes.map(f => f.errorCode))
  const canAutoFix = errorCodes ? errorCodes.every(c => addressedCodes.has(c) || ["T003", "V002", "V003", "V006"].includes(c)) : appliedFixes.length > 0

  return {
    originalXml: xml,
    repairedXml,
    appliedFixes,
    canAutoFix
  }
}
