"use client"

import { useEffect, useState } from "react"
import type { Database } from "@/types/supabase"
import { Button } from "@/components/ui/button"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { EditTeamDialog } from "@/components/teams/edit-team-dialog"
import { Trash2 } from "lucide-react"
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

type Tables = Database["public"]["Tables"]
export type Team = Tables["teams"]["Row"] & {
  team_members: Tables["team_members"]["Row"][]
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      const data = await response.json()

      if (!response.ok) throw new Error(data.error)
      setTeams(data)
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <CreateTeamDialog onSuccess={fetchTeams} />
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-3 pl-4 pr-3 text-left text-sm font-medium">
                Name
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">
                Members
              </th>
              <th className="px-3 py-3 text-left text-sm font-medium">
                Created At
              </th>
              <th className="relative py-3 pl-3 pr-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-b">
                <td className="py-4 pl-4 pr-3">
                  <div className="font-medium">{team.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {team.description}
                  </div>
                </td>
                <td className="px-3 py-4">
                  {team.team_members?.length || 0} members
                </td>
                <td className="px-3 py-4 text-sm">
                  {new Date(team.created_at!).toLocaleDateString()}
                </td>
                <td className="py-4 pl-3 pr-4 text-right">
                  <div className="flex justify-end gap-2">
                    <EditTeamDialog team={team} onSuccess={fetchTeams} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/teams?id=${team.id}`,
                                  {
                                    method: "DELETE",
                                  }
                                )

                                if (!response.ok) {
                                  const data = await response.json()
                                  throw new Error(data.error)
                                }

                                fetchTeams()
                              } catch (error) {
                                console.error("Error deleting team:", error)
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
