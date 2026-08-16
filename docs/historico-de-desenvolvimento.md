---
tags: [k2-sync, changelog]
---

# Histórico de Desenvolvimento

> Log cronológico de tudo que foi feito no K2-Sync. Veja também [[decisoes]], [[handoff-ia]] e [[desenvolvimento]].

## Rodada mais recente — Refinamento visual (interface-design)

**Status: verde** — tsc limpo, lint 0 erros, build OK (18 rotas), Playwright **68 passed + 3 flaky** (todos passam no retry). Backup git: `backup-2026-08-15` (`af4f4de`).

### O que foi feito

1. **Fontes** — troca de Inter por **Sora** (títulos, `--font-heading`) + **Manrope** (corpo, `--font-sans`) via `next/font/google` no root `layout.tsx`; `globals.css` aponta `--font-heading` para a variável do loader; `page-header.tsx` com h1 em `font-heading`.
2. **StatCard** — número herói `text-[28px] font-heading font-bold` + `tabular-nums`, ícone `h-10 w-10 rounded-xl` com `h-5 w-5`, `gap-3`, valor com `mt-auto`.
3. **Dashboard** — banner harmonizado (`md:flex-row`, h1 `font-heading`, mensagem `text-pretty`); "Agenda de Hoje" com grid `grid-cols-[auto_1fr]` no mobile (hora `w-12`, nome + serviço com dot colorido, StatusBadge em `col-start-2`; `sm:flex` com badge `sm:ml-auto`); "Ações Rápidas" com ícone `h-9 w-9` e `gap-3`.
4. **Agenda reescrita** (`appointments/page.tsx`) — **removidos**: calendário em grade (botões dos dias), barra do mês, `DateStrip`, estado `mobileCalendarOpen`, helpers `WEEKDAYS/getDaysInMonth/getFirstDayOfMonth/hasAppointmentsOnDay/prevMonth/nextMonth`. **Adicionados**: `toDateInputValue`, `handleDateChange`, `mobileServicesOpen`.
   - Navegação: `[‹] [›]` + rótulo da janela + contador `<p>N agendamento(s)</p>` + botão **"Ir para hoje"** + `<input type="date">`.
   - Seletor **Dia/Semana/Mês** em `<select>` ("Visão da agenda") na barra de filtros.
   - Card de sessão: grid `grid-cols-[auto_1fr]` no mobile — coluna esquerda com hora + data curta `dd/MM`, conteúdo com **nome, serviço (dot colorido) e metas** sempre visíveis; rodapé `border-t` com status + botão WhatsApp.
   - "Serviços no mês": coluna lateral (desktop) + colapsável (mobile).
5. **E2E** — novo teste "view selector and date input work" em `appointments.spec.ts`; `auth.spec.ts` passou a usar `getByTitle('Sair do Sistema')` (botão do header) por causa do overlay `<nextjs-portal>` que intercepta o dropdown do rodapé da sidebar.
6. **Screenshots** para revisão visual em `frontend/test-results/` (`shot-dashboard-*.png`, `shot-agenda-*.png` em desktop 1280 e mobile 390).

## Rodada anterior — Renomeação "Prontuários" → "Evoluções" + melhorias de pacientes

- UI renomeada em `records/page.tsx`, `RecordForm.tsx`, `patients/[id]/page.tsx`, sidebar/bottom-nav e specs (`records`, `records-crud`, `patient-history`, `dashboard`).
- `patients/page.tsx`: nome do paciente como link para o perfil; botões **Perfil → Evolução** (`?tab=history`) no card e na tabela.
- `PatientForm.tsx`: grids responsivos, labels acentuados (Gênero, Profissão, Endereço, Observações, Contato de Emergência, São Paulo), dialog de criação `sm:max-w-xl` com scroll interno.

## Rodadas anteriores (histórico git)

- **Financeiro** — contas a receber/pagar + cobranças (`/financial/*`), migrações `create_financial_entries`, `create_financial_categories`, `add_appointment_id`, `financial_patient_and_rls_fixes`.
- **Serviços** — CRUD + kit editor (`/services`), tabela `services` + `add_commission_to_appointments`.
- **Produtos/Estoque** — `/products` (alerta de estoque baixo) e `/stock` (reposição, histórico), migração `create_products_stock`.
- **Agenda com WhatsApp** — integração de mensagens via WhatsApp, cards de sessão, depósitos.
- **Autenticação multi-tenant** — Supabase Auth, RPC `create_tenant_for_user` (secure), RLS profile-based (`user_tenant_id()`), migrations numeradas.
- **Anamnese LGPD** — 5 passos, assinatura digital, consentimento LGPD, armazenamento em JSONB.
- **Evoluções (prontuário)** — CRUD com categorias, `medical_records`.
- **Pacientes** — CRUD completo com CPF, endereço, contato de emergência.
- **Interface** — re-design "Estúdio de Bem-Estar" (sálvia + dourado), glassmorphism, bottom-nav mobile, drawer determinístico.
- **Testes** — suíte E2E completa: 15 specs, responsividade em 390/768/1280px, helpers de login/seeds.

## Próximos passos sugeridos

- Validar visualmente os screenshots em `frontend/test-results/`.
- Novas telas/módulos: relatórios, pagamento online, exportação, agenda por profissional.
- Revisar arquivos órfãos: `src/components/ui/date-strip.tsx` (não usado desde a nova agenda).