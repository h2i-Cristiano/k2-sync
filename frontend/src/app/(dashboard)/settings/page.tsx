"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Moon, Sun, Monitor, Bell, Shield, Key, User, Settings2, Smartphone, Save } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("appearance")

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Configurações salvas com sucesso!")
    }, 800)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas preferências, aparência e segurança do sistema.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Aparência
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Perfil Profissional
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle>Tema do Sistema</CardTitle>
              <CardDescription>
                Personalize a aparência do K2-Sync para o seu ambiente de trabalho.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setTheme('light')}
              >
                <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                  <Sun className="h-6 w-6 text-orange-600" />
                </div>
                <span className="font-medium">Modo Claro</span>
              </div>
              <div 
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setTheme('dark')}
              >
                <div className="h-12 w-12 rounded-full bg-indigo-900 flex items-center justify-center mb-3">
                  <Moon className="h-6 w-6 text-indigo-300" />
                </div>
                <span className="font-medium">Modo Escuro</span>
              </div>
              <div 
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setTheme('system')}
              >
                <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <Monitor className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <span className="font-medium">Automático (Sistema)</span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle>Densidade da Interface</CardTitle>
              <CardDescription>
                Ajuste o espaçamento dos elementos na tela.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Modo Compacto</Label>
                  <p className="text-sm text-muted-foreground">Reduz margens e paddings para exibir mais informações.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seus dados profissionais que aparecerão para os pacientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6 mb-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold ring-4 ring-background shadow-md">
                  DR
                </div>
                <Button variant="outline">Alterar Foto</Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input defaultValue="Dr. Exemplo" />
                </div>
                <div className="space-y-2">
                  <Label>Especialidade</Label>
                  <Input defaultValue="Fisioterapia" />
                </div>
                <div className="space-y-2">
                  <Label>Email Profissional</Label>
                  <Input defaultValue="contato@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone (WhatsApp)</Label>
                  <Input defaultValue="(11) 99999-9999" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Registro Profissional (Ex: CREFITO, CRM)</Label>
                  <Input defaultValue="123456-F" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSave} disabled={saving} className="ml-auto">
                {saving ? "Salvando..." : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Escolha como deseja ser avisado sobre eventos importantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Novos Agendamentos</Label>
                      <p className="text-sm text-muted-foreground">Receba um aviso quando um paciente marcar consulta.</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-primary" />
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Lembretes por WhatsApp</Label>
                      <p className="text-sm text-muted-foreground">O sistema enviará lembretes automáticos via Evolution API (em breve).</p>
                    </div>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="shadow-sm border-none bg-card">
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>
                Gerencie sua senha e sessões ativas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Senha Atual</Label>
                <Input type="password" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <Input type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input type="password" />
                </div>
              </div>
              <Button className="mt-2" variant="outline">
                <Key className="mr-2 h-4 w-4" /> Atualizar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
