import type { Database } from "../supabase"

type Tables = Database["public"]["Tables"]

export type Profile = Tables["profiles"]["Row"]
export type TeamMember = Tables["team_members"]["Row"] & {
  profiles: Profile
}

export type Team = Tables["teams"]["Row"] & {
  team_members: (TeamMember & {
    profiles: Profile
  })[]
}

export interface PendingChange {
  type: "add" | "remove"
  userId: string
  fromTeamId: string | null
  member: Profile | (TeamMember & { profiles: Profile })
}

export type ViewMode = "list" | "board"
