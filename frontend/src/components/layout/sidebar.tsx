"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  Leaf,
  ChevronLeft,
  ArrowDownCircle,
  ArrowUpCircle,
  Hand,
} from "lucide-react"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
  match?: string
}

interface NavGroupDef {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

const mainNavGroups: NavGroupDef[] = [
  {
    label: "Principal",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/appointments", label: "Agenda", icon: Calendar },
      { href: "/patients", label: "Pacientes", icon: Users, match: "/patients" },
    ],
  },
]

const financeNav: NavItem[] = [
  { href: "/financial", label: "Financeiro", icon: CreditCard },
  { href: "/financial/charges", label: "Cobrancas", icon: Receipt },
  { href: "/financial/payable", label: "Contas a Pagar", icon: ArrowDownCircle },
  { href: "/financial/receivable", label: "Contas a Receber", icon: ArrowUpCircle },
]

const operationalNav: NavItem[] = [
  { href: "/services", label: "Servicos", icon: Hand },
  { href: "/products", label: "Produtos", icon: ShoppingBag },
  { href: "/stock", label: "Estoque", icon: Warehouse },
]

const crmNav: NavItem[] = [
  { href: "/crm", label: "CRM", icon: Contact, disabled: true },
  { href: "/marketing", label: "Marketing", icon: Megaphone, disabled: true },
]

const adminNav: NavItem[] = [
  { href: "/reports", label: "Relatorios", icon: BarChart3, disabled: true },
  { href: "/settings", label: "Configuracoes", icon: Settings },
]

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed?: boolean }) {
  return (
    <Link
      href={item.disabled ? "#" : item.href}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        item.disabled
          ? "opacity-40 cursor-not-allowed"
          : active
          ? "bg-accent/15 text-accent font-semibold shadow-xs dark:bg-accent/20 dark:text-accent"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-black/5 dark:hover:text-white dark:hover:bg-sidebar-accent/50"
      }`}
      onClick={(e) => item.disabled && e.preventDefault()}
    >
      <div className="relative flex items-center justify-center">
        {active && (
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3.5px] rounded-r-full bg-gradient-to-b from-slate-700 to-slate-900 dark:from-slate-400 dark:to-slate-500 shadow-[0_0_10px_rgba(51,65,85,0.35)]" />
        )}
        <item.icon className={`h-[19px] w-[19px] transition-transform duration-200 group-hover:scale-110 ${active ? "text-accent dark:text-accent" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"}`} />
      </div>
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && item.disabled && (
        <span className="ml-auto text-[9px] font-semibold bg-black/5 text-sidebar-foreground/50 dark:bg-white/[0.06] dark:text-sidebar-foreground/40 px-1.5 py-0.5 rounded uppercase tracking-wider">Em breve</span>
      )}
    </Link>
  )
}

function NavLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return null
  return (
    <p className="px-3 pt-5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/45">
      {children}
    </p>
  )
}

function NavGroup({ items, activeHref, collapsed }: { items: NavItem[]; activeHref: string; collapsed?: boolean }) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <NavLink
          key={item.href}
          item={item}
          active={
            item.match ? activeHref.startsWith(item.match) : activeHref === item.href
          }
          collapsed={collapsed}
        />
      ))}
    </div>
  )
}

interface SidebarContentProps {
  user: User | null
  onLogout: () => void
  collapsed?: boolean
  onToggle?: () => void
}

export function SidebarContent({ user, onLogout, collapsed, onToggle }: SidebarContentProps) {
  const pathname = usePathname()

  const initials = user?.user_metadata?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U"

  return (
    <div className="flex h-full flex-col bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border/70 dark:bg-sidebar dark:border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-500 dark:to-slate-800 shadow-lg shadow-slate-900/25 group-hover:scale-105 transition-transform duration-200">
            <Leaf className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-base font-bold tracking-tight text-foreground dark:text-white group-hover:text-primary transition-colors">K2-Sync</span>
              <span className="block text-[10px] font-medium text-sidebar-foreground/55 uppercase tracking-wider -mt-0.5">Wellness OS</span>
            </div>
          )}
        </Link>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-black/5 dark:hover:text-white dark:hover:bg-sidebar-accent"
            onClick={onToggle}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        )}
      </div>

      <Separator className="bg-border/60 dark:bg-sidebar-border" />

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5">
        {/* Principal group */}
        <NavLabel collapsed={collapsed}>Principal</NavLabel>
        <NavGroup items={mainNavGroups[0].items} activeHref={pathname} collapsed={collapsed} />
        <NavGroup items={[{ href: "/records", label: "Prontuarios", icon: FileText }]} activeHref={pathname} collapsed={collapsed} />

        <NavLabel collapsed={collapsed}>Financeiro</NavLabel>
        <NavGroup items={financeNav} activeHref={pathname} collapsed={collapsed} />

        <NavLabel collapsed={collapsed}>Operacional</NavLabel>
        <NavGroup items={operationalNav} activeHref={pathname} collapsed={collapsed} />

        <NavLabel collapsed={collapsed}>CRM</NavLabel>
        <NavGroup items={crmNav} activeHref={pathname} collapsed={collapsed} />

        <NavLabel collapsed={collapsed}>Sistema</NavLabel>
        <NavGroup items={adminNav} activeHref={pathname} collapsed={collapsed} />
      </div>

      <Separator className="bg-border/60 dark:bg-sidebar-border" />

      {/* User */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2.5 px-3 rounded-xl text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-black/5 dark:text-sidebar-foreground/80 dark:hover:text-white dark:hover:bg-sidebar-accent/50" />}>
            <div className="relative">
              <Avatar className="h-8.5 w-8.5 ring-2 ring-sidebar-border">
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-500 dark:to-slate-800 text-white text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
            </div>
            {!collapsed && (
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="text-sm font-semibold truncate max-w-[140px] text-foreground dark:text-white">
                  {user?.user_metadata?.full_name || "Usuario"}
                </span>
                <span className="text-[11px] text-sidebar-foreground/45 truncate max-w-[140px]">
                  {user?.email}
                </span>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl shadow-lg border-border/60" align="start" side="top">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{user?.user_metadata?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings" />}>
                <Settings className="mr-2 h-4 w-4 text-sidebar-foreground/70" />
                Configuracoes
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-rose-600 dark:text-rose-400">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
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
  const supabase = useMemo(() => createClient(), [])

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
    <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 transition-all duration-300 glass-sidebar dark:bg-sidebar dark:border-r dark:border-sidebar-border ${collapsed ? "lg:w-[68px]" : "lg:w-64"}`}>
      <SidebarContent user={user} onLogout={handleLogout} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-foreground hover:bg-muted" aria-label="Abrir menu" />}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" showCloseButton className="p-0 data-[side=left]:w-[85%] data-[side=left]:sm:max-w-md glass-sidebar dark:bg-sidebar dark:border-sidebar-border">
        <SidebarContent user={user} onLogout={handleLogout} />
      </SheetContent>
    </Sheet>
  )
}
