"use client"

import { useState } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { CreateTicketForm } from "./create-ticket-form"
import { createClient } from "@/utils/supabase/client"
import { useEffect } from "react"
import { createTicket } from "@/app/(protected)/tickets/api"
import { Team } from "@/types/teams"

export function CreateTicketButton() {
  const [open, setOpen] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    async function loadTeams() {
      const supabase = createClient()
      const { data } = await supabase.from("teams").select("*").order("name")

      if (data) {
        setTeams(data)
      }
    }

    loadTeams()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Ticket</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new support ticket. All fields
            marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <CreateTicketForm
          teams={teams}
          onSuccess={() => setOpen(false)}
          onSubmit={createTicket}
        />
      </DialogContent>
    </Dialog>
  )
}
