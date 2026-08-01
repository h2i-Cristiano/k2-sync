"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Criar usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!authData?.user) {
        setError("Usuario nao foi criado. Tente outro email.")
        setLoading(false)
        return
      }

      // 2. Criar tenant via RPC
      const slug = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "clinica"
      
      const { data: tenant, error: tenantError } = await supabase.rpc(
        "create_tenant_for_user",
        {
          p_name: fullName + " - Clinica",
          p_slug: slug,
          p_full_name: fullName,
        }
      )

      if (tenantError) {
        setError("Erro ao criar clinica: " + tenantError.message)
        setLoading(false)
        return
      }

      // 3. Atualizar JWT com tenant_id e role
      await supabase.auth.updateUser({
        data: { tenant_id: tenant?.id, role: "admin" },
      })

      // 4. Forçar refresh da sessão para o JWT incluir tenant_id
      await supabase.auth.getSession()

      setSuccess(true)
    } catch (err) {
      setError("Erro inesperado: " + (err as Error).message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Conta criada!</CardTitle>
          <CardDescription>
            Redirecionando para o painel...
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/dashboard")}>
            Ir para o Dashboard
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full border-none shadow-none bg-transparent sm:bg-card sm:border sm:shadow-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
        <CardDescription>
          Crie sua conta gratuita no K2-Sync
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSignup}>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Dr. Joao Silva"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : "Criar Conta Gratis"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Ja tem conta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Faca login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
