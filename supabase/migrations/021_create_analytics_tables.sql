-- Create analytics_metrics table to track page views and engagement
CREATE TABLE IF NOT EXISTS public.analytics_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'click', 'upload', 'comment'
  entity_id TEXT, -- video_id, event_id, member_id, etc.
  entity_type TEXT, -- 'video', 'event', 'member', 'article'
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB, -- additional data like duration, device, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_event_type CHECK (event_type IN ('view', 'click', 'upload', 'comment', 'like', 'share'))
);

-- Create analytics_summaries table for daily aggregates
CREATE TABLE IF NOT EXISTS public.analytics_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  page_path TEXT NOT NULL,
  entity_type TEXT, -- 'video', 'event', 'member', NULL for general
  entity_id TEXT,
  view_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(date, page_path, entity_type, entity_id)
);

-- Create indices for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_page_path ON public.analytics_metrics(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_entity ON public.analytics_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_created_at ON public.analytics_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_date ON public.analytics_summaries(date);
CREATE INDEX IF NOT EXISTS idx_analytics_summaries_page_path ON public.analytics_summaries(page_path);

-- Enable RLS
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for analytics_metrics
DROP POLICY IF EXISTS "public_insert_analytics_metrics" ON public.analytics_metrics;
DROP POLICY IF EXISTS "admin_select_analytics_metrics" ON public.analytics_metrics;

-- Drop existing policies for analytics_summaries
DROP POLICY IF EXISTS "public_view_analytics_summaries" ON public.analytics_summaries;
DROP POLICY IF EXISTS "admin_manage_analytics_summaries" ON public.analytics_summaries;

-- RLS Policies for analytics_metrics
CREATE POLICY "public_insert_analytics_metrics" ON public.analytics_metrics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_select_analytics_metrics" ON public.analytics_metrics
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for analytics_summaries
CREATE POLICY "public_view_analytics_summaries" ON public.analytics_summaries
  FOR SELECT USING (true);

CREATE POLICY "admin_manage_analytics_summaries" ON public.analytics_summaries
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to aggregate daily metrics
CREATE OR REPLACE FUNCTION public.aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
  INSERT INTO public.analytics_summaries (date, page_path, entity_type, entity_id, view_count)
  SELECT 
    DATE(am.created_at),
    am.page_path,
    am.entity_type,
    am.entity_id,
    COUNT(*) FILTER (WHERE am.event_type = 'view')
  FROM public.analytics_metrics am
  WHERE DATE(am.created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY DATE(am.created_at), am.page_path, am.entity_type, am.entity_id
  ON CONFLICT (date, page_path, entity_type, entity_id) DO UPDATE
  SET view_count = EXCLUDED.view_count, updated_at = now();
END;
$$ LANGUAGE plpgsql;
