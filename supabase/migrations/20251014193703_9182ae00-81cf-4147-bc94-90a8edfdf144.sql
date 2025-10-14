-- Add location field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update RLS policies for user management
-- Allow admins to insert new profiles
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin(auth.uid()));

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Add location to orders if not exists (for tracking where products were sent)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_location TEXT;