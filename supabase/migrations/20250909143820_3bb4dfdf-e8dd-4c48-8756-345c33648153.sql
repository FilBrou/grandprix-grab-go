-- Create functions for reports
CREATE OR REPLACE FUNCTION public.get_daily_sales(days INTEGER DEFAULT 7)
RETURNS TABLE (
  date DATE,
  total_sales DECIMAL(10,2),
  order_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    DATE(o.created_at) as date,
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_sales,
    COUNT(o.id) as order_count
  FROM public.orders o
  WHERE o.created_at >= CURRENT_DATE - INTERVAL '1 day' * days
    AND o.status NOT IN ('cancelled')
  GROUP BY DATE(o.created_at)
  ORDER BY DATE(o.created_at) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_popular_items(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  item_name TEXT,
  total_quantity BIGINT,
  total_revenue DECIMAL(10,2)
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.name as item_name,
    COALESCE(SUM(oi.quantity), 0) as total_quantity,
    COALESCE(SUM(oi.quantity * oi.unit_price), 0)::DECIMAL(10,2) as total_revenue
  FROM public.items i
  LEFT JOIN public.order_items oi ON i.id = oi.item_id
  LEFT JOIN public.orders o ON oi.order_id = o.id
  WHERE o.status NOT IN ('cancelled') OR o.status IS NULL
  GROUP BY i.id, i.name
  ORDER BY total_quantity DESC, total_revenue DESC
  LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_sales_statistics()
RETURNS TABLE (
  total_revenue DECIMAL(10,2),
  total_orders BIGINT,
  average_order_value DECIMAL(10,2),
  total_items_sold BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(o.total_amount), 0)::DECIMAL(10,2) as total_revenue,
    COUNT(o.id) as total_orders,
    COALESCE(AVG(o.total_amount), 0)::DECIMAL(10,2) as average_order_value,
    COALESCE(SUM(oi.quantity), 0) as total_items_sold
  FROM public.orders o
  LEFT JOIN public.order_items oi ON o.id = oi.order_id
  WHERE o.status NOT IN ('cancelled');
$$;