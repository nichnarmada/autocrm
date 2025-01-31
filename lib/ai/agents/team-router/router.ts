import { ChatOpenAI } from "@langchain/openai"
import { MemorySaver } from "@langchain/langgraph"
import { createReactAgent } from "@langchain/langgraph/prebuilt"
import { TeamRoutingInput, TeamRoutingResult } from "@/types/agents/router"
import { teamRoutingPrompt, defaultTeamRoutingConfig } from "./config"
import { createClient } from "@/utils/supabase/server"

// Create the agent
const agentModel = new ChatOpenAI(defaultTeamRoutingConfig)
const agentCheckpointer = new MemorySaver()
const routingAgent = createReactAgent({
  llm: agentModel,
  tools: [],
  checkpointSaver: agentCheckpointer,
})

async function getTeamInfo() {
  const supabase = await createClient()

  // Get teams and their capabilities
  const { data: teams, error: teamsError } = await supabase.from("teams")
    .select(`
      id,
      name,
      capabilities,
      specialties,
      current_workload,
      max_workload,
      team_members (
        count
      )
    `)

  if (teamsError) {
    console.error("[Team Router] Error fetching teams:", teamsError)
    throw teamsError
  }

  // Get current workload per team
  const { data: workloads, error: workloadsError } = await supabase
    .from("tickets")
    .select("team_id, status")
    .not("status", "eq", "closed")
    .in("status", ["open", "in_progress"])

  if (workloadsError) {
    console.error("[Team Router] Error fetching workloads:", workloadsError)
    throw workloadsError
  }

  // Calculate workload per team
  const teamWorkloads = new Map<string, number>()
  workloads?.forEach((ticket) => {
    if (ticket.team_id) {
      teamWorkloads.set(
        ticket.team_id,
        (teamWorkloads.get(ticket.team_id) || 0) + 1
      )
    }
  })

  return {
    teams: teams || [],
    workloads: teamWorkloads,
  }
}

export async function routeTicket(
  input: TeamRoutingInput
): Promise<TeamRoutingResult> {
  // Add input validation
  if (!input.title?.trim() || !input.description?.trim()) {
    console.error("[Team Router] Missing required input fields")
    throw new Error("Title and description are required")
  }

  // Get team information
  const { teams, workloads } = await getTeamInfo()

  if (!teams.length) {
    console.error("[Team Router] No teams found in database")
    throw new Error("No teams available for routing")
  }

  // Format teams for prompt
  const formattedTeams = teams.map((team) => ({
    id: team.id,
    name: team.name,
    capabilities: team.capabilities || [],
    specialties: team.specialties || [],
    memberCount: team.team_members?.[0]?.count || 0,
    currentWorkload: team.current_workload || 0,
    maxWorkload: team.max_workload || 100,
  }))

  // Format workloads for prompt
  const formattedWorkloads = Array.from(workloads.entries()).map(
    ([teamId, count]) => {
      const team = teams.find((t) => t.id === teamId)
      return `${team?.name}: ${count} active tickets`
    }
  )

  const promptMessages = await teamRoutingPrompt.formatMessages({
    ...input,
    availableTeams: JSON.stringify(formattedTeams, null, 2),
    teamWorkloads: formattedWorkloads.join("\n"),
  })

  const finalState = await routingAgent.invoke(
    { messages: promptMessages },
    {
      configurable: {
        thread_id: `ticket-${input.id}-routing-${Date.now()}`,
      },
    }
  )

  const lastMessage =
    finalState.messages[finalState.messages.length - 1].content

  let parsed: TeamRoutingResult
  try {
    const messageStr =
      typeof lastMessage === "string"
        ? lastMessage
        : JSON.stringify(lastMessage)
    parsed = JSON.parse(messageStr)

    // Validate the response
    if (
      !parsed.team_id ||
      !parsed.team_name ||
      !parsed.confidence ||
      !parsed.reasoning ||
      !parsed.required_capabilities ||
      typeof parsed.estimated_workload !== "number"
    ) {
      console.error(
        "[Team Router] Invalid response format. Missing required fields:",
        {
          hasTeamId: !!parsed.team_id,
          hasTeamName: !!parsed.team_name,
          hasConfidence: !!parsed.confidence,
          hasReasoning: !!parsed.reasoning,
          hasCapabilities: !!parsed.required_capabilities,
          hasWorkload: typeof parsed.estimated_workload === "number",
        }
      )
      throw new Error("Invalid response format")
    }

    // Validate team exists
    const teamExists = teams.some(
      (team) => team.id === parsed.team_id && team.name === parsed.team_name
    )
    if (!teamExists) {
      console.error("[Team Router] Selected team does not exist:", {
        teamId: parsed.team_id,
        teamName: parsed.team_name,
      })
      throw new Error("Selected team does not exist")
    }

    // Validate confidence
    if (parsed.confidence < 0 || parsed.confidence > 1) {
      console.error(
        "[Team Router] Invalid confidence value:",
        parsed.confidence
      )
      throw new Error("Confidence must be between 0 and 1")
    }

    // Validate workload
    if (parsed.estimated_workload < 1 || parsed.estimated_workload > 10) {
      console.error(
        "[Team Router] Invalid workload value:",
        parsed.estimated_workload
      )
      throw new Error("Estimated workload must be between 1 and 10")
    }
  } catch (error) {
    console.error("[Team Router] Parsing/validation error:", error)
    throw new Error(`Failed to parse routing result JSON: ${error}`)
  }

  // Store routing metrics if not in preview mode
  if (input.id !== "preview") {
    const supabase = await createClient()
    await supabase.from("team_routing_metrics").insert({
      ticket_id: input.id,
      team_id: parsed.team_id,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      required_capabilities: parsed.required_capabilities,
      estimated_workload: parsed.estimated_workload,
    })
  }

  return {
    ...parsed,
    routing_timestamp: new Date().toISOString(),
  }
}
