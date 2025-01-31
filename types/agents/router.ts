import { TicketCategory } from "../tickets"

export interface TeamRoutingInput {
  id: string
  category: TicketCategory
  priority: string
  title: string
  description: string
  requiredSkills?: string[]
  complexity?: string
}

export interface TeamRoutingResult {
  team_id: string
  team_name: string
  confidence: number
  reasoning: string
  routing_timestamp: string
  required_capabilities: string[]
  estimated_workload: number
}

export interface TeamRoutingConfig {
  model: string
  temperature: number
  maxTokens: number
  minConfidenceThreshold?: number
  maxWorkloadThreshold?: number
}
