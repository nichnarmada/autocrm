"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()
  const [isProcessingInvite, setIsProcessingInvite] = useState(false)

  useEffect(() => {
    // Check for hash parameters
    const hash = window.location.hash.replace("#", "")
    if (!hash) return // Skip if no hash

    const params = new URLSearchParams(hash)
    if (params.get("type") === "invite") {
      setIsProcessingInvite(true)
      // Get tokens from hash
      const accessToken = params.get("access_token")
      const refreshToken = params.get("refresh_token")

      if (accessToken && refreshToken) {
        // Set up the session with the tokens
        const supabase = createClient()
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          .then(({ data: { session }, error }) => {
            if (session) {
              // Redirect to setup profile with invite flag
              const setupUrl = new URL("/setup-profile", window.location.origin)
              setupUrl.searchParams.set("invite", "true")
              window.location.replace(setupUrl.toString())
            } else {
              console.error("Failed to set session:", error)
              setIsProcessingInvite(false)
            }
          })
          .catch((error) => {
            console.error("Error setting session:", error)
            setIsProcessingInvite(false)
          })
        return
      }
    }

    // Only check auth if not handling invite
    async function checkAuth() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push("/dashboard")
      }
    }

    checkAuth()
  }, [router])

  if (isProcessingInvite) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-3xl space-y-8 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Setting up your account...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we process your invitation.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to AutoCRM
        </h1>
        <p className="text-lg text-muted-foreground">
          Your all-in-one customer relationship management solution
        </p>

        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}
