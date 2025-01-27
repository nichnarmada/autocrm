import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const attachmentId = request.nextUrl.pathname.split("/")[3]

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
          assigned_to,
          customer_id
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

    // Only allow download by:
    // 1. The ticket creator
    // 2. The assigned agent
    // 3. The customer
    // 4. Any admin/agent
    if (
      !isAgent &&
      attachment.ticket.created_by !== user.id &&
      attachment.ticket.assigned_to !== user.id &&
      attachment.ticket.customer_id !== user.id
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get a signed URL for the file
    const { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from("ticket-attachments")
      .createSignedUrl(attachment.storage_path, 60) // URL expires in 60 seconds

    if (signedUrlError) {
      console.error("Error creating signed URL:", signedUrlError)
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        url: signedUrl.signedUrl,
        fileName: attachment.file_name,
      },
    })
  } catch (error) {
    console.error(
      "Error in GET /api/tickets/[id]/attachments/[attachmentId]/download:",
      error
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
