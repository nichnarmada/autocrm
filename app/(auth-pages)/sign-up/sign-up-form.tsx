"use client"

import { signUpAction } from "@/app/actions"
import { FormMessage, Message } from "@/components/form-message"
import { SubmitButton } from "@/components/submit-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useEffect } from "react"

interface SignUpFormProps {
  messageParams: Message
  onSubmit: (formData: FormData) => Promise<void>
  defaultEmail?: string | null
  isInvite?: boolean
}

export function SignUpForm({
  messageParams,
  onSubmit,
  defaultEmail,
  isInvite,
}: SignUpFormProps) {
  const { toast } = useToast()

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
      <form className="mx-auto w-full max-w-lg space-y-6 px-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            defaultValue={defaultEmail || ""}
            disabled={!!defaultEmail}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            name="password"
            placeholder="Create a password"
            minLength={6}
            required
          />
        </div>

        <SubmitButton
          className="w-full"
          formAction={signUpAction}
          pendingText="Creating account..."
        >
          {isInvite ? "Complete Setup" : "Create account"}
        </SubmitButton>

        <FormMessage message={messageParams} />

        {!isInvite && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        )}
      </form>
      <Toaster />
    </>
  )
}
