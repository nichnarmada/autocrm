import { Database } from "./supabase"

type Tables = Database["public"]["Tables"]

export type Profile = Tables["profiles"]["Row"]

// Base ticket type from Supabase
export type BaseTicket = Tables["tickets"]["Row"]

// Ticket attachment type with relations
export type TicketAttachment = Tables["ticket_attachments"]["Row"] & {
  uploaded_by: Profile | null
}

// Ticket type with all relations expanded
export type Ticket = BaseTicket & {
  assigned_to: Profile | null
  created_by: Profile | null
  customer_id: Profile | null
  team_id: Tables["teams"]["Row"] | null
  ticket_attachments?: TicketAttachment[]
  ticket_comments?: (Tables["ticket_comments"]["Row"] & {
    user_id: Profile | null
  })[]
}

// Ticket comment type with relations
export type TicketComment = Tables["ticket_comments"]["Row"] & {
  user_id: Profile | null
}

// Ticket status type
export type TicketStatus = Database["public"]["Enums"]["ticket_status"]

// Ticket priority type
export type TicketPriority = Database["public"]["Enums"]["ticket_priority"]

// Ticket category type
export type TicketCategory = Database["public"]["Enums"]["ticket_category"]

// Type for creating a new ticket
export type CreateTicketInput = Tables["tickets"]["Insert"]

// Type for updating a ticket
export type UpdateTicketInput = Tables["tickets"]["Update"]
