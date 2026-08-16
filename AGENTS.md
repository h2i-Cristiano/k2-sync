# AGENTS.md — Contexto para ferramentas de IA

> Este arquivo é lido automaticamente por agentes de IA (opencode, Cursor, Claude Code, Windsurf, Codex etc.). Leia-o por completo antes de qualquer alteração.

## O que é este projeto

**K2-Sync** — SaaS multi-tenant (pt-BR) de gestão para clínicas, estúdios de bem-estar e salões de beleza. App completo: autenticação, pacientes, agenda, prontuário (chamado de **Evoluções**), anamnese digital com assinatura LGPD, financeiro (contas a receber/pagar), produtos, estoque, serviços e configurações.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + React 19, TypeScript estrito |
| UI | shadcn/ui **v4 (base-ui)** + Tailwind **v4** — **NUNCA usar Radix** |
| Fontes | Sora (`--font-heading`, títulos) + Manrope (`--font-sans`, corpo) via `next/font/google` |
| Forms | react-hook-form + Zod **v4** |
| Backend | Supabase (Auth, PostgreSQL + RLS, Storage), multitenant |
| Deploy | Vercel (root `frontend`) + GitHub Actions |
| Testes | Playwright (E2E) — porta 3001 |

## Diretórios

- `frontend/` — app Next.js (todo código vive aqui; `src/app`, `src/components`, `src/lib`)
- `docs/` — **vault Obsidian** de documentação técnica (arquitetura, banco, deploy, handoff). Leia `docs/handoff-ia.md` para retomar o trabalho.
- `supabase/migrations/` — migrations SQL (16 arquivos, numerados `YYYYMMDDHHMMSS_descricao.sql`)
- `database-schema.sql` — schema base no repo root

## Comandos (sempre em `frontend/`)

```bash
npm run dev            # dev server na porta 3001
npm run build          # build de produção
npm run lint           # ESLint (0 erros; warnings pré-existentes são aceitos)
npx tsc --noEmit       # typecheck
npx playwright test    # suíte E2E completa (~71 testes)
npx playwright show-report
```

Variáveis de teste (definidas no ambiente / CI):
`TEST_USER_EMAIL` (e-mail, default `e2e@test.com`), `TEST_USER_PASSWORD` (senha do usuário e2e pré-existente, default `test123456`).

## Convenções críticas (não quebrar)

1. **shadcn v4 / base-ui**: sem `asChild`, sem Radix. `<Select onValueChange={v => { if (v) ... }}>` — retorna `(string | null, eventDetails)`.
2. **Zod v4**: `z.record()` exige **2 argumentos**; `z.enum([...], { message: "..." })` usa `message`, não `required_error`.
3. **Server Actions**: `"use server"` em `src/lib/actions/`, autenticar com `supabase.auth.getUser()`, retornar `{ data, error }`. Usar `public.user_tenant_id()` (profile-based) — **não** ler tenant_id do JWT.
4. **Português acentuado**: todo texto de UI em pt-BR com acentos corretos (ex.: "Evoluções", "Pacientes", "Duração").
5. **UTF-8**: ao escrever arquivos com conteúdo acentuado, **nunca** usar `Set-Content`/`Out-File` do PowerShell (corrompe). Usar as ferramentas de edição/escrita padrão do agente ou `[IO.File]::WriteAllText` com encoding UTF-8.
6. **Rota de login é `/login`** (não `/auth/login`).
7. **Sidebar/bottom-nav**: usar o componente existente; cada nova rota precisa de item de navegação + spec e2e.

## Design system (rodada interface-design concluída)

- Identidade: "Estúdio de Bem-Estar" — paleta **sálvia + dourado**, cor do serviço como assinatura visual (dot colorido + borda esquerda no card de sessão).
- Títulos `font-heading` (Sora); corpo `font-sans` (Manrope); números com `tabular-nums`.
- **Agenda**: modo **lista** fixo (sem calendário em grade). Navegação prev/next + rótulo da janela + botão "Ir para hoje" + `<input type="date">`. Seletor **Dia/Semana/Mês em `<select>`** ("Visão da agenda") na barra de filtros. "Serviços no mês" fica na coluna lateral (desktop) e colapsável (mobile). Card de sessão mantém **nome, data e serviço sempre visíveis** (grid `[auto_1fr]` no mobile; hora/data curta à esquerda, nome + serviço + metas, rodapé com status + WhatsApp).
- **Dashboard**: cards com número herói (28px), "Agenda de Hoje" e "Ações Rápidas" harmonizados.
- Todo trabalho de UI futuro deve seguir a skill `interface-design` (`.agents/skills/interface-design/SKILL.md`).

## Mapeamento de módulos

| Rota | Módulo | Observação |
|------|--------|-----------|
| `/dashboard` | Dashboard | stats, agenda de hoje, ações rápidas, banner |
| `/appointments` | Agenda | lista, filtros, CRUD, WhatsApp |
| `/patients` (+ `[id]`, `[id]/anamnese`) | Pacientes | perfil, histórico (Evoluções), anamnese |
| `/records` | Evoluções | antigo "Prontuários" (renomeado na UI) |
| `/services` | Serviços | CRUD + kit editor |
| `/products` | Produtos | alerta de estoque baixo |
| `/stock` | Estoque | reposição, histórico |
| `/financial/charges` `/receivable` `/payable` | Financeiro | cobranças, contas a receber/pagar |
| `/settings` | Configurações | perfil, aparência (tema claro/escuro), segurança, notificações |

## Testes E2E

- Specs em `frontend/e2e/`: `auth`, `signup`, `dashboard`, `patients`, `patients-crud`, `patient-history`, `appointments`, `records`, `records-crud`, `services`, `products`, `charges`, `stock`, `settings`, `responsive`.
- `responsive.spec.ts` cobre 3 larguras: **390px (mobile)**, **768px (tablet)** e o default do config (**1280px desktop**) — inclui teste de overflow horizontal e drawer.
- Flakiness conhecida: timing de replicação do Supabase sob workers paralelos (toasts de CRUD) — todos passam no retry. NÃO "consertar" a menos que fique sistemático.
- Overlay de dev do Next (`<nextjs-portal>`) pode interceptar o dropdown do rodapé do sidebar — usar o botão do header **"Sair do Sistema"** (`getByTitle('Sair do Sistema')`) nos testes de logout.

## Estado atual (última rodada concluída e verde)

- tsc limpo, lint 0 erros (warnings pré-existentes ok), build OK (18 rotas), Playwright **68 passed + 3 flaky** (todos passam no retry).
- Última rodada: fontes Sora/Manrope, harmonização do dashboard, agenda sem calendário com navegação compacta, card de sessão com tríade sempre visível, smoke test novo (seletor de visão + input de data).
- Backup git: tag `backup-2026-08-15` (`af4f4de`).
- Ver `docs/handoff-ia.md` e `docs/historico-de-desenvolvimento.md` para o histórico completo e próximos passos sugeridos.