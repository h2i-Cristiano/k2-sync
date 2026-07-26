"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Nao autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return { user, profile }
}

export async function updateProfile(data: { full_name?: string; phone?: string }) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Nao autenticado")

  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id)

  if (error) throw new Error(error.message)

  if (data.full_name) {
    await supabase.auth.updateUser({ data: { full_name: data.full_name } })
  }

  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
  return { success: true }
}
