-- Setup dev admin user (update existing)
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy/sql/new

DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Find existing user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ti.h2icorp@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found: ti.h2icorp@gmail.com';
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- Update password
  UPDATE auth.users
  SET encrypted_password = crypt('08Cris8', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = v_user_id;

  -- Create tenant
  INSERT INTO tenants (name, slug)
  VALUES ('H2I Corp - Dev', 'h2i-corp-dev')
  ON CONFLICT (slug) DO UPDATE SET name = 'H2I Corp - Dev'
  RETURNING id INTO v_tenant_id;

  -- Create or update profile as admin
  INSERT INTO profiles (id, full_name, role, tenant_id)
  VALUES (v_user_id, 'Dev Admin', 'admin', v_tenant_id)
  ON CONFLICT (id) DO UPDATE
  SET full_name = 'Dev Admin', role = 'admin', tenant_id = v_tenant_id;

  -- Update JWT metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tenant_id', v_tenant_id, 'role', 'admin')
  WHERE id = v_user_id;

  RAISE NOTICE 'Dev admin configured: % (tenant: %, role: admin)', v_user_id, v_tenant_id;
END $$;
