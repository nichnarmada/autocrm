"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type {
  TicketPriority,
  TicketStatus,
  TicketCategory,
} from "@/types/tickets"
import type { Database } from "@/types/supabase"

type Team = Database["public"]["Tables"]["teams"]["Row"]

const ticketSchema = z.object({
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

interface CreateTicketFormProps {
  teams?: Team[]
  onSuccess?: () => void
}

export function CreateTicketForm({ teams, onSuccess }: CreateTicketFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "bug",
      status: "new",
      team_id: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof ticketSchema>) {
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("tickets").insert([
        {
          ...values,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ])

      if (error) throw error

      form.reset()
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error("Error creating ticket:", error)
      // You might want to show an error toast here
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Brief description of the issue"
                  {...field}
                />
              </FormControl>
              <FormDescription>Keep it short and descriptive</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detailed description of the issue"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="feature_request">
                      Feature Request
                    </SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="question">Question</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="enhancement">Enhancement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {teams && (
          <FormField
            control={form.control}
            name="team_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign to Team (Optional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </Button>
      </form>
    </Form>
  )
}
