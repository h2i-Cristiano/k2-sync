<!-- BEGIN:k2sync-agent-rules -->
# K2-Sync — Regras para Agentes de Codigo

## Stack — NAO assuma nada

Este projeto usa tecnologias com QUEBRAS DE API. Leia antes de escrever codigo.

### Next.js 16
- App Router (NAO Pages Router)
- `useSearchParams()` deve ser wrapped em `<Suspense>`
- Middleware usa convencao deprecada (funciona mas avisa)
- Server Components sao o padrao

### shadcn/ui v4 (base-ui, NAO Radix)
- `asChild` NAO EXISTE — usar `render` prop
- Select `onValueChange` retorna `(value: string | null, eventDetails)` — sempre null-guard
- Use `render` prop para customizar triggers
- Componentes: `src/components/ui/`

### Zod v4
- `z.record()` requer DOIS argumentos: `z.record(z.string(), z.any())`
- `z.enum()` segundo parametro usa `{ message: "..." }` NAO `{ required_error: "..." }`
- Schemas: `src/lib/validations/`

### Tailwind v4
- Utility classes glassmorphism: `glass`, `glass-card`, `glass-sidebar`, `glass-header`
- `bg-premium` para gradiente premium
- Border radius: `rounded-xl` (12px)

### Supabase
- Client: `createClient()` from `@supabase/ssr`
- Server Actions: `src/lib/actions/`
- RLS: usar `public.user_tenant_id()` para buscar tenant_id (NAO do JWT)
- NUNCA criar funcoes no schema `auth` via SQL Editor (permission denied)

### Playwright (E2E)
- 35 testes em `frontend/e2e/`
- User: `e2e@test.com` / `test123456`
- Rodar: `npx playwright test`

## Convencoes

- Componentes: `src/components/ui/` (genericos) e `src/components/forms/` (dominio)
- Forms: react-hook-form + Zod, um schema por entidade
- Server Actions: uma arquivo por entidade em `src/lib/actions/`
- Git commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- NUNCA commitar `.env.local` ou secrets
<!-- END:k2sync-agent-rules -->
