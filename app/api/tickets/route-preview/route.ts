import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { routeTicket } from "@/lib/ai/agents/team-router/router"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { title, description, category } = body

    // Validate required fields
    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description and category are required for routing" },
        { status: 400 }
      )
    }

    const routingResult = await routeTicket({
      id: "preview",
      category,
      priority: "medium", // Default priority for preview
      title,
      description,
      requiredSkills: [],
      complexity: undefined,
    })

    return NextResponse.json({
      result: routingResult,
    })
  } catch (error) {
    console.error("[POST /api/tickets/route-preview] Unhandled error:", error)
    return NextResponse.json(
      { error: "Failed to preview team routing" },
      { status: 500 }
    )
  }
}
