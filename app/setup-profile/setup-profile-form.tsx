"use client"

import { useSearchParams } from "next/navigation"
import { setupProfileAction } from "@/app/actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useState } from "react"

type FormState = {
  error?: string
  success?: string
}

type ActionResult = {
  error?: string
  success?: boolean
}

export default function SetupProfileForm() {
  const searchParams = useSearchParams()
  const isInvitedUser = searchParams.get("invite") === "true"
  const [formState, setFormState] = useState<FormState>({})

  async function onSubmit(formData: FormData) {
    try {
      // If invited user, update password
      if (isInvitedUser) {
        const password = formData.get("password") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (password !== confirmPassword) {
          setFormState({ error: "Passwords do not match" })
          return
        }

        const supabase = createClient()
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
          setFormState({ error: error.message })
          return
        }
      }

      // Append isInvited to form data
      formData.append("isInvited", isInvitedUser.toString())

      // Submit the form
      const result = (await setupProfileAction(formData)) as ActionResult
      if (result?.error) {
        setFormState({ error: result.error })
      } else {
        setFormState({ success: "Profile setup complete" })
      }
    } catch (error) {
      setFormState({ error: "An unexpected error occurred" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Your Profile</CardTitle>
        <CardDescription>
          {isInvitedUser
            ? "Welcome! Please complete your profile setup and set your password."
            : "Welcome! Please complete your profile setup to continue."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              placeholder="Enter your display name"
            />
          </div>

          {isInvitedUser && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Set Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Confirm your password"
                />
              </div>
            </>
          )}

          <Button type="submit" className="w-full">
            Complete Setup
          </Button>

          {formState.error && (
            <p className="text-sm text-red-500">{formState.error}</p>
          )}
          {formState.success && (
            <p className="text-sm text-green-500">{formState.success}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
