import { describe, expect, it } from "vitest"

import {
  normalizeNotificationForDisplay,
  type AppNotification,
} from "./notifications-store"

function makeNotification(overrides: Partial<AppNotification>): AppNotification {
  return {
    id: "notif-1",
    type: "info",
    title: "Titlu demo",
    message: "Mesaj demo",
    createdAt: "2026-03-26T06:00:00.000Z",
    ...overrides,
  }
}

describe("normalizeNotificationForDisplay", () => {
  it("traduce prefixele legacy ale agentilor si curata ruta veche de scanari", () => {
    const notification = normalizeNotificationForDisplay(
      makeNotification({
        title: "[compliance_monitor] Alertă: 1 finding-uri critice/high fără dovadă atașată",
        message: "Alertă: 1 finding-uri critice/high fără dovadă atașată",
        linkTo: "/dashboard/scanari",
      })
    )

    expect(notification.title).toBe("Am verificat pentru tine")
    expect(notification.message).toContain("fără dovadă atașată")
    expect(notification.linkTo).toBe("/dashboard/resolve")
  })

  it("păstrează notificările deja umane și linkurile bune", () => {
    const notification = normalizeNotificationForDisplay(
      makeNotification({
        title: "Schimbare legislativă: Monitorul Oficial",
        message: "A apărut o actualizare care te poate afecta.",
        linkTo: "/dashboard/scan",
      })
    )

    expect(notification.title).toBe("Schimbare legislativă: Monitorul Oficial")
    expect(notification.message).toBe("A apărut o actualizare care te poate afecta.")
    expect(notification.linkTo).toBe("/dashboard/scan")
  })

  it("ancorează alertele de scor în snapshot când nu există link explicit", () => {
    const notification = normalizeNotificationForDisplay(
      makeNotification({
        title: "[compliance_monitor] Scor conformitate în declin: 58%. Verifică problemele deschise.",
        message: "Scor conformitate în declin: 58%. Verifică problemele deschise.",
      })
    )

    expect(notification.title).toBe("Am verificat pentru tine")
    expect(notification.linkTo).toBe("/dashboard")
  })
})
