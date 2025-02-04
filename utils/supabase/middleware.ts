import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    let response = NextResponse.next({
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    return response
  } catch (e) {
    console.error("Middleware - Error:", e)
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}
