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
- [x] RPC `create_tenant_for_user` com `ON CONFLICT DO UPDATE` (corrige bug INSERT vs trigger)

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

### Anamnese Digital
- [x] Formulario de 5 passos com validacao Zod por step
- [x] Step 1: Identificacao
- [x] Step 2: Historico de saude
- [x] Step 3: Habitos
- [x] Step 4: Queixa principal
- [x] Step 5: Expectativas + Consentimento LGPD
- [x] Server action (create, update)
- [x] Barra de progresso + navegacao entre steps

### Agenda
- [x] Navegacao por dia (anterior/proximo/hoje)
- [x] Visualizacao timeline com cards de agendamento
- [x] Cadastro via AppointmentForm (create + edit mode)
- [x] Status badges (agendado, confirmado, em andamento, concluido, cancelado, nao compareceu)
- [x] Indicador de atendimento domiciliar
- [x] **Pre-selecao de paciente** via query param `?patient={id}`
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

### Testes
- [x] **35 testes E2E** (Playwright)
- [x] cobrindo: auth, signup, dashboard, pacientes CRUD, agenda, prontuarios, configuracoes
- [x] CI/CD (GitHub Actions) — lint + typecheck + Playwright

### Validacao CPF
- [x] `lib/cpf.ts` — `isValidCPF()` (Mod-11)
- [x] Validacao no schema Zod (`.refine()`)
- [x] Feedback visual (verde valido / vermelho invalidos digitos)

---

## Pendente

### Funcionalidades
- [ ] Upload de foto de perfil (Supabase Storage)
- [ ] Dashboard com graficos (recharts/chart.js)
- [ ] Hooks customizados (`src/hooks/`)

### Integracoes
- [ ] WhatsApp (Evolution API)
- [ ] Pagamentos (Cakto PIX)
- [ ] Modulo IA (Groq/Gemini)

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

---

## Estrutura de Arquivos

```
D:\K2-Sync\
├── database-schema.sql
├── PLANO-K2-SYNC.md
├── supabase/migrations/
│   ├── 20260726000000_create_tenant_rpc.sql
│   ├── 20260726010000_auto_confirm_users.sql
│   ├── 20260726020000_fix_tenant_rpc.sql
│   └── 20260726030000_setup_dev_admin.sql
└── frontend/
    ├── e2e/ (8 arquivos, 35 testes)
    └── src/
        ├── app/(dashboard)/
        │   ├── patients/page.tsx
        │   ├── appointments/page.tsx
        │   ├── records/page.tsx
        │   └── settings/page.tsx
        ├── components/forms/
        │   ├── PatientForm.tsx      # CPF + CEP + campos obrigatorios
        │   ├── AppointmentForm.tsx  # Create + Edit
        │   ├── RecordForm.tsx
        │   └── AnamneseForm.tsx     # 5-step wizard
        └── lib/
            ├── cpf.ts               # Validacao Mod-11
            ├── validations/         # Zod schemas
            └── actions/             # Server actions
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

---

## Comandos Uteis

```bash
# Iniciar
cd D:\K2-Sync\frontend && npm run dev

# Testes E2E
$env:TEST_USER_EMAIL="e2e@test.com"; $env:TEST_USER_PASSWORD="test123456"
npx playwright test

# Deploy
npx vercel --prod --force --scope arena-resenha

# Lint + TypeCheck
npm run lint && npx tsc --noEmit
```

---

> [!tip] Links
> - [[SaaS_Resenha_e_Futebol]] - Arena Resenha
> - [[Project_k2-sync]] - Obsidian
