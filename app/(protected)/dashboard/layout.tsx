import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
  admin,
  agent,
  customer,
}: {
  children: React.ReactNode
  admin: React.ReactNode
  agent: React.ReactNode
  customer: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // Return the appropriate view based on role
  switch (profile?.role) {
    case "admin":
      return admin
    case "agent":
      return agent
    case "customer":
      return customer
    default:
      return children // fallback/default view
  }
}
