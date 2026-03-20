import type { EFacturaValidationRecord } from "@/lib/compliance/types"
import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import { validateCUI } from "@/lib/server/request-validation"

export type EfacturaSupplierImportRecord = {
  name: string
  cui?: string
  invoiceCount?: number
}

type SupplierValidationLike = Pick<EFacturaValidationRecord, "supplierName" | "supplierCui">

export function collectSupplierImports(validations: SupplierValidationLike[]): EfacturaSupplierImportRecord[] {
  const index = new Map<string, EfacturaSupplierImportRecord>()

  for (const validation of validations) {
    const supplierName = validation.supplierName?.trim()
    if (!supplierName) continue

    const supplierCui = validation.supplierCui ? validateCUI(validation.supplierCui) ?? undefined : undefined
    const nameKey = `name:${supplierName.toLowerCase()}`
    const cuiKey = supplierCui ? `cui:${supplierCui}` : null
    const existing =
      (cuiKey ? index.get(cuiKey) : undefined) ??
      index.get(nameKey)

    if (existing) {
      existing.invoiceCount = (existing.invoiceCount ?? 1) + 1
      if (!existing.cui && supplierCui) existing.cui = supplierCui
      if (cuiKey) index.set(cuiKey, existing)
      continue
    }

    const record: EfacturaSupplierImportRecord = {
      name: supplierName,
      ...(supplierCui ? { cui: supplierCui } : {}),
      invoiceCount: 1,
    }

    index.set(nameKey, record)
    if (cuiKey) index.set(cuiKey, record)
  }

  return [...new Set(index.values())]
}

export function buildVendorPrefillSignal(validations: SupplierValidationLike[]): {
  suggestion?: PrefillSuggestion<boolean>
  vendorSignals?: OrgProfilePrefill["vendorSignals"]
} {
  const suppliers = collectSupplierImports(validations)
  if (suppliers.length === 0) return {}

  const sortedSuppliers = [...suppliers].sort((left, right) => {
    const leftInvoiceCount = left.invoiceCount ?? 1
    const rightInvoiceCount = right.invoiceCount ?? 1
    if (rightInvoiceCount !== leftInvoiceCount) return rightInvoiceCount - leftInvoiceCount
    return left.name.localeCompare(right.name, "ro")
  })

  const invoiceCount = sortedSuppliers.reduce((total, supplier) => total + (supplier.invoiceCount ?? 1), 0)
  const topVendors = sortedSuppliers.slice(0, 3).map((supplier) => supplier.name)
  const supplierLabel = suppliers.length === 1 ? "furnizor" : "furnizori"
  const invoiceLabel = invoiceCount === 1 ? "validare" : "validări"
  const vendorList = topVendors.join(", ")
  const reason = vendorList
    ? `Am detectat ${suppliers.length} ${supplierLabel} în ${invoiceCount} ${invoiceLabel} e-Factura (${vendorList}), deci folosești deja vendorii externi.`
    : `Am detectat ${suppliers.length} ${supplierLabel} în ${invoiceCount} ${invoiceLabel} e-Factura, deci folosești deja vendorii externi.`

  return {
    suggestion: {
      value: true,
      confidence: "high",
      reason,
    },
    vendorSignals: {
      source: "efactura_validations",
      vendorCount: suppliers.length,
      invoiceCount,
      topVendors,
    },
  }
}

export function enrichOrgProfilePrefillWithVendorSignals(
  prefill: OrgProfilePrefill | null,
  validations: SupplierValidationLike[]
): OrgProfilePrefill | null {
  if (!prefill) return null

  const { suggestion, vendorSignals } = buildVendorPrefillSignal(validations)
  if (!suggestion || !vendorSignals) return prefill

  return {
    ...prefill,
    vendorSignals,
    suggestions: {
      ...prefill.suggestions,
      usesExternalVendors: suggestion,
    },
  }
}
