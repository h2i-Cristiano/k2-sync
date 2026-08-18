"use server"

import { z } from "zod"
import { anamneseCreateSchema, anamneseUpdateSchema, AnamneseCreateFormValues, AnamneseUpdateFormValues } from "@/lib/validations/anamnese"
import { revalidatePath } from "next/cache"
import { getUserAndTenant, assertAcessoClinico, SEM_PERMISSAO } from "@/lib/auth-helpers"

const uuidSchema = z.string().uuid("ID inválido")

export async function createAnamnese(data: AnamneseCreateFormValues) {
  try {
    const validatedData = anamneseCreateSchema.parse(data)
    const { supabase, tenantId, user, role } = await getUserAndTenant()
    assertAcessoClinico(role)

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
    if (err.message === SEM_PERMISSAO) return { error: "Seu perfil não tem acesso à anamnese." }
    return { error: "Os dados enviados são inválidos." }
  }
}

export async function getAnamneseById(patientId: string) {
  try {
    const { supabase, tenantId, role } = await getUserAndTenant()
    assertAcessoClinico(role)

    const { data, error } = await supabase
      .from("anamnesis")
      .select("id, data")
      .eq("patient_id", patientId)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Erro ao buscar anamnese:", error)
      return { error: "Erro ao buscar anamnese." }
    }

    if (!data) {
      return { data: null }
    }

    return { data: { id: data.id, data: data.data } }
  } catch (err: any) {
    console.error("Erro em getAnamneseById:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message === SEM_PERMISSAO) return { error: "Seu perfil não tem acesso à anamnese." }
    return { error: "Erro interno." }
  }
}

export async function updateAnamnese(id: string, data: Partial<AnamneseUpdateFormValues>) {
  try {
    uuidSchema.parse(id)
    const validatedData = anamneseUpdateSchema.parse(data)
    const { supabase, tenantId, role } = await getUserAndTenant()
    assertAcessoClinico(role)

    const { error } = await supabase
      .from("anamnesis")
      .update(validatedData)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar anamnese:", error)
      return { error: "Erro ao atualizar anamnese." }
    }

    const { data: anamnese } = await supabase.from("anamnesis").select("patient_id").eq("id", id).eq("tenant_id", tenantId).single()
    if (anamnese?.patient_id) {
      revalidatePath(`/patients/${anamnese.patient_id}`)
    }
    
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateAnamnese:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message === SEM_PERMISSAO) return { error: "Seu perfil não tem acesso à anamnese." }
    return { error: "Dados inválidos ou erro interno." }
  }
}