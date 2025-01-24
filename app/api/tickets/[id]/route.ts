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
    const update: TicketUpdate = await request.json()

    const { data: ticket, error } = await supabase
      .from("tickets")
      .update(update)
      .eq("id", ticketId)
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
      .single()

    if (error) {
      console.error("[API] Error updating ticket:", error)
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

// DELETE /api/tickets/[id]
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

    // Check authentication and role
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        },
        { status: 401 }
      )
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "User profile not found",
          },
        },
        { status: 404 }
      )
    }

    const isAgentOrAdmin = profile.role === "agent" || profile.role === "admin"
    if (!isAgentOrAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Only agents and admins can delete tickets",
          },
        },
        { status: 403 }
      )
    }

    // Delete the ticket
    const { error } = await supabase.from("tickets").delete().eq("id", ticketId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TICKET_DELETE]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_DELETE_ERROR",
          message: "Failed to delete ticket",
        },
      },
      { status: 500 }
    )
  }
}
