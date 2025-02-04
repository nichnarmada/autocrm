import { Geist } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

export const metadata = {
  title: "AutoCRM",
  description: "Customer Relationship Management System",
}

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="flex min-h-screen flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
