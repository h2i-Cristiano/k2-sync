import { createClient } from "@/lib/supabase/server"

export async function getUserAndTenant() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error("Não autenticado")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.tenant_id) {
    throw new Error("Erro de configuração da conta (Tenant não encontrado).")
  }

  return { supabase, user, tenantId: profile.tenant_id }
}
