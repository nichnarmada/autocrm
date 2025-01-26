export default function VerifyEmailPage() {
  return (
    <div className="mx-auto my-auto w-full max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">AutoCRM</h1>
        <p className="mt-3 text-muted-foreground">Check your email</p>
      </div>

      <div className="space-y-4 rounded-lg bg-card p-8 shadow-lg">
        <p className="text-center text-muted-foreground">
          We&apos;ve sent you an email with a link to verify your account. Click
          the link to complete your registration and set up your profile.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t receive an email? Check your spam folder.
        </p>
      </div>
    </div>
  )
}
