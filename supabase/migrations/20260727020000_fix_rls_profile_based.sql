-- Migration: Fix RLS to use profile-based tenant check instead of JWT-based
-- The JWT might not have tenant_id (stale session, first login after signup).
-- Using profiles table for tenant check is always correct and reliable.

-- Helper function: get current user's tenant_id from profiles
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- Drop old policies
-- =============================================
DROP POLICY IF EXISTS patients_tenant_isolation ON patients;
DROP POLICY IF EXISTS appointments_tenant_isolation ON appointments;
DROP POLICY IF EXISTS anamnesis_tenant_isolation ON anamnesis;
DROP POLICY IF EXISTS medical_records_tenant_isolation ON medical_records;
DROP POLICY IF EXISTS payments_tenant_isolation ON payments;
DROP POLICY IF EXISTS audit_logs_tenant_isolation ON audit_logs;
DROP POLICY IF EXISTS profiles_tenant_isolation ON profiles;

-- =============================================
-- Recreate with profile-based check
-- =============================================

-- Profiles: self-read + tenant isolation
-- (profiles_self_read and profiles_self_update already exist from previous migration)
CREATE POLICY profiles_tenant_isolation ON profiles
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Patients
CREATE POLICY patients_tenant_isolation ON patients
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Appointments
CREATE POLICY appointments_tenant_isolation ON appointments
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Anamnesis
CREATE POLICY anamnesis_tenant_isolation ON anamnesis
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Medical Records
CREATE POLICY medical_records_tenant_isolation ON medical_records
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Payments
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL USING (tenant_id = public.user_tenant_id());

-- Audit Logs
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL USING (tenant_id = public.user_tenant_id());
