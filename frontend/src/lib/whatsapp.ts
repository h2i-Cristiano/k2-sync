export function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, "")
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

export function buildPaymentMessage(params: {
  patientName: string
  serviceName: string
  amount: number
  pixKey?: string
  status: "scheduled" | "completed"
}): string {
  const { patientName, serviceName, amount, pixKey, status } = params

  if (status === "scheduled") {
    return `Olá ${patientName}! 👋\n\nSeu agendamento de *${serviceName}* foi registrado para o horário escolhido.\n\n⏰ Importante: o horário *só será confirmado após a confirmação do pagamento*.\n\n💰 Valor: R$ ${amount.toFixed(2)}${pixKey ? `\n\nPara pagamento antecipado, utilize a chave PIX:\n${pixKey}` : ""}\n\nAssim que o pagamento for confirmado, te confirmamos o horário! 🌿`
  }

  return `Olá ${patientName}! 👋\n\nSeu atendimento de *${serviceName}* foi concluído com sucesso!\n\n💰 Valor: R$ ${amount.toFixed(2)}${pixKey ? `\n\nPara pagamento, utilize a chave PIX:\n${pixKey}` : ""}\n\nObrigado pela confiança! 🌿`
}

export function buildCommissionMessage(params: {
  professionalName: string
  serviceName: string
  commissionPercent: number
  commissionAmount: number
}): string {
  const { professionalName, serviceName, commissionPercent, commissionAmount } = params
  return `Olá ${professionalName}! 📊\n\nSua comissão pelo atendimento de *${serviceName}* foi registrada.\n\nPercentual: ${commissionPercent}%\nValor: R$ ${commissionAmount.toFixed(2)}`
}

export function buildDepositMessage(params: {
  patientName: string
  serviceName: string
  amount: number
}): string {
  const { patientName, serviceName, amount } = params
  return `Olá ${patientName}! 👋\n\nSeu agendamento de *${serviceName}* foi registrado.\n\n💰 Valor da entrada: R$ ${amount.toFixed(2)}\n\n⏰ Importante: o horário *só será confirmado após a confirmação do pagamento* da entrada.\n\nPara garantir sua vaga, realize o pagamento antecipado.\n\nAssim que o pagamento for confirmado, te confirmamos o horário! 🌿`
}
