-- 2025-02-03: Ajout de deleted_at et table chat_attachments pour gérer pièces jointes

BEGIN;

-- 1) Ajouter deleted_at sur chat_messages pour soft delete (si absent)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2) Créer table chat_attachments
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_name TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_attachments_message_id ON public.chat_attachments(message_id);

COMMENT ON TABLE public.chat_attachments IS 'Pièces jointes associées aux messages de chat';

COMMIT;