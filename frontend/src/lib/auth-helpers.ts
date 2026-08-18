import { createClient } from "@/lib/supabase/server"

export async function getUserAndTenant() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    throw new Error("Não autenticado")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", user.id)
    .single()

  if (!profile || !profile.tenant_id) {
    throw new Error("Erro de configuração da conta (Tenant não encontrado).")
  }

  return { supabase, user, tenantId: profile.tenant_id, role: profile.role as string }
}

export const SEM_PERMISSAO = "Sem permissão"

// Perfis sem acesso a dado clínico (evoluções e anamnese).
const PERFIS_SEM_ACESSO_CLINICO = ["receptionist"]

// Bloqueia escrita de dado clínico. A leitura é barrada pela RLS, já que as
// páginas consultam o banco direto do cliente.
export function assertAcessoClinico(role: string) {
  if (PERFIS_SEM_ACESSO_CLINICO.includes(role)) {
    throw new Error(SEM_PERMISSAO)
  }
}
