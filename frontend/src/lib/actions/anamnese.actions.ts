"use server"

import { createClient } from "@/lib/supabase/server"
import { anamneseSchema, AnamneseFormValues } from "@/lib/validations/anamnese"
import { revalidatePath } from "next/cache"

export async function createAnamnese(data: AnamneseFormValues) {
  try {
    const validatedData = anamneseSchema.parse(data)
    
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Não autorizado." }
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single()

    if (!profile?.tenant_id) {
      return { error: "Erro de configuração da conta." }
    }

    const { data: newAnamnese, error } = await supabase
      .from("anamnesis")
      .insert({
        ...validatedData,
        tenant_id: profile.tenant_id,
        professional_id: user.id
      })
      .select()
      .single()

    if (error) {
      return { error: error.message }
    }

    revalidatePath(`/patients/${validatedData.patient_id}`)
    return { data: newAnamnese }

  } catch (err: any) {
    return { error: "Os dados enviados são inválidos." }
  }
}

export async function updateAnamnese(id: string, data: Partial<AnamneseFormValues>) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("anamnesis")
      .update(data)
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    // Achar o patient_id para revalidate
    const { data: anamnese } = await supabase.from("anamnesis").select("patient_id").eq("id", id).single()
    if (anamnese?.patient_id) {
      revalidatePath(`/patients/${anamnese.patient_id}`)
    }
    
    return { success: true }
  } catch (err) {
    return { error: "Erro interno." }
  }
}
