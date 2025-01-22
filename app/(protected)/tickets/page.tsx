"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { TicketList } from "@/components/tickets/ticket-list"
import { CreateTicketButton } from "@/components/tickets/create-ticket-button"
import type { Database } from "@/types/supabase"
import { redirect } from "next/navigation"

type Tables = Database["public"]["Tables"]
type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  created_by: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets")
      const json = await response.json()
      console.log("API Response:", json)

      if (json.success) {
        setTickets(json.data)
      } else {
        console.error("Error fetching tickets:", json.error)
      }
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        redirect("/sign-in")
      }
    }

    // Initial fetch
    const init = async () => {
      await checkUser()
      await fetchTickets()
    }

    init()

    // Set up real-time subscription
    const channel = supabase
      .channel("tickets-channel")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "tickets",
        },
        (payload) => {
          // Refetch tickets when any change occurs
          fetchTickets()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <CreateTicketButton />
      </div>
      <TicketList tickets={tickets} />
    </div>
  )
}
