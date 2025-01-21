"use client"

import { Message } from "@/components/form-message"
import { LoginForm } from "./sign-in-form"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function Login({ searchParams }: SearchParamsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState<Message>({ message: "" })

  useEffect(() => {
    // Handle searchParams in useEffect since we can't await in component body
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

  async function signIn(formData: FormData) {
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    })

    if (!error) {
      // All users go to dashboard, parallel routes will handle the different views
      router.push("/dashboard")
    }
  }

  return (
    <div className="w-full max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">AutoCRM</h1>
        <p className="mt-3 text-muted-foreground">Sign in to your account</p>
      </div>

      <LoginForm messageParams={message} onSubmit={signIn} />
    </div>
  )
}
