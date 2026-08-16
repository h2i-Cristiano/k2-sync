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
          <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {label}
            </p>
            {Icon && (
              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tones[tone])}>
                <Icon className="h-5 w-5" />
              </div>
            )}
          </div>
        <div className="mt-auto">
          <p className="tnum font-heading text-[28px] font-bold leading-none tracking-tight text-foreground">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
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