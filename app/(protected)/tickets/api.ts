import { createClient } from "@/utils/supabase/client"
import type { z } from "zod"
import type { ticketSchema } from "./schema"

export type CreateTicketData = z.infer<typeof ticketSchema>

export async function createTicket(data: CreateTicketData): Promise<void> {
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

  const { error } = await supabase.from("tickets").insert([
    {
      ...data,
      created_by: user.id,
      customer_id: isAgent ? null : user.id, // Set customer_id for customers
      created_on_behalf: isAgent, // Set created_on_behalf flag for agents
    },
  ])

  if (error) throw error
}

export async function deleteTicket(id: string): Promise<void> {
  console.log("[API] Deleting ticket:", id)

  const response = await fetch(`/api/tickets/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    console.error("[API] Error deleting ticket:", error)
    throw new Error(error.error?.message || "Failed to delete ticket")
  }

  console.log("[API] Successfully deleted ticket:", id)
}
