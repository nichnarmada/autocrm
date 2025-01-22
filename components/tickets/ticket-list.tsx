import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { TicketEditForm } from "./ticket-edit-form"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]

type Ticket = Tables["tickets"]["Row"] & {
  assigned_to: Tables["profiles"]["Row"] | null
  created_by: Tables["profiles"]["Row"] | null
  customer_id: Tables["profiles"]["Row"] | null
  team_id: Tables["teams"]["Row"] | null
}

interface TicketListProps {
  tickets: Ticket[]
  teams: Tables["teams"]["Row"][]
  agents: Tables["profiles"]["Row"][]
}

export function TicketList({ tickets, teams, agents }: TicketListProps) {
  const router = useRouter()
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const [ticketToEdit, setTicketToEdit] = useState<Ticket | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (ticket: Ticket) => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
      })
      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error.message)
      }

      // Refresh the page to show updated list
      router.refresh()
    } catch (error) {
      console.error("Error deleting ticket:", error)
    } finally {
      setIsDeleting(false)
      setTicketToDelete(null)
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => {
                // Don't navigate if clicking the dropdown menu
                if ((e.target as HTMLElement).closest(".dropdown-trigger")) {
                  e.stopPropagation()
                  return
                }
                router.push(`/tickets/${ticket.id}`)
              }}
            >
              <TableCell className="font-medium">
                #{ticket.id.split("-")[0]}
              </TableCell>
              <TableCell>{ticket.title}</TableCell>
              <TableCell>
                <Badge
                  variant={ticket.status === "new" ? "default" : "secondary"}
                >
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                {ticket.assigned_to?.full_name || (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {ticket.team_id?.name || (
                  <span className="text-muted-foreground">No team</span>
                )}
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell className="text-muted-foreground">
                {ticket.created_at &&
                  new Date(ticket.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="dropdown-trigger h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setTicketToEdit(ticket)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTicketToDelete(ticket)
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={ticketToDelete !== null}
        onOpenChange={(open) => !open && setTicketToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the ticket &quot;
              {ticketToDelete?.title}&quot; and all its associated data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => ticketToDelete && handleDelete(ticketToDelete)}
            >
              {isDeleting ? "Deleting..." : "Delete Ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ticketToEdit && (
        <TicketEditForm
          ticket={ticketToEdit}
          teams={teams}
          agents={agents}
          open={ticketToEdit !== null}
          onOpenChange={(open) => !open && setTicketToEdit(null)}
        />
      )}
    </>
  )
}
