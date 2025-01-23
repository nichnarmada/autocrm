"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserPlus, Trash2 } from "lucide-react"
import type { Database } from "@/types/supabase"

type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]

interface TeamMembersProps {
  teamId: string
  members: TeamMember[]
}

export function TeamMembers({ teamId, members }: TeamMembersProps) {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Team Members ({members.length})</h4>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
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
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div>
                    <p className="text-sm font-medium">{member.user_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
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
