-- Migration: Fix handle_new_user trigger
-- The original trigger inserts tenant_id from raw_user_meta_data, but at signup
-- time tenant_id is not yet in metadata → NOT NULL violation.
-- Fix: create profile WITHOUT tenant_id (nullable for now), then the signup
-- flow's create_tenant_for_user RPC fills it in.

-- First, make tenant_id nullable in profiles for the trigger to work
-- (the signup flow fills it in immediately after via RPC)
ALTER TABLE profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- Drop and recreate the trigger to handle missing tenant_id gracefully
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'professional')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
