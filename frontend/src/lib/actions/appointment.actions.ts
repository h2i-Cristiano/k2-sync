"use server"

import { appointmentSchema, AppointmentFormValues } from "@/lib/validations/appointment"
import { revalidatePath } from "next/cache"
import { getUserAndTenant } from "@/lib/auth-helpers"

export async function createAppointment(data: AppointmentFormValues) {
  try {
    const validatedData = appointmentSchema.parse(data)
    const { supabase, tenantId, user } = await getUserAndTenant()

    const { data: newAppointment, error } = await supabase
      .from("appointments")
      .insert({
        ...validatedData,
        tenant_id: tenantId,
        professional_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar agendamento:", error)
      return { error: "Erro ao criar agendamento no banco de dados." }
    }

    revalidatePath("/appointments")
    return { data: newAppointment }

  } catch (err: any) {
    console.error("Erro em createAppointment:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message.includes("Tenant não encontrado")) return { error: err.message }
    return { error: "Os dados enviados são inválidos." }
  }
}

export async function updateAppointment(id: string, data: Partial<AppointmentFormValues>) {
  try {
    const validatedData = appointmentSchema.partial().parse(data)
    const { supabase, tenantId } = await getUserAndTenant()

    const { error } = await supabase
      .from("appointments")
      .update(validatedData)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar agendamento:", error)
      return { error: "Erro ao atualizar agendamento." }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateAppointment:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Erro interno ou dados inválidos." }
  }
}

export async function deleteAppointment(id: string) {
  try {
    const { supabase, tenantId } = await getUserAndTenant()
    
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao excluir agendamento:", error)
      return { error: "Erro ao excluir agendamento." }
    }

    revalidatePath("/appointments")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em deleteAppointment:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Erro interno." }
  }
}
