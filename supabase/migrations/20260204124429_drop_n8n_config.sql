-- Migration: Remove deprecated n8n_config column
-- Reason: n8n has been fully replaced by Supabase Edge Functions for all automations
-- Date: 2026-02-04

-- Drop the n8n_config column from companies table
ALTER TABLE public.companies DROP COLUMN IF EXISTS n8n_config;

-- Add comment to document the change
COMMENT ON TABLE public.companies IS 'Company profiles for white-labeling. Automations now handled via Supabase Edge Functions (review-hunter, invoice-chaser, webhook-dispatcher).';
