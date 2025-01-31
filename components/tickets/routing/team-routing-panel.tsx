"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SparklesIcon, CheckIcon } from "lucide-react"
import type { TeamRoutingResult } from "@/types/agents/router"

interface TeamRoutingPanelProps {
  routingResult: TeamRoutingResult | null
  isRouting: boolean
  onTeamSelect?: (teamId: string) => void
  selectedTeamId?: string
}

export function TeamRoutingPanel({
  routingResult,
  isRouting,
  onTeamSelect,
  selectedTeamId,
}: TeamRoutingPanelProps) {
  if (isRouting) {
    return <TeamRoutingPanelSkeleton />
  }

  if (!routingResult) return null

  const confidencePercentage = Math.round(routingResult.confidence * 100)
  const isHighConfidence = routingResult.confidence >= 0.8
  const isSuggestionApplied = routingResult.team_id === selectedTeamId

  const handleApplyClick = (e: React.MouseEvent, teamId: string) => {
    e.preventDefault()
    onTeamSelect?.(teamId)
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">Team Suggestion</CardTitle>
          <Badge
            variant={isHighConfidence ? "default" : "secondary"}
            className="ml-auto"
          >
            {confidencePercentage}% confident
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Team with Apply button */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Suggested Team</label>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge
                variant={isSuggestionApplied ? "default" : "outline"}
                className="cursor-pointer"
                onClick={(e) => handleApplyClick(e, routingResult.team_id)}
              >
                {routingResult.team_name}
              </Badge>
            </div>
            <Button
              size="sm"
              type="button"
              variant={isSuggestionApplied ? "outline" : "default"}
              onClick={(e) => handleApplyClick(e, routingResult.team_id)}
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
            {routingResult.reasoning}
          </p>
        </div>

        {/* Required Capabilities */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Required Capabilities</label>
          <div className="flex flex-wrap gap-2">
            {routingResult.required_capabilities.map((capability) => (
              <Badge key={capability} variant="secondary">
                {capability}
              </Badge>
            ))}
          </div>
        </div>

        {/* Estimated Workload */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Estimated Workload</label>
          <p className="text-sm text-muted-foreground">
            {routingResult.estimated_workload} story points
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function TeamRoutingPanelSkeleton() {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Finding Best Team...
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
