// S1.7 — Cabinet view pentru magic links trimise patroni.
// Pereche cu:
//  - /api/shared/[token]/approve
//  - /api/shared/[token]/reject
//  - /api/shared/[token]/comment
//  - lib/server/cabinet-magic-link-email.ts (notificare Resend)

import { MagicLinksPageSurface } from "@/components/compliscan/magic-links-page"

export default function MagicLinksPage() {
  return <MagicLinksPageSurface />
}
