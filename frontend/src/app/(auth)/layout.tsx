import { HeartPulse } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Esquerda: Formulários */}
      <div className="flex w-full flex-col items-center justify-center lg:w-1/2 p-8">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
      
      {/* Direita: Imagem / Arte */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <HeartPulse className="h-8 w-8" />
          K2-Sync
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Gestao inteligente para sua saude
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Acompanhe seus pacientes, evoluções e agendamentos com seguranca e eficiencia.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} K2-Sync. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
