import { Separator } from "@/components/ui/separator"
import { ProfileForm } from "./profile-form"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-2 h-6 w-32" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Separator />
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4">
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}

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
    return <ProfileSkeleton />
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
