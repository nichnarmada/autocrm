"use client"

import { Row } from "@tanstack/react-table"
import { Maximize2, Pencil, Trash, Paperclip } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { EditTicketDialog } from "@/components/tickets/edit-ticket-dialog"
import { TicketAttachmentsDialog } from "@/components/tickets/ticket-attachments-dialog"
import { deleteTicket } from "./api"
import type { Ticket } from "@/types/tickets"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataTableRowActionsProps {
  row: Row<Ticket>
  teams: Team[]
  agents: Profile[]
  userId: string
}

export function DataTableRowActions({
  row,
  teams,
  agents,
  userId,
}: DataTableRowActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const ticket = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAttachmentsDialog, setShowAttachmentsDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasAttachments, setHasAttachments] = useState(false)
  const supabase = createClient()

  // Check if ticket has attachments
  useEffect(() => {
    async function checkAttachments() {
      const { count, error } = await supabase
        .from("ticket_attachments")
        .select("*", { count: "exact", head: true })
        .eq("ticket_id", ticket.id)

      if (error) {
        console.error("Error checking attachments:", error)
        return
      }

      setHasAttachments(count ? count > 0 : false)
    }

    checkAttachments()
  }, [ticket.id])

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteTicket(ticket.id)
      toast({
        title: "Ticket deleted",
        description: "The ticket has been permanently deleted.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error deleting ticket:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete ticket",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleView = () => {
    router.push(`/tickets/${ticket.id}`)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachmentsDialog(true)}
            className="h-8 w-8"
          >
            <Paperclip
              className={cn("h-4 w-4", hasAttachments && "text-blue-500")}
            />
            <span className="sr-only">
              {hasAttachments ? "View attachments" : "Add attachments"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {hasAttachments ? "View attachments" : "Add attachments"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleView}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
            <span className="sr-only">View ticket details</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View details</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEditDialog(true)}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit ticket</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit ticket</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash className="h-4 w-4" />
            <span className="sr-only">Delete ticket</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete ticket</TooltipContent>
      </Tooltip>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ticket and all its comments. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditTicketDialog
        ticket={ticket}
        teams={teams}
        agents={agents}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <TicketAttachmentsDialog
        ticketId={ticket.id}
        open={showAttachmentsDialog}
        onOpenChange={setShowAttachmentsDialog}
        userId={userId}
        assignedToId={ticket.assigned_to?.id}
        createdById={ticket.created_by?.id}
      />
    </div>
  )
}
