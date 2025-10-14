-- Make sync-order-by-id callable without JWT so DB trigger doesn't need secrets
-- Recreate trigger function without Authorization header
DROP TRIGGER IF EXISTS on_order_created_sync_monday ON public.orders;
DROP FUNCTION IF EXISTS public.sync_order_to_monday();

CREATE OR REPLACE FUNCTION public.sync_order_to_monday()
RETURNS TRIGGER AS $$
DECLARE
  config_row RECORD;
  request_id bigint;
BEGIN
  SELECT * INTO config_row FROM public.monday_config WHERE auto_sync = true LIMIT 1;
  IF config_row.auto_sync THEN
    SELECT extensions.net.http_post(
      url := 'https://akipvgehxmwzfglhdokb.supabase.co/functions/v1/sync-order-by-id',
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'orderId', NEW.id::text,
        'boardId', config_row.board_id
      )
    ) INTO request_id;
    RAISE LOG 'Initiated Monday sync for order % (request_id: %)', NEW.id, request_id;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to initiate Monday sync for order %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_order_created_sync_monday
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_to_monday();