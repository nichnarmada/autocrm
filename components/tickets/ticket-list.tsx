import { TicketCard } from "./ticket-card"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]

type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
}

interface TicketListProps {
  tickets: Ticket[]
}

export function TicketList({ tickets }: TicketListProps) {
  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  )
}
