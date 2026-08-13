"use server"

import { z } from "zod"
import { appointmentCreateSchema, appointmentUpdateSchema, AppointmentCreateFormValues, AppointmentUpdateFormValues } from "@/lib/validations/appointment"
import { revalidatePath } from "next/cache"
import { getUserAndTenant } from "@/lib/auth-helpers"

const uuidSchema = z.string().uuid("ID inválido")

export async function createAppointment(data: AppointmentCreateFormValues & { depositAmount?: number }) {
  try {
    const { depositAmount, ...appointmentData } = data
    const validatedData = appointmentCreateSchema.parse(appointmentData)
    const { commission_percent: _cp, commission_amount: _ca, ...insertData } = validatedData as any
    const { supabase, tenantId, user } = await getUserAndTenant()

    const { data: newAppointment, error } = await supabase
      .from("appointments")
      .insert({
        ...insertData,
        tenant_id: tenantId,
        professional_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Erro ao criar agendamento:", JSON.stringify(error, null, 2))
      return { error: `Erro ao criar agendamento: ${error.message || error.details || "Erro desconhecido"}` }
    }

    let depositEntryId: string | null = null

    if (depositAmount && depositAmount > 0) {
      const [patientResult, serviceResult] = await Promise.all([
        supabase.from("patients").select("full_name").eq("id", validatedData.patient_id).single(),
        supabase.from("services").select("name").eq("id", validatedData.service_type).single(),
      ])

      const patientName = patientResult.data?.full_name || "Paciente"
      const serviceName = serviceResult.data?.name || "Serviço"

      const { data: entry, error: entryError } = await supabase
        .from("financial_entries")
        .insert({
          tenant_id: tenantId,
          type: "receivable",
          description: `Entrada - ${serviceName} - ${patientName}`,
          amount: depositAmount,
          due_date: new Date().toISOString().split("T")[0],
          status: "pending",
          category: "Sessão",
          appointment_id: newAppointment.id,
        })
        .select("id")
        .single()

      if (!entryError && entry) {
        depositEntryId = entry.id
      }
    }

    revalidatePath("/appointments")
    revalidatePath("/financial/receivable")
    return { data: newAppointment, depositEntryId }

  } catch (err: any) {
    console.error("Erro em createAppointment:", err?.message || err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    if (err.message?.includes("Tenant não encontrado")) return { error: err.message }
    return { error: `Erro: ${err.message || "Dados inválidos ou erro interno."}` }
  }
}

export async function updateAppointment(id: string, data: Partial<AppointmentUpdateFormValues>) {
  try {
    uuidSchema.parse(id)
    const validatedData = appointmentUpdateSchema.parse(data)
    const { commission_percent: _cp2, commission_amount: _ca2, ...updateData } = validatedData as any
    const { supabase, tenantId } = await getUserAndTenant()

    const { data: currentApt } = await supabase
      .from("appointments")
      .select("status, total_cost, patient_id, service_type")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single()

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id)
      .eq("tenant_id", tenantId)

    if (error) {
      console.error("Erro ao atualizar agendamento:", error)
      return { error: "Erro ao atualizar agendamento." }
    }

    if (validatedData.status === "completed" && currentApt && currentApt.status !== "completed" && currentApt.total_cost > 0) {
      const [patientResult, serviceResult] = await Promise.all([
        supabase.from("patients").select("full_name").eq("id", currentApt.patient_id).single(),
        supabase.from("services").select("name").eq("id", currentApt.service_type).single(),
      ])

      const patientName = patientResult.data?.full_name || "Paciente"
      const serviceName = serviceResult.data?.name || "Serviço"

      await supabase.from("financial_entries").insert({
        tenant_id: tenantId,
        type: "receivable",
        description: `${serviceName} - ${patientName}`,
        amount: currentApt.total_cost,
        due_date: new Date().toISOString().split("T")[0],
        status: "paid",
        paid_at: new Date().toISOString(),
        category: "Sessão",
        appointment_id: id,
      })
    }

    revalidatePath("/appointments")
    revalidatePath("/financial/receivable")
    return { success: true }
  } catch (err: any) {
    console.error("Erro em updateAppointment:", err)
    if (err.message === "Não autenticado") return { error: "Não autorizado." }
    return { error: "Dados inválidos ou erro interno." }
  }
}

export async function deleteAppointment(id: string) {
  try {
    uuidSchema.parse(id)
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
