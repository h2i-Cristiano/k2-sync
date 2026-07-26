"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun, Monitor, Bell, Shield, Key, User, Smartphone, Save } from "lucide-react"
import { toast } from "sonner"
import { getProfile, updateProfile, updatePassword } from "@/lib/actions/profile.actions"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("appearance")
  const [profile, setProfile] = useState<any>(null)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { user, profile: p } = await getProfile()
        setProfile(p)
        setFullName(p?.full_name || user.user_metadata?.full_name || "")
        setPhone(p?.phone || "")
      } catch {
        toast.error("Erro ao carregar perfil")
      }
    }
    loadProfile()
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ full_name: fullName, phone })
      toast.success("Perfil atualizado com sucesso!")
    } catch {
      toast.error("Erro ao salvar perfil.")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("As senhas nao conferem.")
      return
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    setChangingPassword(true)
    try {
      await updatePassword(newPassword)
      toast.success("Senha atualizada com sucesso!")
      setNewPassword("")
      setConfirmPassword("")
    } catch {
      toast.error("Erro ao alterar senha.")
    } finally {
      setChangingPassword(false)
    }
  }

  const initials = fullName
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U"

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferencias, aparencia e seguranca do sistema.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Aparencia
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notificacoes
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Seguranca
          </TabsTrigger>
        </TabsList>

        {/* Aparencia */}
        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tema do Sistema</CardTitle>
              <CardDescription>Personalize a aparencia do K2-Sync.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onClick={() => setTheme("light")}
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <Sun className="h-6 w-6 text-orange-600" />
                </div>
                <span className="font-medium">Modo Claro</span>
              </div>
              <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onClick={() => setTheme("dark")}
              >
                <div className="h-12 w-12 rounded-full bg-indigo-900 flex items-center justify-center mb-3">
                  <Moon className="h-6 w-6 text-indigo-300" />
                </div>
                <span className="font-medium">Modo Escuro</span>
              </div>
              <div
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                onClick={() => setTheme("system")}
              >
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Monitor className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="font-medium">Automatico (Sistema)</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Informacoes Pessoais</CardTitle>
              <CardDescription>Atualize seus dados que aparecerao para os pacientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold ring-4 ring-background shadow-md">
                  {initials}
                </div>
                <Button variant="outline" disabled>Alterar Foto (em breve)</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.id ? "" : ""} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email nao pode ser alterado aqui.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveProfile} disabled={saving} className="ml-auto">
                {saving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alteracoes</>}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Notificacoes */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Preferencias de Notificacao</CardTitle>
              <CardDescription>Escolha como deseja ser avisado sobre eventos importantes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-primary" />
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Novos Agendamentos</Label>
                    <p className="text-sm text-muted-foreground">Receba um aviso quando um paciente marcar consulta.</p>
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">Lembretes por WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Envio automatico via Evolution API (em breve).</p>
                  </div>
                </div>
                <Switch disabled />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seguranca */}
        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimo 6 caracteres" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" />
                </div>
              </div>
              <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline">
                <Key className="mr-2 h-4 w-4" />
                {changingPassword ? "Alterando..." : "Atualizar Senha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
