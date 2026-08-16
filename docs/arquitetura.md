# Arquitetura Tecnica

## Visao Geral

O K2-Sync segue a arquitetura **Next.js App Router** com Server Components, Server Actions e Supabase como backend completo.

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │ Dashboard│  │   Pacientes      │  │
│  │  (login/ │  │  (stats) │  │  (CRUD + perfil) │  │
│  │  signup) │  │          │  │                  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│  ┌────┴──────────────┴─────────────────┴──────────┐ │
│  │              Server Actions (lib/actions/)      │ │
│  │  patient.actions  appointment.actions  ...      │ │
│  └────────────────────┬───────────────────────────┘ │
│                       │                             │
│  ┌────────────────────┴───────────────────────────┐ │
│  │              Supabase Client                    │ │
│  │  createClient() from @supabase/ssr             │ │
│  └────────────────────┬───────────────────────────┘ │
└───────────────────────┼─────────────────────────────┘
                        │ HTTPS
┌───────────────────────┼─────────────────────────────┐
│                Supabase (Backend)                    │
│  ┌──────────┐  ┌──────┴──────┐  ┌────────────────┐ │
│  │   Auth   │  │  PostgreSQL │  │    Storage     │ │
│  │ (JWT +   │  │  (RLS +     │  │  (avatars,     │ │
│  │  users)  │  │   policies) │  │   patients)    │ │
│  └──────────┘  └─────────────┘  └────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Padroes de Codigo

### Componentes

- **UI Library:** shadcn/ui v4 (base-ui), NUNCA Radix
- **Convencao:** Componentes em `src/components/ui/` (genericos) e `src/components/forms/` (especificos de dominio)
- **Props:** Interface explicita, sem `any`
- **Estilo:** Tailwind v4, `rounded-xl` para bordas, utility classes glassmorphism

### Forms

- **Lib:** react-hook-form + Zod v4
- **Schema:** Um arquivo por entidade em `src/lib/validations/`
- **Validacao:** `zodResolver(schema)` no `useForm`
- **Submit:** Server actions em `src/lib/actions/`
- **base-ui Select:** `onValueChange` retorna `(value: string | null, eventDetails)` — sempre null-guard

### Server Actions

- **Localizacao:** `src/lib/actions/`
- **Padrao:** Funcoes `use server` com `supabase.auth.getUser()` para auth
- **RLS:** Usar `public.user_tenant_id()` para buscar tenant_id do profile (NAO do JWT)
- **Retorno:** `{ data, error }` — sempre verificar error antes de usar data

### Validacoes (Zod v4)

```typescript
// z.record() requer DOIS argumentos
z.record(z.string(), z.any())

// z.enum() usa { message } nao { required_error }
z.enum(['a', 'b'], { message: "Obrigatorio" })
```

### Estilo Visual

```css
/* Utility glassmorphism */
.glass         /* fundo glass generico */
.glass-card    /* card com efeito glass */
.glass-sidebar /* sidebar com glass */
.glass-header  /* header com glass */
.bg-premium    /* gradiente premium */
```

### Design System (rodada interface-design)

- **Fontes**: `Sora` para títulos (`--font-heading`, ex.: h1 do page-header) e `Manrope` para corpo (`--font-sans`), via `next/font/google` no root `layout.tsx`. Números usam `tabular-nums`.
- **Tokens**: `--font-heading` definido no `globals.css` apontando para a variável gerada pelo font loader; classes `font-heading` / `font-sans`.
- **Identidade**: paleta sálvia + dourado; a **cor do serviço** é a assinatura visual (dot colorido + borda esquerda do card de sessão).
- **Componentes-chave**:
  - `stat-card.tsx` — número herói 28px `font-heading` + ícone `h-10 w-10 rounded-xl`.
  - `page-header.tsx` — h1 com `font-heading`.
  - Agenda em modo lista (sem calendário) — ver `desenvolvimento.md` / `decisoes.md`.
- Todo trabalho de UI segue a skill `.agents/skills/interface-design/SKILL.md`.

## Fluxos Principais

### Fluxo de Autenticacao

```
1. Usuario preenche login/signup
2. supabase.auth.signInWithOAuth() / signUp()
3. Middleware intercepta → refresh session
4. Login: sync tenant_id para JWT via getProfile()
5. Signup: create_tenant_for_user() RPC → tenant + profile
6. Redirect para /dashboard
```

### Fluxo Multi-Tenant

```
1. Login → profile.busca tenant_id
2. JWT atualizado com tenant_id
3. Toda query usa RLS policy: tenant_id = user_tenant_id()
4. user_tenant_id() busca no profiles (NAO no JWT)
5. Dados isolados por tenant
```

### Fluxo Anamnese

```
1. Paciente selecionado → /patients/[id]/anamnese
2. Step 1: Queixa Principal
3. Step 2: Saude
4. Step 3: Habitos
5. Step 4: Expectativas
6. Step 5: Consentimento LGPD
   ├── Termos scrollaveis (11 secoes)
   ├── Checkbox: "Li e compreendo"
   ├── Termos marketing (9 secoes)
   ├── Checkbox: "Autorizo uso de imagem" (OPCIONAL)
   ├── Assinatura digital (canvas API)
   ├── CPF com auto-formatting
   └── Foto com carimbo de data/hora
7. Submit → server action → Supabase
```

## Convencoes de Arquivos

| Padrao | Exemplo |
|--------|---------|
| Pages | `src/app/(dashboard)/patients/page.tsx` |
| Layouts | `src/app/(dashboard)/layout.tsx` |
| Forms | `src/components/forms/PatientForm.tsx` |
| UI | `src/components/ui/button.tsx` |
| Schemas | `src/lib/validations/patient.ts` |
| Actions | `src/lib/actions/patient.actions.ts` |
| Migrations | `supabase/migrations/YYYYMMDDHHMMSS_descricao.sql` |
| Tests | `frontend/e2e/patients-crud.spec.ts` |

## Seguranca

- **RLS:** Todas as tabelas com `ENABLE ROW LEVEL SECURITY` + `FORCE`
- **Auth:** Supabase Auth com JWT tokens
- **Tenant Isolation:** `user_tenant_id()` function busca profile
- **Storage:** Buckets privados com policies por tenant
- **HTTPS:** Vercel force HTTPS
- **Secrets:** Nunca commitar `.env.local` (no .gitignore)
