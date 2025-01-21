"use client"

import { Suspense } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { setupProfileAction } from "@/app/actions"
import { useSearchParams } from "next/navigation"

// Separate component for error display
function ErrorDisplay() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  if (!error) return null
  return <div className="text-sm text-red-500">{error}</div>
}

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/sign-in")
      }
    }
    checkSession()
  }, [router, supabase.auth])

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Complete Your Agent Profile</CardTitle>
          <CardDescription>
            Please set up your agent account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={setupProfileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
              />
            </div>
            <Suspense>
              <ErrorDisplay />
            </Suspense>
            <Button type="submit" className="w-full">
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
