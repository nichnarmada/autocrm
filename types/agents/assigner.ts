import { TicketCategory } from "../tickets"

export interface AgentAssignmentInput {
  id: string
  team_id: string
  category: TicketCategory
  priority: string
  title: string
  description: string
  required_capabilities: string[]
  estimated_workload: number
}

export interface AgentAssignmentResult {
  agent_id: string
  agent_name: string
  confidence: number
  reasoning: string
  assignment_timestamp: string
  skill_match_score: number
  predicted_resolution_time: string
  workload_after_assignment: number
}

export interface AgentAssignmentConfig {
  model: string
  temperature: number
  maxTokens: number
  minConfidenceThreshold?: number
  maxWorkloadThreshold?: number
  minSkillMatchScore?: number
}
