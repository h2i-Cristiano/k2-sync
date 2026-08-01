-- Migration: Fix profiles RLS — allow users to read their own profile
-- The tenant_isolation policy requires tenant_id in JWT, but users need
-- to READ their profile to GET the tenant_id. Self-read policy fixes this.

-- Allow users to always read their own profile row
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (id = auth.uid());

-- Allow users to update their own profile (for JWT refresh scenarios)
CREATE POLICY profiles_self_update ON profiles
  FOR UPDATE USING (id = auth.uid());
