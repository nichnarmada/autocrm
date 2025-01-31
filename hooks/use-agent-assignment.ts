import { useState, useCallback } from "react"
import { AgentAssignmentResult } from "@/types/agents/assigner"

interface UseAgentAssignment {
  assignmentResult: AgentAssignmentResult | null
  isAssigning: boolean
  error: Error | null
  assignAgent: (
    teamId: string,
    title: string,
    description: string,
    category: string,
    requiredCapabilities?: string[],
    estimatedWorkload?: number
  ) => Promise<void>
}

export function useAgentAssignment(): UseAgentAssignment {
  const [assignmentResult, setAssignmentResult] =
    useState<AgentAssignmentResult | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const assignAgent = useCallback(
    async (
      teamId: string,
      title: string,
      description: string,
      category: string,
      requiredCapabilities?: string[],
      estimatedWorkload?: number
    ) => {
      if (!teamId || !title || !description || !category) return

      setIsAssigning(true)
      setError(null)

      try {
        const response = await fetch("/api/tickets/assign-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId,
            title,
            description,
            category,
            requiredCapabilities,
            estimatedWorkload,
          }),
        })

        if (!response.ok) throw new Error("Agent assignment failed")

        const data = await response.json()
        setAssignmentResult(data.result)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Agent assignment failed")
        )
      } finally {
        setIsAssigning(false)
      }
    },
    []
  )

  return {
    assignmentResult,
    isAssigning,
    error,
    assignAgent,
  }
}
