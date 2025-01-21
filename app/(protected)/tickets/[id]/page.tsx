import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import { UpdateTicketButton } from "@/components/tickets/update-ticket-button"
import { AssignTicketButton } from "@/components/tickets/assign-ticket-button"
import { TicketComments } from "@/components/tickets/ticket-comments"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from("tickets")
    .select("*, assigned_to(*), team_id(*)")
    .eq("id", id)
    .single()

  if (!ticket) {
    notFound()
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{ticket.title}</h1>
        <p className="text-muted-foreground">{ticket.description}</p>
      </div>

      <div className="mb-6 flex gap-2">
        <UpdateTicketButton ticket={ticket} />
        <AssignTicketButton ticket={ticket} />
      </div>

      <TicketComments ticketId={ticket.id} />
    </div>
  )
}
