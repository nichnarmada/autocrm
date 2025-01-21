import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const json = await request.json()
    const { email } = json

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // First check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("role")
      .eq("email", email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Send invitation with redirect to setup profile
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: {
          role: "agent",
          invited_by: user.id,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/setup-profile`,
      },
    })

    if (error) {
      console.error("Error sending invite:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in invite API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
