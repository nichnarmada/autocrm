import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { TicketsListView } from "./tickets-list-view"
import { TicketListSkeleton } from "./ticket-list-skeleton"
import { Suspense } from "react"

interface SearchParams {
  view?: string
  tab?: string
  search?: string
}

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function TicketsPage({ searchParams }: PageProps) {
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
        <TicketsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function TicketsContent({
  searchParams: params,
}: {
  searchParams: Promise<SearchParams>
}) {
  const searchParams = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }

  // Build query based on view
  let query = supabase.from("tickets").select(
    `
      *,
      assigned_to:profiles!tickets_assigned_to_fkey(*),
      created_by:profiles!tickets_created_by_fkey(*),
      customer_id:profiles!tickets_customer_id_fkey(*),
      team_id:teams(*)
    `
  )

  // Apply view filters at the database level
  if (searchParams.view) {
    switch (searchParams.view) {
      case "unassigned":
        query = query.is("assigned_to", null)
        break
      case "ongoing":
        query = query.in("status", ["open", "in_progress"])
        break
      case "completed":
        query = query.in("status", ["resolved", "closed"])
        break
      // "all" view doesn't need additional filters
    }
  }

  // Add final ordering
  query = query.order("created_at", { ascending: false })

  // Fetch data in parallel
  const [ticketsResponse, teamsResponse, agentsResponse] = await Promise.all([
    query,
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
