import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  tone?: "primary" | "success" | "warning" | "gold" | "destructive" | "muted"
  hint?: string
  href?: string
  className?: string
}

const tones: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  gold: "bg-gold/15 text-gold",
  destructive: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
}

function StatCard({ label, value, icon: Icon, tone = "primary", hint, href, className }: StatCardProps) {
  const inner = (
    <Card className={cn("h-full", className)}>
      <CardContent className="flex flex-col gap-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {Icon && (
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
        </div>
        <p className="tnum text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full focus-visible:outline-none">
        {inner}
      </Link>
    )
  }
  return inner
}

export { StatCard }