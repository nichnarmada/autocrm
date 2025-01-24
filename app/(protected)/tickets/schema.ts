import * as z from "zod"
import type {
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from "@/types/tickets"

export const ticketSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(
    ["low", "medium", "high", "urgent"] as [
      TicketPriority,
      ...TicketPriority[],
    ],
    {
      required_error: "Please select a priority level",
    }
  ),
  category: z.enum(
    [
      "bug",
      "feature_request",
      "support",
      "question",
      "documentation",
      "enhancement",
      "other",
    ] as [TicketCategory, ...TicketCategory[]],
    {
      required_error: "Please select a category",
    }
  ),
  team_id: z.string().optional(),
  status: z
    .enum(["new", "open", "in_progress", "resolved", "closed"] as [
      TicketStatus,
      ...TicketStatus[],
    ])
    .default("new"),
})
