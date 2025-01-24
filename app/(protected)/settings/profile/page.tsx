import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./profile-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function SettingsProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/sign-in")
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/sign-in")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground">
          Update your personal information and manage your account
        </p>
      </div>
      <Separator />
      <ProfileForm profile={profile} />
    </div>
  )
}
