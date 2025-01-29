"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import { ticketSchema } from "@/app/(protected)/tickets/schema"
import type { z } from "zod"
import { Team } from "@/types/teams"
import { FileUpload } from "@/components/file-upload"
import { useTicketClassification } from "@/hooks/use-ticket-classification"
import { debounce } from "lodash"
import { ClassificationPanel } from "@/components/tickets/classification/classification-panel"

interface CreateTicketFormProps {
  teams?: Team[]
  onSuccess?: (ticketId: string) => void
  onSubmit: (data: z.infer<typeof ticketSchema>) => Promise<{ id: string }>
}

export function CreateTicketForm({
  teams,
  onSuccess,
  onSubmit,
}: CreateTicketFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { classification, isClassifying, classifyTicket } =
    useTicketClassification()

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "bug",
      status: "new",
      team_id: undefined,
      attachments: [],
    },
  })

  const debouncedClassify = useCallback(
    debounce((title: string, description: string) => {
      classifyTicket(title, description)
    }, 500),
    [classifyTicket]
  )

  const handleFieldChange = useCallback(
    (field: string, value: string) => {
      if (field === "title" || field === "description") {
        const title = field === "title" ? value : form.getValues("title")
        const description =
          field === "description" ? value : form.getValues("description")
        debouncedClassify(title, description)
      }
    },
    [debouncedClassify, form]
  )

  async function handleSubmit(values: z.infer<typeof ticketSchema>) {
    setIsSubmitting(true)
    try {
      const formData = {
        ...values,
        attachments: selectedFiles.map((file) => ({ file })),
      }
      const result = await onSubmit(formData)
      form.reset()
      setSelectedFiles([])
      router.refresh()
      if (onSuccess) {
        onSuccess(result.id)
      }
    } catch (error) {
      console.error("Error creating ticket:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange("title", e.target.value)
                    }}
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
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      handleFieldChange("description", e.target.value)
                    }}
                    placeholder="Detailed description of the issue"
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="attachments"
            render={() => (
              <FormItem>
                <FormLabel>Attachments (Optional)</FormLabel>
                <FormControl>
                  <FileUpload
                    value={selectedFiles}
                    onChange={setSelectedFiles}
                    maxSize={10 * 1024 * 1024} // 10MB
                    accept={[
                      "image/*",
                      ".pdf",
                      ".txt",
                      ".csv",
                      ".doc",
                      ".docx",
                      ".xls",
                      ".xlsx",
                    ]}
                    maxFiles={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(isClassifying || classification) && (
            <ClassificationPanel
              classification={classification}
              isClassifying={isClassifying}
              onCategorySelect={(category) => {
                form.setValue("category", category, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                })
              }}
              selectedCategory={form.getValues("category")}
            />
          )}

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
                  <Select onValueChange={field.onChange} value={field.value}>
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
                      <SelectItem value="documentation">
                        Documentation
                      </SelectItem>
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
    </div>
  )
}
