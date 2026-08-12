CREATE TABLE IF NOT EXISTS financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, type, name)
);

ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fc_select" ON financial_categories FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY "fc_insert" ON financial_categories FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "fc_delete" ON financial_categories FOR DELETE USING (tenant_id = public.user_tenant_id());

INSERT INTO financial_categories (tenant_id, type, name)
SELECT id, 'payable', cat FROM tenants, (VALUES ('Aluguel'), ('Fornecedores'), ('Salários'), ('Impostos'), ('Utilidades'), ('Manutenção'), ('Outros')) AS cats(cat)
ON CONFLICT (tenant_id, type, name) DO NOTHING;

INSERT INTO financial_categories (tenant_id, type, name)
SELECT id, 'receivable', cat FROM tenants, (VALUES ('Consulta'), ('Sessão'), ('Pacote'), ('Produto'), ('Parceria'), ('Outros')) AS cats(cat)
ON CONFLICT (tenant_id, type, name) DO NOTHING;
