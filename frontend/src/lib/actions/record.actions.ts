"use server"

import { revalidatePath } from "next/cache"
import { recordSchema, RecordFormValues } from "@/lib/validations/record"
import { getUserAndTenant } from "@/lib/auth-helpers"

export async function createRecord(data: RecordFormValues) {
  try {
    const parsed = recordSchema.parse(data)
    const { supabase, user, tenantId } = await getUserAndTenant()

    const { error } = await supabase.from("medical_records").insert({
      ...parsed,
      tenant_id: tenantId,
      professional_id: user.id,
    })

    if (error) {
      console.error("Erro ao criar prontuário:", error)
      return { error: "Erro ao criar prontuário no banco de dados." }
    }
    
    revalidatePath("/records")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em createRecord:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message.includes("Tenant não encontrado")) return { error: err.message }
    return { error: "Dados inválidos ou erro interno." }
  }
}

export async function updateRecord(id: string, data: RecordFormValues) {
  try {
    const parsed = recordSchema.parse(data)
    const { supabase, tenantId } = await getUserAndTenant()

    const { error } = await supabase
      .from("medical_records")
      .update(parsed)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar prontuário:", error)
      return { error: "Erro ao atualizar prontuário." }
    }
    
    revalidatePath("/records")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateRecord:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Dados inválidos ou erro interno." }
  }
}

export async function deleteRecord(id: string) {
  try {
    const { supabase, tenantId } = await getUserAndTenant()

    const { error } = await supabase
      .from("medical_records")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao excluir prontuário:", error)
      return { error: "Erro ao excluir prontuário." }
    }
    
    revalidatePath("/records")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em deleteRecord:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Erro interno." }
  }
}
