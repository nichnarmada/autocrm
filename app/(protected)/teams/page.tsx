"use client"

import { useEffect, useState } from "react"
import type { Database } from "@/types/supabase"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { TeamsTable } from "@/components/teams/teams-table"
import { LayoutGrid, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Tables = Database["public"]["Tables"]
export type Team = Tables["teams"]["Row"] & {
  team_members: Tables["team_members"]["Row"][]
}

type ViewMode = "list" | "board"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      const data = await response.json()

      if (!response.ok) {
        console.error("[TeamsPage] Error fetching teams:", data.error)
        throw new Error(data.error)
      }

      setTeams(data)
    } catch (error) {
      console.error("[TeamsPage] Error fetching teams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams?id=${teamId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        console.error("[TeamsPage] Error deleting team:", data.error)
        throw new Error(data.error)
      }

      await fetchTeams()
    } catch (error) {
      console.error("[TeamsPage] Error deleting team:", error)
    }
  }

  useEffect(() => {
    fetchTeams()
    return () => {}
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teams</h1>
        <div className="flex items-center gap-4">
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as ViewMode)
            }}
          >
            <TabsList>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="board">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Board
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <CreateTeamDialog
            onSuccess={async () => {
              await fetchTeams()
            }}
          />
        </div>
      </div>

      {viewMode === "list" ? (
        <TeamsTable
          teams={teams}
          onDeleteTeam={handleDeleteTeam}
          onTeamUpdate={async () => {
            await fetchTeams()
          }}
        />
      ) : (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Board view with drag and drop coming soon...
          </p>
        </div>
      )}
    </div>
  )
}
