-- Drop the collection_points table as we'll use user_locations instead
DROP TABLE IF EXISTS public.collection_points CASCADE;

-- Update orders table to reference user_locations instead
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS collection_point_id,
ADD COLUMN IF NOT EXISTS user_location_id UUID REFERENCES public.user_locations(id) ON DELETE SET NULL;