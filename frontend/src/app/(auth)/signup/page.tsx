"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Leaf, User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from "lucide-react"

export default function SignupPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
      <div className="w-full">
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-900/25 dark:from-slate-500 dark:to-slate-800">
            <Leaf className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">K2-Sync</h1>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wellness OS</p>
        </div>
        <Card variant="glass" className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Conta criada!</CardTitle>
            <CardDescription>
              Redirecionando para o painel...
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex-col gap-4">
            <Button className="w-full text-base" onClick={() => router.push("/dashboard")}>
              Ir para o Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Logo (mobile) */}
      <div className="mb-8 flex flex-col items-center text-center lg:hidden">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-900/25 dark:from-slate-500 dark:to-slate-800">
          <Leaf className="h-7 w-7 text-white" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">K2-Sync</h1>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Wellness OS</p>
      </div>

      <Card variant="glass" className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Criar Conta</CardTitle>
          <CardDescription>
            Crie sua conta gratuita no K2-Sync
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo</Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Dr. Joao Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="pl-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar Conta Gratis
                  <ArrowRight data-icon="inline-end" />
                </>
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Ja tem conta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Faca login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
