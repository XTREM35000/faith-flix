-- Culte & Prière : officiants, demandes (mariage, baptême, confession), FAQ, votes

BEGIN;

-- Fonctions d'autorisations (évite les erreurs si l'ordre de migration change).
CREATE OR REPLACE FUNCTION public.is_developer(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_uid = '11111111-1111-1111-1111-111111111111'::uuid;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_developer(p_uid)
    OR EXISTS (
      SELECT 1 FROM public.admin_users au WHERE au.id = p_uid
    );
$$;

-- ---------------------------------------------------------------------------
-- Officiants (par paroisse)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.officiants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id uuid NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  title varchar(100),
  phone varchar(50),
  email varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_officiants_paroisse ON public.officiants(paroisse_id);

-- ---------------------------------------------------------------------------
-- Officiant « du jour » (champ lecture seule côté formulaire)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_officiant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id uuid NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  officiant_id uuid REFERENCES public.officiants(id) ON DELETE SET NULL,
  date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (paroisse_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_officiant_date ON public.daily_officiant(paroisse_id, date);

-- ---------------------------------------------------------------------------
-- Demandes (polymorphe via type + metadata JSONB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id uuid NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  type varchar(20) NOT NULL CHECK (type IN ('wedding', 'baptism', 'confession')),
  is_anonymous boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name varchar(100),
  user_email varchar(100),
  user_phone varchar(50),
  location varchar(255),
  preferred_date timestamptz,
  preferred_officiant_id uuid REFERENCES public.officiants(id) ON DELETE SET NULL,
  default_officiant_id uuid REFERENCES public.officiants(id) ON DELETE SET NULL,
  duration_minutes int CHECK (duration_minutes IS NULL OR duration_minutes IN (15, 30, 45, 60)),
  description text,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  priority varchar(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('very_high', 'high', 'normal', 'low', 'very_low')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_requests_type ON public.requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_user_id ON public.requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_paroisse ON public.requests(paroisse_id);
CREATE INDEX IF NOT EXISTS idx_requests_preferred_date ON public.requests(preferred_date);

-- ---------------------------------------------------------------------------
-- FAQ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id uuid NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text,
  category varchar(50),
  author_name varchar(100),
  author_email varchar(100),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  moderation_status varchar(20) NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'published', 'rejected')),
  is_pinned boolean NOT NULL DEFAULT false,
  votes_up int NOT NULL DEFAULT 0,
  votes_down int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faqs_paroisse ON public.faqs(paroisse_id);
CREATE INDEX IF NOT EXISTS idx_faqs_moderation ON public.faqs(moderation_status);

CREATE TABLE IF NOT EXISTS public.faq_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote smallint NOT NULL CHECK (vote IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (faq_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_faq_votes_faq ON public.faq_votes(faq_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.officiants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_officiant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS officiants_select ON public.officiants;
CREATE POLICY officiants_select ON public.officiants
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS officiants_admin_all ON public.officiants;
CREATE POLICY officiants_admin_all ON public.officiants
  FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS daily_officiant_select ON public.daily_officiant;
CREATE POLICY daily_officiant_select ON public.daily_officiant
  FOR SELECT USING (true);

DROP POLICY IF EXISTS daily_officiant_admin ON public.daily_officiant;
CREATE POLICY daily_officiant_admin ON public.daily_officiant
  FOR ALL USING (public.is_admin_or_super());

DROP POLICY IF EXISTS requests_insert ON public.requests;
CREATE POLICY requests_insert ON public.requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS requests_select ON public.requests;
CREATE POLICY requests_select ON public.requests
  FOR SELECT USING (
    user_id IS NOT NULL AND auth.uid() = user_id
    OR public.is_admin_or_super()
  );

DROP POLICY IF EXISTS requests_update_admin ON public.requests;
CREATE POLICY requests_update_admin ON public.requests
  FOR UPDATE USING (public.is_admin_or_super());

DROP POLICY IF EXISTS requests_delete_admin ON public.requests;
CREATE POLICY requests_delete_admin ON public.requests
  FOR DELETE USING (public.is_admin_or_super());

DROP POLICY IF EXISTS faqs_select ON public.faqs;
CREATE POLICY faqs_select ON public.faqs
  FOR SELECT USING (
    moderation_status = 'published'
    OR public.is_admin_or_super()
    OR (user_id IS NOT NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS faqs_insert ON public.faqs;
CREATE POLICY faqs_insert ON public.faqs
  FOR INSERT WITH CHECK (moderation_status = 'pending');

DROP POLICY IF EXISTS faqs_update_admin ON public.faqs;
CREATE POLICY faqs_update_admin ON public.faqs
  FOR UPDATE USING (public.is_admin_or_super());

DROP POLICY IF EXISTS faqs_delete_admin ON public.faqs;
CREATE POLICY faqs_delete_admin ON public.faqs
  FOR DELETE USING (public.is_admin_or_super());

DROP POLICY IF EXISTS faq_votes_select ON public.faq_votes;
CREATE POLICY faq_votes_select ON public.faq_votes
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin_or_super());

DROP POLICY IF EXISTS faq_votes_insert ON public.faq_votes;
CREATE POLICY faq_votes_insert ON public.faq_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS faq_votes_update_own ON public.faq_votes;
CREATE POLICY faq_votes_update_own ON public.faq_votes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS faq_votes_delete_own ON public.faq_votes;
CREATE POLICY faq_votes_delete_own ON public.faq_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Vote atomique (évite courses sur votes_up / votes_down)
CREATE OR REPLACE FUNCTION public.faq_cast_vote(p_faq_id uuid, p_vote smallint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  prev smallint;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_vote IS NULL OR p_vote NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'invalid vote';
  END IF;

  SELECT vote INTO prev FROM public.faq_votes WHERE faq_id = p_faq_id AND user_id = uid;

  IF prev IS NULL THEN
    INSERT INTO public.faq_votes (faq_id, user_id, vote) VALUES (p_faq_id, uid, p_vote);
    IF p_vote = 1 THEN
      UPDATE public.faqs SET votes_up = votes_up + 1, updated_at = now() WHERE id = p_faq_id;
    ELSE
      UPDATE public.faqs SET votes_down = votes_down + 1, updated_at = now() WHERE id = p_faq_id;
    END IF;
  ELSIF prev <> p_vote THEN
    UPDATE public.faq_votes SET vote = p_vote WHERE faq_id = p_faq_id AND user_id = uid;
    IF prev = 1 AND p_vote = -1 THEN
      UPDATE public.faqs SET votes_up = votes_up - 1, votes_down = votes_down + 1, updated_at = now() WHERE id = p_faq_id;
    ELSIF prev = -1 AND p_vote = 1 THEN
      UPDATE public.faqs SET votes_up = votes_up + 1, votes_down = votes_down - 1, updated_at = now() WHERE id = p_faq_id;
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.faq_cast_vote(uuid, smallint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.faq_cast_vote(uuid, smallint) TO authenticated;

COMMIT;
