import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SetupProfileForm } from "./setup-profile-form"

type SearchParams = { [key: string]: string | undefined }

type SetupProfilePageProps = {
  params: Promise<SearchParams>
}

export default async function SetupProfilePage({
  params,
}: SetupProfilePageProps) {
  const searchParams = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/sign-in")
  }

  // Check if profile is already set up
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_profile_setup")
    .eq("id", user.id)
    .single()

  if (profile?.is_profile_setup) {
    return redirect("/dashboard")
  }

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-2 px-8 sm:max-w-md">
      <SetupProfileForm />
    </div>
  )
}
