"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SparklesIcon, CheckIcon } from "lucide-react"
import type { AgentAssignmentResult } from "@/types/agents/assigner"

interface AgentAssignmentPanelProps {
  assignmentResult: AgentAssignmentResult | null
  isAssigning: boolean
  onAgentSelect?: (agentId: string) => void
  selectedAgentId?: string
}

export function AgentAssignmentPanel({
  assignmentResult,
  isAssigning,
  onAgentSelect,
  selectedAgentId,
}: AgentAssignmentPanelProps) {
  if (isAssigning) {
    return <AgentAssignmentPanelSkeleton />
  }

  if (!assignmentResult) return null

  const confidencePercentage = Math.round(assignmentResult.confidence * 100)
  const isHighConfidence = assignmentResult.confidence >= 0.8
  const isSuggestionApplied = assignmentResult.agent_id === selectedAgentId
  const skillMatchPercentage = Math.round(
    assignmentResult.skill_match_score * 100
  )

  const handleApplyClick = (e: React.MouseEvent, agentId: string) => {
    e.preventDefault()
    onAgentSelect?.(agentId)
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Agent Suggestion
          </CardTitle>
          <Badge
            variant={isHighConfidence ? "default" : "secondary"}
            className="ml-auto"
          >
            {confidencePercentage}% confident
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Agent with Apply button */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Suggested Agent</label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={isSuggestionApplied ? "default" : "outline"}
                className="cursor-pointer"
                onClick={(e) => handleApplyClick(e, assignmentResult.agent_id)}
              >
                {assignmentResult.agent_name}
              </Badge>
              <Badge variant="secondary">
                {skillMatchPercentage}% skill match
              </Badge>
            </div>
            <Button
              size="sm"
              type="button"
              variant={isSuggestionApplied ? "outline" : "default"}
              onClick={(e) => handleApplyClick(e, assignmentResult.agent_id)}
              disabled={isSuggestionApplied}
              className="flex items-center gap-2"
            >
              {isSuggestionApplied ? (
                <>
                  <CheckIcon className="h-4 w-4" />
                  Applied
                </>
              ) : (
                "Apply Suggestion"
              )}
            </Button>
          </div>
        </div>

        {/* Reasoning */}
        <div className="space-y-1">
          <label className="text-sm font-medium">AI Reasoning</label>
          <p className="text-sm text-muted-foreground">
            {assignmentResult.reasoning}
          </p>
        </div>

        {/* Predicted Resolution Time */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            Predicted Resolution Time
          </label>
          <p className="text-sm text-muted-foreground">
            {assignmentResult.predicted_resolution_time}
          </p>
        </div>

        {/* Workload After Assignment */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Agent Workload</label>
          <p className="text-sm text-muted-foreground">
            {assignmentResult.workload_after_assignment} tickets after
            assignment
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function AgentAssignmentPanelSkeleton() {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Finding Best Agent...
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  )
}
