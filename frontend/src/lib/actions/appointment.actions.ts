"use server"

import { createClient } from "@/lib/supabase/server"
import { appointmentSchema, AppointmentFormValues } from "@/lib/validations/appointment"
import { revalidatePath } from "next/cache"

export async function createAppointment(data: AppointmentFormValues) {
  try {
    const validatedData = appointmentSchema.parse(data)
    
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

    const { data: newAppointment, error } = await supabase
      .from("appointments")
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

    revalidatePath("/appointments")
    return { data: newAppointment }

  } catch (err: any) {
    return { error: "Os dados enviados são inválidos." }
  }
}

export async function updateAppointment(id: string, data: Partial<AppointmentFormValues>) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("appointments")
      .update(data)
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (err) {
    return { error: "Erro interno." }
  }
}

export async function deleteAppointment(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)

    if (error) {
      return { error: error.message }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (err) {
    return { error: "Erro interno." }
  }
}
