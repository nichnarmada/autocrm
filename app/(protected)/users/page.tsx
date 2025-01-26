import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { UsersListSkeleton } from "./users-list-skeleton"
import { Suspense } from "react"
import { UsersListView } from "./users-list-view"

export default async function UsersPage() {
  const supabase = await createClient()

  // Get current user and check if admin
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

  // Fetch initial users
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="container">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
      </div>

      <Suspense fallback={<UsersListSkeleton />}>
        <UsersListView users={users || []} />
      </Suspense>
    </div>
  )
}
