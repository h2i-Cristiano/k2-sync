CREATE TABLE IF NOT EXISTS financial_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  category TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_entries_tenant_type ON financial_entries(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_tenant_status ON financial_entries(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_entries_due_date ON financial_entries(due_date);

ALTER TABLE financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "financial_entries_select_own_tenant" ON financial_entries
  FOR SELECT USING (tenant_id = public.user_tenant_id());

CREATE POLICY "financial_entries_insert_own_tenant" ON financial_entries
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());

CREATE POLICY "financial_entries_update_own_tenant" ON financial_entries
  FOR UPDATE USING (tenant_id = public.user_tenant_id());

CREATE POLICY "financial_entries_delete_own_tenant" ON financial_entries
  FOR DELETE USING (tenant_id = public.user_tenant_id());
