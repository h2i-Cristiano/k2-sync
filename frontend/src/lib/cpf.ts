export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleaned)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleaned.charAt(10))
}

export interface CPFData {
  nome: string
  nascimento: string
  cpf: string
  situacao: string
  message?: string
}

export async function fetchCPFData(cpf: string): Promise<CPFData | null> {
  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) return null

  try {
    const res = await fetch(`https://receitaws.com.br/v1/cpf/${cleaned}`, {
      headers: { Accept: "application/json" },
    })

    if (!res.ok) return null

    const data = await res.json()

    if (data.status === "ERROR" || !data.nome) return null

    return {
      nome: data.nome || "",
      nascimento: data.nascimento || "",
      cpf: data.cpf || cleaned,
      situacao: data.situacao || "",
    }
  } catch {
    return null
  }
}
