-- Migration: Secure create_tenant_for_user RPC
-- Adds a check to prevent users who already have a tenant from creating another one
-- and hijacking their profile to a new tenant.

DROP FUNCTION IF EXISTS create_tenant_for_user(text,text,text) CASCADE;

CREATE OR REPLACE FUNCTION create_tenant_for_user(
  p_name TEXT,
  p_slug TEXT,
  p_full_name TEXT
)
RETURNS SETOF tenants AS $$
DECLARE
  new_tenant tenants%ROWTYPE;
  current_tenant UUID;
BEGIN
  -- Check if user already has a tenant assigned
  SELECT tenant_id INTO current_tenant FROM profiles WHERE id = auth.uid();
  IF current_tenant IS NOT NULL THEN
    RAISE EXCEPTION 'O usuário já possui uma clínica/consultório vinculada.';
  END IF;

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
