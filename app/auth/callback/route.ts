import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")
  const token = requestUrl.searchParams.get("token")
  const type = requestUrl.searchParams.get("type")

  const supabase = await createClient()

  // Handle invite flow
  if (token && type === "invite") {
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "invite",
      })

      if (verifyError) throw verifyError

      // Get the next URL (should be setup-profile) and preserve query params
      const nextUrl = new URL(next || "/setup-profile", requestUrl)
      nextUrl.searchParams.set("invite", "true")
      return NextResponse.redirect(nextUrl)
    } catch (error) {
      console.error("Error verifying invite token:", error)
      return NextResponse.redirect(
        new URL("/sign-in?error=Invalid or expired invite link", requestUrl)
      )
    }
  }

  // Handle regular auth flow
  if (code) {
    try {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError

      // Get user session to check if email is verified
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // If next URL is provided, use it, otherwise determine based on profile status
        if (next) {
          return NextResponse.redirect(new URL(next, requestUrl))
        }

        // Check if profile exists and is setup
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_profile_setup")
          .eq("id", session.user.id)
          .single()

        // Redirect based on profile status
        const redirectUrl = profile?.is_profile_setup
          ? new URL("/dashboard", requestUrl)
          : new URL("/setup-profile", requestUrl)

        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(
        new URL("/sign-in?error=Authentication failed", requestUrl)
      )
    }
  }

  // No valid auth parameters found
  return NextResponse.redirect(
    new URL("/sign-in?error=Invalid authentication request", requestUrl)
  )
}
