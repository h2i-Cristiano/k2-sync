# Guia de Desenvolvimento

## Pre-requisitos

- Node.js 22+
- npm
- Git
- Supabase account (para credenciais)

## Setup Local

```bash
# Clonar
git clone https://github.com/h2i-Cristiano/k2-sync.git
cd k2-sync/frontend

# Instalar
npm install

# Configurar env
cp .env.example .env.local
# Editar com credenciais Supabase

# Rodar
npm run dev
```

Acesse http://localhost:3001

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Server dev (porta 3001) |
| `npm run build` | Build de producao |
| `npm run start` | Rodar build de producao |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeCheck |
| `npx playwright test` | Todos os E2E tests |
| `npx playwright test e2e/auth.spec.ts` | Teste especifico |
| `npx playwright show-report` | Ver relatorio HTML |

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/                    # Rotas (App Router)
│   │   ├── (auth)/             # Rotas de autenticacao (rota de login e /login)
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (dashboard)/        # Rotas autenticadas
│   │   │   ├── layout.tsx      # Header + Sidebar
│   │   │   ├── dashboard/      # Stats, agenda de hoje, acoes rapidas, banner
│   │   │   ├── patients/       # + [id] (perfil/Evolucoes) + [id]/anamnese
│   │   │   ├── appointments/   # Agenda (modo lista, sem calendario)
│   │   │   ├── records/        # Evolucoes (antigo "Prontuarios")
│   │   │   ├── services/       # Servicos + kit editor
│   │   │   ├── products/       # Produtos + alerta de estoque baixo
│   │   │   ├── stock/          # Estoque: reposicao e historico
│   │   │   ├── financial/      # charges, receivable, payable
│   │   │   └── settings/
│   │   ├── layout.tsx          # Root layout (fontes Sora + Manrope)
│   │   └── page.tsx            # Redirect
│   ├── components/
│   │   ├── forms/              # Forms de dominio
│   │   │   ├── PatientForm.tsx
│   │   │   ├── AppointmentForm.tsx
│   │   │   ├── RecordForm.tsx
│   │   │   └── AnamneseForm.tsx
│   │   ├── layout/
│   │   │   └── sidebar.tsx     # Sidebar + bottom-nav mobile + drawer
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── providers.tsx
│   │   └── theme-toggle.tsx
│   └── lib/
│       ├── cpf.ts              # Validacao CPF Mod-11
│       ├── services.ts         # Servicos pre-definidos
│       ├── utils.ts            # cn() helper
│       ├── validations/        # Schemas Zod
│       └── actions/            # Server actions
├── e2e/                        # Testes Playwright
├── public/                     # Assets estaticos
└── supabase/migrations/        # Migrations SQL
```

## Convencoes de Codigo

### Componentes

```tsx
// Usar shadcn/ui v4 (base-ui)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// NUNCA usar Radix (asChild nao existe)
// CORRETO:
<SelectTrigger>
  <SelectValue />
</SelectTrigger>

// ERRADO:
<SelectTrigger asChild>
```

### Forms

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { mySchema, MyFormValues } from "@/lib/validations/my-schema"

const form = useForm<MyFormValues>({
  resolver: zodResolver(mySchema),
  defaultValues: { ... },
})

// base-ui Select: onValueChange retorna (string | null, eventDetails)
<Select onValueChange={(value) => {
  if (value) form.setValue("field", value)
}}>
```

### Zod v4

```typescript
import { z } from "zod"

// z.record() requer DOIS argumentos
z.record(z.string(), z.any())

// z.enum() usa { message } nao { required_error }
z.enum(['a', 'b'], { message: "Obrigatorio" })

// .refine() para validacoes customizadas
z.string().refine(val => val.length > 0, "Campo obrigatorio")
```

### Server Actions

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export async function myAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  // Usar public.user_tenant_id() para RLS
  const { data, error } = await supabase
    .from("my_table")
    .select("*")
    // RLS filtra automaticamente por tenant

  if (error) return { error: error.message }
  return { data }
}
```

### Estilo

```tsx
// Tailwind v4
<div className="rounded-xl border bg-card p-6">

// Glassmorphism
<div className="glass-card p-6">
<div className="glass-sidebar">
<div className="glass-header">

// Premium gradient
<div className="bg-premium">
```

## Testes E2E

### Configuracao

```bash
# Variaveis de ambiente para testes
$env:TEST_USER_EMAIL="e2e@test.com"
$env:TEST_USER_PASSWORD="test123456"
```

### Estrutura

```
e2e/
├── helpers.ts              # loginAsTestUser() + seeds
├── auth.spec.ts            # Login/logout
├── signup.spec.ts          # Cadastro
├── dashboard.spec.ts       # Dashboard + logout
├── patients.spec.ts        # Auth redirect
├── patients-crud.spec.ts   # CRUD completo
├── patient-history.spec.ts # Perfil + Evolucoes
├── appointments.spec.ts    # Agenda (CRUD, navegacao, visao)
├── records.spec.ts         # Evolucoes (list + busca)
├── records-crud.spec.ts    # Evolucoes (CRUD)
├── services.spec.ts        # Servicos + kit
├── products.spec.ts        # Produtos + estoque baixo
├── charges.spec.ts         # Financeiro
├── stock.spec.ts           # Estoque
├── settings.spec.ts        # Configuracoes
└── responsive.spec.ts      # Mobile 390px + tablet 768px
```

### Cobertura de viewports

| Largura | Descricao |
|---------|-----------|
| 1280px | Desktop — viewport default do config (todos os specs rodam nela) |
| 390px | Mobile — `responsive.spec.ts` testa overflow horizontal + drawer |
| 768px | Tablet — `responsive.spec.ts` testa overflow + header compacto |

### Rodar

```bash
# Todos
npx playwright test

# Arquivo especifico
npx playwright test e2e/auth.spec.ts

# Modo headed (ver navegador)
npx playwright test --headed

# Debug
npx playwright test --debug
```

### Escrever Testes

```typescript
import { test, expect } from "@playwright/test"

test.describe("Meu Modulo", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("http://localhost:3001/login")
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL!)
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD!)
    await page.click('button[type="submit"]')
    await page.waitForURL("**/dashboard")
  })

  test("deve carregar a pagina", async ({ page }) => {
    await page.goto("http://localhost:3001/my-module")
    await expect(page.locator("h1")).toBeVisible()
  })
})
```

## Debugging

### Erros Comuns

| Erro | Causa | Solucao |
|------|-------|---------|
| `asChild` not found | Usando Radix | Usar shadcn/ui v4 (base-ui) |
| `z.record()` error | 1 argumento | Passar 2 argumentos |
| `onValueChange` error | Tipagem | null-guard: `if (value)` |
| Hydration mismatch | Date.now() no server | Usar useEffect |
| 401 Supabase | Env errada | Verificar .env.local |

### Ferramentas

- **React DevTools:** Ver component tree
- **Supabase Dashboard:** Ver dados, RLS logs
- **Playwright Inspector:** Debug testes
- **VS Code:** Breakpoints no server actions

## Git

### Branches

- `main` — producao, deploy automatico
- `feature/*` — novas funcionalidades
- `fix/*` — correcoes de bugs

### Commits

```
feat: add payment module
fix: resolve RLS policy issue
docs: update LGPD terms
refactor: extract signature component
test: add appointment E2E tests
```

### Workflow

```bash
# Criar feature
git checkout -b feature/payment-module

# Trabalhar
git add .
git commit -m "feat: add payment module"

# Push + PR
git push origin feature/payment-module

# Deploy automatico apos merge no main
```
