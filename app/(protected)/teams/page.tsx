"use client"

import { useEffect, useState } from "react"
import type { Database } from "@/types/supabase"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { TeamsTable } from "@/components/teams/teams-table"
import { LayoutGrid, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

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
    return (
      <div className="container">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b">
            <div className="grid grid-cols-4 p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-4 border-b p-4 last:border-0"
            >
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-9" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
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
