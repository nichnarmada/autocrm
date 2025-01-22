"use client"

import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
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
        <form action={setupProfileAction} className="space-y-4">
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

          <Button type="submit" className="w-full">
            Complete Setup
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
