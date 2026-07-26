-- Migration: Fix create_tenant_for_user to use ON CONFLICT DO UPDATE
-- The handle_new_user() trigger creates a profile row without tenant_id,
-- then create_tenant_for_user was trying to INSERT another row → duplicate key error.
-- Fix: use ON CONFLICT DO UPDATE to set tenant_id on the existing row.
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy/sql/new

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
