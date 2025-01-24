"use client"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import { AddMemberDialog } from "@/components/teams/add-member-dialog"
import { DeleteTeamDialog } from "@/components/teams/delete-team-dialog"
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  UserRoundPen,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TeamMembers } from "./team-members"
import { EditTeamDialog } from "./edit-team-dialog"
import type { Team } from "@/types/teams"
import type { Profile } from "@/types/users"
import { PendingChange } from "@/app/(protected)/teams/api"

interface TeamsTableProps {
  teams: Team[]
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>
  onDeleteTeam: (teamId: string) => Promise<void>
  onTeamUpdate: () => Promise<void>
  onUpdateMembers: (teamId: string, changes: PendingChange[]) => Promise<void>
  onUpdateTeam: (
    teamId: string,
    data: { name: string; description: string }
  ) => Promise<void>
  onRemoveMember: (teamId: string, userId: string) => Promise<void>
  fetchAvailableMembers: (teamId: string) => Promise<Profile[]>
}

export function TeamsTable({
  teams,
  setTeams,
  onDeleteTeam,
  onTeamUpdate,
  onUpdateMembers,
  onUpdateTeam,
  onRemoveMember,
  fetchAvailableMembers,
}: TeamsTableProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <Fragment key={team.id}>
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() =>
                        setExpandedTeam(
                          expandedTeam === team.id ? null : team.id
                        )
                      }
                    >
                      {expandedTeam === team.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    {team.name}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {team.team_members.length} members
                  </span>
                </TableCell>
                <TableCell>
                  {team.created_at
                    ? new Date(team.created_at).toLocaleDateString()
                    : "Unknown"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <AddMemberDialog
                      teamId={team.id}
                      teams={teams.filter((t) => t.id !== team.id)}
                      currentTeamMembers={team.team_members}
                      setTeams={setTeams}
                      onUpdateMembers={(changes) =>
                        onUpdateMembers(team.id, changes)
                      }
                      onSuccess={onTeamUpdate}
                      fetchAvailableMembers={fetchAvailableMembers}
                    >
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Manage team members</span>
                        <UserRoundPen className="h-4 w-4" />
                      </Button>
                    </AddMemberDialog>
                    <EditTeamDialog
                      team={team}
                      onSuccess={onTeamUpdate}
                      onUpdateTeam={onUpdateTeam}
                    >
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Edit team</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </EditTeamDialog>
                    <DeleteTeamDialog
                      teamId={team.id}
                      onConfirm={() => onDeleteTeam(team.id)}
                    >
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Delete team</span>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </DeleteTeamDialog>
                  </div>
                </TableCell>
              </TableRow>
              {expandedTeam === team.id && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <TeamMembers
                      teamId={team.id}
                      members={team.team_members}
                      onUpdate={onTeamUpdate}
                      onRemoveMember={onRemoveMember}
                    />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
