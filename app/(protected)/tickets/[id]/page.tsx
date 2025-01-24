import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { TicketDetail } from "./ticket-detail"
import { TicketDetailSkeleton } from "./ticket-detail-skeleton"

type TicketIdPageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketIdPage({ params }: TicketIdPageProps) {
  const { id } = await params

  return (
    <div className="container">
      <Suspense fallback={<TicketDetailSkeleton />}>
        <TicketContent id={id} />
      </Suspense>
    </div>
  )
}

async function TicketContent({ id }: { id: string }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/sign-in")
  }

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      `
      *,
      assigned_to:profiles!tickets_assigned_to_fkey(id, full_name, email, avatar_url),
      created_by:profiles!tickets_created_by_fkey(id, full_name, email, avatar_url),
      customer_id:profiles!tickets_customer_id_fkey(id, full_name, email, avatar_url),
      team_id:teams(id, name, description)
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching ticket:", error)
  }

  return <TicketDetail ticket={ticket} userId={user.id} />
}
