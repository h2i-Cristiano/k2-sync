import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get("cpf")

  if (!cpf) {
    return NextResponse.json({ error: "CPF required" }, { status: 400 })
  }

  const cleaned = cpf.replace(/\D/g, "")
  if (cleaned.length !== 11) {
    return NextResponse.json({ error: "Invalid CPF length" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://receitaws.com.br/v1/cpf/${cleaned}`, {
      headers: { "User-Agent": "K2-Sync/1.0" },
    })

    if (!res.ok) {
      return NextResponse.json({ error: "ReceitaWS returned " + res.status }, { status: 502 })
    }

    const data = await res.json()

    if (data.status === "ERROR") {
      return NextResponse.json({ error: data.message || "CPF not found" }, { status: 404 })
    }

    return NextResponse.json({
      nome: data.nome || null,
      nascimento: data.nascimento || null,
      situacao: data.situacao || null,
      cpf: data.cpf || cleaned,
    })
  } catch {
    return NextResponse.json({ error: "Failed to reach ReceitaWS" }, { status: 502 })
  }
}
