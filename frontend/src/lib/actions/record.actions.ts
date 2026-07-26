"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { recordSchema, RecordFormValues } from "@/lib/validations/record"

async function getUserAndTenant() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Nao autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!profile) throw new Error("Perfil nao encontrado")

  return { supabase, user, tenantId: profile.tenant_id }
}

export async function createRecord(data: RecordFormValues) {
  const parsed = recordSchema.parse(data)
  const { supabase, user, tenantId } = await getUserAndTenant()

  const { error } = await supabase.from("medical_records").insert({
    ...parsed,
    tenant_id: tenantId,
    professional_id: user.id,
  })

  if (error) throw new Error(error.message)
  revalidatePath("/records")
  return { success: true }
}

export async function updateRecord(id: string, data: RecordFormValues) {
  const parsed = recordSchema.parse(data)
  const { supabase, tenantId } = await getUserAndTenant()

  const { error } = await supabase
    .from("medical_records")
    .update(parsed)
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) throw new Error(error.message)
  revalidatePath("/records")
  return { success: true }
}

export async function deleteRecord(id: string) {
  const { supabase, tenantId } = await getUserAndTenant()

  const { error } = await supabase
    .from("medical_records")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId)

  if (error) throw new Error(error.message)
  revalidatePath("/records")
  return { success: true }
}
