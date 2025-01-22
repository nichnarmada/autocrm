import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tickets/[id]/comments
export async function GET(request: NextRequest) {
  try {
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*, user:profiles(*)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[TICKET_COMMENTS_GET]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_COMMENTS_GET_ERROR",
          message: "Failed to fetch ticket comments",
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/tickets/[id]/comments
export async function POST(request: NextRequest) {
  try {
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const supabase = await createClient()
    const json = await request.json()

    // Get user session
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "You must be logged in to create comments",
          },
        },
        { status: 401 }
      )
    }

    // Create the comment
    const { data, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        content: json.content,
        is_internal: json.is_internal || false,
        attachments: json.attachments || [],
      })
      .select("*, user:profiles(*)")
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[TICKET_COMMENTS_POST]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_COMMENTS_POST_ERROR",
          message: "Failed to create ticket comment",
        },
      },
      { status: 500 }
    )
  }
}
