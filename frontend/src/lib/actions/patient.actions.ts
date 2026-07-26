"use server"

import { createClient } from "@/lib/supabase/server"
import { patientSchema, PatientFormValues } from "@/lib/validations/patient"
import { revalidatePath } from "next/cache"

export async function createPatient(data: PatientFormValues) {
  try {
    // Validar com Zod no servidor
    const validatedData = patientSchema.parse(data)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Não autorizado." }
    }

    // Obter o tenant_id do JWT ou buscar o profile
    // No nosso schema, patient precisa de tenant_id, e o token RLS resolve isso automaticamente
    // Porém a coluna tenant_id no banco para patients eh NOT NULL.
    // Vamos buscar o tenant_id do usuario
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      return { error: "Erro de configuração da conta (Tenant não encontrado)." }
    }

    const { data: newPatient, error } = await supabase
      .from("patients")
      .insert({
        ...validatedData,
        tenant_id: profile.tenant_id,
        // Remover valores vazios que o zod possa ter deixado passar como literais se necessario
        birth_date: validatedData.birth_date || null
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar paciente:", error)
      return { error: error.message }
    }

    revalidatePath("/patients")
    return { data: newPatient }

  } catch (err: any) {
    console.error("Erro de validação ou servidor:", err)
    return { error: "Os dados enviados são inválidos ou ocorreu um erro interno." }
  }
}

export async function updatePatient(id: string, data: Partial<PatientFormValues>) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("patients")
      .update(data)
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/patients")
    revalidatePath(`/patients/${id}`)
    return { success: true }
  } catch (err) {
    return { error: "Erro interno." }
  }
}

export async function deletePatient(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/patients")
    return { success: true }
  } catch (err) {
    return { error: "Erro interno." }
  }
}
