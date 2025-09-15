-- Clean up orphaned orders (orders without order items)
DELETE FROM orders 
WHERE id IN (
  SELECT o.id 
  FROM orders o 
  LEFT JOIN order_items oi ON o.id = oi.order_id 
  WHERE oi.order_id IS NULL
);