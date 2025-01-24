import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { UsersListView } from "./users-list-view"
import { UsersListSkeleton } from "./users-list-skeleton"
import { Suspense } from "react"

export default async function UsersPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="container">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
        <InviteUserDialog />
      </div>

      <Suspense fallback={<UsersListSkeleton />}>
        <UsersContent />
      </Suspense>
    </div>
  )
}

async function UsersContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  // Fetch users
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return <UsersListView users={users || []} />
}
