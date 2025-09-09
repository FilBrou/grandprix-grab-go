-- Create a function to update item stock when an order is placed
CREATE OR REPLACE FUNCTION public.update_item_stock(item_id uuid, quantity_to_subtract integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.items 
  SET stock = stock - quantity_to_subtract
  WHERE id = item_id AND stock >= quantity_to_subtract;
$$;