-- RBAC: restringe LEITURA de dado clinico por perfil.
--
-- Contexto: as paginas /records e /patients/[id] consultam medical_records e
-- anamnesis direto do cliente, com a sessao do proprio usuario. A policy atual
-- so filtra por tenant, entao qualquer perfil autenticado do tenant le tudo.
-- Bloquear apenas as Server Actions impede a escrita, mas nao a leitura.
--
-- Regra aprovada:
--   admin        -> tudo
--   professional -> tudo, exceto configuracao do tenant
--   receptionist -> agenda, pacientes, financeiro, estoque
--                   SEM evolucoes (medical_records) e SEM anamnese
--
-- Aprovada pelo usuario em 2026-08-16.
--
-- Reversao, se precisar soltar a restricao por perfil:
--   DROP POLICY medical_records_tenant_isolation ON medical_records;
--   CREATE POLICY medical_records_tenant_isolation ON medical_records
--     FOR ALL USING (tenant_id = public.user_tenant_id());
--   (idem para anamnesis)

-- Helper: role do usuario atual, no mesmo padrao de public.user_tenant_id().
-- SECURITY DEFINER porque profiles tem RLS; STABLE para o planner cachear.
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- =============================================
-- MEDICAL RECORDS (Evolucoes)
-- =============================================
DROP POLICY IF EXISTS medical_records_tenant_isolation ON medical_records;

CREATE POLICY medical_records_tenant_isolation ON medical_records
  FOR ALL
  USING (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  )
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  );

-- =============================================
-- ANAMNESIS
-- =============================================
DROP POLICY IF EXISTS anamnesis_tenant_isolation ON anamnesis;

CREATE POLICY anamnesis_tenant_isolation ON anamnesis
  FOR ALL
  USING (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  )
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  );

-- Nota: o WITH CHECK explicito acima nao corrige nenhuma falha anterior. Numa
-- policy FOR ALL sem WITH CHECK o Postgres reaproveita o USING na escrita, ou
-- seja, as policies originais ja barravam INSERT/UPDATE cross-tenant. Esta
-- explicito apenas para deixar a intencao legivel.
