// Traduz erros de autenticacao do Supabase para mensagens uteis em pt-BR.
//
// Motivacao: em 2026-08-16 uma falha no trigger handle_new_user fez a tela de
// cadastro exibir literalmente "{}" para o usuario. O codigo repassava
// authError.message direto para a UI, e quando o GoTrue responde com corpo
// vazio ou nao reconhecido essa string nao tem valor nenhum para quem esta
// tentando se cadastrar.

// Mensagens conhecidas do GoTrue -> texto em pt-BR.
const TRADUCOES: Record<string, string> = {
  "user already registered": "Este e-mail já está cadastrado. Faça login ou use outro e-mail.",
  "invalid login credentials": "E-mail ou senha incorretos.",
  "email not confirmed": "Confirme seu e-mail antes de entrar.",
  "password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres.",
  "unable to validate email address: invalid format": "E-mail inválido.",
  "email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
  "database error saving new user": "Não foi possível concluir o cadastro. Tente novamente em instantes.",
}

// Uma mensagem so serve se comunicar algo. Corpo vazio, objeto serializado e
// afins nao comunicam nada.
function ehInutil(msg: string): boolean {
  const t = msg.trim()
  return t === "" || t === "{}" || t === "[]" || t === "null" || t === "undefined" || t === "[object Object]"
}

/**
 * Extrai uma mensagem apresentavel de qualquer erro do Supabase.
 *
 * @param erro     o objeto de erro (AuthError, PostgrestError, Error, unknown)
 * @param fallback texto exibido quando o erro nao traz nada de util
 */
export function mensagemDeErro(erro: unknown, fallback: string): string {
  const bruta = typeof erro === "string" ? erro : (erro as { message?: unknown })?.message
  const msg = typeof bruta === "string" ? bruta : ""

  if (ehInutil(msg)) return fallback

  const traduzida = TRADUCOES[msg.trim().toLowerCase()]
  if (traduzida) return traduzida

  return msg
}
