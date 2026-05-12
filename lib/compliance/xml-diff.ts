// XML diff utility — extras din EFacturaValidatorCard pentru reutilizare în
// Fiscal Resolve Cockpit (XmlDiffViewer block).
//
// Comparator simplu linie-cu-linie cu detectare added/removed/same. Suficient
// pentru reparații field-level pe XML CIUS-RO; pentru diff structurale complexe
// (re-ordering element-uri), output-ul afișează ambele perechi remove+add.

export type DiffLine = {
  type: "same" | "removed" | "added"
  text: string
  lineNo: number
}

export function computeXmlDiff(original: string, repaired: string): DiffLine[] {
  const origLines = original.split("\n")
  const repLines = repaired.split("\n")
  const result: DiffLine[] = []
  const maxLen = Math.max(origLines.length, repLines.length)

  let oi = 0
  let ri = 0
  while (oi < origLines.length || ri < repLines.length) {
    const oLine = oi < origLines.length ? origLines[oi] : undefined
    const rLine = ri < repLines.length ? repLines[ri] : undefined

    if (oLine === rLine) {
      result.push({ type: "same", text: rLine!, lineNo: ri + 1 })
      oi++
      ri++
    } else if (rLine !== undefined && (oLine === undefined || !origLines.slice(oi).includes(rLine))) {
      result.push({ type: "added", text: rLine, lineNo: ri + 1 })
      ri++
    } else if (oLine !== undefined && (rLine === undefined || !repLines.slice(ri).includes(oLine))) {
      result.push({ type: "removed", text: oLine, lineNo: oi + 1 })
      oi++
    } else {
      result.push({ type: "removed", text: oLine!, lineNo: oi + 1 })
      result.push({ type: "added", text: rLine!, lineNo: ri + 1 })
      oi++
      ri++
    }

    if (result.length > maxLen + 200) break // safety
  }
  return result
}
