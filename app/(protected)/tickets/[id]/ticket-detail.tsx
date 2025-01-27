"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CommentSection } from "./comment-section"
import { EditTicketDialog } from "@/components/tickets/edit-ticket-dialog"
import { Pencil, Plus } from "lucide-react"
import type { Ticket, TicketAttachment } from "@/types/tickets"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"
import { Separator } from "@/components/ui/separator"
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
import { useToast } from "@/hooks/use-toast"
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog"
import { TicketAttachmentsDialog } from "@/components/tickets/ticket-attachments-dialog"
import { AttachmentPreview } from "@/components/attachments/attachment-preview"

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
  const [deleteAttachment, setDeleteAttachment] =
    useState<TicketAttachment | null>(null)
  const [previewAttachment, setPreviewAttachment] =
    useState<TicketAttachment | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>(
    {}
  )
  const [isAttachmentsDialogOpen, setIsAttachmentsDialogOpen] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_attachments",
          filter: `ticket_id=eq.${ticket.id}`,
        },
        async (payload) => {
          // Fetch the complete attachment data with relations
          if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("ticket_attachments")
              .select(
                `
                *,
                uploaded_by:profiles!ticket_attachments_uploaded_by_fkey(
                  id,
                  full_name,
                  email,
                  avatar_url
                )
              `
              )
              .eq("id", payload.new.id)
              .single()

            if (data) {
              setTicket((current) => ({
                ...current,
                ticket_attachments: [
                  ...(current.ticket_attachments || []),
                  data,
                ],
              }))
            }
          } else if (payload.eventType === "DELETE") {
            setTicket((current) => ({
              ...current,
              ticket_attachments: current.ticket_attachments?.filter(
                (a) => a.id !== payload.old.id
              ),
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticket.id])

  // Fetch signed URLs for image attachments
  useEffect(() => {
    async function fetchSignedUrls() {
      const imageAttachments =
        ticket.ticket_attachments?.filter((a) =>
          a.file_type.startsWith("image/")
        ) || []

      const urls: Record<string, string> = {}

      for (const attachment of imageAttachments) {
        try {
          // Get signed URL directly from Supabase
          const { data: signedUrl, error } = await supabase.storage
            .from("ticket-attachments")
            .createSignedUrl(attachment.storage_path, 60) // URL valid for 60 seconds

          if (error) throw error
          if (signedUrl) {
            urls[attachment.id] = signedUrl.signedUrl
          }
        } catch (error) {
          console.error("Error fetching signed URL:", error)
        }
      }

      setAttachmentUrls(urls)
    }

    fetchSignedUrls()
  }, [ticket.ticket_attachments])

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      // Get signed URL directly from Supabase
      const { data: signedUrl, error } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(attachment.storage_path, 60)

      if (error) throw error
      if (!signedUrl) throw new Error("Failed to generate download URL")

      // Create a link and click it to start the download
      const link = document.createElement("a")
      link.href = signedUrl.signedUrl
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to download file",
      })
    }
  }

  const handleDeleteAttachment = async (attachment: TicketAttachment) => {
    try {
      const response = await fetch(
        `/api/tickets/${ticket.id}/attachments/${attachment.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete attachment")
      }

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete attachment",
      })
    } finally {
      setDeleteAttachment(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
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

          {/* Attachments Section */}
          {ticket.ticket_attachments &&
            ticket.ticket_attachments.length > 0 && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Attachments</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => setIsAttachmentsDialogOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attachment
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {ticket.ticket_attachments.map((attachment) => (
                      <AttachmentPreview
                        key={attachment.id}
                        id={attachment.id}
                        fileName={attachment.file_name}
                        fileType={attachment.file_type}
                        fileSize={attachment.file_size}
                        storagePath={attachment.storage_path}
                        previewUrl={attachmentUrls[attachment.id]}
                        canDelete={
                          userId === attachment.uploaded_by?.id ||
                          userId === ticket.assigned_to?.id ||
                          userId === ticket.created_by?.id
                        }
                        onDelete={() => setDeleteAttachment(attachment)}
                        onDownload={() => handleDownload(attachment)}
                        onPreview={() => setPreviewAttachment(attachment)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
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

      <AlertDialog
        open={deleteAttachment !== null}
        onOpenChange={(open) => !open && setDeleteAttachment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteAttachment && handleDeleteAttachment(deleteAttachment)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImagePreviewDialog
        open={previewAttachment !== null}
        onOpenChange={(open) => !open && setPreviewAttachment(null)}
        imageUrl={
          previewAttachment ? attachmentUrls[previewAttachment.id] : undefined
        }
        alt={previewAttachment?.file_name}
      />

      <TicketAttachmentsDialog
        ticketId={ticket.id}
        open={isAttachmentsDialogOpen}
        onOpenChange={setIsAttachmentsDialogOpen}
        userId={userId}
        assignedToId={ticket.assigned_to?.id}
        createdById={ticket.created_by?.id}
      />
    </div>
  )
}
