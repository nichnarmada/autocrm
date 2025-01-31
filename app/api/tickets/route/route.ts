import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { routeTicket } from "@/lib/ai/agents/team-router/router"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { ticketId } = body

    if (!ticketId) {
      console.log("[POST /api/tickets/route] Missing ticketId")
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }

    // Get ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (ticketError) {
      console.error("[POST /api/tickets/route] Supabase error:", ticketError)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Route the ticket
    const routingResult = await routeTicket({
      id: ticket.id,
      category: ticket.category,
      priority: ticket.priority,
      title: ticket.title,
      description: ticket.description,
      requiredSkills: ticket.required_skills,
      complexity: ticket.complexity,
    })

    // Update ticket with routing results
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        team_id: routingResult.team_id,
        routing_attempts: (ticket.routing_attempts || 0) + 1,
        last_routing_timestamp: routingResult.routing_timestamp,
        routing_confidence: routingResult.confidence,
      })
      .eq("id", ticketId)

    if (updateError) {
      console.error("[POST /api/tickets/route] Update error:", updateError)
      throw updateError
    }

    return NextResponse.json({
      result: routingResult,
    })
  } catch (error) {
    console.error("[POST /api/tickets/route] Unhandled error:", error)
    return NextResponse.json(
      { error: "Failed to route ticket" },
      { status: 500 }
    )
  }
}
