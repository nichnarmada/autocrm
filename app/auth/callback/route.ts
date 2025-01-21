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

  console.log("Auth Callback - URL:", requestUrl.toString())
  console.log("Auth Callback - Has code:", !!code)

  if (code) {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code)

    console.log("Auth Callback - User:", user)
    console.log("Auth Callback - Error:", error)

    // If this is from an invite link, redirect to setup profile
    if (
      user?.user_metadata?.role === "agent" &&
      !user?.user_metadata?.full_name
    ) {
      console.log("Auth Callback - Redirecting to setup profile")
      return NextResponse.redirect(`${origin}/setup-profile`)
    }
  }

  // If there's a next parameter, redirect there
  if (next) {
    console.log("Auth Callback - Redirecting to next:", next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Default redirect
  console.log("Auth Callback - Default redirect to dashboard")
  return NextResponse.redirect(`${origin}/dashboard`)
}
