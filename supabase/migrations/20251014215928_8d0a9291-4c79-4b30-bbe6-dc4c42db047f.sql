-- Phase 1: Database Schema Transformation for Multi-Event System

-- 1.1 Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  logo_url TEXT,
  hero_image_url TEXT,
  theme_color TEXT DEFAULT '#FF0000',
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "allow_orders": true,
    "require_collection_point": true,
    "enable_notifications": true,
    "currency": "CAD",
    "timezone": "America/Montreal"
  }'::jsonb
);

-- Create indexes for fast lookups
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_dates ON public.events(start_date, end_date);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events
CREATE POLICY "Anyone can view active events"
  ON public.events FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage all events"
  ON public.events FOR ALL
  USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1.2 Add event_id to existing tables
ALTER TABLE public.items 
  ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX idx_items_event_id ON public.items(event_id);

ALTER TABLE public.orders 
  ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX idx_orders_event_id ON public.orders(event_id);

ALTER TABLE public.user_locations 
  ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX idx_user_locations_event_id ON public.user_locations(event_id);

ALTER TABLE public.monday_config 
  ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

CREATE INDEX idx_monday_config_event_id ON public.monday_config(event_id);

-- 1.3 Create default event for existing data
INSERT INTO public.events (
  name,
  slug,
  description,
  start_date,
  end_date,
  status,
  location,
  theme_color
) VALUES (
  'Grand Prix de Montréal 2024',
  'montreal-gp-2024',
  'Plateforme officielle de commande pour le Grand Prix de Montréal',
  '2024-06-01',
  '2024-06-30',
  'active',
  'Circuit Gilles-Villeneuve, Montréal, QC',
  '#FF0000'
);

-- 1.4 Migrate existing data to default event
UPDATE public.items 
SET event_id = (SELECT id FROM public.events WHERE slug = 'montreal-gp-2024')
WHERE event_id IS NULL;

UPDATE public.orders 
SET event_id = (SELECT id FROM public.events WHERE slug = 'montreal-gp-2024')
WHERE event_id IS NULL;

UPDATE public.user_locations 
SET event_id = (SELECT id FROM public.events WHERE slug = 'montreal-gp-2024')
WHERE event_id IS NULL;

UPDATE public.monday_config 
SET event_id = (SELECT id FROM public.events WHERE slug = 'montreal-gp-2024')
WHERE event_id IS NULL;

-- 1.5 Make event_id NOT NULL after migration
ALTER TABLE public.items ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN event_id SET NOT NULL;
ALTER TABLE public.user_locations ALTER COLUMN event_id SET NOT NULL;

-- 1.6 Update RLS policies for event-scoped access
DROP POLICY IF EXISTS "Anyone can view available items" ON public.items;
CREATE POLICY "Anyone can view available items in active events"
  ON public.items FOR SELECT
  USING (
    available = true 
    AND event_id IN (SELECT id FROM public.events WHERE status = 'active')
  );

DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id 
    AND event_id IN (SELECT id FROM public.events WHERE status IN ('active', 'completed'))
  );

DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Users can create orders for active events"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND event_id IN (SELECT id FROM public.events WHERE status = 'active')
  );

DROP POLICY IF EXISTS "Users can view their own locations" ON public.user_locations;
CREATE POLICY "Users can view locations for active events"
  ON public.user_locations FOR SELECT
  USING (
    (auth.uid() = user_id OR is_admin(auth.uid()))
    AND event_id IN (SELECT id FROM public.events WHERE status IN ('active', 'completed'))
  );

-- 1.7 Update database functions for event context
CREATE OR REPLACE FUNCTION public.get_daily_sales(
  event_uuid UUID,
  days INTEGER DEFAULT 7
)
RETURNS TABLE(date DATE, total_sales NUMERIC, order_count BIGINT)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(o.created_at) as date,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_sales,
    COUNT(o.id) as order_count
  FROM public.orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    AND o.status NOT IN ('cancelled')
    AND o.event_id = event_uuid
  GROUP BY DATE(o.created_at)
  ORDER BY DATE(o.created_at) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_popular_items(
  event_uuid UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(item_name TEXT, total_quantity BIGINT, total_revenue NUMERIC)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.name as item_name,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0)::DECIMAL(10,2) as total_revenue
  FROM public.items i
  LEFT JOIN public.order_items oi ON i.id = oi.item_id
  LEFT JOIN public.orders o ON oi.order_id = o.id
  WHERE (o.status NOT IN ('cancelled') OR o.status IS NULL)
    AND i.event_id = event_uuid
  GROUP BY i.id, i.name
  ORDER BY total_quantity DESC, total_revenue DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_statistics(event_uuid UUID)
RETURNS TABLE(
  total_revenue NUMERIC,
  total_orders BIGINT,
  average_order_value NUMERIC,
  total_items_sold BIGINT
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_revenue,
    COUNT(o.id) as total_orders,
    COALESCE(AVG(o.total_amount), 0)::DECIMAL(10,2) as average_order_value,
    COALESCE(SUM(oi.quantity), 0) as total_items_sold
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled')
    AND o.event_id = event_uuid;
$$;