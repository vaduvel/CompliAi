"use client"

// lib/client/use-track-event.ts
// Client-side analytics hook. Fire-and-forget POST to /api/analytics/track.

import { useCallback, useRef } from "react"

export function useTrackEvent() {
  const sent = useRef(new Set<string>())

  const track = useCallback((event: string, properties?: Record<string, unknown>) => {
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, properties }),
    }).catch(() => {})
  }, [])

  /** Fire once per event name per component lifecycle. */
  const trackOnce = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (sent.current.has(event)) return
      sent.current.add(event)
      track(event, properties)
    },
    [track],
  )

  return { track, trackOnce }
}
