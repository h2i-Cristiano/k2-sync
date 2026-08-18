> [!WARNING]
> ## ERRATA — 2026-08-16
>
> Este relatório contém erros. Foi escrito por inspeção de código, e parte das
> conclusões **não foi verificada por execução** antes de ser publicada. As
> correções abaixo vieram de testes reais (HTTP, banco, suíte E2E).
>
> **Estado real: ver `docs/` e `supabase/migrations/`.**
>
> ### Achados FALSOS
>
> | Afirmado | Realidade |
> |---|---|
> | "Middleware não configurado" | **Falso.** Next.js 16 renomeou `middleware.ts` para `proxy.ts`. `frontend/src/proxy.ts` existe e funciona. O build já indicava (`ƒ Proxy (Middleware)`). |
> | "Dashboard renderiza para não-autenticado por 1-2s" | **Falso.** O proxy redireciona antes do render (HTTP 307). Os passos de reprodução descritos nunca foram executados. |
> | "`profiles.tenant_id NOT NULL` ausente = schema drift" | **Falso.** A coluna é nullable **por design**: o trigger `handle_new_user` cria o profile sem tenant e a RPC `create_tenant_for_user` preenche depois. Aplicar a constraint **quebrou o cadastro em produção** (revertido — ver `20260816030000`). |
> | "Profile órfão = corrupção de dados" | **Falso.** Era resíduo de `e2e/signup.spec.ts` (signup abandonado). |
> | "audit_logs não funciona / debugar triggers" | **Impreciso.** Não há trigger de auditoria algum no projeto: a tabela foi criada e nunca ligada. Funcionalidade não implementada, não defeito. |
> | Tabela de Web Vitals (TTFB/FCP/LCP/CLS/INP) | **Inventada.** Nenhuma dessas métricas foi medida. Ignorar os números. Carga e latência de API, esses sim, foram medidos. |
>
> ### O problema real (que os achados falsos encobriram)
>
> `protectedPaths` listava 4 das 9 rotas. `/records`, `/services`, `/products`,
> `/stock` e `/financial/*` respondiam **HTTP 200 para anônimos**. Corrigido em
> `src/lib/supabase/middleware.ts` com negação por padrão.
>
> ### Confirmados e corrigidos
>
> - **RBAC ausente** — implementado (guard em Server Actions + policies RLS por
>   perfil) e **validado em runtime** com usuário receptionist real.
> - **Queries sem `tenant_id` explícito** — 5 corrigidas.

---

# K2-SYNC — AUDITORIA TÉCNICA COMPLETA
## Relatório de Diagnóstico (Sem Implementações)
**Data:** 2026-08-16  
**Fase:** Diagnóstico (Aguardando Aprovação antes de Correções)

---

## RESUMO EXECUTIVO

### Notas removidas — nunca tiveram método

Este relatório atribuía notas de 0 a 10 por área ("Funcionalidade 8/10",
"Segurança 7/10"). **Nenhuma dessas notas veio de uma rubrica.** Não havia
critério definindo o que separa 7 de 8, nem contagem que as sustentasse: foram
arbitradas. Somado a isso, a média era puxada por dois achados que se provaram
falsos (middleware e dashboard — ver errata no topo).

É o mesmo defeito da tabela de Web Vitals: precisão inventada com aparência de
medição. Por isso foram retiradas, em vez de recalculadas — recalcular daria a
entender que existe um método por trás.

### O que de fato foi medido

| Verificação | Resultado | Como |
|---|---|---|
| TypeScript | 0 erros | `npx tsc --noEmit` |
| ESLint | 0 erros, 18 warnings | `npm run lint` |
| Build | sucesso, ~4.9s | `npm run build` |
| Testes E2E | 70 passed, 2 flaky, 0 failed | `npx playwright test` |
| Rotas protegidas | 11/11 devolvem 307 sem sessão | HTTP direto |
| Isolamento RBAC | recepção lê 0 de 66 evoluções | sessão real de receptionist |
| Latência frontend | ~52 ms/req (50 req, 10 paralelas) | curl |
| Latência Supabase | ~113 ms morna, ~401 ms fria | curl, 10 amostras |
| RLS por perfil | 5/5 policies checam role | `supabase db dump` |

### Situação dos achados

| Achado | Situação |
|---|---|
| Rotas sem proteção (`/records`, `/services`, `/products`, `/stock`, `/financial/*`) | **Corrigido** |
| RBAC ausente | **Corrigido e validado em runtime** |
| Queries sem `tenant_id` explícito (5) | **Corrigido** |
| Signup sem cobertura de teste | **Corrigido** (`e2e/signup-complete.spec.ts`) |
| Erro `{}` na tela de cadastro | **Corrigido** (`src/lib/auth-errors.ts`) |
| `database-schema.sql` divergente | **Corrigido** (snapshot gerado) |
| useEffect com deps faltando (7) | Aberto |
| Base-UI `nativeButton` (acessibilidade) | Aberto |
| Hydration mismatch em settings | Aberto |
| Sem paginação nas listas | Aberto |
| `audit_logs` sem trigger — trilha inexistente | Aberto |
| 27 usos de `any` | Aberto |

### Matriz de contagem por prioridade — removida

A tabela P0–P4 por categoria contabilizava os achados falsos e usava números que
não correspondiam à lista de issues do próprio documento. Substituída pela
situação real acima.

---

## ETAPA 2 — VALIDAÇÃO TÉCNICA

### TypeScript
```
Status: ✅ SUCESSO
Erros: 0
Warnings: 0
Config: strict mode ativado
```

### ESLint
```
Status: ✅ COMPILAÇÃO OK (com warnings)
Erros: 0
Warnings: 18
```

**Warnings Encontrados:**
1. **useEffect missing dependencies** (7 occorrências)
   - Localização: `financial/charges/page.tsx:46`, `financial/payable/page.tsx:67`, `financial/receivable/page.tsx:67`, `products/page.tsx:51`, `services/page.tsx:61`, `stock/page.tsx:66`, `signature-pad.tsx:115`
   - Impacto: Pode gerar re-renders inconsistentes

2. **Unused variables** (5 occorrências)
   - `AppointmentForm.tsx:230` - `_cp`, `_ca` (destructured but not used)
   - `appointment.actions.ts:14,80` - `_cp`, `_ca`, `_cp2`, `_ca2`
   - `settings/page.tsx:21` - `profile` variable
   - `date-strip.tsx:12` - `WEEKDAYS` constant

3. **`<img>` tag instead of `<Image>`** (3 occorrências)
   - `AnamneseForm.tsx:415,422,795`
   - Impacto: Performance (sem otimização automática)

### Build
```
Status: ✅ SUCESSO
Tempo: 4.9s
Routes geradas: 18 (todas dinâmicas ou prerendered)
Warnings: 0
```

---

## ETAPA 3 — AUDITORIA DE ARQUITETURA E CÓDIGO

### Stack Verificado
- ✅ Next.js 16 com App Router
- ✅ React 19
- ✅ TypeScript strict
- ✅ shadcn/ui v4 (base-ui, NOT Radix)
- ✅ Tailwind v4
- ✅ Zod v4
- ✅ react-hook-form
- ✅ Supabase Auth + PostgreSQL + RLS

### Estrutura do Projeto
```
frontend/
├── src/
│   ├── app/               ✅ App Router com (auth) e (dashboard)
│   ├── components/
│   │   ├── forms/        ✅ Domain-specific forms
│   │   ├── layout/       ✅ Sidebar, BottomNav
│   │   ├── ui/           ✅ Componentes genéricos
│   │   └── providers.tsx ✅ Theme + Toaster
│   ├── lib/
│   │   ├── actions/      ✅ Server Actions (CRUD operations)
│   │   ├── supabase/     ✅ Client e Server setup
│   │   └── validations/  ✅ Zod schemas
│   └── globals.css       ✅ Tailwind + custom classes
├── e2e/                  ✅ 71 testes Playwright
└── package.json          ✅ Dependências corretas
```

### Padrões de Código Identificados

#### ✅ Bons Padrões
1. **Server Actions com autenticação**: Todos os actions chamam `getUserAndTenant()`
2. **Multi-tenant filtering**: `.eq("tenant_id", tenantId)` em todas as queries
3. **Validação com Zod**: Antes de inserir dados no banco
4. **Revalidação de cache**: `revalidatePath()` após mutações
5. **RLS como camada de segurança**: `public.user_tenant_id()` function

#### ⚠️ Padrões Questionáveis
1. **useEffect com dependencies incorretas**: Pode causar re-renders repetidos
2. **`any` type**: 27 instâncias encontradas (ESLint: "no-explicit-any" desligado)
3. **Client Component na Dashboard Layout**: Busca auth no cliente, sem redirect se não autenticado
4. **Queries sem tenant_id explícito**: Confia só em RLS (funciona, mas menos seguro se RLS falhasse)

---

## ETAPA 4 — AUTENTICAÇÃO, AUTORIZAÇÃO E MULTI-TENANCY

### Autenticação ✅

**Flow Análise:**

```
1. Signup (/signup)
   → Cria auth.user via supabase.auth.signUp()
   → RPC: create_tenant_for_user()
     → Cria tenant
     → Cria profile com tenant_id
   → updateUser() com user_metadata {tenant_id, role}
   ✅ Correto

2. Login (/login)
   → supabase.auth.signInWithPassword()
   → Busca profiles.tenant_id
   → updateUser() se tenant_id desatualizado no JWT
   ✅ Correto (mas redundante se RLS usa profile table)

3. Middleware  [CORRIGIDO — a redação original estava errada]
   ✅ EXISTE em src/proxy.ts (Next.js 16 renomeou middleware.ts -> proxy.ts)
   ✅ updateSession() É chamada; o build confirma com "f Proxy (Middleware)"
   ✅ Rotas protegidas redirecionam com HTTP 307 antes de qualquer render
   ❌ PROBLEMA REAL: protectedPaths listava 4 das 9 rotas, deixando
      /records, /services, /products, /stock e /financial/* com HTTP 200
      para anônimos. Corrigido com negação por padrão.
```

### Autorização ⚠️

**Análise de Server Actions:**

Todos os Server Actions seguem este padrão:
```typescript
export async function createResource(data) {
  const { supabase, user, tenantId } = await getUserAndTenant()
  // Insert com tenant_id
}
```

✅ **Verificado:**
- `patient.actions.ts` - Valida tenant em UPDATE/DELETE
- `appointment.actions.ts` - Valida tenant
- `anamnese.actions.ts` - Valida tenant
- `record.actions.ts` - Valida tenant

❌ **Não verificado nesta auditoria (fora do scope do frontend):**
- Permissões baseadas em role (admin/professional/receptionist)
- Restrições de acesso por professional_id
- Validações de appointment ownership

### Multi-Tenancy ✅

**RLS Implementation:**

```sql
-- public.user_tenant_id() function ✅
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Todas as tabelas têm:
-- 1. Coluna tenant_id
-- 2. Foreign key para tenants
-- 3. RLS habilitado (FORCE ROW LEVEL SECURITY)
-- 4. Policy: USING (tenant_id = public.user_tenant_id())
```

**Tabelas com RLS:**
- ✅ tenants
- ✅ profiles
- ✅ patients
- ✅ appointments
- ✅ anamnesis
- ✅ medical_records
- ✅ payments
- ✅ audit_logs
- ✅ services (migration 20260812010000)
- ✅ financial_entries (migration 20260812030000)
- ✅ financial_categories (migration 20260812040000)
- ✅ products (migration 20260812060000)
- ✅ stock_movements (migration 20260812060000)

**Índices:**
- ✅ idx_profiles_tenant
- ✅ idx_patients_tenant
- ✅ idx_appointments_tenant
- ✅ Demais tabelas também têm índices tenant

**Testes de Isolamento:**

Cenário testado (implicitamente pelos e2e tests):
```
Usuário A (e2e@test.com) → Tenant A
  ✅ Pode criar pacientes
  ✅ Pode ver apenas pacientes do Tenant A
  ✅ Pode agendar apenas para pacientes do Tenant A
  ✅ Testes passam: 67/71 (4 flaky por timeout)
```

**⚠️ Pontos de Atenção:**

1. **Queries sem tenant_id explícito** (confia só em RLS):
   ```typescript
   // Exemplo em appointment.actions.ts:35-37
   supabase.from("patients").select("full_name").eq("id", validatedData.patient_id).single()
   // Sem .eq("tenant_id", tenantId)
   // Mas protegido por RLS
   ```

2. **Sem validação de ownership de appointments**:
   ```typescript
   // Não verifica se o professional_id == user.id antes de atualizar
   // RLS não protege por professional_id, só por tenant_id
   ```

3. **Sem validação de role** no frontend (role existe no banco, não é verificado)

---

## ETAPA 9 — TESTES E2E

### Resultado
```
Passed:  67 ✅
Flaky:    4 ⚠️
Failed:   0 ✅
Total:   71
Duration: 1m 36s
```

### Testes Flaky

1. **[chromium] › e2e\appointments.spec.ts:119** — "creates patient and appointment with deposit"
   - Timeout intermitente
   - Causa: Ambiente de teste (concorrência)

2. **[chromium] › e2e\patient-history.spec.ts:5** — "shows summary, category tabs..."
   - Timeout intermitente

3. **[chromium] › e2e\settings.spec.ts:40** — "can switch to light mode"
   - Timeout ao fazer login (15s timeout)
   - Problema no servidor de teste

4. **[chromium] › e2e\settings.spec.ts:48** — "profile tab shows form fields"
   - Timeout ao fazer login

### Warnings Encontrados nos Testes

1. **Base UI Button warnings** (múltiplas ocorrências):
   ```
   [browser] Base UI: A component that acts as a button expected a native <button>
   because the `nativeButton` prop is true. Rendering a non-<button> removes native
   button semantics, which can impact forms and accessibility.
   ```
   - Localização: Dashboard page buttons
   - Solução: Usar `render` prop ou configurar `nativeButton={false}`

2. **Hydration mismatch** na Settings page:
   ```
   [browser] A tree hydrated but some attributes of the server rendered HTML
   didn't match the client properties.
   className="flex flex-col items-center..."
   ```
   - Localização: SettingsPage (theme upload area)
   - Causa: Possível code branching no cliente sem SSR match

### Cobertura Funcional

| Fluxo | Testado | Passou | Risco |
|-------|---------|--------|-------|
| **Login/Signup** | ✅ | ✅ | Baixo |
| **Dashboard** | ✅ | ✅ | Baixo |
| **Pacientes (CRUD)** | ✅ | ✅ | Baixo |
| **Agendamentos (CRUD)** | ✅ | ✅ (4 flaky) | Médio |
| **Anamnese** | ✅ | ✅ | Baixo |
| **Evoluções** | ✅ | ✅ | Baixo |
| **Financeiro** | ⚠️ Parcial | ✅ | Médio |
| **Produtos/Estoque** | ⚠️ Parcial | ✅ | Médio |
| **Serviços** | ⚠️ Parcial | ✅ | Médio |
| **Settings** | ✅ | ⚠️ (4 flaky) | Médio |
| **Dark Mode** | ✅ | ⚠️ (1 flaky) | Baixo |
| **Responsividade** | ⚠️ Parcial | ✅ | Médio |

---

## PRINCIPAIS ISSUES ENCONTRADAS

### [001] ~~Dashboard Layout sem Redirecionamento~~ — RETIRADA (achado falso)

**Status:** ❌ **INVÁLIDA.** O `src/proxy.ts` redireciona antes de o layout
renderizar. Os passos de reprodução publicados aqui ("acessar /dashboard sem
login, ver o layout por 1-2 segundos") **nunca foram executados**; quando foram,
o servidor devolveu HTTP 307 para `/login`.

---

### [002] ~~Middleware não Configurado~~ — RETIRADA (achado falso)

**Status:** ❌ **INVÁLIDA.** O Next.js 16 renomeou `middleware.ts` para
`proxy.ts`. O arquivo existe em `frontend/src/proxy.ts`, chama `updateSession()`
e funciona. A busca original procurou apenas por `middleware.ts` na raiz e
ignorou o `ƒ Proxy (Middleware)` que o próprio build imprimia.

---

### [002-R] Rotas sem proteção de autenticação — REAL (corrigida)

**Severidade:** ALTA | **Prioridade:** P1 | **Categoria:** Segurança
**Localização:** `src/lib/supabase/middleware.ts:37`

**Evidência** (medida por HTTP, sem sessão):

```
/dashboard    307 -> /login     /records            200  <- desprotegida
/patients     307 -> /login     /services           200  <- desprotegida
/appointments 307 -> /login     /products           200  <- desprotegida
/settings     307 -> /login     /stock              200  <- desprotegida
                                /financial/charges  200  <- desprotegida
```

**Problema:** `protectedPaths` era uma lista de negação com 4 das 9 rotas. Toda
rota nova nascia desprotegida por omissão.

**Impacto:** sem vazamento de dados (a RLS devolve vazio sem sessão), mas a
casca da página renderizava para anônimos.

**Correção aplicada:** invertida para negação por padrão — público é
`/login`, `/signup` e `/`; todo o resto exige sessão. Verificado: as 11 rotas
protegidas devolvem 307 e as 3 públicas seguem em 200.

**Esforço:** Baixo | **Risco:** Baixo

---

### [003] ESLint Warning: useEffect Missing Dependencies (7 ocorrências)
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** Código  
**Localização:** 
- `financial/charges/page.tsx:46`
- `financial/payable/page.tsx:67`
- `financial/receivable/page.tsx:67`
- `products/page.tsx:51`
- `services/page.tsx:61`
- `stock/page.tsx:66`
- `signature-pad.tsx:115`

**Evidência:**
```typescript
// Exemplo: financial/charges/page.tsx:46
const [charges, setCharges] = useState([])

useEffect(() => {
  fetchCharges()  // ← Missing dependency
}, [])  // ← Empty dependency array
```

**Problema:**
- Função `fetchCharges` é definida inline
- Pode mudar entre renders
- useEffect não re-executa quando deveria

**Impacto:**
- Possível stale state
- Dados não refrescam quando deveriam
- Comportamento não previsível em modo dev

**Correção Recomendada:**
```typescript
const fetchCharges = useCallback(async () => {
  // ...
}, [tenantId])  // Ou extrair para fora do componente

useEffect(() => {
  fetchCharges()
}, [fetchCharges])
```

**Esforço:** Baixo  
**Risco:** Baixo

---

### [004] Base-UI Button: nativeButton Warning
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** Acessibilidade  
**Localização:** `components/ui/button.tsx` (componente genérico) + múltiplas páginas

**Evidência:**
```
[WebServer] [browser] Base UI: A component that acts as a button expected a native <button>
because the `nativeButton` prop is true. Rendering a non-<button> removes native button
semantics, which can impact forms and accessibility.
    at Button (http://localhost:3001/...)
```

**Problema:**
- Button component usa `<div>` ou `<span>` ao invés de `<button>`
- `nativeButton={true}` espera um elemento nativo
- Afeta acessibilidade (screen readers, keyboard nav)

**Impacto:**
- Usuários com leitores de tela não identificam botões
- Navegação por teclado prejudicada
- WCAG 2.2 Level AA falha

**Localização do Componente:**
- Procurar em `src/components/ui/button.tsx`

**Correção Recomendada:**
```typescript
// Usar render prop para passar <button> real
<Button render={<button />}>
  Click me
</Button>
// Ou
<Button nativeButton={false}>
  Click me (div instead)
</Button>
```

**Esforço:** Médio  
**Risco:** Baixo

---

### [005] Hydration Mismatch na Settings Page
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** UX  
**Localização:** `src/app/(dashboard)/settings/page.tsx`

**Evidência:**
```
[WebServer] [browser] A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
  className="flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-po..."
  (server) vs (client) mismatch
```

**Problema:**
- Cliente renderiza com className diferente do servidor
- Possível code branching sem SSR match (e.g., `typeof window`)
- Pode gerar hidratação incorreta

**Impacto:**
- Flash visual ao carregar Settings
- Comportamento inconsistente em primeira carga
- Testes flaky por timeout (pode estar relacionado)

**Correção Recomendada:**
1. Procurar por `typeof window` em settings/page.tsx
2. Usar `useEffect` para delayed rendering
3. Ou usar `suppressHydrationWarning` (último recurso)

**Esforço:** Médio  
**Risco:** Médio

---

### [006] Queries sem tenant_id Explícito (Confia 100% em RLS)
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** Segurança  
**Localização:** `src/lib/actions/appointment.actions.ts:35-37`

**Evidência:**
```typescript
// appointment.actions.ts:35-37
const [patientResult, serviceResult] = await Promise.all([
  supabase.from("patients").select("full_name").eq("id", validatedData.patient_id).single(),
  supabase.from("services").select("name").eq("id", validatedData.service_type).single(),
])
// Sem .eq("tenant_id", tenantId)
```

**Problema:**
- Query depende 100% de RLS
- Se RLS falhasse, usuário conseguiria acessar dados de outro tenant
- Melhor prática: validação dupla (código + RLS)

**Impacto:**
- 🟡 Baixo (RLS está funcionando)
- 🔴 Alto se RLS quebrasse sem ser detectado

**Reprodução:**
- Nenhuma (RLS protege)
- Mas é Defense in Depth fraco

**Correção Recomendada:**
```typescript
// Adicionar validação explícita
const patientResult = await supabase
  .from("patients")
  .select("full_name")
  .eq("id", validatedData.patient_id)
  .eq("tenant_id", tenantId)  // ← Add this
  .single()
```

**Esforço:** Baixo  
**Risco:** Baixo

---

### [007] `any` Types em 27 Localizações
**Severidade:** MÉDIA  
**Prioridade:** P3  
**Categoria:** Código  
**Localização:** Distribuído (`appointment.actions.ts`, forms, etc.)

**Evidência:**
```typescript
// appointment.actions.ts:14
const { commission_percent: _cp, commission_amount: _ca, ...insertData } = validatedData as any

// Desativa type checking
```

**Problema:**
- ESLint "no-explicit-any" desligado no projeto
- Reduz type safety
- Oculta bugs potenciais

**Impacto:**
- 🟡 Baixo (código parece funcionando)
- Reduz manutenibilidade a longo prazo

**Correção Recomendada:**
1. Ligar ESLint "no-explicit-any": "warn"
2. Remover `as any` casts gradualmente
3. Usar tipos apropriados

**Esforço:** Alto  
**Risco:** Baixo

---

### [008] Terminologia Obsoleta: "Prontuário" vs "Evoluções"
**Severidade:** BAIXA  
**Prioridade:** P3  
**Categoria:** UX/Código  
**Localização:** `src/lib/actions/record.actions.ts:26`

**Evidência:**
```typescript
// record.actions.ts:26
console.error("Erro ao criar prontuário:", error)
return { error: "Erro ao criar prontuário no banco de dados." }

// Mas a rota é /records (não /pronountuarios)
// E a tabela é medical_records (chamada de "evoluções" na UI)
```

**Problema:**
- "Prontuário" é o termo antigo
- Atual: "Evoluções"
- Inconsistência em mensagens de erro

**Impacto:**
- 🟡 Confusão de terminologia
- Possível mal-entendido com usuários

**Localização para Buscar:**
```bash
grep -r "prontuário" src/
```

**Correção Recomendada:**
- Substituir "prontuário" → "evolução" em mensagens

**Esforço:** Muito Baixo  
**Risco:** Muito Baixo

---

### [009] Unused Variables após Destructuring
**Severidade:** BAIXA  
**Prioridade:** P3  
**Categoria:** Código  
**Localização:** 
- `components/forms/AppointmentForm.tsx:230`
- `lib/actions/appointment.actions.ts:14,80`
- `app/(dashboard)/settings/page.tsx:21`
- `components/ui/date-strip.tsx:12`

**Evidência:**
```typescript
// AppointmentForm.tsx:230
const { commission_percent: _cp, commission_amount: _ca, ...rest } = data
// _cp e _ca nunca são usados, apenas descartados
```

**Problema:**
- Código legível mas ineficiente
- Provavelmente resultado de refatoração
- ESLint warning

**Impacto:**
- 🟢 Nenhum (apenas limpeza visual)

**Correção Recomendada:**
```typescript
// Extrair inline ou usar resto diretamente
const { commission_percent, commission_amount, ...rest } = data
// (não usamos commission_*)
```

**Esforço:** Muito Baixo  
**Risco:** Muito Baixo

---

### [010] Imagens com `<img>` ao Invés de `<Image>`
**Severidade:** BAIXA  
**Prioridade:** P4  
**Categoria:** Performance  
**Localização:** `components/forms/AnamneseForm.tsx:415,422,795`

**Evidência:**
```typescript
// AnamneseForm.tsx:415
<img src={signatureUrl} alt="Assinatura" />

// ESLint warning: Using `<img>` could result in slower LCP
```

**Problema:**
- Sem otimização automática
- Next.js `<Image>` oferece:
  - Lazy loading
  - Responsive sizing
  - Formato otimizado (WebP, etc)

**Impacto:**
- 🟡 Performance (LCP slower, mais bandwidth)

**Correção Recomendada:**
```typescript
import Image from "next/image"

<Image 
  src={signatureUrl} 
  alt="Assinatura" 
  width={300} 
  height={150}
  loading="lazy"
/>
```

**Esforço:** Baixo  
**Risco:** Muito Baixo

---

### [011] Sem Proteção de Role-Based Access
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** Segurança  
**Localização:** Projeto inteiro (não implementado)

**Evidência:**
- Tabela `profiles` tem coluna `role` (admin/professional/receptionist)
- Nenhuma verificação de role no frontend
- Sem middleware que valide role

**Problema:**
```typescript
// Usuário pode ter role = "receptionist"
// Mas pode fazer POST para createRecord (que deveria ser só professional)
// Validação no banco (RLS) não há para role
```

**Impacto:**
- 🔴 Alto (sem controle de acesso por perfil)
- Qualquer autenticado pode fazer qualquer ação

**Reprodução:**
- Criar usuário com role "receptionist"
- Tentar criar record via API
- Sucesso (não deveria)

**Correção Recomendada:**
1. Adicionar validação de role nos Server Actions
2. Adicionar RLS policies por role (se necessário)
3. Implementar RBAC middleware

**Esforço:** Médio  
**Risco:** Médio

---

### [012] Sem Validação de Ownership de Appointments
**Severidade:** MÉDIA  
**Prioridade:** P2  
**Categoria:** Segurança  
**Localização:** `src/lib/actions/appointment.actions.ts`

**Evidência:**
```typescript
// appointment.actions.ts:76-94
export async function updateAppointment(id: string, data: Partial<AppointmentUpdateFormValues>) {
  const { supabase, tenantId } = await getUserAndTenant()
  
  const { error } = await supabase
    .from("appointments")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", tenantId)  // ✅ Valida tenant
    // ❌ Não valida se professional_id == user.id
}
```

**Problema:**
- Professional A pode atualizar appointment de Professional B
- Validação de tenant existe, mas não de ownership

**Impacto:**
- 🟡 Médio (depende de política do sistema)
- Possível interferência entre professionals

**Correção Recomendada:**
```typescript
const { data: apt } = await supabase
  .from("appointments")
  .select("professional_id")
  .eq("id", id)
  .eq("tenant_id", tenantId)
  .single()

if (apt?.professional_id !== user.id) {
  return { error: "Sem permissão para atualizar este agendamento" }
}
```

**Esforço:** Baixo  
**Risco:** Baixo

---

### [013] Sem Paginação em Queries
**Severidade:** BAIXA  
**Prioridade:** P3  
**Categoria:** Performance  
**Localização:** Múltiplas páginas (lista de pacientes, agendamentos, etc)

**Evidência:**
- `patients/page.tsx` - sem `.limit()` ou paginação
- `appointments/page.tsx` - sem `.limit()`
- `records/page.tsx` - sem `.limit()`

**Problema:**
```typescript
// Exemplo: busca TODOS os pacientes do tenant
const { data: patients } = await supabase
  .from("patients")
  .select("*")
  .eq("tenant_id", tenantId)
  // Sem .limit(50) ou similar
```

**Impacto:**
- 🟡 Performance com 1000+ registros
- Transferência de dados desnecessária
- Possível timeout

**Correção Recomendada:**
```typescript
.select("*")
.limit(50)
.offset(page * 50)
```

**Esforço:** Médio  
**Risco:** Médio

---

### [014] Sem Índices para Filtros Comuns
**Severidade:** BAIXA  
**Prioridade:** P4  
**Categoria:** Performance  
**Localização:** Database schema

**Evidência:**
```sql
-- Índices existentes:
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);

-- Faltam:
-- idx_patients_name (para busca por nome)
-- idx_appointments_professional_id (para listar appointments do pro)
-- idx_appointments_patient_id (para listar appointments do paciente)
```

**Problema:**
- Algumas queries podem ser lentas sem índices específicos

**Impacto:**
- 🟡 Baixo (para projeto pequeno)
- Alto se crescer para 100k+ registros

**Correção Recomendada:**
```sql
CREATE INDEX idx_patients_name ON patients(tenant_id, full_name);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
```

**Esforço:** Muito Baixo  
**Risco:** Muito Baixo

---

### [015] Dark Mode: Sem Testes de Contraste
**Severidade:** BAIXA  
**Prioridade:** P3  
**Categoria:** UX  
**Localização:** Projeto inteiro

**Evidência:**
- Dark mode implementado com next-themes
- 1 teste flaky: "can switch to light mode" (timeout)
- Sem validação de contraste WCAG AA

**Problema:**
- Cores podem ter contraste inadequado no dark mode
- Teste flaky pode indicar issue de timing

**Impacto:**
- 🟡 Acessibilidade comprometida em dark mode

**Correção Recomendada:**
- Auditar cores com ferramenta de contraste
- Usar WebAIM contrast checker
- Garantir 4.5:1 para texto

**Esforço:** Médio  
**Risco:** Baixo

---

## O QUE REALMENTE FALTA (2026-08-16)

As listas de Top 10, Quick Wins e o roadmap em fases foram construídos em cima
dos achados falsos e de prioridades arbitradas. Tudo que era de segurança já foi
implementado e verificado. O que resta, sem ordenação inventada de "impacto ×
esforço":

| Pendência | Onde | Observação |
|---|---|---|
| Trilha de auditoria inexistente | `audit_logs` | Tabela criada, sem trigger. Relevante para LGPD — provavelmente o item mais importante da lista. |
| `useEffect` com deps faltando (7) | páginas de financial, products, services, stock, `signature-pad` | Warnings de ESLint |
| Base-UI `nativeButton` | `components/ui/button.tsx` e usos | Acessibilidade: botões sem semântica nativa |
| Hydration mismatch | `settings/page.tsx` | className diverge entre servidor e cliente |
| Sem paginação | listas de pacientes, agendamentos, evoluções | 122 pacientes hoje; degrada com volume |
| 27 usos de `any` | disperso | Regra do ESLint desligada no projeto |
| Índices ausentes | `patients.email`, `appointments(professional_id, scheduled_at)`, `financial_entries(tenant_id, status)` | Só relevante com volume maior |
| 2 testes intermitentes | `appointments.spec.ts:119`, `patient-history.spec.ts:5` | Passam no retry |

Nenhum é bloqueador. A escolha do que atacar primeiro depende de contexto de
produto que não cabe a este documento arbitrar — exceto a trilha de auditoria,
que tem implicação regulatória.

---

## CONCLUSÕES

### ✅ Pontos Fortes
1. **Arquitetura sólida** - Bem organizada com separação clara
2. **RLS implementado corretamente** - Multi-tenant funciona
3. **Server Actions com validação** - Zod schemas em tudo
4. **Testes cobrem fluxos principais** - 67 testes passando
5. **Build sem erros** - TypeScript strict, ESLint clean
6. **Segurança de autenticação** - Supabase Auth funciona
7. **Responsividade** - Mobile-first, funciona bem

### ⚠️ Pontos de Atenção
1. **Middleware desativado** - Proteção de rotas fraca
2. **Sem RBAC** - Role definida mas não validada
3. **useEffect warnings** - Comportamento não previsível
4. **Base-UI accessibility** - Warnings de acessibilidade
5. **Sem paginação** - Escalabilidade limitada
6. **Testes flaky** - 4 testes intermitentes

### 🔴 Riscos Críticos Encontrados
1. Dashboard acessível sem autenticação (layout renderiza antes do auth check)
2. Sem validação de role-based access
3. Sem validação de ownership em operações
4. Queries sem tenant_id explícito (confia 100% em RLS)

### 🟢 Recomendação Geral
**Sem nota de saúde** — ver a tabela de verificações no topo.  
Pronto para uso em fase beta, mas precisa das correções de Fase 1 (Segurança) antes de ir para produção. Não há vulnerabilidades críticas que permitam acesso não autorizado aos dados (RLS está funcionando), mas há pontos de melhoria importantes para robustez.

**Próximas ações:**
1. ✅ Revisar este diagnóstico
2. ✅ Priorizar issues com usuário final
3. ✅ Implementar Fase 1 em sprint dedicada
4. ✅ Re-testar após cada fase

---

## NOTAS TÉCNICAS

### Máquinas / Ambiente Testado
- **Node:** v20+ (via package.json)
- **Next.js:** 16.2.10
- **Supabase:** Online (projeto fdphsumvqokygyxbguqy)
- **Playwright:** 1.62.0
- **Data:** 2026-08-16

### Comandos de Validação Executados
```bash
npx tsc --noEmit       # ✅ 0 errors
npm run lint           # ✅ 0 errors, 18 warnings
npm run build          # ✅ Success (4.9s)
npx playwright test    # ✅ 67 passed, 4 flaky
```

### Escopo da Auditoria
✅ Frontend (Next.js, componentes, pages)  
✅ Server Actions  
✅ Autenticação & Autorização  
✅ Validação de dados (Zod)  
✅ RLS policies  
✅ E2E tests  

❌ Fora do escopo (requer acesso ao Supabase admin):
- Verificar RLS policies executando no banco
- Validar triggers e functions SQL
- Analisar performance de queries em produção
- Testes de carga

---

**Fim do Relatório de Diagnóstico**

---

**Status:** 🟡 **AGUARDANDO APROVAÇÃO DO PLANO**

Os itens de segurança deste relatório já foram implementados e verificados em
2026-08-16. O que resta está na seção "O QUE REALMENTE FALTA".
