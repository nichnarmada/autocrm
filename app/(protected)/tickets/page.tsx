import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TicketsListView } from "./tickets-list-view"
import { TicketListSkeleton } from "./ticket-list-skeleton"
import { Suspense } from "react"

type TicketsPageProps = {
  params: Promise<{ tab?: string; search?: string }>
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
      </div>

      <Suspense fallback={<TicketListSkeleton />}>
        {/* Move the data fetching and TicketsListView into a new component */}
        <TicketsContent params={params} />
      </Suspense>
    </div>
  )
}

// Create this component in the same file
async function TicketsContent({
  params,
}: {
  params: Promise<{ tab?: string; search?: string }>
}) {
  const searchParams = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }

  // Fetch data in parallel
  const [ticketsResponse, teamsResponse, agentsResponse] = await Promise.all([
    supabase
      .from("tickets")
      .select(
        `
        *,
        assigned_to:profiles!tickets_assigned_to_fkey(*),
        created_by:profiles!tickets_created_by_fkey(*),
        customer_id:profiles!tickets_customer_id_fkey(*),
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

  // Add error logging
  if (ticketsResponse.error) {
    console.error("Error fetching tickets:", ticketsResponse.error)
  }
  if (teamsResponse.error) {
    console.error("Error fetching teams:", teamsResponse.error)
  }
  if (agentsResponse.error) {
    console.error("Error fetching agents:", agentsResponse.error)
  }

  // Log the full response for debugging
  console.log("Tickets Response:", ticketsResponse)
  console.log("Teams Response:", teamsResponse)
  console.log("Agents Response:", agentsResponse)

  return (
    <TicketsListView
      tickets={ticketsResponse.data || []}
      teams={teamsResponse.data || []}
      agents={agentsResponse.data || []}
      userId={user.id}
      searchParams={searchParams}
    />
  )
}
