-- Migration: Link financial entries to patients and harden RLS with WITH CHECK
-- Fixes the "Financeiro/Cobranças não atualizam" issue by enabling queries
-- joined to patients, and guarantees INSERT/UPDATE work on medical_records/payments.

-- =============================================
-- FINANCIAL_ENTRIES.patient_id
-- =============================================
ALTER TABLE financial_entries
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- Backfill from linked appointments
UPDATE financial_entries fe
SET patient_id = a.patient_id
FROM appointments a
WHERE fe.appointment_id = a.id
  AND fe.patient_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_financial_entries_patient ON financial_entries(patient_id);

-- =============================================
-- MEDICAL_RECORDS RLS (garante INSERT/UPDATE/DELETE)
-- =============================================
DROP POLICY IF EXISTS medical_records_tenant_isolation ON medical_records;
DROP POLICY IF EXISTS medical_records_insert_own_tenant ON medical_records;
DROP POLICY IF EXISTS medical_records_update_own_tenant ON medical_records;
DROP POLICY IF EXISTS medical_records_delete_own_tenant ON medical_records;

CREATE POLICY medical_records_tenant_isolation ON medical_records
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY medical_records_insert_own_tenant ON medical_records
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY medical_records_update_own_tenant ON medical_records
  FOR UPDATE USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY medical_records_delete_own_tenant ON medical_records
  FOR DELETE USING (tenant_id = public.user_tenant_id());

-- =============================================
-- PAYMENTS RLS (garante INSERT/UPDATE/DELETE)
-- =============================================
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
DROP POLICY IF EXISTS payments_insert_own_tenant ON payments;
DROP POLICY IF EXISTS payments_update_own_tenant ON payments;
DROP POLICY IF EXISTS payments_delete_own_tenant ON payments;

CREATE POLICY payments_tenant_isolation ON payments
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY payments_insert_own_tenant ON payments
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY payments_update_own_tenant ON payments
  FOR UPDATE USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY payments_delete_own_tenant ON payments
  FOR DELETE USING (tenant_id = public.user_tenant_id());
