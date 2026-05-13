#!/usr/bin/env tsx
// Generează un session cookie valid pentru testarea API via curl.
// Usage: npx tsx scripts/fiscal-maturity/make-session.ts > /tmp/session.txt

import { createSessionToken } from "../../lib/server/auth"

const token = createSessionToken({
  userId: "96d5827110b0fb7f",
  orgId: "org-96d5827110b0fb7f",
  email: "vaduvadaniel10@yahoo.com",
  orgName: "Marketing HUB",
  role: "owner",
  userMode: "partner",
})

console.log(token)
