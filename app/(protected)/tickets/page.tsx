import { createClient } from "@/utils/supabase/server"
import { TicketsListView } from "./tickets-list-view"
import { redirect } from "next/navigation"

type TicketPageProps = {
  params: Promise<{ tab?: string; search?: string }>
}

export default async function TicketsPage({ params }: TicketPageProps) {
  const searchParams = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/sign-in")
  }

  const [ticketsResponse, teamsResponse, agentsResponse] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        `
        *,
        assigned_to:profiles(*),
        created_by:profiles(*),
        customer_id:profiles(*),
        team_id:teams(*)
      `
      )
      .order("created_at", { ascending: false }),
    supabase.from("teams").select("*").order("name"),
    supabase
      .from("profiles")
      .select("*")
      .in("role", ["admin", "agent"])
      .order("full_name"),
  ])

  const tickets = ticketsResponse.data || []
  const teams = teamsResponse.data || []
  const agents = agentsResponse.data || []

  return (
    <div className="container">
      <TicketsListView
        tickets={tickets}
        teams={teams}
        agents={agents}
        userId={user.id}
        searchParams={searchParams}
      />
    </div>
  )
}
