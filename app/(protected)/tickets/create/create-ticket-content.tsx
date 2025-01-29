import { createClient } from "@/utils/supabase/server"
import { CreateTicketView } from "./create-ticket-view"

export async function CreateTicketContent() {
  const supabase = await createClient()

  // Fetch teams for the form
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("*")
    .order("name")

  if (teamsError) {
    console.error("Error fetching teams:", teamsError)
  }

  return <CreateTicketView teams={teams || []} />
}
