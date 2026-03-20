// POST /api/nis2/vendors/import-efactura
// Importă furnizorii unici din validările e-Factura în registrul NIS2 Vendors.
// Dacă nu există date ANAF reale → folosește mock data (demo mode).
// Dedup pe CUI când există, altfel pe nume — nu creează duplicate.

import { NextResponse } from "next/server"

import type { ComplianceState } from "@/lib/compliance/types"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import type { EfacturaSupplierImportRecord } from "@/lib/server/nis2-store"
import { readState, mutateState } from "@/lib/server/mvp-store"
import { upsertVendorsFromEfactura } from "@/lib/server/nis2-store"
import { validateCUI } from "@/lib/server/request-validation"
import { EFACTURA_MOCK_VENDORS } from "@/lib/server/efactura-mock-data"

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const orgId = session.orgId
    const state = await readState()

    // Extrage furnizorii unici din validările e-Factura
    const realSuppliers = collectSupplierImports(state)

    // Sprint 5: Mock mode — când nu există date ANAF reale
    const isDemoMode = realSuppliers.length === 0
    const supplierRecords = isDemoMode
      ? EFACTURA_MOCK_VENDORS.map((vendor) => ({ name: vendor.name, invoiceCount: 1 }))
      : realSuppliers

    if (supplierRecords.length === 0) {
      return NextResponse.json({
        added: 0,
        skipped: 0,
        demoMode: false,
        message: "Nu există date e-Factura validate. Sincronizează mai întâi modulul e-Factura.",
      })
    }

    const result = await upsertVendorsFromEfactura(orgId, supplierRecords)

    // Generează alerte în compliance state pentru tech vendors fără DPA
    if (result.techVendorsWithoutDpa.length > 0) {
      await mutateState((s: ComplianceState) => {
        const now = new Date().toISOString()
        const newAlerts = result.techVendorsWithoutDpa.map((name) => ({
          id: `dpa-${Math.random().toString(36).slice(2, 10)}`,
          message: `Furnizor tech detectat: "${name}" — verifică și atașează DPA (GDPR Art. 28 + NIS2)`,
          severity: "high" as const,
          open: true,
          sourceDocument: "Import e-Factura",
          createdAtISO: now,
        }))
        return { ...s, alerts: [...newAlerts, ...s.alerts] }
      })
    }

    const addedLabel = result.added !== 1 ? "furnizori importați" : "furnizor importat"
    const message = isDemoMode
      ? `Demo mode — ${result.added} ${addedLabel} (15 furnizori simulați). Conectează contul ANAF pentru date reale.`
      : result.added > 0
        ? `${result.added} ${addedLabel} din e-Factura.`
        : "Toți furnizorii din e-Factura există deja în registru."

    return NextResponse.json({
      ...result,
      demoMode: isDemoMode,
      message,
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Import eșuat.", 500, "EFACTURA_VENDOR_IMPORT_FAILED")
  }
}

function collectSupplierImports(state: Pick<ComplianceState, "efacturaValidations">): EfacturaSupplierImportRecord[] {
  const index = new Map<string, EfacturaSupplierImportRecord>()

  for (const validation of state.efacturaValidations) {
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
      if (!existing.cui && supplierCui) {
        existing.cui = supplierCui
      }
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
