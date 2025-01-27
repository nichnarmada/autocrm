import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

type TicketRow = Database["public"]["Tables"]["tickets"]["Row"]
type TicketUpdate = Database["public"]["Tables"]["tickets"]["Update"]

// GET /api/tickets/[id]
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        assigned_to:profiles!tickets_assigned_to_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        created_by:profiles!tickets_created_by_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        customer_id:profiles!tickets_customer_id_fkey(
          id,
          full_name,
          email,
          avatar_url
        ),
        team_id:teams(
          id,
          name,
          description
        )
      `
      )
      .eq("id", ticketId)
      .single()

    if (error) {
      console.error("[API] Error fetching ticket:", error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    console.error("[API] Error in ticket route:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/tickets/[id]
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    const isAgent = profile.role === "agent" || profile.role === "admin"

    // Check if user has permission to update this ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Only allow agents or the ticket creator to update the ticket
    if (!isAgent && ticket.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()

    // Update ticket
    const { error: updateError } = await supabase
      .from("tickets")
      .update({
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        category: body.category,
        assigned_to: body.assigned_to,
        team_id: body.team_id,
      })
      .eq("id", ticketId)

    if (updateError) {
      console.error("Error updating ticket:", updateError)
      return NextResponse.json(
        { error: "Failed to update ticket" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PATCH /api/tickets/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id]
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      )
    }

    const isAgent = profile.role === "agent" || profile.role === "admin"

    // Check if user has permission to delete this ticket
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Only allow agents or the ticket creator to delete the ticket
    if (!isAgent && ticket.created_by !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all attachments for this ticket
    const { data: attachments } = await supabase
      .from("ticket_attachments")
      .select("storage_path")
      .eq("ticket_id", ticketId)

    // Delete all attachment files from storage
    if (attachments && attachments.length > 0) {
      const filePaths = attachments.map((a) => a.storage_path)
      const { error: storageError } = await supabase.storage
        .from("ticket-attachments")
        .remove(filePaths)

      if (storageError) {
        console.error("Error deleting attachment files:", storageError)
      }
    }

    // Delete ticket (this will cascade delete attachments and comments)
    const { error: deleteError } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId)

    if (deleteError) {
      console.error("Error deleting ticket:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete ticket" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/tickets/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
