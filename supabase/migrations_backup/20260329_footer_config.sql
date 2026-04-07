-- Table footer par paroisse + extension de init_system (p_footer_config)

CREATE TABLE IF NOT EXISTS public.footer_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paroisse_id UUID NOT NULL REFERENCES public.paroisses(id) ON DELETE CASCADE,
  address TEXT,
  email VARCHAR(255),
  moderator_phone VARCHAR(50),
  super_admin_email VARCHAR(255),
  super_admin_phone VARCHAR(50),
  facebook_url TEXT,
  youtube_url TEXT,
  instagram_url TEXT,
  whatsapp_url TEXT,
  copyright_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paroisse_id)
);

CREATE INDEX IF NOT EXISTS idx_footer_config_paroisse_id ON public.footer_config(paroisse_id);

ALTER TABLE public.footer_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Footer config is viewable by everyone" ON public.footer_config;
DROP POLICY IF EXISTS "Only admins can manage footer config" ON public.footer_config;

CREATE POLICY "Footer config is viewable by everyone"
  ON public.footer_config
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only admins can manage footer config"
  ON public.footer_config
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE OR REPLACE FUNCTION public.update_footer_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_footer_config_timestamp ON public.footer_config;
CREATE TRIGGER update_footer_config_timestamp
  BEFORE UPDATE ON public.footer_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_footer_config_timestamp();

-- Remplacer init_system : ajouter p_footer_config et insertion dans footer_config

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS proc
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'init_system'
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.proc);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.init_system(
  p_paroisse_nom text,
  p_paroisse_slug text,
  p_paroisse_description text,
  p_sections jsonb,
  p_header_config jsonb,
  p_about_config jsonb,
  p_branding jsonb,
  p_footer_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  elem jsonb;
  v_key text;
  v_content text;
  v_has_home_paroisse boolean;
  v_has_about_paroisse boolean;
  v_hdr_id uuid;
  v_footer jsonb := coalesce(p_footer_config, '{}'::jsonb);
BEGIN
  IF EXISTS (SELECT 1 FROM public.paroisses LIMIT 1) THEN
    RAISE EXCEPTION 'init_system: une paroisse existe déjà';
  END IF;

  INSERT INTO public.paroisses (
    id, nom, slug, description, email, logo_url, adresse, telephone,
    couleur_principale, is_active, created_at, updated_at
  )
  VALUES (
    v_id,
    p_paroisse_nom,
    lower(trim(p_paroisse_slug)),
    p_paroisse_description,
    nullif(trim(p_branding->>'email'), ''),
    nullif(trim(p_branding->>'logo'), ''),
    nullif(trim(p_branding->>'address'), ''),
    nullif(trim(p_branding->>'phone'), ''),
    '#3b82f6',
    true,
    now(),
    now()
  );

  INSERT INTO public.footer_config (
    paroisse_id, address, email, moderator_phone, super_admin_email, super_admin_phone,
    facebook_url, youtube_url, instagram_url, whatsapp_url, copyright_text, created_at, updated_at
  )
  VALUES (
    v_id,
    nullif(trim(v_footer->>'address'), ''),
    nullif(trim(v_footer->>'email'), ''),
    nullif(trim(v_footer->>'moderator_phone'), ''),
    nullif(trim(v_footer->>'super_admin_email'), ''),
    nullif(trim(v_footer->>'super_admin_phone'), ''),
    nullif(trim(v_footer->>'facebook_url'), ''),
    nullif(trim(v_footer->>'youtube_url'), ''),
    nullif(trim(v_footer->>'instagram_url'), ''),
    nullif(trim(v_footer->>'whatsapp_url'), ''),
    nullif(trim(v_footer->>'copyright_text'), ''),
    now(),
    now()
  );

  v_has_home_paroisse := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'homepage_sections' AND column_name = 'paroisse_id'
  );

  IF v_has_home_paroisse THEN
    DELETE FROM public.homepage_sections WHERE paroisse_id = v_id;
  ELSE
    DELETE FROM public.homepage_sections;
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(coalesce(p_sections, '[]'::jsonb))
  LOOP
    v_key := nullif(trim(elem->>'section_key'), '');
    IF v_key IS NULL THEN
      CONTINUE;
    END IF;

    IF jsonb_typeof(elem->'content') IN ('object', 'array') THEN
      v_content := (elem->'content')::text;
    ELSE
      v_content := elem->>'content';
    END IF;

    IF v_has_home_paroisse THEN
      INSERT INTO public.homepage_sections (
        section_key, title, subtitle, content, image_url,
        display_order, is_active, paroisse_id, created_at, updated_at
      )
      VALUES (
        v_key,
        elem->>'title',
        elem->>'subtitle',
        v_content,
        nullif(elem->>'image_url', ''),
        coalesce((elem->>'display_order')::int, 0),
        coalesce((elem->>'is_active')::boolean, true),
        v_id,
        now(),
        now()
      );
    ELSE
      INSERT INTO public.homepage_sections (
        section_key, title, subtitle, content, image_url,
        display_order, is_active, created_at, updated_at
      )
      VALUES (
        v_key,
        elem->>'title',
        elem->>'subtitle',
        v_content,
        nullif(elem->>'image_url', ''),
        coalesce((elem->>'display_order')::int, 0),
        coalesce((elem->>'is_active')::boolean, true),
        now(),
        now()
      );
    END IF;
  END LOOP;

  SELECT id INTO v_hdr_id
  FROM public.header_config
  WHERE is_active = true
  ORDER BY updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_hdr_id IS NOT NULL THEN
    UPDATE public.header_config
    SET
      logo_url = coalesce(nullif(trim(p_header_config->>'logo_url'), ''), logo_url),
      main_title = coalesce(nullif(trim(p_header_config->>'main_title'), ''), main_title),
      subtitle = coalesce(nullif(trim(p_header_config->>'subtitle'), ''), subtitle),
      navigation_items = coalesce((p_header_config->'navigation_items')::jsonb, navigation_items),
      updated_at = now()
    WHERE id = v_hdr_id;
  ELSE
    INSERT INTO public.header_config (
      id, logo_url, logo_alt_text, logo_size, main_title, subtitle, navigation_items, is_active
    )
    VALUES (
      gen_random_uuid(),
      nullif(trim(p_header_config->>'logo_url'), ''),
      'Logo Paroisse',
      'md',
      coalesce(nullif(trim(p_header_config->>'main_title'), ''), 'Paroisse'),
      coalesce(nullif(trim(p_header_config->>'subtitle'), ''), ''),
      coalesce(
        (p_header_config->'navigation_items')::jsonb,
        '[
          {"label": "Accueil", "href": "/", "icon": "home"},
          {"label": "À propos", "href": "/a-propos", "icon": "info"}
        ]'::jsonb
      ),
      true
    );
  END IF;

  v_has_about_paroisse := EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'about_page_sections' AND column_name = 'paroisse_id'
  );

  IF v_has_about_paroisse THEN
    DELETE FROM public.about_page_sections WHERE paroisse_id = v_id;
  ELSE
    DELETE FROM public.about_page_sections;
  END IF;

  IF v_has_about_paroisse THEN
    INSERT INTO public.about_page_sections (
      section_key, title, subtitle, content, content_type, display_order, is_active, metadata, paroisse_id, created_at, updated_at
    )
    VALUES
    (
      'about_hero',
      'À propos de nous',
      'Découvrez notre communauté',
      NULL,
      'hero',
      1,
      true,
      '{}'::jsonb,
      v_id,
      now(),
      now()
    ),
    (
      'parish_description',
      'Notre paroisse',
      NULL,
      coalesce(p_about_config::text, '{}'),
      'text',
      2,
      true,
      NULL,
      v_id,
      now(),
      now()
    );
  ELSE
    INSERT INTO public.about_page_sections (
      section_key, title, subtitle, content, content_type, display_order, is_active, metadata, created_at, updated_at
    )
    VALUES
    (
      'about_hero',
      'À propos de nous',
      'Découvrez notre communauté',
      NULL,
      'hero',
      1,
      true,
      '{}'::jsonb,
      now(),
      now()
    ),
    (
      'parish_description',
      'Notre paroisse',
      NULL,
      coalesce(p_about_config::text, '{}'),
      'text',
      2,
      true,
      NULL,
      now(),
      now()
    );
  END IF;

  RETURN jsonb_build_object('paroisse_id', v_id::text);
END;
$$;

GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.init_system(text, text, text, jsonb, jsonb, jsonb, jsonb, jsonb) TO service_role;
