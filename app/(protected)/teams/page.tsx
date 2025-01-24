"use client"

import { useEffect, useState } from "react"
import { CreateTeamDialog } from "@/components/teams/create-team-dialog"
import { TeamsTable } from "@/components/teams/teams-table"
import { LayoutGrid, List } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamsSkeletonLoading } from "./skeleton-loading"
import type { Team, PendingChange, ViewMode } from "@/types/teams"
import {
  fetchTeams,
  fetchAvailableMembers,
  createTeam,
  updateTeam,
  deleteTeam,
  removeMember,
  updateMembers,
} from "./api"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("list")

  const refreshData = async () => {
    try {
      const teamsData = await fetchTeams()
      setTeams(teamsData)
    } catch (error) {
      console.error("[TeamsPage] Error refreshing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTeam = async (data: {
    name: string
    description: string
  }) => {
    await createTeam(data)
    await refreshData()
  }

  const handleUpdateTeam = async (
    teamId: string,
    data: { name: string; description: string }
  ) => {
    await updateTeam(teamId, data)
    await refreshData()
  }

  const handleRemoveMember = async (teamId: string, userId: string) => {
    await removeMember(teamId, userId)
    await refreshData()
  }

  const handleUpdateMembers = async (
    teamId: string,
    changes: PendingChange[]
  ) => {
    try {
      await updateMembers(teamId, changes)
      await refreshData()
    } catch (error) {
      console.error("[TeamsPage] Error updating members:", error)
      throw error
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId)
      await refreshData()
    } catch (error) {
      console.error("[TeamsPage] Error deleting team:", error)
    }
  }

  useEffect(() => {
    refreshData()
    return () => {}
  }, [])

  if (isLoading) {
    return <TeamsSkeletonLoading />
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
            onCreateTeam={handleCreateTeam}
            onSuccess={refreshData}
          />
        </div>
      </div>

      {viewMode === "list" ? (
        <TeamsTable
          teams={teams}
          setTeams={setTeams}
          onDeleteTeam={handleDeleteTeam}
          onTeamUpdate={refreshData}
          onUpdateMembers={handleUpdateMembers}
          onUpdateTeam={handleUpdateTeam}
          onRemoveMember={handleRemoveMember}
          fetchAvailableMembers={fetchAvailableMembers}
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
