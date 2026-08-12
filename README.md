# K2-Sync

> Sistema de Gestao para Saude — SaaS multi-tenant para clinicas, studios e saloes de beleza.

## Sobre

O K2-Sync e uma plataforma completa de gestao para profissionais de saude, estetica e bem-estar. Oferece cadastro de pacientes, anamnese digital com consentimento LGPD, agenda com servicos pre-definidos, prontuarios eletronicos e configuracoes profissionais.

### Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16 + React 19 |
| UI | shadcn/ui v4 (base-ui) + Tailwind v4 |
| Forms | react-hook-form + Zod v4 |
| Backend | Supabase (Auth, PostgreSQL, RLS, Storage) |
| Deploy | Vercel + GitHub Actions |
| Testes | Playwright (35 E2E tests) |

## Inicio Rapido

```bash
# Clonar
git clone https://github.com/h2i-Cristiano/k2-sync.git
cd k2-sync/frontend

# Instalar
npm install

# Configurar variaveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais Supabase

# Rodar
npm run dev
```

Acesse http://localhost:3001

## Estrutura

```
k2-sync/
├── docs/                    # Documentacao tecnica
├── supabase/migrations/     # Migrations SQL (7 arquivos)
├── frontend/
│   ├── src/app/             # Rotas Next.js
│   ├── src/components/      # Componentes React
│   ├── src/lib/             # Utilitarios, validacoes, server actions
│   └── e2e/                 # Testes Playwright
└── database-schema.sql      # Schema completo do banco
```

## Funcionalidades

- **Auth** — Login/cadastro com Supabase Auth
- **Multi-Tenant** — Isolamento de dados por clinica
- **Pacientes** — CRUD completo com CPF, endereco, contato de emergencia
- **Anamnese Digital** — 5 passos com assinatura digital e captura de foto
- **Agenda** — Calendario + timeline com 10 servicos pre-definidos
- **Prontuarios** — Registro de atendimentos
- **Configuracoes** — Perfil, notificacoes, seguranca, aparencia
- **LGPD** — Consentimento granular (tratamento + marketing separados)
- **Dark Mode** — Toggle light/dark/system

## Testes

```bash
cd frontend

# Configurar usuario de teste
$env:TEST_USER_EMAIL="e2e@test.com"
$env:TEST_USER_PASSWORD="test123456"

# Rodar todos os testes
npx playwright test

# Rodar um arquivo especifico
npx playwright test e2e/auth.spec.ts
```

## Deploy

O deploy e automatico via Vercel a cada push na branch `main`.

```bash
# Deploy manual
npx vercel --prod --force
```

Veja [docs/deploy.md](docs/deploy.md) para configuracao completa.

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [docs/arquitetura.md](docs/arquitetura.md) | Arquitetura tecnica e padroes de codigo |
| [docs/lgpd.md](docs/lgpd.md) | Termos LGPD e consentimento |
| [docs/deploy.md](docs/deploy.md) | Deploy, CI/CD e variaveis de ambiente |
| [docs/desenvolvimento.md](docs/desenvolvimento.md) | Guia de desenvolvimento |
| [docs/banco-de-dados.md](docs/banco-de-dados.md) | Schema, migrations e RLS |
| [PLANO-K2-SYNC.md](PLANO-K2-SYNC.md) | Plano completo do projeto |

## Licenca

Proprietario — H2I Corp / Studio Kamke
