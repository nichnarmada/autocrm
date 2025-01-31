import { useState, useCallback } from "react"
import { TeamRoutingResult } from "@/types/agents/router"

interface UseTeamRouting {
  routingResult: TeamRoutingResult | null
  isRouting: boolean
  error: Error | null
  routeTicket: (
    title: string,
    description: string,
    category: string
  ) => Promise<void>
}

export function useTeamRouting(): UseTeamRouting {
  const [routingResult, setRoutingResult] = useState<TeamRoutingResult | null>(
    null
  )
  const [isRouting, setIsRouting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const routeTicket = useCallback(
    async (title: string, description: string, category: string) => {
      if (!title || title.length < 10) return // Don't route too early

      setIsRouting(true)
      setError(null)

      try {
        const response = await fetch("/api/tickets/route-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
          }),
        })

        if (!response.ok) throw new Error("Team routing failed")

        const data = await response.json()
        setRoutingResult(data.result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Team routing failed"))
      } finally {
        setIsRouting(false)
      }
    },
    []
  )

  return {
    routingResult,
    isRouting,
    error,
    routeTicket,
  }
}
