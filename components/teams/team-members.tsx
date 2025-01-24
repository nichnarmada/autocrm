"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import type { TeamMember } from "@/types/teams"

interface TeamMembersProps {
  teamId: string
  members: TeamMember[]
  onUpdate?: () => Promise<void>
  onRemoveMember: (teamId: string, userId: string) => Promise<void>
}

export function TeamMembers({
  teamId,
  members,
  onUpdate,
  onRemoveMember,
}: TeamMembersProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRemoveMember = async (userId: string) => {
    try {
      setIsLoading(userId)
      await onRemoveMember(teamId, userId)
      toast({
        title: "Success",
        description: "Team member removed successfully",
      })

      if (onUpdate) {
        await onUpdate()
      }
    } catch (error) {
      console.error("[TeamMembers] Error removing member:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove team member",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Team Members ({members.length})</h4>
      </div>
      {members && members.length > 0 ? (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.profiles?.avatar_url || undefined}
                    />
                    <AvatarFallback>
                      {member.profiles?.full_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase() ||
                        member.profiles?.email?.[0].toUpperCase() ||
                        "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profiles?.full_name ||
                        member.profiles?.email ||
                        "Unknown User"}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {member.profiles?.role || "Unknown Role"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.user_id)}
                  disabled={isLoading === member.user_id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="rounded-lg border border-dashed p-4">
          <p className="text-center text-sm text-muted-foreground">
            No members in this team
          </p>
        </div>
      )}
    </div>
  )
}
