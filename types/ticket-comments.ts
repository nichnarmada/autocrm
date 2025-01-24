import type { Database } from "./supabase"

type Tables = Database["public"]["Tables"]

// Base comment type from Supabase
export type TicketComment = Tables["ticket_comments"]["Row"]

// Type for creating a new comment
export type CreateTicketCommentInput = Tables["ticket_comments"]["Insert"]

// Type for updating a comment
export type UpdateTicketCommentInput = Tables["ticket_comments"]["Update"]
