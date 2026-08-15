import * as React from "react"
import { cn } from "@/lib/utils"

interface DataRowProps {
  leading?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  onClick?: () => void
  className?: string
  muted?: boolean
}

function DataRow({ leading, title, subtitle, trailing, onClick, className, muted }: DataRowProps) {
  const Comp: React.ElementType = onClick ? "button" : "div"
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full flex-col gap-3 p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        onClick && "cursor-pointer",
        muted && "opacity-70",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        {leading}
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{title}</div>
          {subtitle && <div className="mt-0.5 text-xs text-muted-foreground">{subtitle}</div>}
        </div>
      </div>
      {trailing && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{trailing}</div>
      )}
    </Comp>
  )
}

export { DataRow }