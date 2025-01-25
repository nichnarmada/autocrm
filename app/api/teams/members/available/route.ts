import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      )
    }

    // Get ALL team members across all teams
    const { data: allTeamMembers } = await supabase
      .from("team_members")
      .select("user_id")

    const allMemberIds = allTeamMembers?.map((member) => member.user_id) || []

    // Get all agents who are not members of any team
    const query = supabase
      .from("profiles")
      .select()
      .eq("role", "agent") // Only get agents
      .order("full_name")

    // Only add the not-in condition if there are existing members
    if (allMemberIds.length > 0) {
      query.not("id", "in", `(${allMemberIds.join(",")})`)
    }

    const { data: users, error } = await query

    if (error) {
      console.error("[GET /api/teams/members/available] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch available users" },
        { status: 500 }
      )
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("[GET /api/teams/members/available] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
