"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Minus, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Team, TeamMember } from "@/types/teams"
import type { Profile } from "@/types/users"
import { PendingChange } from "@/app/(protected)/teams/api"

interface AddMemberDialogProps {
  teamId: string
  teams: Team[]
  currentTeamMembers: TeamMember[]
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>
  onUpdateMembers: (changes: PendingChange[]) => Promise<void>
  onSuccess?: () => Promise<void>
  fetchAvailableMembers: (teamId: string) => Promise<Profile[]>
  children: React.ReactNode
}

export function AddMemberDialog({
  teamId,
  teams,
  currentTeamMembers: initialCurrentTeamMembers,
  setTeams,
  onUpdateMembers,
  onSuccess,
  fetchAvailableMembers,
  children,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unassignedUsers, setUnassignedUsers] = useState<Profile[]>([])
  const [currentTeamMembers, setCurrentTeamMembers] = useState<TeamMember[]>(
    initialCurrentTeamMembers
  )
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setPendingChanges([])
      setCurrentTeamMembers(initialCurrentTeamMembers)
    } else {
      loadAvailableMembers()
    }
  }, [open, initialCurrentTeamMembers])

  const loadAvailableMembers = async () => {
    try {
      setIsLoading(true)
      const users = await fetchAvailableMembers(teamId)
      setUnassignedUsers(users)
    } catch (error) {
      console.error("[AddMemberDialog] Error loading available members:", error)
      toast({
        title: "Error",
        description: "Failed to load available members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddMember = async (
    profile: Profile,
    fromTeamId: string | null
  ) => {
    // Remove from available members list
    setUnassignedUsers((prev) => prev.filter((u) => u.id !== profile.id))

    // Add to current members list
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      team_id: teamId,
      user_id: profile.id,
      profiles: profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setCurrentTeamMembers((prev) => [...prev, newMember])

    // Add to pending changes
    setPendingChanges((prev) => [
      ...prev,
      {
        type: "add",
        userId: profile.id,
        fromTeamId,
        member: profile,
      },
    ])
  }

  const handleRemoveMember = (member: TeamMember) => {
    // Remove from current members list
    setCurrentTeamMembers((prev) => prev.filter((m) => m.id !== member.id))

    // Add back to available members list
    setUnassignedUsers((prev) => [...prev, member.profiles])

    // Handle pending changes
    const wasPendingAddition = pendingChanges.some(
      (change) => change.type === "add" && change.userId === member.user_id
    )
    if (wasPendingAddition) {
      // Remove the pending addition
      setPendingChanges((prev) =>
        prev.filter(
          (change) =>
            !(change.type === "add" && change.userId === member.user_id)
        )
      )
    } else {
      // Add to pending changes as a removal
      setPendingChanges((prev) => [
        ...prev,
        {
          type: "remove",
          userId: member.user_id,
          fromTeamId: null,
          member,
        },
      ])
    }
  }

  const handleSave = async () => {
    try {
      setIsUpdating(true)
      await onUpdateMembers(pendingChanges)
      setOpen(false)
      toast({
        title: "Success",
        description: "Team members updated successfully",
      })
      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      console.error("[AddMemberDialog] Error updating members:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update team members",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
          <DialogDescription>
            Add or remove members from this team.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Available Members</h4>
            {isLoading ? (
              <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : unassignedUsers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {unassignedUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-2",
                        pendingChanges.some(
                          (change) => change.userId === user.id
                        )
                          ? "border-primary bg-primary/5"
                          : ""
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback>
                            {user.full_name
                              ?.split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase() ||
                              user.email?.[0].toUpperCase() ||
                              "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {user.full_name || user.email || "Unknown User"}
                          </p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {user.role || "Unknown Role"}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddMember(user, null)}
                        disabled={isUpdating}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[400px] rounded-lg border border-dashed p-4">
                <p className="text-center text-sm text-muted-foreground">
                  No available members found
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Members</h4>
            {currentTeamMembers.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {currentTeamMembers.map((member) => (
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
                        onClick={() => handleRemoveMember(member)}
                        disabled={isUpdating}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[400px] rounded-lg border border-dashed p-4">
                <p className="text-center text-sm text-muted-foreground">
                  No members in this team
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={pendingChanges.length === 0 || isUpdating}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
