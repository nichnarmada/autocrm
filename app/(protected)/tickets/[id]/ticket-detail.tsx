"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  created_by: Tables["profiles"]["Row"] | null
  customer_id: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
  ticket_comments: (Tables["ticket_comments"]["Row"] & {
    user_id: Tables["profiles"]["Row"] | null
  })[]
}

interface TicketDetailProps {
  id: string
}

export function TicketDetail({ id }: TicketDetailProps) {
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${id}`)
      const json = await response.json()

      if (json.success) {
        setTicket(json.data)
      } else {
        console.error("[Frontend] Error fetching ticket:", json.error)
      }
    } catch (error) {
      console.error("[Frontend] Error fetching ticket:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateTicket = async (update: Partial<Tables["tickets"]["Update"]>) => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(update),
      })
      const json = await response.json()

      if (json.success) {
        setTicket(json.data)
      } else {
        console.error("Error updating ticket:", json.error)
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }

  useEffect(() => {
    fetchTicket()

    // Set up real-time subscription
    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${id}`,
        },
        () => {
          fetchTicket()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-full max-w-sm" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!ticket) {
    return <div>Ticket not found</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ticket Details</h1>
        <div className="flex items-center gap-2">
          <Select
            value={ticket.status}
            onValueChange={(value) =>
              updateTicket({
                status: value as Tables["tickets"]["Row"]["status"],
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={ticket.priority}
            onValueChange={(value) =>
              updateTicket({
                priority: value as Tables["tickets"]["Row"]["priority"],
              })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>
                Created by {ticket.created_by?.full_name} •{" "}
                {ticket.created_at &&
                  new Date(ticket.created_at).toLocaleString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={ticket.status === "new" ? "default" : "secondary"}
              >
                {ticket.status}
              </Badge>
              <Badge
                variant={
                  ticket.priority === "urgent"
                    ? "destructive"
                    : ticket.priority === "high"
                      ? "default"
                      : "secondary"
                }
              >
                {ticket.priority}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose dark:prose-invert">
            <p>{ticket.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Assigned To</div>
            <div>
              {ticket.assigned_to ? (
                ticket.assigned_to.full_name
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm text-muted-foreground">Team</div>
            <div>
              {ticket.team_id ? (
                ticket.team_id.name
              ) : (
                <span className="text-muted-foreground">No team assigned</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Add Comment</Button>
        </CardFooter>
      </Card>

      {/* Comments section will go here */}
    </div>
  )
}
