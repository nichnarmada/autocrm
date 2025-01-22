import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            })
          })
        },
      },
      global: {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is authenticated and making a request to the app
  if (user && !request.nextUrl.pathname.startsWith("/api")) {
    // Get user's role from profiles
    const { data: role } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user?.id)
      .single()

    // Redirect based on role
    if (
      role?.role === "customer" &&
      request.nextUrl.pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    if (
      role?.role === "agent" &&
      request.nextUrl.pathname.startsWith("/customer")
    ) {
      return NextResponse.redirect(new URL("/tickets", request.url))
    }
  }

  // Handle unauthenticated users
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/sign-in") &&
    !request.nextUrl.pathname.startsWith("/sign-up") &&
    !request.nextUrl.pathname.startsWith("/forgot-password") &&
    !request.nextUrl.pathname.startsWith("/verify-email") &&
    !request.nextUrl.pathname.startsWith("/setup-profile") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
