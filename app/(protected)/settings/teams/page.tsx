import { Separator } from "@/components/ui/separator"

export default function SettingsTeamsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Teams</h3>
        <p className="text-sm text-muted-foreground">
          View and manage your team memberships
        </p>
      </div>
      <Separator />
      <div className="flex min-h-[400px] items-center justify-center rounded-md border border-dashed">
        <p className="text-sm text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  )
}
