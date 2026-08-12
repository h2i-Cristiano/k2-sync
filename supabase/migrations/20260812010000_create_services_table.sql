-- Migration: Create services table
-- This replaces the hardcoded SERVICES array in services.ts

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  commission_percent DECIMAL(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_tenant_isolation" ON services
  USING (tenant_id = public.user_tenant_id());

CREATE POLICY "services_insert_own_tenant" ON services
  FOR INSERT
  WITH CHECK (tenant_id = public.user_tenant_id());

CREATE POLICY "services_update_own_tenant" ON services
  FOR UPDATE
  USING (tenant_id = public.user_tenant_id());

CREATE POLICY "services_delete_own_tenant" ON services
  FOR DELETE
  USING (tenant_id = public.user_tenant_id());

-- Indexes
CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_active ON services(tenant_id, active);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_updated_at();
