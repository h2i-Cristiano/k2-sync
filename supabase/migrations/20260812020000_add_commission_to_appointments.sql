-- Migration: Add commission fields to appointments

ALTER TABLE appointments 
  ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
