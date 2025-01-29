import { useState, useCallback } from "react"
import { ClassifierResult } from "@/types/agents/classifier"

interface UseTicketClassification {
  classification: ClassifierResult | null
  isClassifying: boolean
  error: Error | null
  classifyTicket: (title: string, description: string) => Promise<void>
}

export function useTicketClassification(): UseTicketClassification {
  const [classification, setClassification] = useState<ClassifierResult | null>(
    null
  )
  const [isClassifying, setIsClassifying] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const classifyTicket = useCallback(
    async (title: string, description: string) => {
      if (!title || title.length < 10) return // Don't classify too early

      setIsClassifying(true)
      setError(null)

      try {
        const response = await fetch("/api/tickets/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        })

        if (!response.ok) throw new Error("Classification failed")

        const data = await response.json()
        setClassification(data.result)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Classification failed")
        )
      } finally {
        setIsClassifying(false)
      }
    },
    []
  )

  return {
    classification,
    isClassifying,
    error,
    classifyTicket,
  }
}
