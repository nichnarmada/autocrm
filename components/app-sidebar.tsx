import Link from "next/link"
import { LogOut, LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "./ui/button"

export interface SidebarItem {
  href: string
  label: string
  icon: LucideIcon
  roles: string[]
}

interface AppSidebarProps {
  sidebarItems: SidebarItem[]
  signOut: () => void
}

export function AppSidebar({ sidebarItems, signOut }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <h1 className="px-2 text-lg font-semibold">AutoCRM</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <Link href={item.href}>
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <form action={signOut}>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}
