-- Delete all items except soft_drinks category
DELETE FROM public.items 
WHERE category != 'soft_drinks';