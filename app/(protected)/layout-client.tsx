"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, SidebarItem } from "@/components/app-sidebar"
import { Database } from "@/types/supabase"
import { LayoutDashboard, Ticket, Users, Building2 } from "lucide-react"

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
  {
    href: "/teams",
    label: "Teams",
    icon: Building2,
    roles: ["admin", "agent"],
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    roles: ["admin", "agent"],
  },
]

interface LayoutClientProps {
  children: React.ReactNode
  profile: Database["public"]["Tables"]["profiles"]["Row"]
}

export function LayoutClient({ children, profile }: LayoutClientProps) {
  const userRole = profile.role || "customer"
  const filteredItems = sidebarItems.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar sidebarItems={filteredItems} profile={profile} />
      <main className="flex-1 overflow-y-auto py-6">{children}</main>
    </SidebarProvider>
  )
}
