"use client"

import { useRouter } from "next/navigation"
import { CreateTicketForm } from "@/components/tickets/create-ticket-form"
import { createTicket } from "@/app/(protected)/tickets/api"
import type { Team } from "@/types/teams"

interface CreateTicketViewProps {
  teams: Team[]
}

export function CreateTicketView({ teams }: CreateTicketViewProps) {
  const router = useRouter()

  const handleSuccess = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`)
  }

  return (
    <div className="space-y-6">
      <CreateTicketForm
        teams={teams}
        onSuccess={handleSuccess}
        onSubmit={createTicket}
      />
    </div>
  )
}
