import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// PATCH /api/tickets/[id]/comments/[commentId]
export async function PATCH(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split("/")
    const commentId = pathParts[pathParts.length - 1]
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
            message: "You must be logged in to update comments",
          },
        },
        { status: 401 }
      )
    }

    // Update the comment
    const { data, error } = await supabase
      .from("ticket_comments")
      .update({
        content: json.content,
        is_internal: json.is_internal,
        attachments: json.attachments,
      })
      .eq("id", commentId)
      // Only allow updating if user owns the comment (RLS will enforce this)
      .eq("user_id", user.id)
      .select("*, user:profiles(*)")
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[TICKET_COMMENTS_PATCH]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_COMMENTS_PATCH_ERROR",
          message: "Failed to update ticket comment",
        },
      },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id]/comments/[commentId]
export async function DELETE(request: NextRequest) {
  try {
    const pathParts = request.nextUrl.pathname.split("/")
    const commentId = pathParts[pathParts.length - 1]
    const supabase = await createClient()

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
            message: "You must be logged in to delete comments",
          },
        },
        { status: 401 }
      )
    }

    // Delete the comment (RLS will ensure user can only delete their own comments)
    const { error } = await supabase
      .from("ticket_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("[TICKET_COMMENTS_DELETE]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKET_COMMENTS_DELETE_ERROR",
          message: "Failed to delete ticket comment",
        },
      },
      { status: 500 }
    )
  }
}
