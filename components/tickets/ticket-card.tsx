"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Tables = Database["public"]["Tables"]

type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
}

interface TicketCardProps {
  ticket: Ticket
}

function getStatusVariant(status: string) {
  switch (status) {
    case "new":
      return "default"
    case "in_progress":
      return "secondary"
    case "resolved":
      return "outline"
    case "closed":
      return "destructive"
    default:
      return "default"
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  const router = useRouter()

  async function deleteTicket() {
    const supabase = createClient()
    const { error } = await supabase
      .from("tickets")
      .delete()
      .match({ id: ticket.id })

    if (!error) {
      router.refresh()
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <Link
            href={`/tickets/${ticket.id}`}
            className="text-lg font-semibold hover:underline"
          >
            {ticket.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {ticket.created_at
              ? formatDistanceToNow(new Date(ticket.created_at))
              : ""}{" "}
            ago
          </p>
        </div>
        <Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {ticket.description}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {ticket.assigned_to ? (
            <span>Assigned to {ticket.assigned_to.full_name}</span>
          ) : (
            <span>Unassigned</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/tickets/${ticket.id}`)}
          >
            View Details
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteTicket}>
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
