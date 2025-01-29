"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SparklesIcon } from "lucide-react"
import type { ClassifierResult } from "@/types/agents/classifier"
import { TicketCategory } from "@/types/tickets"

interface ClassificationPanelProps {
  classification: ClassifierResult | null
  isClassifying: boolean
  onCategorySelect?: (category: TicketCategory) => void
  selectedCategory?: TicketCategory
}

export function ClassificationPanel({
  classification,
  isClassifying,
  onCategorySelect,
  selectedCategory,
}: ClassificationPanelProps) {
  if (isClassifying) {
    return <ClassificationPanelSkeleton />
  }

  if (!classification) return null

  const confidencePercentage = Math.round(classification.confidence * 100)
  const isHighConfidence = classification.confidence >= 0.8

  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">AI Suggestion</CardTitle>
          <Badge
            variant={isHighConfidence ? "default" : "secondary"}
            className="ml-auto"
          >
            {confidencePercentage}% confident
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Category */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Suggested Category</label>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                classification.category === selectedCategory
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer"
              onClick={() => onCategorySelect?.(classification.category)}
            >
              {classification.category}
            </Badge>
          </div>
        </div>

        {/* Reasoning */}
        <div className="space-y-1">
          <label className="text-sm font-medium">AI Reasoning</label>
          <p className="text-sm text-muted-foreground">
            {classification.reasoning}
          </p>
        </div>

        {/* Research Required */}
        {classification.requiresResearch && (
          <div className="rounded-md bg-yellow-500/10 p-2 text-sm text-yellow-600 dark:text-yellow-400">
            This ticket may require research of similar cases.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ClassificationPanelSkeleton() {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">
            Analyzing Ticket...
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
