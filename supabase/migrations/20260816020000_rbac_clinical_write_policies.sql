-- Correcao de 20260816000000_rbac_clinical_access.sql.
--
-- Aquela migration adicionou a checagem de role apenas em
-- medical_records_tenant_isolation, sem perceber que 20260812070000 dividiu a
-- tabela em quatro policies. No Postgres, policies PERMISSIVE na mesma tabela
-- combinam com OR: as tres policies de escrita (sem checagem de role) davam
-- TRUE por conta propria, entao receptionist seguia podendo gravar direto pelo
-- cliente, contornando o guard das Server Actions.
--
--   SELECT -> coberto so por _tenant_isolation  => ja estava bloqueado
--   INSERT/UPDATE/DELETE -> _own_tenant sem role => furo, corrigido aqui
--
-- anamnesis nao e afetada: tem apenas a policy _tenant_isolation.

DROP POLICY IF EXISTS medical_records_insert_own_tenant ON medical_records;
DROP POLICY IF EXISTS medical_records_update_own_tenant ON medical_records;
DROP POLICY IF EXISTS medical_records_delete_own_tenant ON medical_records;

CREATE POLICY medical_records_insert_own_tenant ON medical_records
  FOR INSERT
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  );

CREATE POLICY medical_records_update_own_tenant ON medical_records
  FOR UPDATE
  USING (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  )
  WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  );

CREATE POLICY medical_records_delete_own_tenant ON medical_records
  FOR DELETE
  USING (
    tenant_id = public.user_tenant_id()
    AND public.user_role() IS DISTINCT FROM 'receptionist'
  );
