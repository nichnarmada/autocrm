import { Separator } from "@/components/ui/separator"

export default function SettingsNotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications
        </p>
      </div>
      <Separator />
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}
