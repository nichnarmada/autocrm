import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SetupProfileForm } from "./setup-profile-form"

type SearchParams = {
  error?: string
  success?: string
  message?: string
}

type SetupProfileProps = {
  params: Promise<SearchParams>
}

export default async function SetupProfile({ params }: SetupProfileProps) {
  const searchParams = await params
  const supabase = await createClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get the user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If profile is already set up, redirect to dashboard
  if (profile?.is_profile_setup) {
    redirect("/dashboard")
  }

  // Check if user was invited (they'll have role in metadata from invite)
  const isInvitedUser =
    user.user_metadata?.role === "agent" && user.user_metadata?.invited_by

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
      <SetupProfileForm
        user={user}
        searchParams={searchParams}
        isInvitedUser={isInvitedUser}
      />
    </div>
  )
}
