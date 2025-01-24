import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { LayoutClient } from "./layout-client"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return <LayoutClient profile={profile}>{children}</LayoutClient>
}
