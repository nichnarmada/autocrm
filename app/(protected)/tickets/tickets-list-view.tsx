"use client"

import { TicketList } from "@/components/tickets/ticket-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Suspense, useState, useEffect } from "react"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  created_by: Tables["profiles"]["Row"] | null
  customer_id: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
}

interface TicketsListViewProps {
  tickets: Ticket[]
  teams: Tables["teams"]["Row"][]
  agents: Tables["profiles"]["Row"][]
  userId: string
  searchParams: { tab?: string; search?: string }
}

export function TicketsListView({
  tickets: initialTickets,
  teams,
  agents,
  userId,
  searchParams,
}: TicketsListViewProps) {
  const [filteredTickets, setFilteredTickets] = useState(initialTickets)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter tickets based on search and tab
  useEffect(() => {
    let filtered = initialTickets

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ticket.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply tab filter
    switch (searchParams.tab) {
      case "assigned":
        filtered = filtered.filter(
          (ticket) => ticket.assigned_to?.id === userId
        )
        break
      case "unassigned":
        filtered = filtered.filter((ticket) => !ticket.assigned_to)
        break
      case "closed":
        filtered = filtered.filter((ticket) => ticket.status === "closed")
        break
      default:
        filtered = filtered.filter((ticket) => ticket.status !== "closed")
    }

    setFilteredTickets(filtered)
  }, [initialTickets, searchQuery, searchParams, userId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to me</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            <Input
              placeholder="Search tickets..."
              className="w-64"
              name="search"
              defaultValue={searchParams.search}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <TabsContent value="all" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <TicketList
                tickets={filteredTickets}
                teams={teams}
                agents={agents}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="assigned" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <TicketList
                tickets={filteredTickets}
                teams={teams}
                agents={agents}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="unassigned" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <TicketList
                tickets={filteredTickets}
                teams={teams}
                agents={agents}
              />
            </Suspense>
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <Suspense fallback={<div>Loading...</div>}>
              <TicketList
                tickets={filteredTickets}
                teams={teams}
                agents={agents}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
