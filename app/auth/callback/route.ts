import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next")

  console.log("Auth Callback - URL:", requestUrl.toString())
  console.log("Auth Callback - Has code:", !!code)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next || "/dashboard", requestUrl))
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    new URL("/sign-in?error=Could not authenticate user", requestUrl)
  )
}
