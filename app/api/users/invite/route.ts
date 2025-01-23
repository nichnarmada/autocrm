import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    // Verify the current user has permission to invite (must be an admin or agent)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user's role
    const { data: inviterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (
      profileError ||
      !inviterProfile ||
      !["admin", "agent"].includes(inviterProfile.role)
    ) {
      return NextResponse.json(
        { error: "Only admins and agents can invite new agents" },
        { status: 403 }
      )
    }

    // Get invite details from request
    const json = await request.json()
    const { email, teamId } = json

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create service role client for admin operations
    const adminAuthClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Send invitation with metadata - set role as agent
    const { data, error } = await adminAuthClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          invited_by: user.id,
          is_invited: true,
          temp_display_name: email.split("@")[0],
          ...(teamId ? { team_id: teamId } : {}),
        },
      }
    )

    if (error) {
      console.error("Error sending invite:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If teamId is provided, create a pending team member record
    if (teamId && data?.user) {
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: data.user.id,
          role: "agent",
          status: "pending",
        })

      if (memberError) {
        console.error("Error creating team member:", memberError)
        // Don't return error here, as the invite was successful
        // Just log the error and continue
      }
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      data: {
        user: data.user,
        teamId: teamId || null,
      },
    })
  } catch (error) {
    console.error("Error in invite API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
