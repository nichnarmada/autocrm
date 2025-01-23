"use server"

import { encodedRedirect } from "@/utils/utils"
import { createClient } from "@/utils/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function signUpAction(formData: FormData) {
  const headersList = await headers()
  const origin = headersList.get("origin")
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const isInvited = formData.get("isInvited") === "true"

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "All fields are required")
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=${
        isInvited ? "/setup-profile?invite=true" : "/verify-email"
      }`,
      data: {
        email: email,
        temp_display_name: email.split("@")[0],
        // For invited users, they'll skip email verification
        email_verified: isInvited,
      },
    },
  })

  if (error) {
    console.error("Sign up error:", error)
    return encodedRedirect("error", "/sign-up", error.message)
  }

  if (!data?.user) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Something went wrong. Please try again."
    )
  }

  // For invited users, redirect to setup profile
  if (isInvited) {
    return redirect("/setup-profile?invite=true")
  }

  // For regular users, redirect to verify email
  return redirect("/verify-email")
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message)
  }

  return redirect("/dashboard")
}

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString()
  const supabase = await createClient()
  const origin = (await headers()).get("origin")
  const callbackUrl = formData.get("callbackUrl")?.toString()

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required")
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  })

  if (error) {
    console.error(error.message)
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    )
  }

  if (callbackUrl) {
    return redirect(callbackUrl)
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  )
}

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient()

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required"
    )
  }

  if (password !== confirmPassword) {
    return encodedRedirect("error", "/reset-password", "Passwords do not match")
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    return encodedRedirect("error", "/reset-password", "Password update failed")
  }

  return redirect("/sign-in?message=Password updated successfully")
}

export const signOutAction = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect("/sign-in")
}

export async function setupProfileAction(formData: FormData) {
  const supabase = await createClient()
  const fullName = formData.get("fullName") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const isInvited = formData.get("isInvited") === "true"

  if (!fullName) {
    return encodedRedirect("error", "/setup-profile", "Full name is required")
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("No user found")
    }

    // For invited users, handle password setup
    if (isInvited) {
      if (!password || !confirmPassword) {
        return encodedRedirect(
          "error",
          "/setup-profile",
          "Password is required for invited users"
        )
      }

      if (password !== confirmPassword) {
        return encodedRedirect(
          "error",
          "/setup-profile",
          "Passwords do not match"
        )
      }

      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      })

      if (passwordError) {
        return encodedRedirect("error", "/setup-profile", passwordError.message)
      }
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        is_profile_setup: true,
      })
      .eq("id", user.id)

    if (profileError) {
      return encodedRedirect("error", "/setup-profile", profileError.message)
    }

    return encodedRedirect("success", "/dashboard", "Profile setup complete")
  } catch (error) {
    console.error("Error setting up profile:", error)
    return encodedRedirect(
      "error",
      "/setup-profile",
      error instanceof Error ? error.message : "Something went wrong"
    )
  }
}
