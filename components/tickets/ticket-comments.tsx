"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export function TicketComments({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const { register, handleSubmit, reset } = useForm()

  async function onSubmit(data: any) {
    const supabase = createClient()
    const { error } = await supabase.from("ticket_comments").insert([
      {
        ticket_id: ticketId,
        content: data.comment,
      },
    ])

    if (!error) {
      router.refresh()
      reset()
    }
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textarea
          {...register("comment")}
          placeholder="Add a comment..."
          className="min-h-[100px]"
        />
        <Button type="submit">Add Comment</Button>
      </form>
    </div>
  )
}
