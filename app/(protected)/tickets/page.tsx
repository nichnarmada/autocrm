import { createClient } from "@/utils/supabase/server"
import { TicketList } from "@/components/tickets/ticket-list"
import { CreateTicketButton } from "@/components/tickets/create-ticket-button"

export default async function TicketsPage() {
  const supabase = await createClient()

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*, assigned_to(*), team_id(*)")
    .order("created_at", { ascending: false })

  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <CreateTicketButton />
      </div>
      <TicketList tickets={tickets || []} />
    </div>
  )
}
