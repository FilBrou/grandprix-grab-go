-- Fix the Monday sync trigger to use pg_net correctly
-- First, drop the existing trigger and function
DROP TRIGGER IF EXISTS on_order_created_sync_monday ON public.orders;
DROP FUNCTION IF EXISTS public.sync_order_to_monday();

-- Enable pg_net extension (for making HTTP requests from database)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the updated sync function using pg_net
CREATE OR REPLACE FUNCTION public.sync_order_to_monday()
RETURNS TRIGGER AS $$
DECLARE
  config_row RECORD;
  service_role_key TEXT;
  project_url TEXT;
BEGIN
  -- Get the Monday configuration
  SELECT * INTO config_row FROM public.monday_config WHERE auto_sync = true LIMIT 1;
  
  -- Only proceed if auto_sync is enabled
  IF config_row.auto_sync THEN
    -- Get Supabase project URL and service role key from environment
    project_url := current_setting('app.settings.project_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- Make async HTTP request to sync-order-by-id edge function
    -- This runs in the background and doesn't block the order creation
    PERFORM extensions.net.http_post(
      url := project_url || '/functions/v1/sync-order-by-id',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || service_role_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'boardId', config_row.board_id
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order creation
    RAISE WARNING 'Failed to sync order to Monday: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_order_created_sync_monday
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_monday();