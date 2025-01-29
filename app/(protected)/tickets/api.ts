import { createClient } from "@/utils/supabase/client"
import type { z } from "zod"
import { ticketSchema } from "@/app/(protected)/tickets/schema"

export type CreateTicketData = z.infer<typeof ticketSchema>

interface FileAttachment {
  file: File
}

export async function createTicket(
  data: CreateTicketData
): Promise<{ id: string }> {
  const supabase = createClient()
  const user = (await supabase.auth.getUser()).data.user

  if (!user) {
    throw new Error("User not authenticated")
  }

  // Get user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    throw new Error("User profile not found")
  }

  const isAgent = profile.role === "agent" || profile.role === "admin"

  // Start a transaction by creating the ticket first
  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert([
      {
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        status: data.status,
        team_id: data.team_id,
        created_by: user.id,
        customer_id: isAgent ? null : user.id,
        created_on_behalf: isAgent,
      },
    ])
    .select()
    .single()

  if (ticketError) throw ticketError

  // If there are attachments, upload them and create records
  if (data.attachments && data.attachments.length > 0) {
    try {
      // Upload files to storage
      const uploadPromises = data.attachments.map(
        async ({ file }: FileAttachment) => {
          const fileExt = file.name.split(".").pop()
          const filePath = `${ticket.id}/${crypto.randomUUID()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Create record in ticket_attachments table
          const { error: attachmentError } = await supabase
            .from("ticket_attachments")
            .insert({
              ticket_id: ticket.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: filePath,
              uploaded_by: user.id,
            })

          if (attachmentError) throw attachmentError
        }
      )

      await Promise.all(uploadPromises)
    } catch (error) {
      // If there's an error uploading attachments, delete the ticket
      await supabase.from("tickets").delete().match({ id: ticket.id })
      throw new Error("Failed to upload attachments")
    }
  }

  // Return the ticket ID for redirection
  return { id: ticket.id }
}

export async function deleteTicket(id: string): Promise<void> {
  const response = await fetch(`/api/tickets/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("[API] Error deleting ticket:", error)
    throw new Error(error.error?.message || "Failed to delete ticket")
  }
}
