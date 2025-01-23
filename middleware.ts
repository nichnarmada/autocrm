import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Route categories
const PUBLIC_ROUTES: string[] = ["/"]
const AUTH_ROUTES: string[] = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/verify-email",
  "/auth/callback",
]
const ONBOARDING_ROUTES: string[] = ["/setup-profile"]

export async function middleware(request: NextRequest) {
  // Create response and Supabase client
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get current path and search params
  const { pathname, searchParams } = request.nextUrl
  const hashParams = new URLSearchParams(request.nextUrl.hash.replace("#", ""))
  const isInviteFlow =
    searchParams.get("invite") === "true" || hashParams.get("type") === "invite"

  // Handle access token in query params (from invite flow)
  const accessToken = searchParams.get("access_token")
  const refreshToken = searchParams.get("refresh_token")

  if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  // Handle invite flow with hash token
  if (hashParams.get("type") === "invite") {
    const setupUrl = new URL("/setup-profile", request.url)
    setupUrl.searchParams.set("invite", "true")

    // Extract tokens from hash params
    const accessToken = hashParams.get("access_token")
    const refreshToken = hashParams.get("refresh_token")

    if (accessToken) {
      setupUrl.searchParams.set("access_token", accessToken)
    }
    if (refreshToken) {
      setupUrl.searchParams.set("refresh_token", refreshToken)
    }

    return NextResponse.redirect(setupUrl)
  }

  // Handle Supabase's raw verification URL for invites
  if (request.url.includes("supabase.co/auth/v1/verify")) {
    const token = searchParams.get("token")
    const type = searchParams.get("type")

    if (token && type === "invite") {
      const redirectUrl = new URL(
        "/auth/callback",
        process.env.NEXT_PUBLIC_BASE_URL
      )
      redirectUrl.searchParams.set("token", token)
      redirectUrl.searchParams.set("type", type)
      redirectUrl.searchParams.set("next", "/setup-profile?invite=true")
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle auth callback with tokens in query params
  if (pathname === "/auth/callback") {
    const token = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")
    const type = searchParams.get("type")
    const next = searchParams.get("next") || "/dashboard"

    if (token && refreshToken && type === "invite") {
      const {
        data: { session },
        error,
      } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      })

      if (session?.user) {
        return NextResponse.redirect(new URL(next, request.url))
      }
    }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Function to check if route is in category
  const isRouteInCategory = (route: string, categories: string[]) =>
    categories.some((category) => route.startsWith(category))

  // Determine route type
  const isPublicRoute = isRouteInCategory(pathname, PUBLIC_ROUTES)
  const isAuthRoute = isRouteInCategory(pathname, AUTH_ROUTES)
  const isOnboardingRoute = isRouteInCategory(pathname, ONBOARDING_ROUTES)
  const isProtectedRoute = !isPublicRoute && !isAuthRoute && !isOnboardingRoute

  // Handle unauthenticated users
  if (!user) {
    // Allow access to public and auth routes
    if (isPublicRoute || isAuthRoute) {
      return response
    }

    // Allow access to onboarding routes only during invite flow
    if (isOnboardingRoute && isInviteFlow) {
      return response
    }

    // If we have tokens but no user, try refreshing the session
    if (accessToken && refreshToken) {
      const {
        data: { session },
        error,
      } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (session?.user) {
        // Redirect to setup profile with invite flag
        const setupUrl = new URL("/setup-profile", request.url)
        setupUrl.searchParams.set("invite", "true")
        return NextResponse.redirect(setupUrl)
      }
    }

    // Redirect to sign-in for all other routes
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Handle authenticated users
  if (user) {
    // Check profile status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_profile_setup")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return response
    }

    const isProfileSetup = profile?.is_profile_setup

    // Handle incomplete profile setup
    if (!isProfileSetup) {
      // Allow access to onboarding routes
      if (isOnboardingRoute) {
        return response
      }

      // Redirect to setup-profile for all other routes

      const setupUrl = new URL("/setup-profile", request.url)
      if (isInviteFlow) {
        setupUrl.searchParams.set("invite", "true")
      }
      return NextResponse.redirect(setupUrl)
    }

    // Prevent accessing auth routes when authenticated
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Allow access to all other routes for authenticated users with complete profiles
    return response
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    {
      source: "/:path*",
      has: [
        {
          type: "host",
          value: "njirsahdvpngmulpwpnb.supabase.co",
        },
      ],
    },
  ],
}
