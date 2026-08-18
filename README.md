# K2-Sync

> SaaS multi-tenant (pt-BR) de gestão para clínicas, estúdios de bem-estar e salões de beleza.

## Sobre

Plataforma completa de gestão para profissionais de saúde, estética e bem-estar: cadastro de pacientes, anamnese digital com consentimento LGPD, agenda com serviços pré-definidos, Evoluções (prontuário), financeiro, produtos, estoque e configurações.

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 (App Router) + React 19, TypeScript estrito |
| UI | shadcn/ui v4 (base-ui) + Tailwind v4 |
| Fontes | Sora (títulos) + Manrope (corpo) |
| Forms | react-hook-form + Zod v4 |
| Backend | Supabase (Auth, PostgreSQL + RLS, Storage) — multi-tenant |
| Deploy | Vercel (root `frontend`) + GitHub Actions |
| Testes | Playwright (71 E2E tests, 3 viewports) |

## Início rápido

```bash
# Clonar
git clone https://github.com/h2i-Cristiano/k2-sync.git
cd k2-sync/frontend

# Instalar
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Rodar
npm run dev
```

Acesse http://localhost:3001

## Estrutura

```
k2-sync/
├── AGENTS.md                # Contexto para ferramentas de IA (ler antes de alterar)
├── docs/                    # Vault Obsidian de documentação técnica
├── supabase/migrations/     # Migrations SQL (16 arquivos)
├── frontend/
│   ├── src/app/             # Rotas Next.js
│   ├── src/components/      # Componentes React
│   ├── src/lib/             # Utilitários, validações, server actions
│   └── e2e/                 # Testes Playwright
├── supabase/migrations/     # Schema do banco (fonte da verdade)
└── database-schema.sql      # Snapshot gerado do schema — não editar a mão
```

## Funcionalidades

- **Auth** — login/cadastro com Supabase Auth
- **Multi-Tenant** — isolamento de dados por clínica (RLS profile-based)
- **Pacientes** — CRUD com CPF, endereço, contato de emergência, perfil com Evoluções
- **Anamnese Digital** — 5 passos com assinatura digital e captura de foto
- **Agenda** — modo lista (sem calendário), Dia/Semana/Mês, WhatsApp, depósitos
- **Evoluções** — prontuário eletrônico por sessão
- **Financeiro** — contas a receber/pagar e cobranças
- **Serviços / Produtos / Estoque** — CRUD + kit editor, alerta de estoque baixo, reposição
- **Configurações** — perfil, aparência (claro/escuro), segurança, notificações
- **LGPD** — consentimento granular (tratamento + marketing separados)

## Testes

```bash
cd frontend

# Configurar usuário de teste (ou deixar os defaults)
$env:TEST_USER_EMAIL="e2e@test.com"
$env:TEST_USER_PASSWORD="test123456"

# Rodar todos os testes (71, em 3 viewports: 1280/768/390)
npx playwright test

# Rodar um arquivo específico
npx playwright test e2e/auth.spec.ts
```

## Deploy

Deploy automático via Vercel a cada push na branch `main` (root directory: `frontend`).

Veja [docs/deploy.md](docs/deploy.md) para configuração completa.

## Documentação (vault Obsidian)

| Documento | Descrição |
|-----------|-----------|
| [docs/handoff-ia.md](docs/handoff-ia.md) | **Retomar o trabalho com IA** (ler primeiro) |
| [docs/historico-de-desenvolvimento.md](docs/historico-de-desenvolvimento.md) | Log do que já foi feito |
| [docs/decisoes.md](docs/decisoes.md) | Decisões de arquitetura e produto (ADR) |
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura técnica e padrões de código |
| [docs/lgpd.md](docs/lgpd.md) | Termos LGPD e consentimento |
| [docs/deploy.md](docs/deploy.md) | Deploy, CI/CD e variáveis de ambiente |
| [docs/desenvolvimento.md](docs/desenvolvimento.md) | Guia de desenvolvimento |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Schema, migrations e RLS |
| [PLANO-K2-SYNC.md](PLANO-K2-SYNC.md) | Plano completo do projeto |

## Licença

Proprietário — H2I Corp / Studio Kamke