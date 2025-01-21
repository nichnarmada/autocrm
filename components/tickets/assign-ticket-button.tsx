"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Ticket } from "@/types/tickets"

export function AssignTicketButton({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function assignTicket(userId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("tickets")
      .update({ assigned_to: userId })
      .match({ id: ticket.id })

    if (!error) {
      router.refresh()
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Assign Ticket</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
        </DialogHeader>
        <Select onValueChange={assignTicket}>
          <SelectTrigger>
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {/* We'll need to fetch agents list */}
            <SelectItem value="agent1">Agent 1</SelectItem>
            <SelectItem value="agent2">Agent 2</SelectItem>
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  )
}
