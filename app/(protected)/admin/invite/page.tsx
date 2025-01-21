"use client"

import { createClient } from "@/utils/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { SubmitButton } from "@/components/submit-button"

export default function InviteAgentPage() {
  const supabase = createClient()
  const { toast } = useToast()

  async function inviteAgent(formData: FormData) {
    try {
      const email = formData.get("email") as string
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // First check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", email)
        .single()

      if (existingUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User already exists",
        })
        return
      }

      // Send invitation
      const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: {
          role: "agent",
          invited_by: user.id,
        },
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send invitation",
      })
    }
  }

  return (
    <div className="container max-w-lg py-10">
      <Card>
        <CardHeader>
          <CardTitle>Invite Agent</CardTitle>
          <CardDescription>
            Send an invitation email to add a new agent to your team.
          </CardDescription>
        </CardHeader>
        <form action={inviteAgent}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="agent@example.com"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton>Send Invitation</SubmitButton>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
