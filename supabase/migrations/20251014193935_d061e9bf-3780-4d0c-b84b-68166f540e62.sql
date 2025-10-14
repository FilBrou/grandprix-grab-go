-- Create user_locations table for multiple locations per user
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_name)
);

-- Enable RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_locations
CREATE POLICY "Users can view their own locations" 
ON public.user_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations" 
ON public.user_locations 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert locations" 
ON public.user_locations 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update locations" 
ON public.user_locations 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete locations" 
ON public.user_locations 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Keep the single location field in profiles for backward compatibility
-- but it will be deprecated in favor of user_locations table