import * as React from "react"
import { cn } from "@/lib/utils"

type StatusTone = "default" | "secondary" | "success" | "warning" | "destructive" | "gold"

const tones: Record<StatusTone, string> = {
  default: "bg-primary/10 text-primary",
  secondary: "bg-muted text-muted-foreground",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-destructive/15 text-destructive",
  gold: "bg-gold/15 text-gold",
}

const dots: Record<StatusTone, string> = {
  default: "bg-primary",
  secondary: "bg-muted-foreground",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  gold: "bg-gold",
}

interface StatusBadgeProps {
  label: string
  tone?: StatusTone
  dot?: boolean
  className?: string
}

function StatusBadge({ label, tone = "secondary", dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dots[tone])} />}
      {label}
    </span>
  )
}

export { StatusBadge, type StatusTone }