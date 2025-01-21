import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Ticket,
  // Users,
  // Settings,
  // Building2,
  // MessageSquare,
  // FileText,
} from "lucide-react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, SidebarItem } from "@/components/app-sidebar"

const sidebarItems: SidebarItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "agent", "customer"],
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: Ticket,
    roles: ["admin", "agent", "customer"],
  },
  // {
  //   href: "/teams",
  //   label: "Teams",
  //   icon: Building2,
  //   roles: ["admin"],
  // },
  // {
  //   href: "/users",
  //   label: "Users",
  //   icon: Users,
  //   roles: ["admin"],
  // },
  // {
  //   href: "/knowledge-base",
  //   label: "Knowledge Base",
  //   icon: FileText,
  //   roles: ["admin", "agent", "customer"],
  // },
  // {
  //   href: "/chat",
  //   label: "Chat",
  //   icon: MessageSquare,
  //   roles: ["admin", "agent", "customer"],
  // },
  // {
  //   href: "/settings",
  //   label: "Settings",
  //   icon: Settings,
  //   roles: ["admin", "agent", "customer"],
  // },
]

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/sign-in")
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()

  const userRole = profile?.role || "customer"

  // Filter sidebar items based on user role
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(userRole)
  )

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/sign-in")
  }

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar sidebarItems={filteredItems} signOut={signOut} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </SidebarProvider>
  )
}
