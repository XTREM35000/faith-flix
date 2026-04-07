-- Certaines bases ont header_config sans created_at (ou sans updated_at) : alignement sur 016_create_header_config.sql
ALTER TABLE public.header_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.header_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
