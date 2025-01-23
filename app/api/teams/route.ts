import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { Database } from "@/types/supabase"

type Team = Database["public"]["Tables"]["teams"]["Row"]
type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"]
type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"]

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: teams, error } = await supabase
      .from("teams")
      .select(
        `
        id,
        name,
        description,
        created_at,
        updated_at,
        team_members (
          id,
          user_id,
          team_id,
          role,
          created_at,
          updated_at
        )
      `
      )
      .order("name")

    if (error) {
      console.error("[GET /api/teams] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(teams)
  } catch (error) {
    console.error("[GET /api/teams] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const json = await request.json()

    // Debug: Check user's profile and role
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single()

    if (profileError) {
      console.error("[POST /api/teams] Error fetching profile:", profileError)
    }

    const teamData: TeamInsert = {
      name: json.name,
      description: json.description,
    }

    const { data, error } = await supabase
      .from("teams")
      .insert([teamData])
      .select()
      .single()

    if (error) {
      console.error("[POST /api/teams] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[POST /api/teams] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const json = await request.json()

    const { id, name, description } = json
    const updateData: TeamUpdate = {
      name,
      description,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("teams")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[PUT /api/teams] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[PUT /api/teams] Server error:", error)
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
    const id = searchParams.get("id")

    if (!id) {
      console.error("[DELETE /api/teams] Error: No team ID provided")
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      )
    }

    const { error } = await supabase.from("teams").delete().eq("id", id)

    if (error) {
      console.error("[DELETE /api/teams] Error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/teams] Server error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
