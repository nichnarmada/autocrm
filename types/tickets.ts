import { Database } from "./supabase"

type Tables = Database["public"]["Tables"]

export type Profile = Tables["profiles"]["Row"]

export type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Profile | null
  team_id: Tables["teams"]["Row"] | null
}
