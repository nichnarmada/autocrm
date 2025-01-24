import type { Database } from "./supabase"
import { Profile } from "./users"

type Tables = Database["public"]["Tables"]

export type TeamMember = Tables["team_members"]["Row"] & {
  profiles: Profile
}

export type Team = Tables["teams"]["Row"] & {
  team_members: (TeamMember & {
    profiles: Profile
  })[]
}

export type ViewMode = "list" | "board"
