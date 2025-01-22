import { TicketDetail } from "./ticket-detail"

type TicketIdPageProps = {
  params: Promise<{ id: string }>
}

export default async function TicketIdPage({ params }: TicketIdPageProps) {
  const { id } = await params

  return <TicketDetail id={id} />
}
