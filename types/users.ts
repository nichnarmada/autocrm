import type { Database } from "./supabase"

type Tables = Database["public"]["Tables"]

export type Profile = Tables["profiles"]["Row"]

export type UserRole = Database["public"]["Enums"]["user_role"]
