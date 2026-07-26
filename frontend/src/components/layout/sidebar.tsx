"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Stethoscope,
  CreditCard,
  Receipt,
  ShoppingBag,
  Warehouse,
  Contact,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  HeartPulse,
  ChevronLeft,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "Agenda", icon: Calendar },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/records", label: "Prontuarios", icon: FileText },
]

const financeNav: NavItem[] = [
  { href: "/financial", label: "Financeiro", icon: CreditCard, disabled: true },
  { href: "/commissions", label: "Comissoes", icon: Receipt, disabled: true },
]

const operationalNav: NavItem[] = [
  { href: "/services", label: "Servicos", icon: Stethoscope, disabled: true },
  { href: "/products", label: "Produtos", icon: ShoppingBag, disabled: true },
  { href: "/stock", label: "Estoque", icon: Warehouse, disabled: true },
]

const crmNav: NavItem[] = [
  { href: "/crm", label: "CRM", icon: Contact, disabled: true },
  { href: "/marketing", label: "Marketing", icon: Megaphone, disabled: true },
]

const adminNav: NavItem[] = [
  { href: "/reports", label: "Relatorios", icon: BarChart3, disabled: true },
  { href: "/settings", label: "Configuracoes", icon: Settings },
]

function NavGroup({ items, activeHref, collapsed }: { items: NavItem[]; activeHref: string; collapsed?: boolean }) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const active = activeHref === item.href
        return (
          <Link
            key={item.href}
            href={item.disabled ? "#" : item.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              item.disabled
                ? "opacity-40 cursor-not-allowed"
                : active
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50"
            }`}
            onClick={(e) => item.disabled && e.preventDefault()}
          >
            <div className="relative flex items-center justify-center">
              {active && (
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-primary" />
              )}
              <item.icon className={`h-[18px] w-[18px] ${active ? "text-primary" : ""}`} />
            </div>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.disabled && (
              <span className="ml-auto text-[10px] text-sidebar-foreground/30 uppercase tracking-wider">Em breve</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}

function NavLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return null
  return (
    <p className="px-3 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
      {children}
    </p>
  )
}

interface SidebarContentProps {
  user: User | null
  onLogout: () => void
  collapsed?: boolean
  onToggle?: () => void
}

function SidebarContent({ user, onLogout, collapsed, onToggle }: SidebarContentProps) {
  const pathname = usePathname()

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <HeartPulse className="h-4.5 w-4.5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-base font-semibold text-white tracking-tight">K2-Sync</span>
              <span className="block text-[10px] text-sidebar-foreground/40 -mt-0.5">Wellness OS</span>
            </div>
          )}
        </Link>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground/40 hover:text-white hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <NavGroup items={mainNav} activeHref={pathname} collapsed={collapsed} />
        <NavLabel collapsed={collapsed}>Financeiro</NavLabel>
        <NavGroup items={financeNav} activeHref={pathname} collapsed={collapsed} />
        <NavLabel collapsed={collapsed}>Operacional</NavLabel>
        <NavGroup items={operationalNav} activeHref={pathname} collapsed={collapsed} />
        <NavLabel collapsed={collapsed}>CRM</NavLabel>
        <NavGroup items={crmNav} activeHref={pathname} collapsed={collapsed} />
        <NavLabel collapsed={collapsed}>Sistema</NavLabel>
        <NavGroup items={adminNav} activeHref={pathname} collapsed={collapsed} />
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2.5 px-3 text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/50" />}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="text-sm font-medium text-white truncate max-w-[140px]">
                  {user?.user_metadata?.full_name || "Usuario"}
                </span>
                <span className="text-[11px] text-sidebar-foreground/40 truncate max-w-[140px]">
                  {user?.email}
                </span>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings" />}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracoes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [user, setUser] = useState<User | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 bg-sidebar transition-all duration-300 ${collapsed ? "lg:w-[68px]" : "lg:w-64"}`}>
        <SidebarContent user={user} onLogout={handleLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 z-50">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="h-10 w-10 m-3" />}>
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SidebarContent user={user} onLogout={handleLogout} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
