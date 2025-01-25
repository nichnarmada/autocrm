"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Ticket } from "@/types/tickets"

interface UpdateTicketDialogProps {
  ticket: Ticket
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateTicketDialog({
  ticket,
  open,
  onOpenChange,
}: UpdateTicketDialogProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function updateStatus(status: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from("tickets")
      .update({ status })
      .match({ id: ticket.id })

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update ticket status",
      })
      return
    }

    toast({
      title: "Success",
      description: "Ticket status updated successfully",
    })

    // Close dialog first
    onOpenChange(false)

    // Then refresh after a small delay
    setTimeout(() => {
      router.refresh()
    }, 100)
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Add a small delay before closing to prevent row click
      setTimeout(() => {
        onOpenChange(false)
      }, 100)
    } else {
      onOpenChange(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
        </DialogHeader>
        <Select onValueChange={updateStatus} defaultValue={ticket.status}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </DialogContent>
    </Dialog>
  )
}
