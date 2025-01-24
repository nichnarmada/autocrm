import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type TeamMember = Database["public"]["Tables"]["team_members"]["Row"]

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

    // Get all users except current team members
    const { data: users, error } = await supabase
      .from("profiles")
      .select()
      .not("id", "in", `(${existingUserIds.join(",")})`)
      .order("full_name")

    if (error) {
      console.error("[GET /api/teams/members] Error:", error)
      return NextResponse.json(
        { error: "Failed to fetch available users" },
        { status: 500 }
      )
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("[GET /api/teams/members] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { teamId, userId } = await request.json()

    // Validate required fields
    if (!teamId || !userId) {
      return NextResponse.json(
        { error: "Team ID and User ID are required" },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select()
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this team" },
        { status: 400 }
      )
    }

    // Add member to team
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: userId,
      })
      .select(
        `
        *,
        profiles!team_members_user_id_fkey (
          id,
          email,
          full_name,
          avatar_url,
          role
        )
      `
      )
      .single()

    if (memberError) {
      console.error("[POST /api/teams/members] Error:", memberError)
      return NextResponse.json(
        { error: "Failed to add team member" },
        { status: 500 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error("[POST /api/teams/members] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")
    const userId = searchParams.get("userId")

    if (!teamId || !userId) {
      return NextResponse.json(
        { error: "Team ID and User ID are required" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId)

    if (error) {
      console.error("[DELETE /api/teams/members] Error:", error)
      return NextResponse.json(
        { error: "Failed to remove team member" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/teams/members] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
