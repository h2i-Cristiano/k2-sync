---
tags:
  - saude
  - SaaS
  - k2-sync
  - project
aliases:
  - K2-Sync
  - Sistema de Gestao para Saude
created: 2026-07-17
updated: 2026-07-26
status: em-desenvolvimento
---
# PLANO K2-SYNC

> [!info] **Sistema de Gestao para Saude**
> SaaS completo focado em terapeutas de massoterapia, estetica avancada, clinicas, dentistas, studios e saloes de beleza.
> Seguranca LGPD + IA clinica + multi-tenant.

---

## Status Atual

> [!success] MVP Funcionando — Fase 2
> **Ultimo status:** 2026-07-26
> **Porta local:** http://localhost:3001
> **Producao:** https://k2-sync.vercel.app
> **GitHub:** https://github.com/h2i-Cristiano/k2-sync
> **Supabase:** fdphsumvqokygyxbguqy (k2-sync, Sao Paulo)

---

## Stack Tecnico

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Frontend | Next.js | 16.2.10 |
| React | React | 19.2.4 |
| UI Library | shadcn/ui v4 (base-ui) | 4.13.1 |
| Styling | Tailwind CSS | v4 (PostCSS) |
| Formularios | react-hook-form + Zod | 7.82.0 + 4.4.3 |
| Backend | Supabase (Auth, PostgreSQL, RLS, Storage) | - |
| Hosting | Vercel | - |
| WhatsApp | Evolution API (self-hosted, gratuito) | Pendente |
| Pagamentos | Cakto (PIX 0% taxa) + Asaas (backup) | Pendente |
| IA | Groq API (Llama 3.1 8B) + Google Gemini | Pendente |
| Icons | Lucide React | 1.25.0 |
| Toasts | Sonner | 2.0.7 |
| Theming | next-themes | 0.4.6 |
| Dates | date-fns | 4.4.0 |
| Testing | Playwright | 1.62.0 |
| Linting | ESLint 9 + next/core-web-vitals | - |

---

## Implementado

### Autenticacao
- [x] Login com email/senha (Supabase Auth)
- [x] Cadastro com criacao automatica de tenant (RPC `create_tenant_for_user`)
- [x] Middleware de protecao de rotas (refresh session + redirect)
- [x] Layout auth split-screen com branding (HeartPulse icon)

### Multi-Tenant
- [x] 8 tabelas com RLS habilitado e FORCE
- [x] Isolamento por `tenant_id` via JWT
- [x] Auto-criacao de profile no signup (trigger `handle_new_user`)
- [x] Storage buckets (avatars, patients, anamnesis)

### Dashboard
- [x] 3 cards de estatisticas (pacientes, agendamentos, prontuarios)
- [x] Lista de pacientes recentes
- [x] Acoes rapidas (Novo Paciente, Agendar Sessao, Novo Prontuario)

### Pacientes
- [x] Lista com busca (nome, email, telefone)
- [x] Cadastro via PatientForm (react-hook-form + Zod)
- [x] Perfil detalhado com 3 abas (Visao Geral, Clinico, Historico)
- [x] Edicao via dialog no perfil
- [x] Exclusao com confirmacao
- [x] Server actions (create, update, delete)

### Anamnese Digital
- [x] Formulario de 5 passos com validacao Zod por step
- [x] Step 1: Identificacao (nascimento, genero, estado civil, ocupacao, contato emergencia)
- [x] Step 2: Historico de saude (alergias, medicacoes, cirurgias, gravidez)
- [x] Step 3: Habitos (fumo, exercicio, sono, estresse, dieta)
- [x] Step 4: Queixa principal (dor localizacao, intensidade, frequencia)
- [x] Step 5: Expectativas + Consentimento LGPD
- [x] Server action (create, update)
- [x] Barra de progresso + navegacao entre steps

### Agenda
- [x] Navegacao por dia (anterior/proximo/hoje)
- [x] Visualizacao timeline com cards de agendamento
- [x] Cadastro via AppointmentForm (react-hook-form + Zod)
- [x] Status badges (agendado, confirmado, em andamento, concluido, cancelado, nao compareceu)
- [x] Indicador de atendimento domiciliar
- [x] Server actions (create, update, delete)

### Prontuarios Eletronicos
- [x] Lista com busca
- [x] Cadastro com campos (paciente, sessao, queixa, avaliacao, plano, notas)
- [x] Status badges (rascunho, concluido)
- [x] Exclusao

### Configuracoes
- [x] Aba Aparencia (seletor de tema Light/Dark/System via next-themes)
- [x] Aba Perfil Profissional (formulario com placeholders — MOCKUP)
- [x] Aba Notificacoes (toggles — parcialmente funcional)
- [x] Aba Seguranca (formulario de senha — MOCKUP)

### Infraestrutura
- [x] Providers (ThemeProvider + Toaster)
- [x] Error boundary global (`error.tsx`)
- [x] Loading global (`loading.tsx`)
- [x] Pagina 404 personalizada (`not-found.tsx`)
- [x] 14 componentes shadcn/ui (base-ui)
- [x] Server actions com validacao Zod
- [x] Zod schemas (patient, appointment, anamnese)
- [x] Dark mode CSS variables (OKLCH)
- [x] Playwright configurado + 2 testes E2E

---

## Pendente

### Funcionalidades
- [ ] Conectar Settings ao banco (perfil real do usuario)
- [ ] Upload de foto de perfil (Supabase Storage)
- [ ] Expandir PatientForm com todos os campos (endereco, contato emergencia, alergias, medicacoes)
- [ ] Modo edit no AppointmentForm
- [ ] Server actions para prontuarios (atualmente usa Supabase direto)
- [ ] Validacao Zod nos prontuarios
- [ ] Funcao `deleteAnamnese`
- [ ] Dark mode toggle global no header
- [ ] Dashboard com graficos (recharts/chart.js)
- [ ] Hooks customizados (`src/hooks/`)

### Integracoes
- [ ] WhatsApp (Evolution API)
- [ ] Pagamentos (Cakto PIX)
- [ ] Modulo IA (Groq/Gemini)

### Testes
- [ ] Testes unitarios (Vitest)
- [ ] Testes de componente
- [ ] Testes E2E completos (Playwright)

---

## Bugs Conhecidos e Solucoes

### 1. Chave API Supabase
- **Problema:** `sb_publishable_*` nao funciona com `@supabase/supabase-js`
- **Solucao:** Usar chave Legacy JWT (formato `eyJ...`)

### 2. RLS no tenants
- **Problema:** Trigger causava erro 500 durante signup
- **Solucao:** `ALTER TABLE profiles ALTER COLUMN tenant_id DROP NOT NULL;`

### 3. asChild no shadcn v4
- **Problema:** shadcn v4 usa base-ui, nao Radix. `asChild` nao existe.
- **Solucao:** Usar `render` prop: `<DialogTrigger render={<Button />}>`

### 4. Porta em uso
- **Problema:** porta 3000 ja em uso
- **Solucao:** `npm run dev --port 3001`

### 5. RPC create_tenant_for_user
- **Problema:** Funcao chamada no signup mas nao definida no `database-schema.sql`
- **Solucao:** Criar a funcao no Supabase SQL Editor

---

## Estrutura de Arquivos

```
D:\K2-Sync\
├── database-schema.sql                          # Schema completo (326 linhas)
├── PLANO-K2-SYNC.md                             # Este arquivo
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── playwright.config.ts
    ├── components.json                           # shadcn config (base-nova)
    ├── e2e/
    │   ├── auth.spec.ts
    │   └── patients.spec.ts
    └── src/
        ├── middleware.ts                         # Auth middleware
        ├── app/
        │   ├── layout.tsx                       # Root layout (Providers)
        │   ├── page.tsx                         # Redirect /login
        │   ├── error.tsx                        # Error boundary
        │   ├── loading.tsx                      # Loading spinner
        │   ├── not-found.tsx                    # 404 page
        │   ├── globals.css                      # Tailwind + dark mode
        │   ├── (auth)/
        │   │   ├── layout.tsx                   # Split-screen auth
        │   │   ├── login/page.tsx
        │   │   └── signup/page.tsx
        │   └── (dashboard)/
        │       ├── layout.tsx                   # Nav shell + user menu
        │       ├── dashboard/page.tsx           # Stats + recent
        │       ├── patients/
        │       │   ├── page.tsx                 # List + search + create
        │       │   └── [id]/
        │       │       ├── page.tsx             # Profile (3 tabs)
        │       │       └── anamnese/page.tsx
        │       ├── appointments/page.tsx        # Timeline day view
        │       ├── records/page.tsx             # Prontuarios CRUD
        │       └── settings/page.tsx            # 4 tabs (mockup)
        ├── components/
        │   ├── providers.tsx                    # ThemeProvider + Toaster
        │   ├── forms/
        │   │   ├── PatientForm.tsx              # react-hook-form + Zod
        │   │   ├── AppointmentForm.tsx
        │   │   └── AnamneseForm.tsx             # 5-step wizard
        │   └── ui/                              # 14 shadcn components
        │       ├── avatar.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── dialog.tsx
        │       ├── dropdown-menu.tsx
        │       ├── input.tsx
        │       ├── label.tsx
        │       ├── select.tsx
        │       ├── separator.tsx
        │       ├── sheet.tsx
        │       ├── sonner.tsx
        │       ├── switch.tsx
        │       ├── tabs.tsx
        │       └── textarea.tsx
        └── lib/
            ├── utils.ts                         # cn() utility
            ├── supabase/
            │   ├── client.ts                    # Browser client
            │   ├── server.ts                    # Server client
            │   └── middleware.ts                # Session refresh
            ├── validations/
            │   ├── patient.ts                   # Zod schema
            │   ├── appointment.ts
            │   └── anamnese.ts
            └── actions/
                ├── patient.actions.ts           # Server actions
                ├── appointment.actions.ts
                └── anamnese.actions.ts
```

---

## Comandos Uteis

```bash
# Iniciar servidor
cd D:\K2-Sync\frontend && npm run dev

# Build de producao
cd D:\K2-Sync\frontend && npm run build

# Rodar testes E2E
cd D:\K2-Sync\frontend && npx playwright test

# Lint
cd D:\K2-Sync\frontend && npm run lint

# Adicionar componente shadcn
cd D:\K2-Sync\frontend && npx shadcn@latest add [componente]

# Deploy manual Vercel
cd D:\K2-Sync\frontend && vercel --prod

# Push schema para Supabase
cd D:\K2-Sync\frontend && supabase db push --linked
```

---

## Deploy & CI/CD

> [!info] Pipeline Automatizado
> - **GitHub Actions:** lint + typecheck + Playwright tests em todo push/PR
> - **Vercel:** auto-deploy em push para `main` (apos configurar `VERCEL_TOKEN`)
> - **Supabase:** projeto linked, schema sincronizado

### Secrets necessarios no GitHub (ja configurados)
| Secret | Valor |
|--------|-------|
| `VERCEL_ORG_ID` | `ffxcjhffooztyczuvbyu` |
| `VERCEL_PROJECT_ID` | `prj_tHqczFKZkRcou9r4GMHIY8vbbMMD` |
| `VERCEL_TOKEN` | Criar em https://vercel.com/account/tokens |

### URLs
| Servico | URL |
|---------|-----|
| Producao | https://k2-sync.vercel.app |
| GitHub | https://github.com/h2i-Cristiano/k2-sync |
| Supabase Dashboard | https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy |
| Supabase Studio | https://fdphsumvqokygyxbguqy.supabase.co |

---

> [!tip] Links
> - [[SaaS_Resenha_e_Futebol]] - Arena Resenha
> - [[Project_arena-resenha]] - Memoria IA Arena
> - [[Project_k2-sync]] - Memoria IA K2-Sync
