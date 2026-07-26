"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Algo deu errado!</h2>
        <p className="text-muted-foreground">
          Ocorreu um erro inesperado ao tentar carregar esta pagina.
        </p>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()} variant="outline">
          Recarregar Pagina
        </Button>
        <Button onClick={() => reset()}>Tentar Novamente</Button>
      </div>
    </div>
  )
}
