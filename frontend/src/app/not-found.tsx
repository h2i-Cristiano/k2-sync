import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div className="space-y-2 text-center">
        <h2 className="text-4xl font-bold tracking-tight">404</h2>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <p className="text-muted-foreground max-w-[500px]">
          Desculpe, a página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <Button render={<Link href="/dashboard" />}>Voltar para o Início</Button>
    </div>
  )
}
