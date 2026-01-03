-- Migration: add invited_by to profiles
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMIT;
