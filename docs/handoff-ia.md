---
tags: [k2-sync, handoff, ia]
---

# Handoff para ferramentas de IA

> Guia para retomar o trabalho no K2-Sync com **qualquer** ferramenta de IA (opencode, Cursor, Windsurf, Claude Code, Codex, etc.). Leia este arquivo antes de começar a programar.

## 1. Como a ferramenta de IA enxerga o projeto

O arquivo **`AGENTS.md`** na raiz do repositório (`D:\K2-Sync\AGENTS.md`) é lido automaticamente pelas principais ferramentas de IA ao abrir o projeto. Ele contém: o que é o projeto, stack, comandos, convenções críticas, design system, mapeamento de módulos e estado atual.

Para ferramentas que não leem `AGENTS.md` automaticamente (ou se quiser reforçar), **cole o conteúdo do `AGENTS.md` na primeira mensagem** junto com: *"Leia AGENTS.md e docs/handoff-ia.md e docs/historico-de-desenvolvimento.md antes de qualquer alteração."*

## 2. Onde está tudo

| Assunto | Arquivo |
|---------|---------|
| Onboarding para IA | `AGENTS.md` (raiz) |
| Guia de retomada (este) | `docs/handoff-ia.md` |
| Log do que já foi feito | `docs/historico-de-desenvolvimento.md` |
| Decisões (ADR) | `docs/decisoes.md` |
| Arquitetura | `docs/arquitetura.md` |
| Banco de dados | `docs/banco-de-dados.md` |
| Deploy / CI/CD | `docs/deploy.md` |
| LGPD | `docs/lgpd.md` |
| Guia de desenvolvimento | `docs/desenvolvimento.md` |
| Skill de UI | `.agents/skills/interface-design/SKILL.md` |
| Migrations | `supabase/migrations/` (16 arquivos) |
| Specs E2E | `frontend/e2e/` |

## 3. Passos para retomar (checklist)

1. **Leia** `AGENTS.md` + `docs/handoff-ia.md` + `docs/historico-de-desenvolvimento.md`.
2. **Rode os comandos de verificação** em `frontend/`: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npx playwright test`.
3. **Suba o dev server** na porta 3001 (`npm run dev`).
4. **Valide o estado atual** contra o que está documentado no `historico-de-desenvolvimento.md`.
5. **Escolha o próximo passo** (ver sugestões abaixo) e confirme com o usuário antes de implementar.

## 4. Armadilhas comuns (não repetir)

- **NUNCA usar Radix / `asChild`** — o projeto usa shadcn v4 (base-ui).
- **NUNCA ler tenant_id do JWT** — usar `public.user_tenant_id()` (profile-based).
- **Zod v4**: `z.record()` com 2 argumentos; `z.enum([...], { message })`.
- **UTF-8**: não usar `Set-Content`/`Out-File` do PowerShell com acentos (corrompe para `�`). Usar `edit`/`write` ou `[IO.File]::WriteAllText`.
- **Rota de login é `/login`** (não `/auth/login`).
- **Flakiness e2e** de CRUD (timing de replicação do Supabase sob workers paralelos) é conhecida e passa no retry — não "consertar".
- **Logout em teste**: usar `getByTitle('Sair do Sistema')` (botão do header), pois o overlay de dev do Next intercepta o dropdown do rodapé da sidebar.
- **Texto pt-BR acentuado**: "Evoluções", "Pacientes", "Duração" etc.

## 5. Estado atual (última rodada, verde)

- tsc limpo, lint 0 erros (warnings pré-existentes ok), build OK (18 rotas), Playwright **68 passed + 3 flaky** (todos passam no retry).
- Última rodada: fontes Sora/Manrope, dashboard harmonizado, agenda sem calendário (lista + select Dia/Semana/Mês + input de data), card de sessão com tríade nome/data/serviço.
- Backup git: tag `backup-2026-08-15` (`af4f4de`).
- Screenshots de revisão visual: `frontend/test-results/shot-*.png`.

## 6. Próximos passos sugeridos

- Revisão visual dos screenshots (390 / 768 / 1280, claro/escuro).
- Módulos novos: relatórios, exportação, pagamento online, agenda por profissional, lembretes automáticos.
- Remover código órfão: `frontend/src/components/ui/date-strip.tsx`.
- Melhorar cobertura e2e: viewport de largura extra (ex.: 798px) se houver device alvo.

## 7. Regra de ouro

**Nunca altere código sem rodar `npx tsc --noEmit` + `npm run lint` + `npm run build` depois, e rodar o Playwright completo antes de dizer que terminou.**