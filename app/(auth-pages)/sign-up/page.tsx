import { Message } from "@/components/form-message"
import { SignUpForm } from "./sign-up-form"
import { ThemeSwitcher } from "@/components/theme-switcher"

type SearchParamsProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SignUp({ searchParams }: SearchParamsProps) {
  const params = await searchParams

  // Convert searchParams to Message type
  const messageParams: Message = params.error
    ? { error: params.error as string }
    : params.success
      ? { success: params.success as string }
      : params.message
        ? { message: params.message as string }
        : { message: "" }

  return (
    <div className="relative flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">ChatGenius</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <SignUpForm messageParams={messageParams} />
      </div>
    </div>
  )
}
