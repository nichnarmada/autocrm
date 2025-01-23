"use client"

import { User } from "@supabase/supabase-js"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setupProfileAction } from "@/app/actions"
import { SubmitButton } from "@/components/submit-button"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

interface SetupProfileFormProps {
  user: User
  searchParams: {
    error?: string
    success?: string
  }
  isInvitedUser: boolean
}

export function SetupProfileForm({
  user,
  searchParams,
  isInvitedUser,
}: SetupProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    formData.append("isInvited", isInvitedUser.toString())

    startTransition(async () => {
      await setupProfileAction(formData)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Your Profile</CardTitle>
        <CardDescription>
          {isInvitedUser
            ? "Welcome! Please set up your agent account to continue."
            : "Welcome! Please complete your profile setup to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={user.email}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              required
            />
          </div>

          {isInvitedUser && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Set your password"
                  required={isInvitedUser}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  required={isInvitedUser}
                  minLength={6}
                />
              </div>
            </>
          )}

          {searchParams.error && (
            <div className="text-sm text-red-500">
              Error: {searchParams.error}
            </div>
          )}
          {searchParams.success && (
            <div className="text-sm text-green-500">
              Success: {searchParams.success}
            </div>
          )}

          <SubmitButton className="w-full" pendingText="Setting up profile...">
            Complete Setup
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  )
}
