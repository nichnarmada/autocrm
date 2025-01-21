"use client"

import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useEffect } from "react"

interface LoginFormProps {
  messageParams: Message
  onSubmit: (formData: FormData) => Promise<void>
}

export function LoginForm({ messageParams, onSubmit }: LoginFormProps) {
  const { toast } = useToast()

  // Show error toast if there's an error
  useEffect(() => {
    if ("error" in messageParams) {
      toast({
        title: "Error",
        description: messageParams.error,
      })
    }
  }, [messageParams, toast])

  return (
    <>
      <form
        action={onSubmit}
        className="mx-auto w-full max-w-lg space-y-6 px-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              className="text-sm text-muted-foreground hover:text-primary"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            required
          />
        </div>

        <SubmitButton className="w-full" pendingText="Signing in...">
          Sign in
        </SubmitButton>

        <FormMessage message={messageParams} />

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
      <Toaster />
    </>
  )
}
