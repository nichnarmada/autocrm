import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import { assignAgent } from "@/lib/ai/agents/agent-assigner/assigner"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      teamId,
      title,
      description,
      category,
      priority,
      requiredCapabilities,
      estimatedWorkload,
    } = body

    // Validate required fields
    if (!teamId || !title || !description || !category) {
      return NextResponse.json(
        {
          error:
            "Team ID, title, description and category are required for assignment",
        },
        { status: 400 }
      )
    }

    const assignmentResult = await assignAgent({
      id: "preview",
      team_id: teamId,
      category,
      priority: priority || "medium", // Default priority for preview
      title,
      description,
      required_capabilities: requiredCapabilities || [],
      estimated_workload: estimatedWorkload || 1,
    })

    return NextResponse.json({
      result: assignmentResult,
    })
  } catch (error) {
    console.error("[POST /api/tickets/assign-preview] Unhandled error:", error)
    return NextResponse.json(
      { error: "Failed to preview agent assignment" },
      { status: 500 }
    )
  }
}
