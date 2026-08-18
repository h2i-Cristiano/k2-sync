#!/usr/bin/env node
/**
 * Remove os dados que a suite E2E acumula no Supabase.
 *
 * O teste e2e/signup-complete.spec.ts precisa concluir um cadastro de verdade
 * para ser util, entao cada execucao deixa um usuario, um tenant e um profile
 * no banco. Este script limpa esse residuo.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=<chave> node scripts/cleanup-e2e-data.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=<chave> node scripts/cleanup-e2e-data.mjs --dry-run
 *
 * A chave NAO fica no repositorio: passe por variavel de ambiente. Ela e
 * administrativa e ignora RLS.
 *
 * O que e removido (apenas o que casa com os padroes de teste):
 *   tenants  com slug LIKE 'e2e-signup-%'   -> leva profiles junto (FK CASCADE)
 *   usuarios com e-mail  e2e-signup-*@test.com
 *
 * O usuario E2E principal (e2e@test.com) e o tenant dele NAO sao tocados.
 */

const URL_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fdphsumvqokygyxbguqy.supabase.co"
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes("--dry-run")

if (!CHAVE) {
  console.error("Erro: defina SUPABASE_SERVICE_ROLE_KEY no ambiente.")
  console.error("Exemplo: SUPABASE_SERVICE_ROLE_KEY=<chave> node scripts/cleanup-e2e-data.mjs")
  process.exit(1)
}

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
}

const api = (caminho, opcoes = {}) =>
  fetch(URL_BASE + caminho, { ...opcoes, headers: { ...cabecalhos, ...(opcoes.headers || {}) } })

async function main() {
  console.log(DRY_RUN ? "MODO SIMULACAO — nada sera removido\n" : "Removendo residuo dos testes E2E\n")

  // --- tenants de signup ---
  const tenants = await (await api("/rest/v1/tenants?select=id,name,slug&slug=like.e2e-signup-*")).json()
  console.log(`tenants e2e-signup-*: ${tenants.length}`)
  for (const t of tenants) console.log(`   ${t.slug}`)

  if (!DRY_RUN && tenants.length) {
    const r = await api("/rest/v1/tenants?slug=like.e2e-signup-*", { method: "DELETE" })
    console.log(`   removidos (HTTP ${r.status})`)
  }

  // --- usuarios de signup ---
  const { users = [] } = await (await api("/auth/v1/admin/users?per_page=500")).json()
  const alvos = users.filter((u) => /^e2e-signup-\d+@test\.com$/.test(u.email || ""))
  console.log(`\nusuarios e2e-signup-*: ${alvos.length}`)
  for (const u of alvos) console.log(`   ${u.email}`)

  if (!DRY_RUN) {
    for (const u of alvos) await api(`/auth/v1/admin/users/${u.id}`, { method: "DELETE" })
    if (alvos.length) console.log(`   removidos`)
  }

  // --- profiles orfaos (signup abandonado entre o trigger e a RPC) ---
  const orfaos = await (await api("/rest/v1/profiles?select=id,full_name&tenant_id=is.null")).json()
  console.log(`\nprofiles sem tenant (signup abandonado): ${orfaos.length}`)
  for (const p of orfaos) console.log(`   ${p.full_name}`)
  if (orfaos.length) {
    console.log("   nao removidos automaticamente: podem ser cadastros reais em andamento.")
    console.log("   conferir a data de criacao antes de apagar.")
  }

  console.log(DRY_RUN ? "\nSimulacao concluida." : "\nLimpeza concluida.")
}

main().catch((e) => {
  console.error("Falhou:", e.message)
  process.exit(1)
})
