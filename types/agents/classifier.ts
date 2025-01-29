import { TicketCategory } from "../tickets"

export interface ClassifierInput {
  id: string
  title: string
  description: string
}

export interface ClassifierResult {
  category: TicketCategory
  confidence: number
  reasoning: string
  requiresResearch: boolean
  classificationTimestamp: string
}

export interface ClassifierConfig {
  model: string
  temperature: number
  maxTokens: number
  minConfidenceThreshold?: number
  requireResearchThreshold?: number
}
