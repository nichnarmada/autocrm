import { AlertCircle, Bug, FileText, Gauge } from "lucide-react"
import type { Database } from "@/types/supabase"

type TicketStatus = Database["public"]["Enums"]["ticket_status"]
type TicketPriority = Database["public"]["Enums"]["ticket_priority"]
type TicketCategory = Database["public"]["Enums"]["ticket_category"]

export const statuses: { value: TicketStatus; label: string }[] = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "open",
    label: "Open",
  },
  {
    value: "in_progress",
    label: "In Progress",
  },
  {
    value: "resolved",
    label: "Resolved",
  },
  {
    value: "closed",
    label: "Closed",
  },
]

export const priorities: { value: TicketPriority; label: string }[] = [
  {
    value: "low",
    label: "Low",
  },
  {
    value: "medium",
    label: "Medium",
  },
  {
    value: "high",
    label: "High",
  },
  {
    value: "urgent",
    label: "Urgent",
  },
]

export const categories: {
  value: TicketCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    value: "bug",
    label: "Bug",
    icon: Bug,
  },
  {
    value: "feature_request",
    label: "Feature Request",
    icon: FileText,
  },
  {
    value: "support",
    label: "Support",
    icon: AlertCircle,
  },
  {
    value: "question",
    label: "Question",
    icon: AlertCircle,
  },
  {
    value: "documentation",
    label: "Documentation",
    icon: FileText,
  },
  {
    value: "enhancement",
    label: "Enhancement",
    icon: Gauge,
  },
  {
    value: "other",
    label: "Other",
    icon: AlertCircle,
  },
]
