"use client"

import { Message } from "@/components/form-message"
import { SignUpForm } from "./sign-up-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function SignUp({ searchParams }: SearchParamsProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()
  const [message, setMessage] = useState<Message>({ message: "" })

  useEffect(() => {
    const loadSearchParams = async () => {
      const params = await searchParams
      const messageParams: Message = params.error
        ? { error: params.error as string }
        : params.success
          ? { success: params.success as string }
          : params.message
            ? { message: params.message as string }
            : { message: "" }
      setMessage(messageParams)
    }
    loadSearchParams()
  }, [searchParams])

  async function signUp(formData: FormData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        options: {
          data: {
            full_name: formData.get("full_name") as string,
            role: "customer", // Always set as customer for public sign-up
          },
        },
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        })
        return
      }

      if (data?.user) {
        toast({
          title: "Success",
          description: "Please check your email to verify your account.",
        })
        router.push("/verify-email")
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      })
    }
  }

  return (
    <div className="w-full max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">AutoCRM</h1>
        <p className="mt-3 text-muted-foreground">Create your account</p>
      </div>

      <SignUpForm messageParams={message} onSubmit={signUp} />
    </div>
  )
}
