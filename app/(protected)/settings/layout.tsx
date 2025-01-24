"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  {
    title: "Profile",
    href: "/settings/profile",
  },
  {
    title: "Teams",
    href: "/settings/teams",
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
  },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.href))?.title.toLowerCase() ||
    "profile"

  return (
    <div className="flex-1 space-y-4 px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Tabs value={activeTab} className="w-full">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.href}
                value={tab.title.toLowerCase()}
                asChild
              >
                <Link href={tab.href}>{tab.title}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}
