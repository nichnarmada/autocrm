"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit,
} from "lucide-react"
import { TeamMembers } from "./team-members"
import { EditTeamDialog } from "./edit-team-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Team } from "@/app/(protected)/teams/page"

interface TeamsTableProps {
  teams: Team[]
  onDeleteTeam: (teamId: string) => Promise<void>
  onTeamUpdate: () => Promise<void>
}

export function TeamsTable({
  teams,
  onDeleteTeam,
  onTeamUpdate,
}: TeamsTableProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => (
            <>
              <TableRow key={team.id}>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() =>
                      setExpandedTeam(expandedTeam === team.id ? null : team.id)
                    }
                  >
                    {expandedTeam === team.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{team.name}</p>
                    {team.description && (
                      <p className="text-sm text-muted-foreground">
                        {team.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{team.team_members?.length || 0} members</TableCell>
                <TableCell>
                  {new Date(team.created_at!).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <EditTeamDialog team={team} onSuccess={onTeamUpdate}>
                          <div className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Team
                          </div>
                        </EditTeamDialog>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <AlertDialog>
                          <AlertDialogTrigger className="w-full">
                            <div className="flex items-center text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </div>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Team</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this team? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDeleteTeam(team.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              {expandedTeam === team.id && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <TeamMembers
                      teamId={team.id}
                      members={team.team_members || []}
                    />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
