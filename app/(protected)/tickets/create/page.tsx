import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { CreateTicketContent } from "./create-ticket-content"

export default async function CreateTicketPage() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="container max-w-3xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Ticket</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create a new support ticket.
        </p>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <CreateTicketContent />
      </Suspense>
    </div>
  )
}
