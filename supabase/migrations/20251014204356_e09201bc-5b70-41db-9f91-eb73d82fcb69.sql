-- Enable required extensions for HTTP requests
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Create monday_config table
CREATE TABLE IF NOT EXISTS public.monday_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  auto_sync BOOLEAN NOT NULL DEFAULT true,
  status_mapping JSONB NOT NULL DEFAULT '{"pending":"En attente","confirmed":"Confirmée","ready":"Prête","completed":"Terminée","cancelled":"Annulée"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.monday_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only admins can manage monday config
CREATE POLICY "Admins can view monday config"
  ON public.monday_config
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert monday config"
  ON public.monday_config
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update monday config"
  ON public.monday_config
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete monday config"
  ON public.monday_config
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_monday_config_updated_at
  BEFORE UPDATE ON public.monday_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to sync order to Monday automatically
CREATE OR REPLACE FUNCTION public.sync_order_to_monday()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  config_record RECORD;
  supabase_url TEXT;
  supabase_service_key TEXT;
  function_url TEXT;
BEGIN
  -- Get Monday config
  SELECT * INTO config_record FROM public.monday_config LIMIT 1;
  
  -- Only proceed if config exists and auto_sync is enabled
  IF config_record IS NOT NULL AND config_record.auto_sync = true THEN
    -- Get Supabase URL and service key from environment
    supabase_url := current_setting('app.settings.supabase_url', true);
    supabase_service_key := current_setting('app.settings.supabase_service_key', true);
    
    -- Construct function URL
    function_url := supabase_url || '/functions/v1/sync-order-by-id';
    
    -- Call edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_service_key
      ),
      body := jsonb_build_object(
        'orderId', NEW.id,
        'boardId', config_record.board_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
CREATE TRIGGER on_order_created_sync_monday
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_order_to_monday();