import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { assignAgent } from "@/lib/ai/agents/agent-assigner/assigner"

export async function POST(request: Request) {
  try {
    console.log("[POST /api/tickets/assign] Starting agent assignment")
    const supabase = await createClient()
    const body = await request.json()
    const { ticketId } = body

    console.log("[POST /api/tickets/assign] Request body:", { ticketId })

    if (!ticketId) {
      console.log("[POST /api/tickets/assign] Missing ticketId")
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }

    // Get ticket details
    console.log("[POST /api/tickets/assign] Fetching ticket details")
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*, team_routing_metrics!inner(*)")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      console.log("[POST /api/tickets/assign] Ticket not found:", {
        ticketError,
      })
      return NextResponse.json(
        { error: "Ticket not found or not routed to a team" },
        { status: 404 }
      )
    }

    console.log("[POST /api/tickets/assign] Found ticket:", {
      ticketId: ticket.id,
      teamId: ticket.team_id,
      category: ticket.category,
    })

    // Assign the ticket to an agent
    console.log("[POST /api/tickets/assign] Calling assignAgent")
    const assignmentResult = await assignAgent({
      id: ticket.id,
      team_id: ticket.team_id,
      category: ticket.category,
      priority: ticket.priority,
      title: ticket.title,
      description: ticket.description,
      required_capabilities: ticket.team_routing_metrics.required_capabilities,
      estimated_workload: ticket.team_routing_metrics.estimated_workload,
    })

    console.log("[POST /api/tickets/assign] Assignment result:", {
      agentId: assignmentResult.agent_id,
      confidence: assignmentResult.confidence,
      skillMatchScore: assignmentResult.skill_match_score,
    })

    // Update ticket with agent assignment
    console.log("[POST /api/tickets/assign] Updating ticket with assignment")
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        assigned_to: assignmentResult.agent_id,
        assignment_attempts: ticket.assignment_attempts + 1,
        last_assignment_timestamp: assignmentResult.assignment_timestamp,
        assignment_confidence: assignmentResult.confidence,
        status: "assigned",
      })
      .eq("id", ticketId)

    if (updateError) {
      console.log("[POST /api/tickets/assign] Update error:", updateError)
      throw updateError
    }

    console.log("[POST /api/tickets/assign] Successfully assigned ticket")
    return NextResponse.json({
      result: assignmentResult,
    })
  } catch (error) {
    console.error("[POST /api/tickets/assign] Error:", error)
    return NextResponse.json(
      { error: "Failed to assign ticket" },
      { status: 500 }
    )
  }
}
