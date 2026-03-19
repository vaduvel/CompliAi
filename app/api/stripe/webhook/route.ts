// app/api/stripe/webhook/route.ts
// Stripe webhook handler — actualizează planul org la checkout.session.completed
// și subscription status events
//
// Configurare Stripe Dashboard:
//   Endpoint URL: https://<domeniu>/api/stripe/webhook
//   Events: checkout.session.completed, customer.subscription.deleted,
//           customer.subscription.updated, invoice.payment_failed

import { setOrgPlan } from "@/lib/server/plan"
import { logRouteError } from "@/lib/server/operational-logger"
import { createRequestContext } from "@/lib/server/request-context"
import type { OrgPlan } from "@/lib/server/plan"

// ── Stripe event types (subset) ───────────────────────────────────────────────

interface StripeCheckoutSessionCompletedEvent {
  type: "checkout.session.completed"
  data: {
    object: {
      id: string
      customer: string
      subscription: string
      subscription_data?: {
        metadata?: {
          orgId?: string
          targetPlan?: string
        }
      }
      metadata?: {
        orgId?: string
        targetPlan?: string
      }
    }
  }
}

interface StripeSubscriptionEvent {
  type:
    | "customer.subscription.deleted"
    | "customer.subscription.updated"
    | "invoice.payment_failed"
  data: {
    object: {
      id: string
      customer: string
      status: string
      metadata?: {
        orgId?: string
        targetPlan?: string
      }
    }
  }
}

type StripeEvent = StripeCheckoutSessionCompletedEvent | StripeSubscriptionEvent | { type: string }

// ── HMAC verification ─────────────────────────────────────────────────────────

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
      const [k, v] = part.split("=")
      if (k && v) acc[k] = v
      return acc
    }, {})

    const timestamp = parts["t"]
    const v1 = parts["v1"]
    if (!timestamp || !v1) return false

    const signedPayload = `${timestamp}.${payload}`
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload))
    const computed = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    return computed === v1
  } catch {
    return false
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const context = createRequestContext(request, "/api/stripe/webhook")

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    // Stripe not configured — accept in dev without signature check
    if (process.env.NODE_ENV === "production") {
      return new Response("STRIPE_WEBHOOK_SECRET not configured", { status: 500 })
    }
  }

  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  if (webhookSecret) {
    const valid = await verifyStripeSignature(payload, signature, webhookSecret)
    if (!valid) {
      return new Response("Semnătură invalidă", { status: 400 })
    }
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return new Response("JSON invalid", { status: 400 })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = (event as StripeCheckoutSessionCompletedEvent).data.object
      const metadata =
        session.subscription_data?.metadata ?? session.metadata
      const orgId = metadata?.orgId
      const targetPlan = metadata?.targetPlan as OrgPlan | undefined

      if (orgId && targetPlan && ["pro", "partner"].includes(targetPlan)) {
        await setOrgPlan(orgId, targetPlan, {
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        })
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = (event as StripeSubscriptionEvent).data.object
      const orgId = sub.metadata?.orgId
      if (orgId) {
        await setOrgPlan(orgId, "free")
      }
    } else if (event.type === "invoice.payment_failed") {
      // Log only — don't downgrade immediately; Stripe handles retry
      const sub = (event as StripeSubscriptionEvent).data.object
      const orgId = sub.metadata?.orgId
      if (orgId) {
        console.warn(`[Stripe] invoice.payment_failed pentru org ${orgId}`)
      }
    }

    return new Response("ok", { status: 200 })
  } catch (error) {
    await logRouteError(context, error, {
      code: "STRIPE_WEBHOOK_PROCESSING_FAILED",
      durationMs: 0,
      status: 500,
    })
    // Return 200 to prevent Stripe from retrying — log internally
    return new Response("ok", { status: 200 })
  }
}
