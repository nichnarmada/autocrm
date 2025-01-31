import { ChatOpenAI } from "@langchain/openai"
import { MemorySaver } from "@langchain/langgraph"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import {
  AgentAssignmentInput,
  AgentAssignmentResult,
} from "@/types/agents/assigner"
import { assignmentPrompt, defaultAssignmentConfig } from "./config"
import { createClient } from "@/utils/supabase/server"
import { Profile } from "@/types/users"
import type { TeamMember } from "@/types/teams"

// Create the agent
const agentModel = new ChatOpenAI(defaultAssignmentConfig)
const agentCheckpointer = new MemorySaver()
const assignmentAgent = createReactAgent({
  llm: agentModel,
  tools: [],
  checkpointSaver: agentCheckpointer,
})

// Profile already contains: id, email, full_name, avatar_url, role, is_profile_setup
type Agent = Profile

async function getAgentInfo(teamId: string) {
  console.log("[Agent Assigner] Getting agent info for team:", teamId)
  const supabase = await createClient()

  // Get team members and their profiles
  console.log("[Agent Assigner] Fetching team members and profiles")
  const { data: members, error: agentsError } = await supabase
    .from("team_members")
    .select(
      `
      *,
      profiles!team_members_user_id_fkey (
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq("team_id", teamId)
    .eq("profiles.role", "agent")

  if (agentsError) {
    console.error("[Agent Assigner] Error fetching agents:", agentsError)
    throw agentsError
  }

  // Transform the nested data structure
  const transformedAgents: Agent[] =
    members?.map((member) => (member as TeamMember).profiles) || []

  console.log("[Agent Assigner] Found agents:", {
    count: transformedAgents.length,
    agentIds: transformedAgents.map((a) => a.id),
  })

  // Get historical performance
  console.log("[Agent Assigner] Fetching historical performance")
  const { data: history } = await supabase
    .from("ticket_resolution_history")
    .select("*")
    .in("agent_id", transformedAgents.map((a) => a.id) || [])
    .order("created_at", { ascending: false })
    .limit(100)

  console.log("[Agent Assigner] Found historical records:", {
    count: history?.length,
  })

  // Calculate average resolution times per agent
  const agentPerformance = new Map<
    string,
    {
      avgResolutionTime: number
      totalTickets: number
      satisfactionScore: number
    }
  >()

  history?.forEach((record) => {
    const current = agentPerformance.get(record.agent_id) || {
      avgResolutionTime: 0,
      totalTickets: 0,
      satisfactionScore: 0,
    }

    const resolutionHours = record.resolution_time
      ? parseInt(record.resolution_time.replace(" hours", ""))
      : 0

    current.avgResolutionTime =
      (current.avgResolutionTime * current.totalTickets + resolutionHours) /
      (current.totalTickets + 1)
    current.totalTickets += 1
    current.satisfactionScore =
      (current.satisfactionScore * (current.totalTickets - 1) +
        (record.customer_satisfaction || 0)) /
      current.totalTickets

    agentPerformance.set(record.agent_id, current)
  })

  console.log("[Agent Assigner] Calculated performance metrics:", {
    agentCount: agentPerformance.size,
    metrics: Array.from(agentPerformance.entries()).map(([id, perf]) => ({
      agentId: id,
      avgResolutionTime: perf.avgResolutionTime,
      totalTickets: perf.totalTickets,
      satisfactionScore: perf.satisfactionScore,
    })),
  })

  return {
    agents: transformedAgents,
    performance: agentPerformance,
  }
}

export async function assignAgent(
  input: AgentAssignmentInput
): Promise<AgentAssignmentResult> {
  console.log(
    "[Agent Assigner] Starting agent assignment for ticket:",
    input.id
  )

  // Add input validation
  if (!input.team_id) {
    console.log("[Agent Assigner] Missing team_id")
    throw new Error("Team ID is required")
  }

  // Get agent information
  console.log("[Agent Assigner] Getting agent information")
  const { agents, performance } = await getAgentInfo(input.team_id)

  if (!agents.length) {
    console.log("[Agent Assigner] No available agents found")
    throw new Error("No available agents found in the team")
  }

  console.log("[Agent Assigner] Found agents:", {
    count: agents.length,
    agentIds: agents.map((a) => a.id),
  })

  // Format agents for prompt
  const formattedAgents = agents.map((agent) => ({
    id: agent.id,
    name: agent.full_name,
    role: agent.role,
    email: agent.email,
  }))

  // Format performance data
  const formattedPerformance = Array.from(performance.entries()).map(
    ([agentId, perf]) => {
      const agent = agents.find((a) => a.id === agentId)
      return `${agent?.full_name}:
  Average Resolution Time: ${perf.avgResolutionTime.toFixed(1)}h
  Total Tickets: ${perf.totalTickets}
  Satisfaction Score: ${perf.satisfactionScore.toFixed(2)}/5`
    }
  )

  // Format current workloads - using historical data instead of current workload
  const formattedWorkloads = agents.map((agent) => {
    const perf = performance.get(agent.id)
    return `${agent.full_name}: ${perf?.totalTickets || 0} historical tickets`
  })

  console.log("[Agent Assigner] Found agents:", {
    count: agents.length,
    availableAgentIds: agents.map((a) => a.id),
  })

  console.log("[Agent Assigner] Calling LLM for assignment")
  const promptMessages = await assignmentPrompt.formatMessages({
    ...input,
    availableAgents: JSON.stringify(formattedAgents, null, 2),
    historicalPerformance: formattedPerformance.join("\n"),
    currentWorkloads: formattedWorkloads.join("\n"),
  })

  const finalState = await assignmentAgent.invoke(
    { messages: promptMessages },
    {
      configurable: {
        thread_id: `ticket-${input.id}-assignment-${Date.now()}`,
      },
    }
  )

  const lastMessage =
    finalState.messages[finalState.messages.length - 1].content

  console.log("[Agent Assigner] Raw LLM response:", { lastMessage })

  let parsed: AgentAssignmentResult
  try {
    const messageStr =
      typeof lastMessage === "string"
        ? lastMessage
        : JSON.stringify(lastMessage)
    parsed = JSON.parse(messageStr)

    console.log("[Agent Assigner] Parsed result:", {
      agentId: parsed.agent_id,
      confidence: parsed.confidence,
      skillMatchScore: parsed.skill_match_score,
    })

    // Validate the response
    if (
      !parsed.agent_id ||
      !parsed.agent_name ||
      !parsed.confidence ||
      !parsed.reasoning ||
      !parsed.skill_match_score ||
      !parsed.predicted_resolution_time ||
      typeof parsed.workload_after_assignment !== "number"
    ) {
      console.log("[Agent Assigner] Invalid response format:", {
        hasAgentId: !!parsed.agent_id,
        hasAgentName: !!parsed.agent_name,
        hasConfidence: !!parsed.confidence,
        hasReasoning: !!parsed.reasoning,
        hasSkillMatchScore: !!parsed.skill_match_score,
        hasResolutionTime: !!parsed.predicted_resolution_time,
        hasWorkload: typeof parsed.workload_after_assignment === "number",
      })
      throw new Error("Invalid response format")
    }

    // Validate agent exists
    const agentExists = agents.some(
      (agent) =>
        agent.id === parsed.agent_id && agent.full_name === parsed.agent_name
    )
    if (!agentExists) {
      console.log("[Agent Assigner] Selected agent does not exist:", {
        agentId: parsed.agent_id,
        agentName: parsed.agent_name,
      })
      throw new Error("Selected agent does not exist")
    }

    // Validate confidence and skill match
    if (
      parsed.confidence < 0 ||
      parsed.confidence > 1 ||
      parsed.skill_match_score < 0 ||
      parsed.skill_match_score > 1
    ) {
      console.log("[Agent Assigner] Invalid confidence or skill match score:", {
        confidence: parsed.confidence,
        skillMatchScore: parsed.skill_match_score,
      })
      throw new Error(
        "Confidence and skill match score must be between 0 and 1"
      )
    }

    // Validate resolution time format
    if (!/^\d+h \d+m$/.test(parsed.predicted_resolution_time)) {
      console.log("[Agent Assigner] Invalid resolution time format:", {
        resolutionTime: parsed.predicted_resolution_time,
      })
      throw new Error("Invalid resolution time format")
    }
  } catch (error) {
    console.error("[Agent Assigner] Parsing/validation error:", error)
    throw new Error(`Failed to parse assignment result JSON: ${error}`)
  }

  console.log("[Agent Assigner] Storing assignment metrics")
  // Store assignment metrics
  const supabase = await createClient()
  await supabase.from("agent_performance_metrics").insert({
    ticket_id: input.id,
    agent_id: parsed.agent_id,
    confidence: parsed.confidence,
    reasoning: parsed.reasoning,
    skill_match_score: parsed.skill_match_score,
    predicted_resolution_time: parsed.predicted_resolution_time,
    workload_at_assignment: parsed.workload_after_assignment - 1,
  })

  // Update agent workload
  console.log("[Agent Assigner] Updating agent workload")
  await supabase
    .from("profiles")
    .update({
      current_workload: parsed.workload_after_assignment,
    })
    .eq("id", parsed.agent_id)

  console.log("[Agent Assigner] Assignment complete")
  return {
    ...parsed,
    assignment_timestamp: new Date().toISOString(),
  }
}
