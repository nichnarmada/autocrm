"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CommentSection } from "./comment-section"
import { EditTicketDialog } from "@/components/tickets/edit-ticket-dialog"
import { Pencil } from "lucide-react"
import type { Ticket } from "@/types/tickets"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"
import { Separator } from "@/components/ui/separator"

interface TicketDetailProps {
  ticket: Ticket
  userId: string
}

export function TicketDetail({
  ticket: initialTicket,
  userId,
}: TicketDetailProps) {
  const [ticket, setTicket] = useState(initialTicket)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [agents, setAgents] = useState<Profile[]>([])
  const supabase = createClient()

  // Fetch teams and agents for the edit dialog
  useEffect(() => {
    async function fetchTeamsAndAgents() {
      const [teamsResponse, agentsResponse] = await Promise.all([
        supabase.from("teams").select("*"),
        supabase
          .from("profiles")
          .select("*")
          .in("role", ["admin", "agent"])
          .order("full_name"),
      ])

      if (teamsResponse.data) {
        setTeams(teamsResponse.data)
      }
      if (agentsResponse.data) {
        setAgents(agentsResponse.data)
      }
    }

    fetchTeamsAndAgents()
  }, [])

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
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left Column - Ticket Details */}
      <div className="flex w-2/3 flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground">Ticket #{ticket.id}</p>
          </div>
          <Button
            size="sm"
            className="h-8 px-2"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Created by {ticket.created_by?.full_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {ticket.created_at &&
                    new Date(ticket.created_at).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p>{ticket.description}</p>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <CommentSection ticketId={ticket.id} />
      </div>

      {/* Right Column - Metadata & Actions */}
      <div className="w-1/3 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="mb-2 font-medium">Assignment</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Assigned To
                  </div>
                  <div className="mt-1">
                    {ticket.assigned_to ? (
                      ticket.assigned_to.full_name
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Team</div>
                  <div className="mt-1">
                    {ticket.team_id ? (
                      ticket.team_id.name
                    ) : (
                      <span className="text-muted-foreground">
                        No team assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-medium">Category</h3>
              <Badge variant="outline">{ticket.category}</Badge>
            </div>

            <Separator />

            <div>
              <h3 className="mb-2 font-medium">Customer</h3>
              <div className="space-y-1">
                <div>{ticket.customer_id?.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {ticket.customer_id?.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EditTicketDialog
        ticket={ticket}
        teams={teams}
        agents={agents}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  )
}
