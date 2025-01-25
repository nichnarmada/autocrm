"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { UsersListView } from "./users-list-view"
import { useToast } from "@/hooks/use-toast"
import type { Profile } from "@/types/users"

interface UsersContentProps {
  initialUsers: Profile[]
}

export function UsersContent({ initialUsers }: UsersContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<Profile[]>(initialUsers)

  const inviteUser = async (email: string) => {
    try {
      const response = await fetch("/api/users/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role: "agent", // Always set role to agent
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      })

      // Refresh the page to get updated user list
      router.refresh()
    } catch (error) {
      console.error("Error inviting user:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
      })
      throw error
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <InviteUserDialog onInvite={inviteUser} />
      </div>
      <UsersListView users={users} />
    </>
  )
}
