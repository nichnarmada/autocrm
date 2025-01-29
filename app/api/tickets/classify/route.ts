import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { classifyTicket } from "@/lib/ai/agents/ticket-classifier/classifier"
import { ClassifierInput } from "@/types/agents/classifier"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const body = await req.json()
  const { ticketId, title, description } = body

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Validate input first
    if (!title || title.length < 10) {
      return NextResponse.json(
        { error: "Title must be at least 10 characters" },
        { status: 400 }
      )
    }

    // Classify ticket
    const result = await classifyTicket({
      id: ticketId,
      title,
      description: description ?? "",
    } as ClassifierInput)

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Classification error:", error)
    return NextResponse.json(
      { error: "Classification failed" },
      { status: 500 }
    )
  }
}
