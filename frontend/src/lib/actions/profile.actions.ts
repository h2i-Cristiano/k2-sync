"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { updateProfileSchema, updatePasswordSchema } from "@/lib/validations/profile"

export async function getProfile() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Não autorizado." }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return { user, profile }
  } catch (err: any) {
    console.error("Erro em getProfile:", err)
    return { error: "Erro ao carregar perfil." }
  }
}

export async function updateProfile(data: { full_name?: string; phone?: string }) {
  try {
    const validatedData = updateProfileSchema.parse(data)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Não autorizado." }

    const { error } = await supabase
      .from("profiles")
      .update(validatedData)
      .eq("id", user.id)

    if (error) {
      console.error("Erro ao atualizar perfil:", error)
      return { error: "Erro ao atualizar perfil." }
    }

    if (validatedData.full_name) {
      await supabase.auth.updateUser({ data: { full_name: validatedData.full_name } })
    }

    revalidatePath("/settings")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateProfile:", err)
    if (err.message?.includes("validation")) return { error: "Dados inválidos." }
    return { error: "Ocorreu um erro ao atualizar o perfil." }
  }
}

export async function updatePassword(newPassword: string) {
  try {
    const validatedPassword = updatePasswordSchema.parse(newPassword)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Não autorizado." }

    const { error } = await supabase.auth.updateUser({ password: validatedPassword })
    
    if (error) {
      console.error("Erro ao atualizar senha:", error)
      return { error: "Erro ao atualizar a senha." }
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updatePassword:", err)
    if (err.message?.includes("validation")) return { error: "Dados inválidos." }
    return { error: "Não foi possível atualizar a senha no momento." }
  }
}