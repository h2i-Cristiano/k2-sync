"use server"

import { z } from "zod"
import { patientSchema, PatientFormValues } from "@/lib/validations/patient"
import { revalidatePath } from "next/cache"
import { getUserAndTenant } from "@/lib/auth-helpers"

const uuidSchema = z.string().uuid("ID inválido")

export async function createPatient(data: PatientFormValues) {
  try {
    const validatedData = patientSchema.parse(data)
    const { supabase, tenantId } = await getUserAndTenant()

    const { data: newPatient, error } = await supabase
      .from("patients")
      .insert({
        ...validatedData,
        tenant_id: tenantId,
        birth_date: validatedData.birth_date || null
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar paciente:", error)
      return { error: "Erro ao criar paciente no banco de dados." }
    }

    revalidatePath("/patients")
    return { data: newPatient }

  } catch (err: any) {
    console.error("Erro em createPatient:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Os dados enviados são inválidos ou ocorreu um erro interno." }
  }
}

export async function updatePatient(id: string, data: Partial<PatientFormValues>) {
  try {
    uuidSchema.parse(id)
    const validatedData = patientSchema.partial().parse(data)
    const { supabase, tenantId } = await getUserAndTenant()

    const { error } = await supabase
      .from("patients")
      .update(validatedData)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar paciente:", error)
      return { error: "Erro ao atualizar paciente." }
    }

    revalidatePath("/patients")
    revalidatePath(`/patients/${id}`)
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updatePatient:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Dados inválidos ou erro interno." }
  }
}

export async function deletePatient(id: string) {
  try {
    uuidSchema.parse(id)
    const { supabase, tenantId } = await getUserAndTenant()
    
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao excluir paciente:", error)
      return { error: "Erro ao excluir paciente." }
    }

    revalidatePath("/patients")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em deletePatient:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Erro interno." }
  }
}