"use client"

import Link from "next/link"
import { useState } from "react"
import { LucideIcon, User, ChevronUp, LogOut } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Database } from "@/types/supabase"
import { ThemeToggle } from "./theme-toggle"
import { SignOutDialog } from "./sign-out-dialog"

export interface SidebarItem {
  href: string
  label: string
  icon: LucideIcon
  roles: string[]
}

interface AppSidebarProps {
  sidebarItems: SidebarItem[]
  profile: Database["public"]["Tables"]["profiles"]["Row"]
}

export function AppSidebar({ sidebarItems, profile }: AppSidebarProps) {
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)

  return (
    <>
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

        <SidebarFooter className="border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between gap-2 px-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback>
                      {profile.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase() || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {profile.full_name || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {profile.email}
                    </span>
                  </div>
                </div>
                <ChevronUp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <DropdownMenuItem asChild>
                <Link
                  href="/settings/profile"
                  className="flex cursor-pointer items-center"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <ThemeToggle />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive hover:text-destructive focus:text-destructive dark:text-red-500 dark:hover:text-red-400"
                onSelect={(e) => {
                  e.preventDefault()
                  setShowSignOutDialog(true)
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SignOutDialog
        open={showSignOutDialog}
        onOpenChange={setShowSignOutDialog}
      />
    </>
  )
}
