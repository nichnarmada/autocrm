import { LoginForm } from "./sign-in-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Suspense } from "react"

export default function Login() {
  return (
    <Card className="mx-auto my-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="text-center">Sign in to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  )
}
