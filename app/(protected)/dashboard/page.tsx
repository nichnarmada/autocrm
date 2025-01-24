export default function DefaultDashboard() {
  return (
    <div className="container">
      <h1 className="mb-6 text-2xl font-bold">Welcome</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>Loading your personalized dashboard...</p>
        <p className="mt-2 text-sm">
          You will be redirected based on your role
        </p>
      </div>
    </div>
  )
}
