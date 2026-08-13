import { Leaf, CalendarHeart, ReceiptText, ShieldCheck, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const features = [
  {
    icon: CalendarHeart,
    title: "Agenda e pacientes",
    description: "Agendamentos, prontuarios e evolucoes em um so lugar.",
  },
  {
    icon: ReceiptText,
    title: "Financeiro integrado",
    description: "Cobrancas, contas a pagar e a receber sob controle.",
  },
  {
    icon: ShieldCheck,
    title: "Dados protegidos",
    description: "Acesso seguro e por perfil para sua equipe.",
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-premium">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen w-full">
        {/* Esquerda: Formularios */}
        <div className="flex w-full flex-col items-center justify-center p-6 sm:p-8 lg:w-1/2">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>

        {/* Direita: Branding */}
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black p-12 lg:flex">
          {/* Glows decorativos */}
          <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

          {/* Logo */}
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 shadow-lg shadow-black/30 ring-1 ring-white/10">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">K2-Sync</span>
              <span className="block text-[11px] font-medium text-white/50 uppercase tracking-wider">Wellness OS</span>
            </div>
          </div>

          {/* Conteudo central */}
          <div className="relative space-y-8">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                <Sparkles className="h-3.5 w-3.5 text-teal-300" />
                Plataforma de saude e bem-estar
              </span>
              <h1 className="text-4xl font-bold leading-tight text-white">
                Gestao inteligente para sua saude
              </h1>
              <p className="text-lg text-white/70">
                Acompanhe seus pacientes, evolucoes e agendamentos com seguranca e eficiencia.
              </p>
            </div>

            <ul className="space-y-4">
              {features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <feature.icon className="h-5 w-5 text-teal-300" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Rodape */}
          <div className="relative text-sm text-white/40">
            © {new Date().getFullYear()} K2-Sync. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}
