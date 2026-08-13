-- Migration: Products, service material kits, appointment materials and stock ledger
-- Adds inventory control with automatic consumption per appointment.

-- =============================================
-- PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'un',
  cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(tenant_id, active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_own_tenant" ON products;
DROP POLICY IF EXISTS "products_insert_own_tenant" ON products;
DROP POLICY IF EXISTS "products_update_own_tenant" ON products;
DROP POLICY IF EXISTS "products_delete_own_tenant" ON products;

CREATE POLICY "products_select_own_tenant" ON products
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY "products_insert_own_tenant" ON products
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "products_update_own_tenant" ON products
  FOR UPDATE USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "products_delete_own_tenant" ON products
  FOR DELETE USING (tenant_id = public.user_tenant_id());

CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- =============================================
-- SERVICE_MATERIALS (kit: materiais usados por servico)
-- =============================================
CREATE TABLE IF NOT EXISTS service_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, service_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_service_materials_tenant ON service_materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_materials_service ON service_materials(tenant_id, service_id);

ALTER TABLE service_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_materials_select_own_tenant" ON service_materials;
DROP POLICY IF EXISTS "service_materials_insert_own_tenant" ON service_materials;
DROP POLICY IF EXISTS "service_materials_update_own_tenant" ON service_materials;
DROP POLICY IF EXISTS "service_materials_delete_own_tenant" ON service_materials;

CREATE POLICY "service_materials_select_own_tenant" ON service_materials
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY "service_materials_insert_own_tenant" ON service_materials
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "service_materials_update_own_tenant" ON service_materials
  FOR UPDATE USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "service_materials_delete_own_tenant" ON service_materials
  FOR DELETE USING (tenant_id = public.user_tenant_id());

-- =============================================
-- APPOINTMENT_MATERIALS (snapshot dos materiais de um atendimento)
-- =============================================
CREATE TABLE IF NOT EXISTS appointment_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, appointment_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_appointment_materials_tenant ON appointment_materials(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_materials_appointment ON appointment_materials(tenant_id, appointment_id);

ALTER TABLE appointment_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointment_materials_select_own_tenant" ON appointment_materials;
DROP POLICY IF EXISTS "appointment_materials_insert_own_tenant" ON appointment_materials;
DROP POLICY IF EXISTS "appointment_materials_update_own_tenant" ON appointment_materials;
DROP POLICY IF EXISTS "appointment_materials_delete_own_tenant" ON appointment_materials;

CREATE POLICY "appointment_materials_select_own_tenant" ON appointment_materials
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY "appointment_materials_insert_own_tenant" ON appointment_materials
  FOR INSERT WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "appointment_materials_update_own_tenant" ON appointment_materials
  FOR UPDATE USING (tenant_id = public.user_tenant_id())
  WITH CHECK (tenant_id = public.user_tenant_id());
CREATE POLICY "appointment_materials_delete_own_tenant" ON appointment_materials
  FOR DELETE USING (tenant_id = public.user_tenant_id());

-- =============================================
-- STOCK_MOVEMENTS (livro-caixa de estoque)
--   quantity com sinal: + entrada, - saida
--   movement_type: stock_in (reposicao), adjust (ajuste manual),
--                  session (consumo em atendimento)
-- =============================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('stock_in', 'adjust', 'session')),
  reason TEXT,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_appointment ON stock_movements(appointment_id);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_movements_select_own_tenant" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_insert_own_tenant" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_update_own_tenant" ON stock_movements;
DROP POLICY IF EXISTS "stock_movements_delete_own_tenant" ON stock_movements;

CREATE POLICY "stock_movements_select_own_tenant" ON stock_movements
  FOR SELECT USING (tenant_id = public.user_tenant_id());
CREATE POLICY "stock_movements_insert_own_tenant" ON stock_movements
  FOR INSERT WITH CHECK (
    tenant_id = public.user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.tenant_id = tenant_id
    )
  );
CREATE POLICY "stock_movements_update_own_tenant" ON stock_movements
  FOR UPDATE USING (tenant_id = public.user_tenant_id());
CREATE POLICY "stock_movements_delete_own_tenant" ON stock_movements
  FOR DELETE USING (tenant_id = public.user_tenant_id());

-- =============================================
-- HELPER: debitar estoque (consumo por atendimento)
-- Usado pela server action ao concluir o agendamento.
-- =============================================
CREATE OR REPLACE FUNCTION public.consume_appointment_materials(p_appointment_id UUID)
RETURNS void AS $$
DECLARE
  v_tenant UUID;
  r RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant FROM appointments WHERE id = p_appointment_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Atendimento não encontrado';
  END IF;

  FOR r IN
    SELECT am.product_id, am.quantity, am.tenant_id
    FROM appointment_materials am
    WHERE am.appointment_id = p_appointment_id AND am.tenant_id = v_tenant
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity - r.quantity
    WHERE id = r.product_id AND tenant_id = v_tenant
      AND stock_quantity >= r.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Estoque insuficiente para o material (produto %). Ajuste o estoque ou os materiais da sessão.', r.product_id;
    END IF;

    INSERT INTO stock_movements (tenant_id, product_id, quantity, movement_type, reason, appointment_id, created_by)
    VALUES (v_tenant, r.product_id, -r.quantity, 'session', 'Consumo em atendimento', p_appointment_id, auth.uid());
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper para recompor estoque caso um atendimento deixe de ser 'completed'
CREATE OR REPLACE FUNCTION public.restore_appointment_materials(p_appointment_id UUID)
RETURNS void AS $$
DECLARE
  v_tenant UUID;
  r RECORD;
BEGIN
  SELECT tenant_id INTO v_tenant FROM appointments WHERE id = p_appointment_id;
  IF v_tenant IS NULL THEN
    RAISE EXCEPTION 'Atendimento não encontrado';
  END IF;

  FOR r IN
    SELECT am.product_id, am.quantity, am.tenant_id
    FROM appointment_materials am
    WHERE am.appointment_id = p_appointment_id AND am.tenant_id = v_tenant
  LOOP
    UPDATE products
    SET stock_quantity = stock_quantity + r.quantity
    WHERE id = r.product_id AND tenant_id = v_tenant;

    INSERT INTO stock_movements (tenant_id, product_id, quantity, movement_type, reason, appointment_id, created_by)
    VALUES (v_tenant, r.product_id, r.quantity, 'session', 'Restauração (atendimento revertido)', p_appointment_id, auth.uid());
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SEED: materiais para os servicos padrao (se houver produtos)
-- Nada a semear: kits sao criados pela UI.
-- =============================================
