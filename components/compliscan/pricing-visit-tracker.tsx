"use client"

import { useEffect, useRef } from "react"
import { useTrackEvent } from "@/lib/client/use-track-event"

/**
 * Tracks when a user visits pricing but doesn't convert (click a CTA).
 * Fires on unmount if no conversion event recorded.
 */
export function PricingVisitTracker() {
  const { track } = useTrackEvent()
  const convertedRef = useRef(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      const link = target.closest("a")
      if (link?.href?.includes("/login") || link?.href?.includes("/register")) {
        convertedRef.current = true
      }
    }
    document.addEventListener("click", handleClick, true)
    return () => {
      document.removeEventListener("click", handleClick, true)
      if (!convertedRef.current) {
        track("visited_pricing_not_converted")
      }
    }
  }, [track])

  return null
}
