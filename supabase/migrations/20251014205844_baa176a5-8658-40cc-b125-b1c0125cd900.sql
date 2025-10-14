-- Fix the trigger to use correct URL and authorization
DROP TRIGGER IF EXISTS on_order_created_sync_monday ON public.orders;
DROP FUNCTION IF EXISTS public.sync_order_to_monday();

-- Create the fixed sync function
CREATE OR REPLACE FUNCTION public.sync_order_to_monday()
RETURNS TRIGGER AS $$
DECLARE
  config_row RECORD;
  request_id bigint;
BEGIN
  -- Get the Monday configuration
  SELECT * INTO config_row FROM public.monday_config WHERE auto_sync = true LIMIT 1;
  
  -- Only proceed if auto_sync is enabled
  IF config_row.auto_sync THEN
    -- Make async HTTP request to sync-order-by-id edge function
    -- Using the known project URL and service role authorization
    SELECT extensions.net.http_post(
      url := 'https://akipvgehxmwzfglhdokb.supabase.co/functions/v1/sync-order-by-id',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'boardId', config_row.board_id
      )
    ) INTO request_id;
    
    RAISE LOG 'Initiated Monday sync for order % (request_id: %)', NEW.id, request_id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the order creation
    RAISE WARNING 'Failed to initiate Monday sync for order %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER on_order_created_sync_monday
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_monday();