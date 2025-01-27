import * as z from "zod"
import type {
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from "@/types/tickets"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

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
  attachments: z
    .array(
      z.object({
        file: z
          .instanceof(File)
          .refine(
            (file) => file.size <= MAX_FILE_SIZE,
            `File size should be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`
          )
          .refine(
            (file) => ACCEPTED_FILE_TYPES.includes(file.type),
            "Invalid file type. Supported types: images, PDF, text, Word, Excel"
          ),
      })
    )
    .optional(),
})
