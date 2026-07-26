-- Migration: Create create_tenant_for_user RPC
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy/sql/new

-- Drop existing function with different return type
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
  VALUES (auth.uid(), p_full_name, 'admin', new_tenant.id);

  RETURN NEXT new_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
