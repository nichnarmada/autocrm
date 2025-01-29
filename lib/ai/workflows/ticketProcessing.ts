import { classifyTicket } from "../agents/ticket-classifier/classifier"
// Future imports: research, priority, routing, etc.

export async function processTicket(
  ticketId: string,
  title: string,
  description: string
) {
  // 1. Classification
  const classification = await classifyTicket({
    id: ticketId,
    title,
    description,
  })

  // 2. Optional steps: research, priority assignment, etc.
  // E.g., if (classification.requiresResearch) { ... }

  return classification
}
