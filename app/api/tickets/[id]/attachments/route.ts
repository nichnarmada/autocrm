import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST /api/tickets/[id]/attachments - Upload file(s)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

    // Check if user has access to the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        { success: false, error: "Ticket not found" },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    const uploadPromises = files.map(async (file) => {
      const timestamp = new Date().getTime()
      const fileName = `${timestamp}-${file.name}`
      const filePath = `${ticketId}/${fileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("ticket-attachments")
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Create record in ticket_attachments table
      const { data: attachment, error: attachmentError } = await supabase
        .from("ticket_attachments")
        .insert({
          ticket_id: ticketId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
        })
        .select()
        .single()

      if (attachmentError) {
        // Cleanup uploaded file if record creation fails
        await supabase.storage.from("ticket-attachments").remove([filePath])
        throw attachmentError
      }

      return attachment
    })

    const results = await Promise.allSettled(uploadPromises)
    const successes = results
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value)
    const failures = results
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      )
      .map((result) => result.reason)

    if (failures.length > 0) {
      console.error("Some files failed to upload:", failures)
    }

    return NextResponse.json({
      success: true,
      data: successes,
      errors: failures.length > 0 ? failures : undefined,
    })
  } catch (error) {
    console.error("[API] Error uploading attachments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to upload attachments" },
      { status: 500 }
    )
  }
}

// GET /api/tickets/[id]/attachments - List attachments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const ticketId = request.nextUrl.pathname.split("/")[3]

    const { data: attachments, error } = await supabase
      .from("ticket_attachments")
      .select(
        `
        *,
        uploaded_by:profiles(
          id,
          full_name,
          email,
          avatar_url
        )
      `
      )
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: attachments })
  } catch (error) {
    console.error("[API] Error fetching attachments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch attachments" },
      { status: 500 }
    )
  }
}
