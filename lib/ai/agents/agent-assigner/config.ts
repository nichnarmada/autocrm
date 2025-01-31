import { AgentAssignmentConfig } from "@/types/agents/assigner"
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from "@langchain/core/prompts"

export const defaultAssignmentConfig: AgentAssignmentConfig = {
  model: "gpt-4-turbo-preview",
  temperature: 0.2,
  maxTokens: 1000,
  minConfidenceThreshold: 0.8,
  maxWorkloadThreshold: 50,
  minSkillMatchScore: 0.7,
}

// Create a system prompt template
const systemPrompt =
  SystemMessagePromptTemplate.fromTemplate(`You are an agent assignment expert for a support system. Your task is to:
1. Analyze the ticket details and required capabilities
2. Review available agents' expertise, skills, and current workload
3. Determine the best agent to handle the ticket based on:
   - Skill match with required capabilities
   - Current workload and availability
   - Historical performance with similar tickets
   - Predicted resolution time

You must respond with ONLY a raw JSON object (no markdown, no code blocks) in this format:
{{
  "agent_id": string,
  "agent_name": string,
  "confidence": number,
  "reasoning": string,
  "assignment_timestamp": string,
  "skill_match_score": number,
  "predicted_resolution_time": string,
  "workload_after_assignment": number
}}

Important:
- DO NOT wrap the response in markdown code blocks or any other formatting
- confidence should be between 0 and 1
- provide clear reasoning for your agent selection
- skill_match_score should be between 0 and 1
- predicted_resolution_time should be in format "Xh Ym" (e.g. "2h 30m")
- workload_after_assignment must account for current workload + new ticket
- agent_id must be a valid UUID from the provided agents
- agent_name must match an existing agent name
- Consider agent expertise levels for required capabilities
- Factor in current workload distribution
- Account for agent availability status`)

// Create a final user (human) prompt template with placeholders
const userPrompt = HumanMessagePromptTemplate.fromTemplate(`
Ticket Details:
ID: {id}
Category: {category}
Priority: {priority}
Title: {title}
Description: {description}
Required Capabilities: {required_capabilities}
Estimated Workload: {estimated_workload}

Available Agents:
{availableAgents}

Historical Performance:
{historicalPerformance}

Current Workloads:
{currentWorkloads}
`)

// Create the chat prompt template
export const assignmentPrompt = ChatPromptTemplate.fromMessages([
  systemPrompt,
  userPrompt,
])
