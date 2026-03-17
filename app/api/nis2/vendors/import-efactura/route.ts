// POST /api/nis2/vendors/import-efactura
// Importă furnizorii unici din validările e-Factura în registrul NIS2 Vendors.
// Dedup pe nume — nu creează duplicate.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, readSessionFromRequest } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readState } from "@/lib/server/mvp-store"
import { upsertVendorsFromEfactura } from "@/lib/server/nis2-store"

export async function POST(request: Request) {
  try {
    const session = readSessionFromRequest(request)
    if (!session) return jsonError("Autentificare necesară.", 401, "UNAUTHORIZED")

    const { orgId } = await getOrgContext()
    const state = await readState()

    // Extrage furnizorii unici din validările e-Factura
    const supplierNames = [
      ...new Set(
        state.efacturaValidations
          .map((v) => v.supplierName)
          .filter((name): name is string => Boolean(name?.trim()))
      ),
    ]

    if (supplierNames.length === 0) {
      return NextResponse.json({
        added: 0,
        skipped: 0,
        message: "Nu există date e-Factura validate. Sincronizează mai întâi modulul e-Factura.",
      })
    }

    const result = await upsertVendorsFromEfactura(orgId, supplierNames)

    return NextResponse.json({
      ...result,
      message:
        result.added > 0
          ? `${result.added} furnizor${result.added !== 1 ? "i" : ""} importat${result.added !== 1 ? "ți" : ""} din e-Factura.`
          : "Toți furnizorii din e-Factura există deja în registru.",
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Import eșuat.", 500, "EFACTURA_VENDOR_IMPORT_FAILED")
  }
}
