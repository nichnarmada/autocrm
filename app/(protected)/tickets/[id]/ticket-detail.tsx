"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
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
import { CommentSection } from "./comment-section"
import type {
  Ticket,
  UpdateTicketInput,
  TicketStatus,
  TicketPriority,
} from "@/types/tickets"

interface TicketDetailProps {
  ticket: Ticket
  userId: string
}

export function TicketDetail({
  ticket: initialTicket,
  userId,
}: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const supabase = createClient()

  const updateTicket = async (update: Partial<UpdateTicketInput>) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}`, {
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
    // Set up real-time subscription
    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          setTicket((current) => ({ ...current, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticket.id])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
        <div className="flex items-center gap-2">
          <Select
            value={ticket.status}
            onValueChange={(value) =>
              updateTicket({
                status: value as TicketStatus,
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
                priority: value as TicketPriority,
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

      <div className="mb-4 flex-grow overflow-auto">
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
                  <span className="text-muted-foreground">
                    No team assigned
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="h-[40vh]">
        <CommentSection ticketId={ticket.id} />
      </div>
    </div>
  )
}
