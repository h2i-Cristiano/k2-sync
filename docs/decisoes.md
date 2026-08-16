---
tags: [k2-sync, decisoes, adr]
---

# Decisões de Arquitetura e Produto

> Registro de decisões (ADR) tomadas ao longo do projeto. Formato: contexto → decisão → consequência. Veja também [[historico-de-desenvolvimento]] e [[arquitetura]].

## ADR-001 — Agenda em modo lista (sem calendário em grade)

- **Contexto:** a agenda tinha um calendário em grade (botões de dias) + barra do mês + strip de datas. O usuário achou poluído e pediu layout compacto/limpo, com foco nos dados principais (nome, data, serviço) sempre visíveis.
- **Decisão:** modo **lista** fixo. Navegação prev/next + rótulo da janela + botão "Ir para hoje" + `<input type="date">`. Seletor Dia/Semana/Mês em `<select>` na barra de filtros. "Serviços no mês" na coluna lateral (desktop) e colapsável (mobile). Card de sessão com grid `[auto_1fr]` (hora + data curta à esquerda; nome + serviço + metas; rodapé com status + WhatsApp).
- **Consequência:** UI mais compacta; `DateStrip` ficou sem uso (candidato a remoção); specs e2e de navegação adaptadas; smoke test novo para `<select>` de visão e input de data.

## ADR-002 — Tipografia Sora + Manrope

- **Contexto:** fontes anteriores (Inter) sem hierarquia clara; pedido de fontes modernas e intuitivas.
- **Decisão:** **Sora** para títulos (`--font-heading`) e **Manrope** para corpo (`--font-sans`), via `next/font/google` no root layout. Números com `tabular-nums`.
- **Consequência:** hierarquia visual mais forte; títulos do `page-header` e números heróis (`stat-card`) usam `font-heading`.

## ADR-003 — "Prontuários" → "Evoluções"

- **Contexto:** o termo "Prontuários" era pesado e fora do vocabulário do nicho (massoterapia/estética).
- **Decisão:** renomear para **Evoluções** na UI (rota `/records` mantida). Cada evolução é um registro de sessão; usa `created_at` como data/hora (sem migração de schema).
- **Consequência:** specs e2e renomeados/atualizados; sidebar/bottom-nav/command palette atualizados.

## ADR-004 — Multi-tenant profile-based (RLS)

- **Contexto:** isolamento por tenant no primeiro login falhava ao usar tenant_id do JWT (sessões desatualizadas).
- **Decisão:** `public.user_tenant_id()` busca o tenant no `profiles` (não no JWT); todas as queries dependem da RLS; `create_tenant_for_user` com `ON CONFLICT DO UPDATE`.
- **Consequência:** isolamento robusto; server actions autenticam com `supabase.auth.getUser()` e deixam a filtragem para a RLS.

## ADR-005 — shadcn/ui v4 (base-ui), nunca Radix

- **Contexto:** o projeto usa shadcn v4 com base-ui como primitivas; Radix (com `asChild`) não existe nessa stack.
- **Decisão:** usar apenas componentes shadcn v4/base-ui. `Select` retorna `(string | null, eventDetails)` — sempre `null-guard`.
- **Consequência:** códigos com `asChild` ou imports de Radix quebram; validar com `npx tsc --noEmit` e `npm run lint`.

## ADR-006 — Zod v4 (API atual)

- **Contexto:** Zod v4 mudou APIs em relação à v3.
- **Decisão:** `z.record()` com **2 argumentos**; `z.enum([...], { message })` (não `required_error`).
- **Consequência:** erros de tipagem se o padrão v3 for usado.