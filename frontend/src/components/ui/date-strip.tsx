"use client"

import { cn } from "@/lib/utils"

interface DateStripProps {
  selected: Date
  onSelect: (date: Date) => void
  daysCount?: number
  className?: string
}

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]
const WEEKDAY_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function DateStrip({ selected, onSelect, daysCount = 7, className }: DateStripProps) {
  const today = new Date()
  const start = new Date(selected)
  start.setDate(start.getDate() - 3)

  const days = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })

  return (
    <div
      className={cn("flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      {days.map((d) => {
        const isSelected = isSameDay(d, selected)
        const isToday = isSameDay(d, today)
        return (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onSelect(d)}
            aria-pressed={isSelected}
            className={cn(
              "flex min-w-[52px] flex-col items-center gap-0.5 rounded-xl border px-2 py-2 transition-colors",
              isSelected
                ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                : "border-border/60 bg-card text-foreground hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
              {WEEKDAY_FULL[d.getDay()]}
            </span>
            <span className="tnum text-base font-bold leading-none">{d.getDate()}</span>
            <span className={cn("text-[9px] font-medium uppercase", isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
              {isToday ? "hoje" : MONTHS[d.getMonth()]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export { DateStrip }