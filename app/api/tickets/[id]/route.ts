import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tickets/[id]
export async function GET(request: NextRequest) {
  try {
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const supabase = await createClient()

    // First get the ticket with basic relations
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        *,
        assigned_to:profiles(*),
        created_by:profiles(*),
        customer_id:profiles(*),
        team_id:teams(*)
      `
      )
      .eq("id", ticketId)
      .single()

    if (error) throw error

    // Then get comments separately
    const { data: comments, error: commentsError } = await supabase
      .from("ticket_comments")
      .select("*, user:profiles(*)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (commentsError) throw commentsError

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        ticket_comments: comments,
      },
    })
  } catch (error) {
    console.error("[TICKET_GET]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_GET_ERROR",
          message: "Failed to fetch ticket",
        },
      },
      { status: 500 }
    )
  }
}

// PATCH /api/tickets/[id]
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const json = await request.json()

    const { data, error } = await supabase
      .from("tickets")
      .update(json)
      .eq("id", ticketId)
      .select(
        `
        *,
        assigned_to:profiles(*),
        created_by:profiles(*),
        customer_id:profiles(*),
        team_id:teams(*)
      `
      )
      .single()

    if (error) throw error

    // Get comments separately
    const { data: comments, error: commentsError } = await supabase
      .from("ticket_comments")
      .select("*, user:profiles(*)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (commentsError) throw commentsError

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        ticket_comments: comments,
      },
    })
  } catch (error) {
    console.error("[TICKET_PATCH]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_PATCH_ERROR",
          message: "Failed to update ticket",
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id]
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

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
