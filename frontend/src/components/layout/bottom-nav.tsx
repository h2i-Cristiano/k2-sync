"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Calendar, Users, Plus, Menu, UserPlus, CalendarPlus, ClipboardPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarContent } from "@/components/layout/sidebar"
import { User } from "@supabase/supabase-js"

interface BottomNavProps {
  user: User | null
  onLogout: () => void
}

const items = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/appointments", label: "Agenda", icon: Calendar },
  { href: "/patients", label: "Pacientes", icon: Users },
]

const quickActions = [
  { href: "/patients", label: "Novo Paciente", icon: UserPlus },
  { href: "/appointments", label: "Agendar Sessão", icon: CalendarPlus },
  { href: "/records", label: "Novo Prontuário", icon: ClipboardPlus },
]

export function BottomNav({ user, onLogout }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.slice(0, 2).map((item) => (
          <NavItem key={item.href} href={item.href} label={item.label} icon={item.icon} active={isActive(item.href)} />
        ))}

        <div className="relative flex flex-1 justify-center">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon"
                  className="absolute -top-5 h-14 w-14 rounded-full border-4 border-background bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                  aria-label="Novo"
                />
              }
            >
              <Plus className="h-6 w-6" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-52">
              {quickActions.map((action) => (
                <DropdownMenuItem
                  key={action.href}
                  onClick={() => {
                    setMenuOpen(false)
                    router.push(action.href)
                  }}
                >
                  <action.icon className="mr-2 h-4 w-4 text-primary" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <NavItem href="/patients" label="Pacientes" icon={Users} active={isActive("/patients")} />

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                className={cn(
                  "flex h-auto flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-foreground/70 hover:bg-primary/10 hover:text-primary"
                )}
                aria-label="Mais opções"
              >
                <Menu className="h-5 w-5" />
                <span className="text-[10px] font-medium">Mais</span>
              </Button>
            }
          />
          <SheetContent side="left" showCloseButton className="p-0 glass-sidebar dark:bg-sidebar dark:border-sidebar-border" style={{ width: "min(85vw, 28rem)", maxWidth: "min(85vw, 28rem)" }}>
            <SidebarContent user={user} onLogout={onLogout} />
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-auto flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors",
        active ? "text-primary" : "text-foreground/60 hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.2]")} />
      <span className="text-[10px] font-medium">{label}</span>
      {active && <span className="h-1 w-1 rounded-full bg-primary" />}
    </Link>
  )
}