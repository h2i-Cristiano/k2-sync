"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  back?: boolean
  onBack?: () => void
  backHref?: string
  actions?: React.ReactNode
  className?: string
}

function PageHeader({
  title,
  description,
  back,
  onBack,
  backHref,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {back &&
          (backHref ? (
            <Button
              render={<Link href={backHref} />}
              variant="ghost"
              size="icon"
              className="mt-0.5 h-10 w-10 shrink-0 rounded-full text-muted-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="mt-0.5 h-10 w-10 shrink-0 rounded-full text-muted-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ))}
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-foreground sm:text-[1.375rem]">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export { PageHeader }