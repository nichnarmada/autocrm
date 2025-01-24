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

    // Get current team members
    const { data: currentMembers } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", teamId)

    const existingUserIds =
      currentMembers?.map((member) => member.user_id) || []

    // Get all agents except current team members
    const { data: users, error } = await supabase
      .from("profiles")
      .select()
      .eq("role", "agent") // Only get agents
      .not(
        "id",
        "in",
        existingUserIds.length > 0 ? `(${existingUserIds.join(",")})` : "(null)"
      )
      .order("full_name")

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
