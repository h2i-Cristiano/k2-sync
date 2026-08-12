"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { recordCreateSchema, recordUpdateSchema, RecordCreateFormValues, RecordUpdateFormValues } from "@/lib/validations/record"
import { getUserAndTenant } from "@/lib/auth-helpers"

const uuidSchema = z.string().uuid("ID inválido")

export async function createRecord(data: RecordCreateFormValues) {
  try {
    const parsed = recordCreateSchema.parse(data)
    const { supabase, user, tenantId } = await getUserAndTenant()

    const { data: newRecord, error } = await supabase
      .from("medical_records")
      .insert({
        ...parsed,
        tenant_id: tenantId,
        professional_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar prontuário:", error)
      return { error: "Erro ao criar prontuário no banco de dados." }
    }
    
    revalidatePath("/records")
    return { data: newRecord }
  } catch (err: any) {
    console.error("Erro em createRecord:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Dados inválidos ou erro interno." }
  }
}

export async function updateRecord(id: string, data: RecordUpdateFormValues) {
  try {
    uuidSchema.parse(id)
    const parsed = recordUpdateSchema.parse(data)
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
    uuidSchema.parse(id)
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