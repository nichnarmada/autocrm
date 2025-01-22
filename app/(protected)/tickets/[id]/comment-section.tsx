"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/utils/supabase/client"
import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import type { Database } from "@/types/supabase"

type Tables = Database["public"]["Tables"]
type Comment = Tables["ticket_comments"]["Row"] & {
  user: Tables["profiles"]["Row"]
}

interface CommentSectionProps {
  ticketId: string
}

export function CommentSection({ ticketId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null)
  const supabase = createClient()

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`)
      const json = await response.json()

      if (json.success) {
        setComments(json.data)
      } else {
        console.error("[Frontend] Error fetching comments:", json.error)
      }
    } catch (error) {
      console.error("[Frontend] Error fetching comments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content }),
      })
      const json = await response.json()

      if (json.success) {
        setContent("")
        await fetchComments()
      } else {
        console.error("[Frontend] Error adding comment:", json.error)
      }
    } catch (error) {
      console.error("[Frontend] Error adding comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/comments/${commentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ content: editContent }),
        }
      )
      const json = await response.json()

      if (json.success) {
        setEditingCommentId(null)
        setEditContent("")
        await fetchComments()
      } else {
        console.error("[Frontend] Error updating comment:", json.error)
      }
    } catch (error) {
      console.error("[Frontend] Error updating comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!commentToDelete) return

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}/comments/${commentToDelete.id}`,
        {
          method: "DELETE",
        }
      )
      const json = await response.json()

      if (json.success) {
        await fetchComments()
      } else {
        console.error("[Frontend] Error deleting comment:", json.error)
      }
    } catch (error) {
      console.error("[Frontend] Error deleting comment:", error)
    } finally {
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingCommentId(null)
    setEditContent("")
  }

  const openDeleteDialog = (comment: Comment) => {
    setCommentToDelete(comment)
    setDeleteDialogOpen(true)
  }

  useEffect(() => {
    fetchComments()

    // Set up real-time subscription
    const channel = supabase
      .channel(`comments-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_comments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId])

  // Get current user ID for permission checks
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
    }
    getCurrentUser()
  }, [])

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-grow flex-col">
          <ScrollArea className="mb-4 flex-grow pr-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b pb-2">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-muted-foreground">
                      {comment.user?.full_name} -{" "}
                      {new Date(comment.created_at || "").toLocaleString()}
                    </p>
                    {currentUserId === comment.user_id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEdit(comment)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openDeleteDialog(comment)}
                            className="text-destructive"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(comment.id)}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p>{comment.content}</p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="mt-auto">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add a comment..."
              className="mb-2"
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Comment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
