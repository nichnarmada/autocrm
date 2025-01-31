import { TeamRoutingConfig } from "@/types/agents/router"
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts"

export const defaultTeamRoutingConfig: TeamRoutingConfig = {
  model: "gpt-4-turbo-preview",
  temperature: 0.2,
  maxTokens: 1000,
  minConfidenceThreshold: 0.8,
  maxWorkloadThreshold: 50,
}

// Create a system prompt template
const systemPrompt =
  SystemMessagePromptTemplate.fromTemplate(`You are a team routing expert for a support system. Your task is to:
1. Analyze the ticket details including category, priority, and any special requirements
2. Review team capabilities and current workload
3. Determine the best team to handle the ticket

You must respond with ONLY a raw JSON object (no markdown, no code blocks) in this format:
{{
  "team_id": string,
  "team_name": string,
  "confidence": number,
  "reasoning": string,
  "routing_timestamp": string,
  "required_capabilities": string[],
  "estimated_workload": number
}}

Consider these factors:
- Team expertise and capabilities
- Current team workload and capacity
- Ticket complexity and priority
- Required skills and domain knowledge
- Historical performance with similar tickets

Important:
- DO NOT wrap the response in markdown code blocks or any other formatting
- confidence should be between 0 and 1
- provide clear reasoning for your team selection
- required_capabilities should list key skills needed
- estimated_workload should be between 1-10 (10 being most complex)
- team_id must be a valid UUID from the provided teams
- team_name must match an existing team name`)

// Create a final user (human) prompt template with placeholders
const userPrompt = HumanMessagePromptTemplate.fromTemplate(`
Ticket Details:
ID: {id}
Category: {category}
Priority: {priority}
Title: {title}
Description: {description}
Required Skills: {requiredSkills}
Complexity: {complexity}

Available Teams:
{availableTeams}

Team Workloads:
{teamWorkloads}
`)

// Create the chat prompt template
export const teamRoutingPrompt = ChatPromptTemplate.fromMessages([
  systemPrompt,
  userPrompt,
])
