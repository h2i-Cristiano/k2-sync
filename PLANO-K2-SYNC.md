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
updated: 2026-08-11
status: em-desenvolvimento
---
# PLANO K2-SYNC

> [!info] **Sistema de Gestao para Saude**
> SaaS completo focado em terapeutas de massoterapia, estetica avancada, clinicas, dentistas, studios e saloes de beleza.
> Seguranca LGPD + IA clinica + multi-tenant.

---

## Status Atual

> [!success] Fase 2 Completa — Visual Premium + LGPD
> **Ultimo status:** 2026-08-11
> **Porta local:** http://localhost:3001
> **Producao:** https://k2-sync.vercel.app
> **GitHub:** https://github.com/h2i-Cristiano/k2-sync
> **Supabase:** fdphsumvqokygyxbguqy (k2-sync, Sao Paulo)
> **Vercel:** arena-resenha/k2-sync (prj_tHqczFKZkRcou9r4GMHIY8vbbMMD)
> **E2E Tests:** 35/35 passing

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

## Identidade Visual

| Elemento | Valor |
|----------|-------|
| Cor Primaria | Verde Salvia `#7D9982` |
| Cor Destaque | Dourado `#B89A63` |
| Background | `#F8F8F6` |
| Fonte | Inter (Google Fonts) |
| Border Radius | `rounded-xl` (12px) |

---

## Implementado

### Fase 1 — Visual Premium
- [x] Paleta de cores premium (Verde Salvia + Dourado)
- [x] Fonte Inter via Google Fonts
- [x] Sidebar escura com logo
- [x] Layout com header e sidebar
- [x] Dark mode toggle (next-themes)
- [x] CSS variables para temas light/dark
- [x] Componentes shadcn/ui v4 (base-ui)

### Fase 2 — Glassmorphism + Agenda
- [x] Utility glassmorphism (glass, glass-card, glass-sidebar, glass-header)
- [x] Badge component
- [x] 10 servicos pre-definidos com cores (services.ts)
- [x] AppointmentForm com Select de servicos
- [x] Pagina de agendamentos: calendario + timeline
- [x] Sidebar com sub-item colapsavel (Pacientes > Anamnese)
- [x] Sidebar light mode
- [x] Card glass variant
- [x] Input lighter style
- [x] Header glass
- [x] Botao de logout no header

### Autenticacao
- [x] Login com email/senha (Supabase Auth)
- [x] Cadastro com criacao automatica de tenant (RPC `create_tenant_for_user`)
- [x] Middleware de protecao de rotas (refresh session + redirect)
- [x] Layout auth split-screen com branding (HeartPulse icon)
- [x] Sincronizacao tenant_id no JWT apos login

### Multi-Tenant
- [x] 8 tabelas com RLS habilitado e FORCE
- [x] Isolamento por `public.user_tenant_id()` (profile-based)
- [x] Auto-criacao de profile no signup (trigger `handle_new_user`)
- [x] Storage buckets (avatars, patients, anamnesis)
- [x] RPC `create_tenant_for_user` com `ON CONFLICT DO UPDATE`
- [x] profiles.tenant_id nullable (preenchido pelo RPC)

### Dashboard
- [x] 3 cards de estatisticas (pacientes, agendamentos, prontuarios)
- [x] Lista de pacientes recentes
- [x] Acoes rapidas (Novo Paciente, Agendar Sessao, Novo Prontuario)
- [x] Dark mode toggle (Sun/Moon icons, next-themes)
- [x] User avatar menu com dropdown (Perfil, Config, Sair)

### Pacientes
- [x] Lista com busca (nome, email, telefone)
- [x] Cadastro via PatientForm (react-hook-form + Zod)
- [x] Perfil detalhado com 3 abas (Visao Geral, Clinico, Historico)
- [x] Edicao via dialog no perfil
- [x] Exclusao com confirmacao
- [x] Server actions (create, update, delete)
- [x] **Formulario expandido:** CPF*, Email*, Telefone*, Nascimento*, Genero*, Estado Civil, Profissao
- [x] **Endereco completo:** CEP (auto-fill ViaCEP), Rua, Numero, Complemento, Bairro, Cidade, Estado
- [x] **Contato de Emergencia:** Nome, Telefone, Parentesco
- [x] **Observacoes** (textarea)
- [x] **Validacao CPF Mod-11** (algoritmo matematico, sem API externa)
- [x] **Prompt de agendamento** apos criacao do paciente

### Anamnese Digital (Reformulada)
- [x] Formulario de 5 passos com validacao Zod por step
- [x] Step 1: Queixa Principal (local, intensidade, frequencia, duracao, tratamentos anteriores)
- [x] Step 2: Saude (alergias, medicacoes, condicoes, cirurgias, gestacao)
- [x] Step 3: Habitos (fumar, beber, exercicios, sono, estresse, dieta)
- [x] Step 4: Expectativas
- [x] Step 5: Consentimento LGPD (termos scrollaveis, assinatura digital, CPF, foto com carimbo)
- [x] Consentimento separado para marketing (fotos/videos/depoimentos)
- [x] Termos LGPD com dados do Studio Kamke
- [x] SignaturePad (canvas API, sem lib externa)
- [x] Captura de foto com timestamp overlay
- [x] Server action (create, update)

### Agenda
- [x] Navegacao por dia (anterior/proximo/hoje)
- [x] Visualizacao timeline com cards de agendamento
- [x] Cadastro via AppointmentForm (create + edit mode)
- [x] Status badges (agendado, confirmado, em andamento, concluido, cancelado, nao compareceu)
- [x] Indicador de atendimento domiciliar
- [x] **Pre-selecao de paciente** via query param `?patient={id}`
- [x] **Servicos pre-definidos** com cores (10 opcoes)
- [x] Server actions (create, update, delete)

### Prontuarios Eletronicos
- [x] Lista com busca
- [x] RecordForm com validacao Zod
- [x] Status badges (rascunho, concluido)
- [x] **Edit/Delete** via server actions

### Configuracoes
- [x] Aba Aparencia (tema Light/Dark/System)
- [x] **Aba Perfil Profissional** (DB real — `getProfile`, `updateProfile`)
- [x] **Aba Notificacoes** (toggles)
- [x] **Aba Seguranca** (`updatePassword` funcional)

### LGPD
- [x] Termos de consentimento para tratamento de dados (11 secoes)
- [x] Termos separados para uso de imagem/marketing (9 secoes)
- [x] Consentimento granular (tratamento obrigatorio + marketing opcional)
- [x] Dados do controlador: Studio Kamke, Michele Kamke, Tel (XX) 98884-5326
- [x] Assinatura digital (canvas API)
- [x] CPF com auto-formatting e validacao Mod-11
- [x] Foto com carimbo de data/hora

### Testes
- [x] **35 testes E2E** (Playwright)
- [x] cobrindo: auth, signup, dashboard, pacientes CRUD, agenda, prontuarios, configuracoes
- [x] CI/CD (GitHub Actions) — lint + typecheck + Playwright

---

## Pendente

### Funcionalidades
- [ ] Upload de foto de perfil (Supabase Storage)
- [ ] Dashboard com graficos (recharts/chart.js)
- [ ] Hooks customizados (`src/hooks/`)
- [ ] Modulo de pagamentos (Cakto PIX)
- [ ] WhatsApp integracao (Evolution API)
- [ ] Modulo IA (Groq/Gemini)

### Infraestrutura
- [ ] Configurar Vercel Root Directory via vercel.json (resolvido manualmente)
- [ ] Regenerar lockfile com SWC deps para Vercel build

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
- **Solucao:** Usar `render` prop

### 4. Porta em uso
- **Problema:** porta 3000 ja em uso
- **Solucao:** `npm run dev --port 3001`

### 5. RPC create_tenant_for_user (FIXED)
- **Problema:** INSERT conflitava com trigger `handle_new_user`
- **Solucao:** `ON CONFLICT (id) DO UPDATE SET full_name, role, tenant_id`
- **Migracao:** `20260726020000_fix_tenant_rpc.sql`

### 6. ReceitaWS CPF endpoint removido
- **Problema:** ReceitaWS descontinuou endpoint CPF em 2026
- **Solucao:** Validacao via algoritmo Mod-11 (client-side)

### 7. Vercel Build — Root Directory
- **Problema:** Vercel nao encontrava pasta `app/` na raiz
- **Solucao:** Configurar Root Directory como `frontend` no painel do Vercel

### 8. Vercel Build — SWC Lockfile
- **Problema:** Lockfile sem dependencias nativas SWC
- **Solucao:** Rodar `next build` localmente para patch automatico

---

## Estrutura de Arquivos

```
D:\K2-Sync\
├── database-schema.sql
├── package.json                    # Root (vercel-build script)
├── vercel.json                     # Vercel config
├── PLANO-K2-SYNC.md               # Este arquivo
├── README.md                       # Visao geral do projeto
├── docs/
│   ├── arquitetura.md              # Arquitetura tecnica
│   ├── lgpd.md                     # Termos LGPD completos
│   ├── deploy.md                   # Deploy e CI/CD
│   ├── desenvolvimento.md          # Guia de desenvolvimento
│   └── banco-de-dados.md           # Schema e migrations
├── .github/workflows/ci-cd.yml    # GitHub Actions
├── supabase/migrations/            # 7 migrations SQL
└── frontend/
    ├── e2e/ (8 arquivos, 35 testes)
    └── src/
        ├── app/
        │   ├── (auth)/
        │   │   ├── login/page.tsx
        │   │   └── signup/page.tsx
        │   ├── (dashboard)/
        │   │   ├── layout.tsx      # Glass header + sidebar
        │   │   ├── dashboard/page.tsx
        │   │   ├── patients/
        │   │   │   ├── page.tsx
        │   │   │   └── [id]/
        │   │   │       ├── page.tsx
        │   │   │       └── anamnese/page.tsx
        │   │   ├── appointments/page.tsx
        │   │   ├── records/page.tsx
        │   │   └── settings/page.tsx
        │   ├── layout.tsx
        │   └── page.tsx
        ├── components/
        │   ├── forms/
        │   │   ├── PatientForm.tsx
        │   │   ├── AppointmentForm.tsx
        │   │   ├── RecordForm.tsx
        │   │   └── AnamneseForm.tsx   # 5-step wizard + LGPD
        │   ├── layout/
        │   │   └── sidebar.tsx
        │   ├── ui/ (17 componentes)
        │   ├── providers.tsx
        │   └── theme-toggle.tsx
        └── lib/
            ├── cpf.ts               # Validacao Mod-11
            ├── services.ts          # 10 servicos pre-definidos
            ├── utils.ts
            ├── validations/ (4 schemas)
            └── actions/ (5 server actions)
```

---

## Deploy & CI/CD

### URLs
| Servico | URL |
|---------|-----|
| Producao | https://k2-sync.vercel.app |
| GitHub | https://github.com/h2i-Cristiano/k2-sync |
| Supabase | https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy |

### Dev Admin
| Campo | Valor |
|-------|-------|
| Email | `ti.h2icorp@gmail.com` |
| Senha | `08Cris8` |
| Role | admin |
| Tenant | H2i Corp - Dev |

### E2E Test User
| Campo | Valor |
|-------|-------|
| Email | `e2e@test.com` |
| Senha | `test123456` |

---

## Comandos Uteis

```bash
# Iniciar dev
cd D:\K2-Sync\frontend && npm run dev

# Testes E2E
$env:TEST_USER_EMAIL="e2e@test.com"; $env:TEST_USER_PASSWORD="test123456"
npx playwright test

# Lint + TypeCheck
npm run lint && npx tsc --noEmit

# Deploy Vercel
npx vercel --prod --force --scope arena-resenha

# Deploy via Git (automatico)
git push origin main
```

---

## Convencoes de Codigo

- **Componentes:** shadcn/ui v4 (base-ui), NUNCA Radix
- **Forms:** react-hook-form + Zod v4 (dois args em `z.record()`)
- **Server Actions:** `src/lib/actions/` — use `public.user_tenant_id()` para RLS
- **Validacoes:** `src/lib/validations/` — um schema por entidade
- **Estilo:** Tailwind v4, `rounded-xl`, glassmorphism utilities
- **Testes:** Playwright E2E, cobertura minima por modulo

---

> [!tip] Links
> - [[docs/arquitetura]] - Arquitetura Tecnica
> - [[docs/lgpd]] - Termos LGPD
> - [[docs/deploy]] - Deploy e CI/CD
> - [[docs/desenvolvimento]] - Guia de Desenvolvimento
> - [[docs/banco-de-dados]] - Schema e Migrations
