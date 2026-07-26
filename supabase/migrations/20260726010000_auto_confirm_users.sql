-- Migration: Auto-confirm users for development/testing
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/fdphsumvqokygyxbguqy/sql/new

-- Function to auto-confirm a user by email (admin only)
CREATE OR REPLACE FUNCTION confirm_user_email(p_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email = p_email
    AND email_confirmed_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-confirm all unconfirmed users (development only)
CREATE OR REPLACE FUNCTION confirm_all_unconfirmed_users()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE email_confirmed_at IS NULL;
  
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
