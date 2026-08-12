"use server"

import { anamneseSchema, AnamneseFormValues } from "@/lib/validations/anamnese"
import { revalidatePath } from "next/cache"
import { getUserAndTenant } from "@/lib/auth-helpers"

export async function createAnamnese(data: AnamneseFormValues) {
  try {
    const validatedData = anamneseSchema.parse(data)
    const { supabase, tenantId, user } = await getUserAndTenant()

    const { data: newAnamnese, error } = await supabase
      .from("anamnesis")
      .insert({
        ...validatedData,
        tenant_id: tenantId,
        professional_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar anamnese:", error)
      return { error: "Erro ao criar anamnese no banco de dados." }
    }

    revalidatePath(`/patients/${validatedData.patient_id}`)
    return { data: newAnamnese }

  } catch (err: any) {
    console.error("Erro em createAnamnese:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message.includes("Tenant não encontrado")) return { error: err.message }
    return { error: "Os dados enviados são inválidos." }
  }
}

export async function updateAnamnese(id: string, data: Partial<AnamneseFormValues>) {
  try {
    const validatedData = anamneseSchema.partial().parse(data)
    const { supabase, tenantId } = await getUserAndTenant()

    const { error } = await supabase
      .from("anamnesis")
      .update(validatedData)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar anamnese:", error)
      return { error: "Erro ao atualizar anamnese." }
    }

    // Achar o patient_id para revalidate
    const { data: anamnese } = await supabase.from("anamnesis").select("patient_id").eq("id", id).single()
    if (anamnese?.patient_id) {
      revalidatePath(`/patients/${anamnese.patient_id}`)
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateAnamnese:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Erro interno ou dados inválidos." }
  }
}
