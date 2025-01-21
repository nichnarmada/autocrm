import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const origin = requestUrl.origin
  const next = requestUrl.searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    // If this is from an invite link, redirect to setup profile
    if (
      user?.user_metadata?.role === "agent" &&
      !user?.user_metadata?.full_name
    ) {
      return NextResponse.redirect(`${origin}/setup-profile`)
    }
  }

  // If there's a next parameter, redirect there
  if (next) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Default redirect
  return NextResponse.redirect(`${origin}/dashboard`)
}
