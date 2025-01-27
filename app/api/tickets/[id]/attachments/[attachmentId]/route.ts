import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tickets/[id]/attachments/[attachmentId] - Download file
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const attachmentId = request.nextUrl.pathname.split("/")[5]

    // Get attachment details
    const { data: attachment, error: attachmentError } = await supabase
      .from("ticket_attachments")
      .select("*")
      .eq("id", attachmentId)
      .eq("ticket_id", ticketId)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json(
        { success: false, error: "Attachment not found" },
        { status: 404 }
      )
    }

    // Get signed URL for download
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("ticket-attachments")
      .createSignedUrl(attachment.storage_path, 60) // URL valid for 60 seconds

    if (signedUrlError) {
      throw signedUrlError
    }

    return NextResponse.json({
      success: true,
      data: {
        ...attachment,
        signedUrl: signedUrl.signedUrl,
      },
    })
  } catch (error) {
    console.error("[API] Error getting attachment:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get attachment" },
      { status: 500 }
    )
  }
}

// DELETE /api/tickets/[id]/attachments/[attachmentId] - Delete file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]
    const attachmentId = request.nextUrl.pathname.split("/")[5]

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

    // Get the attachment and check permissions
    const { data: attachment } = await supabase
      .from("ticket_attachments")
      .select(
        `
        *,
        ticket:tickets(
          id,
          created_by,
          assigned_to
        )
      `
      )
      .eq("id", attachmentId)
      .single()

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      )
    }

    // Only allow deletion by:
    // 1. The user who uploaded the attachment
    // 2. The ticket creator
    // 3. The assigned agent
    // 4. Any admin/agent
    if (
      !isAgent &&
      attachment.uploaded_by !== user.id &&
      attachment.ticket.created_by !== user.id &&
      attachment.ticket.assigned_to !== user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete the file from storage
    const { error: storageError } = await supabase.storage
      .from("ticket-attachments")
      .remove([attachment.storage_path])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
      return NextResponse.json(
        { error: "Failed to delete file from storage" },
        { status: 500 }
      )
    }

    // Delete the record from the database
    const { error: dbError } = await supabase
      .from("ticket_attachments")
      .delete()
      .eq("id", attachmentId)

    if (dbError) {
      console.error("Error deleting attachment record:", dbError)
      return NextResponse.json(
        { error: "Failed to delete attachment record" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(
      "Error in DELETE /api/tickets/[id]/attachments/[attachmentId]:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
