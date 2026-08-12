"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Não autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return { user, profile }
}

export async function updateProfile(data: { full_name?: string; phone?: string }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new Error("Não autenticado")

    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", user.id)

    if (error) {
      console.error("Erro ao atualizar perfil:", error)
      throw new Error("Erro ao atualizar perfil no banco de dados.")
    }

    if (data.full_name) {
      await supabase.auth.updateUser({ data: { full_name: data.full_name } })
    }

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    if (err.message === "Não autenticado") throw err
    throw new Error("Ocorreu um erro ao atualizar o perfil.")
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    
    if (error) {
      console.error("Erro ao atualizar senha:", error)
      throw new Error("Erro ao atualizar a senha.")
    }
    
    return { success: true }
  } catch (err: any) {
    throw new Error("Não foi possível atualizar a senha no momento.")
  }
}
