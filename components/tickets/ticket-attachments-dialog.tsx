"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
import { createClient } from "@/utils/supabase/client"
import type { TicketAttachment } from "@/types/tickets"
import { useToast } from "@/hooks/use-toast"
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog"
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
import { AttachmentPreview } from "@/components/attachments/attachment-preview"

interface TicketAttachmentsDialogProps {
  ticketId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  assignedToId?: string
  createdById?: string
}

export function TicketAttachmentsDialog({
  ticketId,
  open,
  onOpenChange,
  userId,
  assignedToId,
  createdById,
}: TicketAttachmentsDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [attachments, setAttachments] = useState<TicketAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>(
    {}
  )
  const [deleteAttachment, setDeleteAttachment] =
    useState<TicketAttachment | null>(null)
  const [previewAttachment, setPreviewAttachment] =
    useState<TicketAttachment | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  // Fetch attachments when dialog opens
  useEffect(() => {
    if (open) {
      fetchAttachments()
    }
  }, [open])

  // Fetch signed URLs for image attachments
  useEffect(() => {
    async function fetchSignedUrls() {
      const imageAttachments = attachments.filter((a) =>
        a.file_type.startsWith("image/")
      )

      const urls: Record<string, string> = {}

      for (const attachment of imageAttachments) {
        try {
          const { data: signedUrl, error } = await supabase.storage
            .from("ticket-attachments")
            .createSignedUrl(attachment.storage_path, 60)

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
  }, [attachments])

  const fetchAttachments = async () => {
    const { data, error } = await supabase
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
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching attachments:", error)
      return
    }

    setAttachments(data)
  }

  const handleUpload = async () => {
    if (!selectedFiles.length) return

    setIsUploading(true)
    try {
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop()
        const filePath = `${ticketId}/${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { error: attachmentError } = await supabase
          .from("ticket_attachments")
          .insert({
            ticket_id: ticketId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            uploaded_by: userId,
          })

        if (attachmentError) throw attachmentError
      }

      toast({
        title: "Success",
        description: "Files uploaded successfully",
      })

      setSelectedFiles([])
      fetchAttachments()
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload files",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (attachment: TicketAttachment) => {
    try {
      const { data: signedUrl, error } = await supabase.storage
        .from("ticket-attachments")
        .createSignedUrl(attachment.storage_path, 60)

      if (error) throw error
      if (!signedUrl) throw new Error("Failed to generate download URL")

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
        description: "Failed to download file",
      })
    }
  }

  const handleDelete = async (attachment: TicketAttachment) => {
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/attachments/${attachment.id}`,
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

      fetchAttachments()
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

  // Function to get file preview URL
  const getFilePreview = useCallback((file: File) => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file)
    }
    return null
  }, [])

  // Cleanup preview URLs when files are removed
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        const previewUrl = getFilePreview(file)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
      })
    }
  }, [selectedFiles, getFilePreview])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Ticket Attachments</DialogTitle>
            <DialogDescription>
              View, upload, or manage attachments for this ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Existing Attachments Section */}
            {attachments.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium">Existing Attachments</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {attachments.map((attachment) => (
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
                        userId === assignedToId ||
                        userId === createdById
                      }
                      onDelete={() => setDeleteAttachment(attachment)}
                      onDownload={() => handleDownload(attachment)}
                      onPreview={() => setPreviewAttachment(attachment)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* New Attachments Section */}
            <div className="space-y-4">
              <h3 className="font-medium">Add New Attachments</h3>

              {/* File Upload Component */}
              <FileUpload
                value={selectedFiles}
                onChange={setSelectedFiles}
                maxSize={10 * 1024 * 1024}
                accept={[
                  "image/*",
                  ".pdf",
                  ".txt",
                  ".csv",
                  ".doc",
                  ".docx",
                  ".xls",
                  ".xlsx",
                ]}
                maxFiles={10}
              />

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {selectedFiles.map((file, index) => {
                      const previewUrl = file.type.startsWith("image/")
                        ? getFilePreview(file)
                        : undefined
                      return (
                        <AttachmentPreview
                          key={index}
                          id={`new-${index}`}
                          fileName={file.name}
                          fileType={file.type}
                          fileSize={file.size}
                          storagePath=""
                          previewUrl={previewUrl || undefined}
                          canDelete
                          onDelete={() => {
                            const newFiles = [...selectedFiles]
                            newFiles.splice(index, 1)
                            setSelectedFiles(newFiles)
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl)
                            }
                          }}
                          onDownload={() => {}} // No download for new files
                        />
                      )
                    })}
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? "Uploading..." : "Upload Files"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              onClick={() => deleteAttachment && handleDelete(deleteAttachment)}
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
    </>
  )
}
