// S1.1 — Cabinet templates page
// Pereche cu:
//  - lib/server/cabinet-templates-store.ts (storage adapter)
//  - app/api/cabinet/templates/{route.ts, [id]/route.ts}
//  - lib/server/document-generator.ts (consumer prin getActiveTemplateForType)

import { CabinetTemplatesPageSurface } from "@/components/compliscan/cabinet-templates-page"

export default function CabinetTemplatesPage() {
  return <CabinetTemplatesPageSurface />
}
