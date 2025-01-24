import { TeamMember } from "@/types/teams"
import { Profile } from "@/types/users"

export interface PendingChange {
  type: "add" | "remove"
  userId: string
  fromTeamId: string | null
  member: Profile | (TeamMember & { profiles: Profile })
}

export async function fetchTeams() {
  const response = await fetch("/api/teams")
  const data = await response.json()

  if (!response.ok) {
    console.error("[TeamsAPI] Error fetching teams:", data.error)
    throw new Error(data.error)
  }

  return data
}

export async function fetchAvailableMembers(teamId: string) {
  const response = await fetch(`/api/teams/members/available?teamId=${teamId}`)
  const data = await response.json()

  if (!response.ok) {
    console.error("[TeamsAPI] Error fetching available members:", data.error)
    throw new Error(data.error)
  }

  return data
}

export async function createTeam(data: { name: string; description: string }) {
  const response = await fetch("/api/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  const responseData = await response.json()
  if (!response.ok) throw new Error(responseData.error)

  return responseData
}

export async function updateTeam(
  teamId: string,
  data: { name: string; description: string }
) {
  const response = await fetch(`/api/teams`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: teamId, ...data }),
  })

  const responseData = await response.json()
  if (!response.ok) throw new Error(responseData.error)

  return responseData
}

export async function deleteTeam(teamId: string) {
  const response = await fetch(`/api/teams?id=${teamId}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error)
  }
}

export async function removeMember(teamId: string, userId: string) {
  const response = await fetch(
    `/api/teams/members?teamId=${teamId}&userId=${userId}`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || "Failed to remove team member")
  }
}

export async function updateMembers(teamId: string, changes: PendingChange[]) {
  // Process all changes sequentially
  for (const change of changes) {
    if (change.type === "add") {
      // Remove from previous team if needed
      if (change.fromTeamId) {
        await removeMember(change.fromTeamId, change.userId)
      }

      // Add to current team
      const response = await fetch("/api/teams/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId,
          userId: change.userId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update team members")
      }
    } else {
      await removeMember(teamId, change.userId)
    }
  }
}
