-- K2-Sync Multi-Tenant Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. TENANTS (Multi-tenant core)
-- =============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basico', 'essencial', 'pro')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'professional' CHECK (role IN ('admin', 'professional', 'receptionist')),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. PATIENTS
-- =============================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  rg TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'O')),
  marital_status TEXT,
  occupation TEXT,
  address JSONB DEFAULT '{}',
  emergency_contact JSONB DEFAULT '{}',
  allergies TEXT[],
  medications TEXT[],
  medical_conditions TEXT[],
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. APPOINTMENTS
-- =============================================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  is_home_visit BOOLEAN DEFAULT FALSE,
  home_visit_address JSONB,
  travel_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. ANAMNESE (Digital Health Forms)
-- =============================================
CREATE TABLE anamnesis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL CHECK (form_type IN ('massage', 'facial', 'body', 'general', 'dental', 'salon')),
  data JSONB NOT NULL DEFAULT '{}',
  signature_hash TEXT,
  signature_ip TEXT,
  signature_timestamp TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. MEDICAL RECORDS (Prontuario)
-- =============================================
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  session_number INTEGER,
  chief_complaint TEXT,
  assessment TEXT,
  treatment_plan TEXT,
  notes TEXT,
  ai_suggestions JSONB,
  ai_disclaimer_shown BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. PAYMENTS
-- =============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  deposit_percent DECIMAL(5,2),
  deposit_amount DECIMAL(10,2),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'cash', 'card', 'transfer')),
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'full', 'remainder')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. AUDIT LOG
-- =============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_name ON patients(tenant_id, full_name);
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_professional ON appointments(professional_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_anamnesis_tenant ON anamnesis(tenant_id);
CREATE INDEX idx_anamnesis_patient ON anamnesis(patient_id);
CREATE INDEX idx_medical_records_tenant ON medical_records(tenant_id);
CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments FORCE ROW LEVEL SECURITY;

ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis FORCE ROW LEVEL SECURITY;

ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records FORCE ROW LEVEL SECURITY;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Tenants: users can only see their own tenant
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Profiles: tenant isolation
CREATE POLICY profiles_tenant_isolation ON profiles
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Patients: tenant isolation
CREATE POLICY patients_tenant_isolation ON patients
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Appointments: tenant isolation
CREATE POLICY appointments_tenant_isolation ON appointments
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Anamnesis: tenant isolation
CREATE POLICY anamnesis_tenant_isolation ON anamnesis
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Medical Records: tenant isolation
CREATE POLICY medical_records_tenant_isolation ON medical_records
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Payments: tenant isolation
CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Audit Logs: tenant isolation
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_anamnesis_updated_at
  BEFORE UPDATE ON anamnesis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional'),
    (NEW.raw_user_meta_data->>'tenant_id')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create tenant and admin profile on signup
DROP FUNCTION IF EXISTS create_tenant_for_user(text,text,text) CASCADE;
CREATE OR REPLACE FUNCTION create_tenant_for_user(
  p_name TEXT,
  p_slug TEXT,
  p_full_name TEXT
)
RETURNS SETOF tenants AS $$
DECLARE
  new_tenant tenants%ROWTYPE;
BEGIN
  INSERT INTO tenants (name, slug)
  VALUES (p_name, p_slug)
  RETURNING * INTO new_tenant;

  INSERT INTO profiles (id, full_name, role, tenant_id)
  VALUES (auth.uid(), p_full_name, 'admin', new_tenant.id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = p_full_name, role = 'admin', tenant_id = new_tenant.id;

  RETURN NEXT new_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORAGE
-- =============================================
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('patients', 'patients', false),
  ('anamnesis', 'anamnesis', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Patients files are accessible only by tenant"
  ON storage.objects FOR ALL
  USING (bucket_id = 'patients' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text);

CREATE POLICY "Anamnesis files are accessible only by tenant"
  ON storage.objects FOR ALL
  USING (bucket_id = 'anamnesis' AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')::text);
