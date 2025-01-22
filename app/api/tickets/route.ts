import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

// GET /api/tickets
export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assigned_to = searchParams.get("assigned_to")
    const team_id = searchParams.get("team_id")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort")

    let query = supabase.from("tickets").select(
      `
        *,
        assigned_to:profiles(*),
        created_by:profiles(*),
        customer_id:profiles(*),
        team_id:teams(*)
      `,
      {
        count: "exact",
      }
    )

    // Apply filters
    if (status) query = query.eq("status", status)
    if (priority) query = query.eq("priority", priority)
    if (assigned_to) query = query.eq("assigned_to", assigned_to)
    if (team_id) query = query.eq("team_id", team_id)
    if (search) query = query.ilike("title", `%${search}%`)

    // Apply sorting
    if (sort) {
      const [field, order] = sort.split(":")
      query = query.order(field, { ascending: order === "asc" })
    } else {
      query = query.order("created_at", { ascending: false })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
      meta: {
        total: count || 0,
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("[TICKETS_GET]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKETS_GET_ERROR",
          message: "Failed to fetch tickets",
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/tickets
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const json = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        },
        { status: 401 }
      )
    }

    // Check if creating on behalf of customer
    const isAgent = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const creatingOnBehalf = isAgent?.data?.role === "agent" && json.customer_id

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        ...json,
        created_by: user.id,
        created_on_behalf: creatingOnBehalf,
        // If agent is creating on behalf, use provided customer_id
        // Otherwise, customer is creating their own ticket
        customer_id: creatingOnBehalf ? json.customer_id : user.id,
      })
      .select(
        `
        *,
        assigned_to:profiles(*),
        created_by:profiles(*),
        customer_id:profiles(*),
        team_id:teams(*)
      `
      )
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[TICKETS_POST]", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "TICKETS_POST_ERROR",
          message: "Failed to create ticket",
        },
      },
      { status: 500 }
    )
  }
}
